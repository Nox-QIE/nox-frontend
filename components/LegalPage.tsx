"use client";

import Link from "next/link";
import { legal } from "@/lib/legal";
import { useI18n } from "@/lib/i18n";
import { Bar } from "./Bar";

export function LegalPage({ doc }: { doc: keyof typeof legal }) {
  const { lang, t } = useI18n();
  const d = legal[doc][lang];
  return (
    <main>
      <Bar />
      <h1>{d.title}</h1>
      <p className="muted" style={{ marginTop: "0.6rem" }}>
        {d.updated}. {d.draft}
      </p>
      {d.sections.map((s) => (
        <section key={s.h}>
          <h2>{s.h}</h2>
          {s.p.map((p) => (
            <p key={p} style={{ marginBottom: "0.7rem", maxWidth: "38rem" }}>
              {p}
            </p>
          ))}
        </section>
      ))}
      <p style={{ marginTop: "2.5rem" }}>
        <Link href="/">{t.back}</Link>
      </p>
    </main>
  );
}
