import type { Address } from "viem";

/** Player-signed actions and outcomes read from NoxGame / NoxCredits events. */
export interface ChainActivity {
  /** Every transaction a player sent from their own wallet: join, night commitment, vote. */
  signed: { player: Address; block: bigint }[];
  finalized: number;
  cancelled: number;
  credits: bigint;
}

export interface DayPoint {
  /** UTC day, YYYY-MM-DD */
  day: string;
  signers: number;
  txs: number;
}

export interface Metrics {
  uniquePlayers: number;
  playerTxs: number;
  gamesFinalized: number;
  gamesCancelled: number;
  credits: bigint;
  /** Consecutive days ending today (UTC), oldest first; days without activity are 0. */
  daily: DayPoint[];
}

const dayOf = (ms: number) => new Date(ms).toISOString().slice(0, 10);

/** Public, verifiable traction numbers: every value can be recomputed from the chain. */
export function summarize(a: ChainActivity, timeOf: (block: bigint) => number, now = Date.now(), days = 30): Metrics {
  const players = new Set<string>();
  const perDay = new Map<string, { signers: Set<string>; txs: number }>();
  for (const s of a.signed) {
    const who = s.player.toLowerCase();
    players.add(who);
    const d = dayOf(timeOf(s.block));
    const bucket = perDay.get(d) ?? { signers: new Set(), txs: 0 };
    bucket.signers.add(who);
    bucket.txs += 1;
    perDay.set(d, bucket);
  }
  const daily: DayPoint[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = dayOf(now - i * 86_400_000);
    const b = perDay.get(d);
    daily.push({ day: d, signers: b?.signers.size ?? 0, txs: b?.txs ?? 0 });
  }
  return { uniquePlayers: players.size, playerTxs: a.signed.length, gamesFinalized: a.finalized, gamesCancelled: a.cancelled, credits: a.credits, daily };
}
