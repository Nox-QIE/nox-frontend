"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import type { Hex } from "viem";
import { loadGame } from "@/lib/chain";
import { config, explorerUrl } from "@/lib/config";
import { short, useI18n } from "@/lib/i18n";
import { ROLE_BY_CODE, verifyGame, type GameEvidence, type Verification } from "@/lib/verify";
import { Bar } from "./Bar";
import { Moon } from "./Moon";

const STEP_MS = 420;

export function GameView() {
  const { t } = useI18n();
  const params = useSearchParams();
  const gameId = (params.get("id") ?? "").toLowerCase() as Hex;
  const [ev, setEv] = useState<GameEvidence | null>(null);
  const [error, setError] = useState<"load" | "missing" | null>(null);
  const [shown, setShown] = useState(0);

  useEffect(() => {
    if (!/^0x[0-9a-f]{64}$/.test(gameId)) return setError("missing");
    loadGame(gameId).then(
      (e) => (e.status === 0 ? setError("missing") : setEv(e)),
      () => setError("load"),
    );
  }, [gameId]);

  const v: Verification | null = useMemo(() => (ev ? verifyGame(ev) : null), [ev]);

  // Reveal each check in turn, as the moon fills. Immediate when the user prefers reduced motion.
  useEffect(() => {
    if (!v) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return setShown(v.checks.length);
    setShown(0);
    const timer = setInterval(() => setShown((n) => (n >= v.checks.length ? (clearInterval(timer), n) : n + 1)), STEP_MS);
    return () => clearInterval(timer);
  }, [v]);

  if (error)
    return (
      <main>
        <Bar />
        <p className="error">{error === "missing" ? t.notFound : t.loadError}</p>
        <p style={{ marginTop: "1rem" }}>
          <Link href="/">{t.back}</Link>
        </p>
      </main>
    );

  if (!ev || !v)
    return (
      <main>
        <Bar />
        <p className="muted">{t.loading}</p>
      </main>
    );

  const done = shown >= v.checks.length;
  const passed = v.checks.slice(0, shown).filter((c) => c.ok).length;
  const anyFailedSoFar = v.checks.slice(0, shown).some((c) => !c.ok);
  const cancelled = ev.status === 4;
  const running = !ev.finalize && !cancelled;

  const verdict = cancelled ? t.verdictCancelled : running ? t.verdictRunning : !done ? t.loading : v.ok ? t.verdictOk : t.verdictBad;
  const verdictLead = cancelled ? ev.cancelledReason ?? "" : running ? t.verdictRunningLead : !done ? "" : v.ok ? t.verdictOkLead : t.verdictBadLead;
  const roleName = (addr: string) => t.roles[v.roles[addr.toLowerCase()] ?? ""] ?? "?";

  return (
    <main>
      <Bar />
      <div className="verdict">
        <Moon fraction={v.checks.length ? passed / v.checks.length : 0} failed={anyFailedSoFar} size={84} />
        <div>
          <h1 aria-live="polite">{verdict}</h1>
          <p className="mono muted" style={{ marginTop: "0.4rem", wordBreak: "break-all" }}>
            {gameId}
          </p>
        </div>
      </div>
      {verdictLead && <p className="lead">{verdictLead}</p>}

      <ul className="checks">
        {v.checks.map((c, i) => {
          const state = i < shown ? (c.ok ? "ok" : "bad") : "pending";
          return (
            <li key={c.id} data-state={state}>
              <span className={`mark mark-${state === "bad" ? "bad" : "ok"}`} aria-hidden="true">
                {state === "pending" ? "·" : c.ok ? "✓" : "✗"}
              </span>
              <span>{t.checks[c.id](c.data)}</span>
            </li>
          );
        })}
      </ul>

      {ev.finalize && (
        <>
          <h2>{t.story}</h2>
          <ol className="story">
            {v.replay.map((r) => (
              <li key={r.round}>
                <h3>{t.night(r.round)}</h3>
                <p>{r.nightVictim ? t.nightKill(short(r.nightVictim), t.roles[r.nightRole ?? ""] ?? "?") : t.nightNone}</p>
                {(r.dayEliminated || Object.keys(r.tally).length > 0) && (
                  <>
                    <h3 style={{ marginTop: "0.6rem" }}>{t.day(r.round)}</h3>
                    <p>{r.dayEliminated ? t.dayOut(short(r.dayEliminated), t.roles[r.dayRole ?? ""] ?? "?") : t.dayNone}</p>
                    <p className="muted">
                      {Object.entries(r.tally)
                        .sort((a, b) => b[1] - a[1])
                        .map(([who, n]) => `${short(who)} ${t.votes(n)}`)
                        .join(", ")}
                    </p>
                  </>
                )}
              </li>
            ))}
          </ol>

          <h2>{t.players}</h2>
          <ul className="list">
            {ev.finalize.roles.map((r) => (
              <li key={r.player}>
                <span className="grow mono">
                  <Link href={`/player/?a=${r.player}`}>{short(r.player)}</Link>
                </span>
                <span className={ROLE_BY_CODE[r.role] === "werewolf" ? "tag-wolves" : undefined}>{roleName(r.player)}</span>
              </li>
            ))}
          </ul>

          <SaltCheck ev={ev} roleName={roleName} />
        </>
      )}

      <p style={{ marginTop: "2.5rem" }}>
        <Link href="/">{t.back}</Link>
        {explorerUrl && (
          <>
            <a href={`${explorerUrl}/address/${config.gameAddress}`} style={{ marginLeft: "1.25rem" }}>
              {t.explorer}
            </a>
          </>
        )}
      </p>
    </main>
  );
}

function SaltCheck({ ev, roleName }: { ev: GameEvidence; roleName: (a: string) => string }) {
  const { t } = useI18n();
  const [salt, setSalt] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const submit = (e: FormEvent) => {
    e.preventDefault();
    const s = salt.trim().toLowerCase();
    const hit = ev.finalize?.roles.find((r) => r.salt.toLowerCase() === s);
    setResult(hit ? t.saltFound(short(hit.player), roleName(hit.player)) : t.saltMissing);
  };
  return (
    <>
      <h2>{t.you}</h2>
      <p className="muted">{t.youLead}</p>
      <form className="salt" onSubmit={submit}>
        <label htmlFor="salt" className="muted">
          {t.saltLabel}
        </label>
        <div className="row">
          <input id="salt" value={salt} onChange={(e) => (setSalt(e.target.value), setResult(null))} placeholder="0x…" spellCheck={false} autoComplete="off" />
          <button className="primary" type="submit">
            {t.checkCode}
          </button>
        </div>
        {result && <p aria-live="polite">{result}</p>}
      </form>
    </>
  );
}
