import { apply, createGame, GameRuleError, type Command, type GameState, type Role } from "@nox/shared/engine";
import { actionHash, roleLeaf, verifyMerkleProof, type NightActionKind } from "@nox/shared/crypto-spec";
import type { Address, Hex } from "viem";

export const ROLE_BY_CODE: Record<number, Role> = { 1: "villager", 2: "werewolf", 3: "seer", 4: "doctor" };
const ACTION_BY_CODE: Record<number, NightActionKind> = { 1: "kill", 2: "inspect", 3: "protect" };
export const TEAM_BY_CODE: Record<number, "village" | "wolves"> = { 1: "village", 2: "wolves" };

/** Position of an event on-chain, to prove ordering. */
export interface At {
  block: bigint;
  logIndex: number;
}

/** Everything the chain says about one game (events + decoded finalize calldata). */
export interface GameEvidence {
  gameId: Hex;
  status: number; // NoxGame.Status
  created?: At & { configHash: Hex };
  players: Address[]; // join order
  rolesCommitted?: At & { root: Hex };
  nightCommits: (At & { round: number; player: Address; hash: Hex })[];
  votes: (At & { round: number; voter: Address; target: Address })[];
  rounds: { round: number; resultHash: Hex }[];
  finalize?: {
    roles: { player: Address; role: number; salt: Hex; proof: Hex[] }[];
    nights: { round: number; player: Address; action: number; target: Address; nonce: Hex }[];
    resultHash: Hex;
    winner: number;
  };
  cancelledReason?: string;
}

export type CheckId = "rolesLockedFirst" | "rolesMatch" | "everyoneRevealed" | "nightsMatch" | "rulesReplay";

export interface Check {
  id: CheckId;
  ok: boolean;
  /** Values for the UI sentence (block numbers, counts, offending address...). */
  data: Record<string, string | number>;
}

export interface RoundReplay {
  round: number;
  nightVictim: Address | null;
  nightRole: Role | null;
  dayEliminated: Address | null;
  dayRole: Role | null;
  tally: Record<string, number>;
}

export interface Verification {
  checks: Check[];
  ok: boolean;
  replay: RoundReplay[];
  replayWinner: "village" | "wolves" | null;
  roles: Record<string, Role>;
}

const lower = (a: string) => a.toLowerCase();
const before = (a: At, b: At) => a.block < b.block || (a.block === b.block && a.logIndex < b.logIndex);

/** Recompute every commitment in the browser and replay the game with the open-source rules engine. */
export function verifyGame(ev: GameEvidence): Verification {
  const checks: Check[] = [];
  const roles: Record<string, Role> = {};
  const replay: RoundReplay[] = [];
  let replayWinner: "village" | "wolves" | null = null;

  // 1. The role root was on-chain before any player acted.
  const firstAction = [...ev.nightCommits, ...ev.votes].sort((a, b) => (before(a, b) ? -1 : 1))[0];
  if (ev.rolesCommitted) {
    checks.push({
      id: "rolesLockedFirst",
      ok: !firstAction || before(ev.rolesCommitted, firstAction),
      data: { lockedAt: ev.rolesCommitted.block.toString(), firstActionAt: firstAction ? firstAction.block.toString() : "-" },
    });
  }

  const f = ev.finalize;
  if (!f || !ev.rolesCommitted) return { checks, ok: false, replay, replayWinner, roles };

  // 2. Every revealed role is in the committed Merkle root.
  const badRole = f.roles.find((r) => {
    const role = ROLE_BY_CODE[r.role];
    return !role || !verifyMerkleProof(r.proof, ev.rolesCommitted!.root, roleLeaf(ev.gameId, r.player, role, r.salt));
  });
  checks.push({ id: "rolesMatch", ok: !badRole, data: { count: f.roles.length, bad: badRole?.player ?? "" } });
  for (const r of f.roles) if (ROLE_BY_CODE[r.role]) roles[lower(r.player)] = ROLE_BY_CODE[r.role]!;

  // 3. Every player who joined got exactly one revealed role.
  const revealed = new Set(f.roles.map((r) => lower(r.player)));
  const missing = ev.players.find((p) => !revealed.has(lower(p)));
  checks.push({
    id: "everyoneRevealed",
    ok: !missing && revealed.size === ev.players.length && f.roles.length === ev.players.length,
    data: { players: ev.players.length, revealed: revealed.size, missing: missing ?? "" },
  });

  // 4. Every night commitment opens to the revealed action.
  const commits = new Map(ev.nightCommits.map((c) => [`${c.round}:${lower(c.player)}`, c.hash.toLowerCase()]));
  const badNight = f.nights.find((n) => {
    const kind = ACTION_BY_CODE[n.action];
    const committed = commits.get(`${n.round}:${lower(n.player)}`);
    return !kind || !committed || committed !== actionHash(ev.gameId, n.round, n.player, kind, n.target, n.nonce).toLowerCase();
  });
  checks.push({
    id: "nightsMatch",
    ok: !badNight && f.nights.length === ev.nightCommits.length,
    data: { count: f.nights.length, commits: ev.nightCommits.length, bad: badNight?.player ?? "" },
  });

  // 5. Replay with the open-source rules: night actions and votes as recorded → same winner.
  try {
    const assignments = f.roles.map((r) => ({ id: lower(r.player), role: ROLE_BY_CODE[r.role]! }));
    let state: GameState = createGame(assignments).state;
    const run = (cmd: Command) => {
      const t = apply(state, cmd);
      state = t.state;
      return t.events;
    };
    // `state` changes inside run(); read it through a function so TypeScript does not narrow it.
    const ended = () => state.phase === "ended";
    const lastRound = Math.max(1, ...f.nights.map((n) => n.round), ...ev.votes.map((v) => v.round));
    for (let round = 1; round <= lastRound + 1 && !ended(); round++) {
      const summary: RoundReplay = { round, nightVictim: null, nightRole: null, dayEliminated: null, dayRole: null, tally: {} };
      for (const n of f.nights.filter((x) => x.round === round)) run({ type: "night_action", actor: lower(n.player), target: lower(n.target) });
      for (const e of run({ type: "end_night" })) {
        if (e.type === "night_resolved" && e.eliminated) {
          summary.nightVictim = e.eliminated as Address;
          summary.nightRole = roles[e.eliminated] ?? null;
        }
      }
      if (!ended()) {
        for (const v of ev.votes.filter((x) => x.round === round)) run({ type: "vote", voter: lower(v.voter), target: lower(v.target) });
        for (const e of run({ type: "end_day" })) {
          if (e.type === "day_resolved") {
            summary.tally = e.tally;
            if (e.eliminated) {
              summary.dayEliminated = e.eliminated as Address;
              summary.dayRole = roles[e.eliminated] ?? null;
            }
          }
        }
      }
      replay.push(summary);
    }
    replayWinner = state.winner ?? null;
    checks.push({
      id: "rulesReplay",
      ok: replayWinner !== null && replayWinner === TEAM_BY_CODE[f.winner],
      data: { replayWinner: replayWinner ?? "-", recordedWinner: TEAM_BY_CODE[f.winner] ?? "-", rounds: replay.length },
    });
  } catch (e) {
    checks.push({
      id: "rulesReplay",
      ok: false,
      data: { replayWinner: "-", recordedWinner: TEAM_BY_CODE[f.winner] ?? "-", error: e instanceof GameRuleError ? e.code : String(e) },
    });
  }

  return { checks, ok: checks.every((c) => c.ok), replay, replayWinner, roles };
}
