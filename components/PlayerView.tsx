"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { getAddress, isAddress, type Address } from "viem";
import { loadPlayer } from "@/lib/chain";
import { explorerUrl } from "@/lib/config";
import { short, useI18n } from "@/lib/i18n";
import { buildProfile, type PlayerProfile } from "@/lib/profile";
import { Bar } from "./Bar";

export function PlayerView() {
  const { t, lang } = useI18n();
  const raw = useSearchParams().get("a") ?? "";
  const [p, setP] = useState<PlayerProfile | null>(null);
  const [error, setError] = useState<"bad" | "load" | null>(null);

  useEffect(() => {
    if (!isAddress(raw)) return setError("bad");
    const address = getAddress(raw) as Address;
    loadPlayer(address).then((e) => setP(buildProfile(address, e)), () => setError("load"));
  }, [raw]);

  const n = (v: number | bigint) => v.toLocaleString(lang === "id" ? "id-ID" : "en-GB");

  return (
    <main>
      <Bar />
      <h1>{t.playerTitle}</h1>
      <p className="mono muted" style={{ marginTop: "0.5rem", wordBreak: "break-all" }}>
        {explorerUrl && isAddress(raw) ? <a href={`${explorerUrl}/address/${raw}`}>{raw}</a> : raw}
      </p>

      {error && <p className="error" style={{ marginTop: "1.5rem" }}>{error === "bad" ? t.playerBad : t.loadError}</p>}
      {!p && !error && <p className="muted" style={{ marginTop: "1.5rem" }}>{t.loading}</p>}

      {p && p.games === 0 && <p className="muted" style={{ marginTop: "1.5rem" }}>{t.playerEmpty}</p>}
      {p && p.games > 0 && (
        <>
          <dl className="kpis">
            <div>
              <dt>{t.pGames}</dt>
              <dd>{n(p.games)}</dd>
            </div>
            <div>
              <dt>{t.pWins}</dt>
              <dd>
                {n(p.wins)}
                <span className="muted" style={{ fontSize: "1rem", fontWeight: 400 }}>
                  {" "}
                  / {n(p.finished)}
                </span>
              </dd>
            </div>
            <div>
              <dt>{t.kCredits}</dt>
              <dd>{n(p.credits)}</dd>
            </div>
            <div>
              <dt>{t.pActions}</dt>
              <dd>{n(p.votes + p.nightActions)}</dd>
            </div>
          </dl>

          <h2>{t.pRoles}</h2>
          <ul className="list">
            {Object.entries(p.roles)
              .sort((a, b) => b[1] - a[1])
              .map(([role, count]) => (
                <li key={role}>
                  <span className={role === "werewolf" ? "tag-wolves" : undefined}>{t.roles[role] ?? role}</span>
                  <span className="num">{t.games(count)}</span>
                </li>
              ))}
          </ul>

          <h2>{t.pHistory}</h2>
          <ul className="list">
            {p.history.map((g) => (
              <li key={g.gameId}>
                <Link className="grow mono" href={`/game/?id=${g.gameId}`}>
                  {short(g.gameId)}
                </Link>
                <span className="muted">{g.role ? t.roles[g.role] : "?"}</span>
                <span className={g.result === "won" ? "tag-village" : g.result === "lost" ? "tag-wolves" : "tag-cancelled"}>{t.pResult[g.result]}</span>
              </li>
            ))}
          </ul>
          <p className="muted" style={{ marginTop: "1rem" }}>
            {t.pNote}
          </p>
        </>
      )}

      <p style={{ marginTop: "2.5rem" }}>
        <Link href="/">{t.back}</Link>
      </p>
    </main>
  );
}
