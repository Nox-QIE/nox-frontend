/**
 * Runs against the local dev chain from nox-backend (`npm run dev:chain`), which deploys the
 * contracts at fixed anvil addresses and plays two demo games. Skipped when it is not running.
 */
import { createPublicClient, http, type Hex } from "viem";
import { beforeAll, describe, expect, it } from "vitest";

const RPC = "http://127.0.0.1:8545";
const GAME = "0xe7f1725e7734ce288f8367e1bb143e90bb3f0512";
const CREDITS = "0x5fbdb2315678afecb367f032d93f642f64180aa3";
process.env.NEXT_PUBLIC_RPC_URL = RPC;
process.env.NEXT_PUBLIC_CHAIN_ID = "31337";
process.env.NEXT_PUBLIC_GAME_ADDRESS = GAME;
process.env.NEXT_PUBLIC_CREDITS_ADDRESS = CREDITS;

const up = await createPublicClient({ transport: http(RPC) })
  .getCode({ address: GAME })
  .then((c) => !!c && c !== "0x")
  .catch(() => false);

describe.skipIf(!up)("verification against the dev chain", () => {
  let chain: typeof import("../lib/chain");
  let verify: typeof import("../lib/verify");
  let games: Awaited<ReturnType<typeof chain.recentGames>>;

  beforeAll(async () => {
    chain = await import("../lib/chain");
    verify = await import("../lib/verify");
    games = await chain.recentGames();
  });

  it("finds both demo games, one won by each team", () => {
    expect(games.map((g) => g.outcome).sort()).toEqual(["village", "wolves"]);
  });

  it("verifies every commitment and replays the same winner", async () => {
    for (const g of games) {
      const ev = await chain.loadGame(g.gameId);
      const v = verify.verifyGame(ev);
      expect(v.checks.map((c) => [c.id, c.ok])).toEqual([
        ["rolesLockedFirst", true],
        ["rolesMatch", true],
        ["everyoneRevealed", true],
        ["nightsMatch", true],
        ["rulesReplay", true],
      ]);
      expect(v.replayWinner).toBe(g.outcome);
      expect(v.replay.length).toBeGreaterThan(0);
    }
  });

  it("catches tampering with a role, a salt, a night target or a vote", async () => {
    const ev = await chain.loadGame(games.find((g) => g.outcome === "village")!.gameId);
    const clone = () => structuredClone(ev);
    const failing = (e: typeof ev) => verify.verifyGame(e).checks.filter((c) => !c.ok).map((c) => c.id);

    const swapped = clone();
    swapped.finalize!.roles[0]!.role = swapped.finalize!.roles[0]!.role === 2 ? 1 : 2;
    expect(failing(swapped)).toContain("rolesMatch");

    const salted = clone();
    salted.finalize!.roles[1]!.salt = ("0x" + "11".repeat(32)) as Hex;
    expect(failing(salted)).toContain("rolesMatch");

    const retarget = clone();
    const n = retarget.finalize!.nights[0]!;
    n.target = retarget.players.find((p) => p.toLowerCase() !== n.target.toLowerCase())!;
    expect(failing(retarget)).toContain("nightsMatch");

    const revote = clone();
    const wolf = revote.finalize!.roles.find((r) => r.role === 2)!.player;
    for (const v of revote.votes) v.target = revote.players.find((p) => p !== wolf && p !== v.voter)!;
    expect(failing(revote)).toContain("rulesReplay");
  });

  it("builds a leaderboard from minted credits", async () => {
    const rows = await chain.leaderboard();
    expect(rows.length).toBe(12); // 5 + 7 demo players
    expect(rows[0]!.credits).toBe(30n);
    expect(rows.at(-1)!.credits).toBe(10n);
  });
});

describe.skipIf(!up)("metrics against the dev chain", () => {
  it("counts the 12 demo players and their signed transactions", async () => {
    const { loadActivity } = await import("../lib/chain");
    const { summarize } = await import("../lib/metrics");
    const { activity, timeOf } = await loadActivity();
    const m = summarize(activity, timeOf);
    expect(m.uniquePlayers).toBe(12);
    expect(m.gamesFinalized).toBe(2);
    expect(m.playerTxs).toBeGreaterThan(12); // joins plus night commits and votes
    expect(m.daily.at(-1)!.signers).toBe(12); // all played today
  });
});

describe.skipIf(!up)("player profile against the dev chain", () => {
  it("matches the leaderboard and the game results", async () => {
    const chain = await import("../lib/chain");
    const { buildProfile } = await import("../lib/profile");
    const top = (await chain.leaderboard())[0]!; // 30 credits = one game, won
    const p = buildProfile(top.player, await chain.loadPlayer(top.player));
    expect(p.games).toBe(1);
    expect(p.wins).toBe(1);
    expect(p.credits).toBe(top.credits);
    expect(p.votes + p.nightActions).toBeGreaterThan(0);
    expect(p.history[0]!.role).not.toBeNull();
  });
});
