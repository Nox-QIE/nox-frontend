"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n";
import { Moon } from "./Moon";

export function Bar() {
  const { lang, setLang, t } = useI18n();
  return (
    <div className="bar">
      <Link className="brand" href="/">
        <Moon fraction={0.72} size={26} />
        Nox
      </Link>
      <div style={{ display: "flex", alignItems: "center", gap: "0.9rem" }}>
        <Link href="/metrics/" className="muted" style={{ fontSize: "0.92rem" }}>
          {t.metricsNav}
        </Link>
        <div className="langs" role="group" aria-label="Language">
          <button aria-pressed={lang === "id"} onClick={() => setLang("id")}>
            ID
          </button>
          <button aria-pressed={lang === "en"} onClick={() => setLang("en")}>
            EN
          </button>
        </div>
      </div>
    </div>
  );
}
