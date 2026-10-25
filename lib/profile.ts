import type { Address, Hex } from "viem";
import { ROLE_BY_CODE, TEAM_BY_CODE } from "./verify";

/** What the chain says about one player, already filtered to that player. */
export interface PlayerEvents {
  joined: { gameId: Hex; block: bigint }[];
  revealed: { gameId: Hex; role: number }[];
  votes: number;
  nightActions: number;
  credits: bigint;
  /** Outcome per game the player joined: winner code, or "cancelled". */
  outcomes: Map<string, number | "cancelled">;
}

export interface PlayerGame {
  gameId: Hex;
  role: string | null;
  result: "won" | "lost" | "cancelled" | "running";
}

export interface PlayerProfile {
  address: Address;
  games: number;
  finished: number;
  wins: number;
  credits: bigint;
  votes: number;
  nightActions: number;
  roles: Record<string, number>;
  /** Newest first. */
  history: PlayerGame[];
}

/** Wins come from the revealed role's team against the recorded winner, so they are verifiable. */
export function buildProfile(address: Address, e: PlayerEvents): PlayerProfile {
  const roleOf = new Map(e.revealed.map((r) => [r.gameId.toLowerCase(), ROLE_BY_CODE[r.role] ?? null]));
  const roles: Record<string, number> = {};
  const history: PlayerGame[] = [...e.joined]
    .sort((a, b) => (b.block > a.block ? 1 : b.block < a.block ? -1 : 0))
    .map(({ gameId }) => {
      const id = gameId.toLowerCase();
      const role = roleOf.get(id) ?? null;
      const outcome = e.outcomes.get(id);
      if (role) roles[role] = (roles[role] ?? 0) + 1;
      let result: PlayerGame["result"] = "running";
      if (outcome === "cancelled") result = "cancelled";
      else if (outcome !== undefined && role) result = TEAM_BY_CODE[outcome] === (role === "werewolf" ? "wolves" : "village") ? "won" : "lost";
      return { gameId, role, result };
    });
  return {
    address,
    games: history.length,
    finished: history.filter((g) => g.result === "won" || g.result === "lost").length,
    wins: history.filter((g) => g.result === "won").length,
    credits: e.credits,
    votes: e.votes,
    nightActions: e.nightActions,
    roles,
    history,
  };
}
