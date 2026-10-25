"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { Bar } from "@/components/Bar";
import { leaderboard, recentGames, type GameSummary, type LeaderRow } from "@/lib/chain";
import { explorerUrl, networkName } from "@/lib/config";
import { short, useI18n } from "@/lib/i18n";

export default function Home() {
  const { t } = useI18n();
  const router = useRouter();
  const [id, setId] = useState("");
  const [bad, setBad] = useState(false);
  const [games, setGames] = useState<GameSummary[] | null>(null);
  const [leaders, setLeaders] = useState<LeaderRow[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    recentGames().then(setGames, () => setFailed(true));
    leaderboard().then(setLeaders, () => setFailed(true));
  }, []);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const v = id.trim();
    if (!/^0x[0-9a-fA-F]{64}$/.test(v)) return setBad(true);
    router.push(`/game/?id=${v.toLowerCase()}`);
  };

  return (
    <main>
      <Bar />
      <h1>{t.title}</h1>
      <p className="lead">{t.lead}</p>

      <form className="find" onSubmit={submit} noValidate>
        <label htmlFor="game-id">{t.gameIdLabel}</label>
        <div className="row">
          <input
            id="game-id"
            value={id}
            onChange={(e) => (setId(e.target.value), setBad(false))}
            placeholder={t.gameIdPlaceholder}
            autoComplete="off"
            spellCheck={false}
            aria-invalid={bad}
            aria-describedby={bad ? "game-id-error" : undefined}
          />
          <button className="primary" type="submit">
            {t.check}
          </button>
        </div>
        {bad && (
          <p className="error" id="game-id-error">
            {t.badId}
          </p>
        )}
      </form>

      {failed && <p className="error" style={{ marginTop: "2rem" }}>{t.loadError}</p>}

      <h2>{t.recent}</h2>
      {games === null ? (
        <p className="muted">{t.loading}</p>
      ) : games.length === 0 ? (
        <p className="muted">{t.recentEmpty}</p>
      ) : (
        <ul className="list">
          {games.map((g) => (
            <li key={g.gameId + g.tx}>
              <Link className="grow mono" href={`/game/?id=${g.gameId}`}>
                {short(g.gameId)}
              </Link>
              <span className={`tag-${g.outcome}`}>{t.outcome[g.outcome]}</span>
            </li>
          ))}
        </ul>
      )}

      <h2>{t.leaderboard}</h2>
      {leaders === null ? (
        <p className="muted">{t.loading}</p>
      ) : leaders.length === 0 ? (
        <p className="muted">{t.leaderEmpty}</p>
      ) : (
        <ol className="list">
          {leaders.map((r, i) => (
            <li key={r.player}>
              <span className="rank">{i + 1}</span>
              <span className="grow mono">
                {explorerUrl ? <a href={`${explorerUrl}/address/${r.player}`}>{short(r.player)}</a> : short(r.player)}
              </span>
              <span className="muted num">{t.games(r.games)}</span>
              <span className="num">
                {r.credits.toString()} {t.credits}
              </span>
            </li>
          ))}
        </ol>
      )}

      <footer>
        <p>
          {t.network}: {networkName}. {t.footer}
        </p>
        <p style={{ marginTop: "0.6rem" }}>
          <Link href="/privacy/">{t.privacyLink}</Link>
          <Link href="/terms/" style={{ marginLeft: "1.25rem" }}>
            {t.termsLink}
          </Link>
        </p>
      </footer>
    </main>
  );
}
