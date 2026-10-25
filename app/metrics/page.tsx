"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Bar } from "@/components/Bar";
import { DailyBars } from "@/components/DailyBars";
import { loadActivity } from "@/lib/chain";
import { config, explorerUrl, networkName } from "@/lib/config";
import { useI18n } from "@/lib/i18n";
import { summarize, type Metrics } from "@/lib/metrics";

export default function MetricsPage() {
  const { t, lang } = useI18n();
  const [m, setM] = useState<Metrics | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    loadActivity().then(({ activity, timeOf }) => setM(summarize(activity, timeOf)), () => setFailed(true));
  }, []);

  const fmtDay = (day: string) => new Date(`${day}T00:00:00Z`).toLocaleDateString(lang === "id" ? "id-ID" : "en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
  const n = (v: number | bigint) => v.toLocaleString(lang === "id" ? "id-ID" : "en-GB");

  return (
    <main>
      <Bar />
      <h1>{t.metricsTitle}</h1>
      <p className="lead">{t.metricsLead}</p>

      {failed && <p className="error" style={{ marginTop: "1.5rem" }}>{t.loadError}</p>}
      {!m && !failed && <p className="muted" style={{ marginTop: "1.5rem" }}>{t.loading}</p>}

      {m && (
        <>
          <dl className="kpis">
            <div>
              <dt>{t.kPlayers}</dt>
              <dd>{n(m.uniquePlayers)}</dd>
            </div>
            <div>
              <dt>{t.kTxs}</dt>
              <dd>{n(m.playerTxs)}</dd>
            </div>
            <div>
              <dt>{t.kGames}</dt>
              <dd>{n(m.gamesFinalized)}</dd>
            </div>
            <div>
              <dt>{t.kCredits}</dt>
              <dd>{n(m.credits)}</dd>
            </div>
          </dl>

          <h2>{t.dailyTitle}</h2>
          <p className="muted" style={{ marginBottom: "0.75rem" }}>
            {t.dailyNote}
          </p>
          <DailyBars data={m.daily} format={fmtDay} label={(d) => t.dailyLabel(fmtDay(d.day), d.signers, d.txs)} />
          <details style={{ marginTop: "0.75rem" }}>
            <summary className="muted">{t.showTable}</summary>
            <table className="data">
              <thead>
                <tr>
                  <th>{t.tableDay}</th>
                  <th>{t.tableSigners}</th>
                  <th>{t.tableTxs}</th>
                </tr>
              </thead>
              <tbody>
                {m.daily
                  .filter((d) => d.txs > 0)
                  .map((d) => (
                    <tr key={d.day}>
                      <td>{fmtDay(d.day)}</td>
                      <td className="num">{d.signers}</td>
                      <td className="num">{d.txs}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </details>

          <p className="muted" style={{ marginTop: "2rem" }}>
            {t.metricsSource(networkName)}{" "}
            {explorerUrl && <a href={`${explorerUrl}/address/${config.gameAddress}`}>{t.explorer}</a>}
          </p>
        </>
      )}

      <p style={{ marginTop: "2.5rem" }}>
        <Link href="/">{t.back}</Link>
      </p>
    </main>
  );
}
