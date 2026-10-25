import {
  createPublicClient,
  decodeFunctionData,
  fallback,
  http,
  parseEventLogs,
  type Address,
  type Hex,
  type Log,
  type PublicClient,
} from "viem";
import { NoxCreditsAbi, NoxGameAbi } from "./abi";
import { config } from "./config";
import type { ChainActivity } from "./metrics";
import type { GameEvidence } from "./verify";

/** QIE caps eth_getLogs at 10,000 blocks per call. */
const WINDOW = 9_999n;

let client: PublicClient | null = null;
export function chain(): PublicClient {
  const transports = config.rpcUrls.map((u) => http(u, { timeout: 10_000 }));
  client ??= createPublicClient({ transport: transports.length === 1 ? transports[0]! : fallback(transports) }) as PublicClient;
  return client;
}

async function logsInWindows(address: Address, topics: (Hex | null)[], fromBlock = config.fromBlock): Promise<Log[]> {
  const latest = await chain().getBlockNumber();
  const out: Log[] = [];
  for (let from = fromBlock; from <= latest; from += WINDOW + 1n) {
    const to = from + WINDOW > latest ? latest : from + WINDOW;
    const logs = (await chain().request({
      method: "eth_getLogs",
      params: [{ address, topics, fromBlock: `0x${from.toString(16)}`, toBlock: `0x${to.toString(16)}` }],
    })) as Log[];
    out.push(...logs.map((l) => ({ ...l, blockNumber: BigInt(l.blockNumber as unknown as string), logIndex: Number(l.logIndex) })));
  }
  return out;
}

const at = (l: { blockNumber: bigint | null; logIndex: number | null }) => ({ block: l.blockNumber ?? 0n, logIndex: l.logIndex ?? 0 });

/** Everything NoxGame recorded for one game, plus the decoded reveal transaction. */
export async function loadGame(gameId: Hex): Promise<GameEvidence> {
  const [status] = await chain().readContract({ address: config.gameAddress, abi: NoxGameAbi, functionName: "games", args: [gameId] });
  // Every NoxGame event has gameId as its first indexed topic.
  const logs = parseEventLogs({ abi: NoxGameAbi, logs: await logsInWindows(config.gameAddress, [null, gameId]) });
  const ev: GameEvidence = { gameId, status: Number(status), players: [], nightCommits: [], votes: [], rounds: [] };
  let finalizeTx: Hex | null = null;
  for (const l of logs) {
    switch (l.eventName) {
      case "GameCreated":
        ev.created = { ...at(l), configHash: l.args.configHash };
        break;
      case "PlayerJoined":
        ev.players.push(l.args.player);
        break;
      case "RolesCommitted":
        ev.rolesCommitted = { ...at(l), root: l.args.rolesRoot };
        break;
      case "NightActionCommitted":
        ev.nightCommits.push({ ...at(l), round: Number(l.args.round), player: l.args.player, hash: l.args.actionHash });
        break;
      case "VoteCast":
        ev.votes.push({ ...at(l), round: Number(l.args.round), voter: l.args.voter, target: l.args.target });
        break;
      case "RoundRecorded":
        ev.rounds.push({ round: Number(l.args.round), resultHash: l.args.resultHash });
        break;
      case "GameFinalized":
        finalizeTx = l.transactionHash;
        break;
      case "GameCancelled":
        ev.cancelledReason = l.args.reason;
        break;
    }
  }
  if (finalizeTx) {
    const tx = await chain().getTransaction({ hash: finalizeTx });
    const { functionName, args } = decodeFunctionData({ abi: NoxGameAbi, data: tx.input });
    if (functionName === "revealAndFinalize") {
      const [, roles, nights, resultHash, winner] = args;
      ev.finalize = {
        roles: roles.map((r) => ({ player: r.player, role: r.role, salt: r.salt, proof: [...r.proof] })),
        nights: nights.map((n) => ({ round: n.round, player: n.player, action: n.action, target: n.target, nonce: n.nonce })),
        resultHash,
        winner,
      };
    }
  }
  return ev;
}

export interface GameSummary {
  gameId: Hex;
  outcome: "village" | "wolves" | "cancelled";
  block: bigint;
  tx: Hex;
}

/** Most recent finalized or cancelled games, newest first. */
export async function recentGames(limit = 10): Promise<GameSummary[]> {
  const logs = parseEventLogs({ abi: NoxGameAbi, logs: await logsInWindows(config.gameAddress, []) });
  const out: GameSummary[] = [];
  for (const l of logs) {
    if (l.eventName === "GameFinalized") {
      out.push({ gameId: l.args.gameId, outcome: l.args.winner === 2 ? "wolves" : "village", block: l.blockNumber, tx: l.transactionHash });
    } else if (l.eventName === "GameCancelled") {
      out.push({ gameId: l.args.gameId, outcome: "cancelled", block: l.blockNumber, tx: l.transactionHash });
    }
  }
  return out.sort((a, b) => Number(b.block - a.block)).slice(0, limit);
}

export interface LeaderRow {
  player: Address;
  credits: bigint;
  games: number;
}

/** Credits earned per wallet, from CreditsMinted events (credits cannot move, so this is the balance). */
export async function leaderboard(limit = 20): Promise<LeaderRow[]> {
  const logs = parseEventLogs({ abi: NoxCreditsAbi, eventName: "CreditsMinted", logs: await logsInWindows(config.creditsAddress, []) });
  const rows = new Map<string, LeaderRow>();
  for (const l of logs) {
    const key = l.args.to.toLowerCase();
    const r = rows.get(key) ?? { player: l.args.to, credits: 0n, games: 0 };
    r.credits += l.args.amount;
    r.games += 1;
    rows.set(key, r);
  }
  return [...rows.values()].sort((a, b) => (b.credits > a.credits ? 1 : b.credits < a.credits ? -1 : b.games - a.games)).slice(0, limit);
}

/** Every player-signed action and game outcome, for the public metrics page. */
export async function loadActivity(): Promise<{ activity: ChainActivity; timeOf: (b: bigint) => number }> {
  const [gameLogs, creditLogs] = await Promise.all([
    logsInWindows(config.gameAddress, []).then((l) => parseEventLogs({ abi: NoxGameAbi, logs: l })),
    logsInWindows(config.creditsAddress, []).then((l) => parseEventLogs({ abi: NoxCreditsAbi, eventName: "CreditsMinted", logs: l })),
  ]);
  const activity: ChainActivity = { signed: [], finalized: 0, cancelled: 0, credits: 0n };
  for (const l of gameLogs) {
    if (l.eventName === "PlayerJoined") activity.signed.push({ player: l.args.player, block: l.blockNumber });
    else if (l.eventName === "VoteCast") activity.signed.push({ player: l.args.voter, block: l.blockNumber });
    else if (l.eventName === "NightActionCommitted") activity.signed.push({ player: l.args.player, block: l.blockNumber });
    else if (l.eventName === "GameFinalized") activity.finalized += 1;
    else if (l.eventName === "GameCancelled") activity.cancelled += 1;
  }
  for (const l of creditLogs) if (l.eventName === "CreditsMinted") activity.credits += l.args.amount;

  // Block timestamps, a few requests at a time.
  const blocks = [...new Set(activity.signed.map((s) => s.block))];
  const times = new Map<bigint, number>();
  for (let i = 0; i < blocks.length; i += 8) {
    await Promise.all(
      blocks.slice(i, i + 8).map(async (b) => times.set(b, Number((await chain().getBlock({ blockNumber: b })).timestamp) * 1000)),
    );
  }
  return { activity, timeOf: (b) => times.get(b) ?? 0 };
}
