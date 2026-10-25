"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Lang = "id" | "en";

const en = {
  title: "Werewolf nobody can rig",
  lead: "Every role in a Nox game is locked on the QIE blockchain before it is dealt, and opened when the game ends. Paste a game ID from the bot to check it yourself.",
  gameIdLabel: "Game ID",
  gameIdPlaceholder: "0x… (from the bot's end-of-game message)",
  check: "Check game",
  badId: "A game ID is 0x followed by 64 hex characters.",
  recent: "Recent games",
  recentEmpty: "No finished games yet. Start one with /newgame in a Telegram group.",
  leaderboard: "Leaderboard",
  leaderEmpty: "No credits earned yet.",
  credits: "credits",
  games: (n: number) => `${n} ${n === 1 ? "game" : "games"}`,
  outcome: { village: "Village won", wolves: "Werewolves won", cancelled: "Cancelled" },
  loading: "Reading the chain…",
  loadError: "Could not read this game from the chain. Check the ID, or try again if the network is slow.",
  notFound: "This game ID has no record on this network.",
  back: "All games",
  verdictOk: "This game was played fair",
  verdictBad: "Something does not match",
  verdictRunning: "Game still in progress",
  verdictCancelled: "Game cancelled",
  verdictOkLead: "Your browser recomputed every proof below from the blockchain. Nothing was taken on trust from Nox.",
  verdictBadLead: "At least one proof below failed. The result of this game cannot be trusted.",
  verdictRunningLead: "Roles are locked on-chain. They are revealed and checked when the game ends.",
  checks: {
    rolesLockedFirst: (d: Record<string, string | number>) => `Roles were locked in block ${d.lockedAt}, before the first action in block ${d.firstActionAt}.`,
    rolesMatch: (d: Record<string, string | number>) => (d.bad ? `The revealed role of ${short(String(d.bad))} does not match what was locked.` : `All ${d.count} revealed roles match the locked fingerprint.`),
    everyoneRevealed: (d: Record<string, string | number>) => (d.missing ? `${short(String(d.missing))} joined but their role was never revealed.` : `Every one of the ${d.players} players had their role revealed.`),
    nightsMatch: (d: Record<string, string | number>) => (d.bad ? `A night action by ${short(String(d.bad))} does not match its sealed choice.` : `All ${d.count} secret night actions match what players sealed at the time.`),
    rulesReplay: (d: Record<string, string | number>) =>
      d.error ? `Replaying the game with the public rules failed (${d.error}).` : d.replayWinner === d.recordedWinner ? `Replaying the game with the open-source rules gives the same winner: ${teamName("en", String(d.replayWinner))}.` : `The rules give ${teamName("en", String(d.replayWinner))}, but the recorded winner is ${teamName("en", String(d.recordedWinner))}.`,
  },
  players: "Players and roles",
  story: "What happened",
  night: (r: number) => `Night ${r}`,
  day: (r: number) => `Day ${r}`,
  nightKill: (who: string, role: string) => `${who} (${role}) was killed.`,
  nightNone: "Nobody died.",
  dayOut: (who: string, role: string) => `The village exiled ${who} (${role}).`,
  dayNone: "The vote was split. Nobody was exiled.",
  votes: (n: number) => `${n} ${n === 1 ? "vote" : "votes"}`,
  you: "Check my role",
  youLead: "The bot sent you a code by DM when the game started. Paste it to see that the role it gave you is the role it revealed.",
  saltLabel: "Code from the bot",
  checkCode: "Check code",
  saltFound: (who: string, role: string) => `Match. Your code belongs to ${who}, revealed as ${role}.`,
  saltMissing: "No player in this game has that code. Check you copied all of it.",
  wallet: "Wallet",
  role: "Role",
  roles: { villager: "Villager", werewolf: "Werewolf", seer: "Seer", doctor: "Doctor" } as Record<string, string>,
  network: "Network",
  explorer: "View on explorer",
  footer: "Nox is open source. Game rules, contracts and this page can be audited on GitHub.",
  privacyLink: "Privacy",
  termsLink: "Terms",
  metricsNav: "Metrics",
  metricsTitle: "Real players, on-chain",
  metricsLead: "Every Nox player signs their own transactions on QIE: joining a game, sealing a night action, voting. These numbers are counted straight from the chain in your browser, so anyone can check them.",
  kPlayers: "Unique player wallets",
  kTxs: "Transactions signed by players",
  kGames: "Games verified and finished",
  kCredits: "Nox Credits earned",
  dailyTitle: "Players signing each day",
  dailyNote: "Distinct player wallets that signed at least one game transaction that day, last 30 days (UTC).",
  dailyLabel: (day: string, signers: number, txs: number) => `${day}: ${signers} ${signers === 1 ? "player" : "players"}, ${txs} ${txs === 1 ? "transaction" : "transactions"}`,
  showTable: "Show as a table",
  tableDay: "Day",
  tableSigners: "Players",
  tableTxs: "Transactions",
  metricsSource: (net: string) => `Source: NoxGame and NoxCredits events on ${net}.`,
};

const id: typeof en = {
  ...en,
  title: "Werewolf yang tidak bisa dicurangi",
  lead: "Setiap peran di game Nox dikunci di blockchain QIE sebelum dibagikan, lalu dibuka saat game selesai. Tempel ID game dari bot untuk memeriksanya sendiri.",
  gameIdLabel: "ID game",
  gameIdPlaceholder: "0x… (dari pesan akhir game di bot)",
  check: "Periksa game",
  badId: "ID game berbentuk 0x diikuti 64 karakter heksadesimal.",
  recent: "Game terbaru",
  recentEmpty: "Belum ada game yang selesai. Mulai dengan /newgame di grup Telegram.",
  leaderboard: "Papan peringkat",
  leaderEmpty: "Belum ada credits yang didapat.",
  credits: "credits",
  games: (n: number) => `${n} game`,
  outcome: { village: "Warga menang", wolves: "Werewolf menang", cancelled: "Dibatalkan" },
  loading: "Membaca blockchain…",
  loadError: "Game ini tidak bisa dibaca dari blockchain. Periksa ID-nya, atau coba lagi bila jaringan lambat.",
  notFound: "ID game ini tidak tercatat di jaringan ini.",
  back: "Semua game",
  verdictOk: "Game ini dimainkan dengan adil",
  verdictBad: "Ada yang tidak cocok",
  verdictRunning: "Game masih berjalan",
  verdictCancelled: "Game dibatalkan",
  verdictOkLead: "Browsermu menghitung ulang setiap bukti di bawah langsung dari blockchain. Tidak ada yang diterima begitu saja dari Nox.",
  verdictBadLead: "Setidaknya satu bukti di bawah gagal. Hasil game ini tidak bisa dipercaya.",
  verdictRunningLead: "Peran sudah dikunci di blockchain. Peran dibuka dan diperiksa saat game selesai.",
  checks: {
    rolesLockedFirst: (d) => `Peran dikunci di blok ${d.lockedAt}, sebelum aksi pertama di blok ${d.firstActionAt}.`,
    rolesMatch: (d) => (d.bad ? `Peran ${short(String(d.bad))} yang dibuka tidak cocok dengan yang dikunci.` : `Ke-${d.count} peran yang dibuka cocok dengan sidik jari yang dikunci.`),
    everyoneRevealed: (d) => (d.missing ? `${short(String(d.missing))} ikut main tapi perannya tidak pernah dibuka.` : `Peran ke-${d.players} pemain dibuka semua.`),
    nightsMatch: (d) => (d.bad ? `Aksi malam ${short(String(d.bad))} tidak cocok dengan pilihan yang disegel.` : `Ke-${d.count} aksi malam rahasia cocok dengan pilihan yang disegel pemain saat itu.`),
    rulesReplay: (d) =>
      d.error ? `Memutar ulang game dengan aturan publik gagal (${d.error}).` : d.replayWinner === d.recordedWinner ? `Memutar ulang game dengan aturan open-source menghasilkan pemenang yang sama: ${teamName("id", String(d.replayWinner))}.` : `Aturan menghasilkan ${teamName("id", String(d.replayWinner))}, tapi pemenang tercatat ${teamName("id", String(d.recordedWinner))}.`,
  },
  players: "Pemain dan peran",
  story: "Jalannya game",
  night: (r) => `Malam ${r}`,
  day: (r) => `Siang ${r}`,
  nightKill: (who, role) => `${who} (${role}) dibunuh.`,
  nightNone: "Tidak ada yang mati.",
  dayOut: (who, role) => `Desa mengusir ${who} (${role}).`,
  dayNone: "Suara terpecah. Tidak ada yang diusir.",
  votes: (n) => `${n} suara`,
  you: "Cek peranku",
  youLead: "Bot mengirimimu kode lewat DM saat game dimulai. Tempel di sini untuk memastikan peran yang diberikan sama dengan yang dibuka.",
  saltLabel: "Kode dari bot",
  checkCode: "Periksa kode",
  saltFound: (who, role) => `Cocok. Kodemu milik ${who}, dibuka sebagai ${role}.`,
  saltMissing: "Tidak ada pemain di game ini dengan kode itu. Pastikan kodenya tersalin utuh.",
  wallet: "Wallet",
  role: "Peran",
  roles: { villager: "Warga", werewolf: "Werewolf", seer: "Seer", doctor: "Doctor" },
  network: "Jaringan",
  explorer: "Lihat di explorer",
  footer: "Nox open source. Aturan game, kontrak, dan halaman ini bisa diaudit di GitHub.",
  privacyLink: "Privasi",
  termsLink: "Syarat layanan",
  metricsNav: "Metrik",
  metricsTitle: "Pemain nyata, tercatat on-chain",
  metricsLead: "Setiap pemain Nox menandatangani transaksinya sendiri di QIE: bergabung ke game, menyegel aksi malam, dan memberi suara. Angka ini dihitung langsung dari blockchain di browsermu, jadi siapa pun bisa memeriksanya.",
  kPlayers: "Wallet pemain unik",
  kTxs: "Transaksi yang ditandatangani pemain",
  kGames: "Game selesai & terverifikasi",
  kCredits: "Nox Credits yang didapat",
  dailyTitle: "Pemain yang bertransaksi per hari",
  dailyNote: "Jumlah wallet pemain berbeda yang menandatangani minimal satu transaksi game pada hari itu, 30 hari terakhir (UTC).",
  dailyLabel: (day, signers, txs) => `${day}: ${signers} pemain, ${txs} transaksi`,
  showTable: "Tampilkan sebagai tabel",
  tableDay: "Hari",
  tableSigners: "Pemain",
  tableTxs: "Transaksi",
  metricsSource: (net) => `Sumber: event NoxGame dan NoxCredits di ${net}.`,
};

export const dict = { en, id };
export type Dict = typeof en;

export function short(a: string) {
  return a.length > 12 ? `${a.slice(0, 6)}…${a.slice(-4)}` : a;
}

function teamName(lang: Lang, t: string) {
  return lang === "id" ? (t === "wolves" ? "Werewolf" : t === "village" ? "Warga" : t) : t === "wolves" ? "Werewolves" : t === "village" ? "Village" : t;
}

const Ctx = createContext<{ lang: Lang; t: Dict; setLang: (l: Lang) => void }>({ lang: "id", t: id, setLang: () => {} });

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("id");
  useEffect(() => {
    try {
      const saved = localStorage.getItem("nox-lang");
      if (saved === "id" || saved === "en") setLangState(saved);
      else if (!navigator.language.toLowerCase().startsWith("id")) setLangState("en");
    } catch {
      /* storage blocked: keep default */
    }
  }, []);
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);
  const setLang = (l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem("nox-lang", l);
    } catch {
      /* ignore */
    }
  };
  return <Ctx.Provider value={{ lang, t: dict[lang], setLang }}>{children}</Ctx.Provider>;
}

export const useI18n = () => useContext(Ctx);
