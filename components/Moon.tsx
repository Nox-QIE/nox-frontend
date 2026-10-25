/** A moon that fills as proofs pass: fraction 0 = new moon, 1 = full. Amber when a proof failed. */
export function Moon({ fraction, failed = false, size = 72 }: { fraction: number; failed?: boolean; size?: number }) {
  const f = Math.max(0, Math.min(1, fraction));
  const r = 30;
  // The shadow disc slides off the moon as fraction grows.
  const shadowX = 32 + f * 64;
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" role="img" aria-hidden="true">
      <defs>
        <clipPath id="moon-clip">
          <circle cx="32" cy="32" r={r} />
        </clipPath>
      </defs>
      <circle cx="32" cy="32" r={r} fill={failed ? "#f2b33d" : "#eef0f7"} />
      <g clipPath="url(#moon-clip)">
        <circle cx={shadowX} cy="32" r={r} fill="#1e2546" style={{ transition: "cx 420ms ease" }} />
      </g>
      <circle cx="32" cy="32" r={r} fill="none" stroke="#2e3762" strokeWidth="1.5" />
    </svg>
  );
}
