import { describe, expect, it } from "vitest";
import { summarize } from "../lib/metrics";

const A = "0x00000000000000000000000000000000000000aa" as const;
const B = "0x00000000000000000000000000000000000000BB" as const;
const day = (iso: string) => Date.parse(`${iso}T12:00:00Z`);

describe("summarize", () => {
  it("counts unique player wallets, signed transactions and daily signers", () => {
    const times = new Map<bigint, number>([
      [1n, day("2026-10-24")],
      [2n, day("2026-10-25")],
      [3n, day("2026-10-25")],
    ]);
    const m = summarize(
      {
        signed: [
          { player: A, block: 1n },
          { player: A, block: 2n },
          { player: B, block: 2n },
          { player: B.toLowerCase() as typeof B, block: 3n }, // same wallet, different case
        ],
        finalized: 1,
        cancelled: 2,
        credits: 70n,
      },
      (b) => times.get(b)!,
      day("2026-10-25"),
      3,
    );
    expect(m.uniquePlayers).toBe(2);
    expect(m.playerTxs).toBe(4);
    expect(m.daily).toEqual([
      { day: "2026-10-23", signers: 0, txs: 0 },
      { day: "2026-10-24", signers: 1, txs: 1 },
      { day: "2026-10-25", signers: 2, txs: 3 },
    ]);
    expect(m.gamesFinalized).toBe(1);
    expect(m.credits).toBe(70n);
  });
});
