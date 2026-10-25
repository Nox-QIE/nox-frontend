import { describe, expect, it } from "vitest";
import { buildProfile } from "../lib/profile";

const P = "0x00000000000000000000000000000000000000aa" as const;
const g = (n: number) => `0x${n.toString(16).padStart(64, "0")}` as const;

describe("buildProfile", () => {
  it("derives wins from the revealed role's team and the recorded winner", () => {
    const p = buildProfile(P, {
      joined: [
        { gameId: g(1), block: 10n },
        { gameId: g(2), block: 20n },
        { gameId: g(3), block: 30n },
        { gameId: g(4), block: 40n },
      ],
      revealed: [
        { gameId: g(1), role: 2 }, // werewolf, wolves won
        { gameId: g(2), role: 3 }, // seer, wolves won
      ],
      votes: 5,
      nightActions: 2,
      credits: 40n,
      outcomes: new Map<string, number | "cancelled">([
        [g(1), 2],
        [g(2), 2],
        [g(3), "cancelled"],
      ]),
    });
    expect(p.history.map((h) => [h.gameId, h.result])).toEqual([
      [g(4), "running"],
      [g(3), "cancelled"],
      [g(2), "lost"],
      [g(1), "won"],
    ]);
    expect([p.games, p.finished, p.wins]).toEqual([4, 2, 1]);
    expect(p.roles).toEqual({ werewolf: 1, seer: 1 });
  });
});
