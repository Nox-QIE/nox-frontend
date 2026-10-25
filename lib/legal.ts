import type { Lang } from "./i18n";

export interface LegalDoc {
  title: string;
  updated: string;
  draft: string;
  sections: { h: string; p: string[] }[];
}

const contact = process.env.NEXT_PUBLIC_CONTACT_URL || "https://github.com/Nox-QIE";

const privacy: Record<Lang, LegalDoc> = {
  id: {
    title: "Kebijakan privasi",
    updated: "Diperbarui 25 Oktober 2026",
    draft: "Draf untuk masa uji. Belum ditinjau ahli hukum.",
    sections: [
      {
        h: "Siapa kami",
        p: ["Nox adalah game Werewolf di grup Telegram yang dicatat di blockchain QIE. Pengendali data: tim Nox. Hubungi kami lewat " + contact + "."],
      },
      {
        h: "Data yang kami simpan",
        p: [
          "ID Telegram-mu, setelah kamu menekan Start, supaya bot boleh mengirim DM berisi peran rahasia.",
          "ID grup tempat game dimainkan, dan ID Telegram host untuk mencegah kecurangan bagi hasil (maks 10 game sah per host per hari).",
          "Rahasia game (peran, kode salt, nonce aksi malam), terenkripsi AES-256-GCM, sampai game selesai dicatat di blockchain. Rahasia ini dihapus 30 hari setelah itu.",
          "Nama tampilan Telegram-mu hanya dipakai di memori selama game berjalan dan tidak disimpan.",
          "Pesan antar-werewolf diteruskan ke sesama werewolf dan tidak disimpan.",
        ],
      },
      {
        h: "Yang dikirim ke penyedia AI",
        p: [
          "Untuk narasi, Game Master mengirim fakta publik game (ronde, jumlah pemain hidup) serta nama tampilan pemain yang baru tersingkir dan daftar pemain di akhir game ke penyedia AI (Anthropic, atau Oxion AI sebagai perantara). ID Telegram dan peran pemain yang masih hidup tidak pernah dikirim.",
        ],
      },
      {
        h: "Yang dicatat di blockchain QIE (publik dan permanen)",
        p: [
          "Setiap pemain mendapat alamat wallet game yang dibuat otomatis. Alamat itu, gabung ke game, vote, hash aksi malam, peran yang dibuka di akhir, dan Nox Credits tercatat di blockchain publik dan tidak bisa dihapus oleh siapa pun.",
          "Alamat wallet tidak memuat ID Telegram-mu, tetapi orang yang ikut di grup yang sama bisa mengaitkannya dengan namamu.",
        ],
      },
      {
        h: "Halaman ini",
        p: ["Dashboard tidak memakai cookie atau analitik. Pilihan bahasa disimpan di browsermu. Data game dibaca langsung dari RPC QIE, sehingga operator RPC dapat melihat alamat IP-mu."],
      },
      {
        h: "Hakmu",
        p: [
          "Sesuai UU No. 27 Tahun 2022 tentang Pelindungan Data Pribadi, kamu berhak meminta akses, perbaikan, dan penghapusan data pribadimu, serta menarik persetujuan.",
          "Ketik /lupakan di DM bot untuk menghapus data off-chain milikmu. Data di blockchain tidak bisa dihapus. Untuk permintaan lain, hubungi kami.",
        ],
      },
      { h: "Perubahan", p: ["Jika kebijakan ini berubah, tanggal di atas diperbarui dan bot mengumumkannya."] },
    ],
  },
  en: {
    title: "Privacy policy",
    updated: "Updated 25 October 2026",
    draft: "Draft for the trial period. Not yet reviewed by a lawyer.",
    sections: [
      {
        h: "Who we are",
        p: ["Nox is a Werewolf game for Telegram groups, recorded on the QIE blockchain. Data controller: the Nox team. Contact us at " + contact + "."],
      },
      {
        h: "What we store",
        p: [
          "Your Telegram ID, once you press Start, so the bot may DM you your secret role.",
          "The ID of the group where a game is played, and the host's Telegram ID to prevent revenue-share abuse (at most 10 valid games per host per day).",
          "Game secrets (roles, salt codes, night action nonces), encrypted with AES-256-GCM, until the game is recorded on the blockchain. They are deleted 30 days after that.",
          "Your Telegram display name is only held in memory during a game and is not stored.",
          "Messages between werewolves are relayed to the other werewolves and not stored.",
        ],
      },
      {
        h: "What is sent to the AI provider",
        p: [
          "For narration, the Game Master sends public game facts (round, number of players alive) plus the display names of players just eliminated and the final roster to the AI provider (Anthropic, or Oxion AI as an intermediary). Telegram IDs and the roles of living players are never sent.",
        ],
      },
      {
        h: "What is recorded on the QIE blockchain (public and permanent)",
        p: [
          "Each player gets an automatically created game wallet address. That address, joining a game, votes, night action hashes, roles revealed at the end, and Nox Credits are recorded on a public blockchain and cannot be deleted by anyone.",
          "A wallet address does not contain your Telegram ID, but people in the same group could link it to your name.",
        ],
      },
      {
        h: "This website",
        p: ["The dashboard uses no cookies or analytics. Your language choice is stored in your browser. Game data is read straight from QIE RPC servers, whose operators can see your IP address."],
      },
      {
        h: "Your rights",
        p: [
          "Under Indonesia's Personal Data Protection Law (No. 27 of 2022) and similar laws, you can ask to access, correct or delete your personal data and withdraw consent.",
          "Send /forget to the bot in a private chat to delete your off-chain data. Blockchain data cannot be deleted. For anything else, contact us.",
        ],
      },
      { h: "Changes", p: ["If this policy changes, the date above is updated and the bot announces it."] },
    ],
  },
};

const terms: Record<Lang, LegalDoc> = {
  id: {
    title: "Syarat layanan",
    updated: "Diperbarui 25 Oktober 2026",
    draft: "Draf untuk masa uji. Belum ditinjau ahli hukum.",
    sections: [
      { h: "Layanan", p: ["Nox adalah game hiburan gratis di grup Telegram dengan Game Master AI. Selama masa uji, layanan bisa berubah, berhenti, atau diatur ulang tanpa pemberitahuan."] },
      {
        h: "Bukan judi",
        p: [
          "Tidak ada uang taruhan, biaya masuk yang dijadikan hadiah, atau taruhan atas hasil game.",
          "Nox Credits adalah poin status yang tidak bisa dipindahkan, dijual, atau ditukar dengan uang atau barang.",
        ],
      },
      { h: "Nox Promise", p: ["Nox tidak pernah meminta kamu menyetor uang, mengirim seed phrase, atau membayar untuk mengklaim hadiah. Siapa pun yang meminta itu atas nama Nox adalah penipu."] },
      {
        h: "Main dengan adil",
        p: [
          "Jangan curang: berbagi peran rahasia di luar aturan game, memakai banyak akun, menyerang bot, atau mencoba memanipulasi Game Master.",
          "Hormati pemain lain. Pelecehan, ujaran kebencian, dan konten ilegal bisa membuat kamu dikeluarkan dari game.",
        ],
      },
      {
        h: "Narasi AI",
        p: ["Narasi dibuat AI dan bisa terasa aneh atau keliru. Hasil game (peran, korban, vote, pemenang) selalu ditentukan mesin aturan open-source, bukan AI, dan bisa diperiksa di halaman bukti."],
      },
      { h: "Game Master pihak ketiga", p: ["Persona di Agent Marketplace dibuat kreator lain dan dimoderasi Nox. Persona yang melanggar aturan dapat dinonaktifkan kapan saja."] },
      { h: "Batas tanggung jawab", p: ["Layanan diberikan apa adanya. Sejauh diizinkan hukum, Nox tidak bertanggung jawab atas kerugian tidak langsung dari penggunaan game ini."] },
      { h: "Kontak", p: ["Pertanyaan dan laporan: " + contact + "."] },
    ],
  },
  en: {
    title: "Terms of service",
    updated: "Updated 25 October 2026",
    draft: "Draft for the trial period. Not yet reviewed by a lawyer.",
    sections: [
      { h: "The service", p: ["Nox is a free party game for Telegram groups with an AI Game Master. During the trial the service may change, stop, or be reset without notice."] },
      {
        h: "Not gambling",
        p: [
          "There are no stakes, no entry fees pooled into prizes, and no bets on game results.",
          "Nox Credits are status points. They cannot be transferred, sold, or exchanged for money or goods.",
        ],
      },
      { h: "The Nox Promise", p: ["Nox will never ask you to deposit money, send a seed phrase, or pay to claim a prize. Anyone asking for that in Nox's name is a scammer."] },
      {
        h: "Play fair",
        p: [
          "Do not cheat: sharing secret roles outside the game's rules, using several accounts, attacking the bot, or trying to manipulate the Game Master.",
          "Respect other players. Harassment, hate speech, and illegal content can get you removed from games.",
        ],
      },
      {
        h: "AI narration",
        p: ["Narration is written by AI and can be odd or wrong. Game outcomes (roles, deaths, votes, winner) are always decided by the open-source rules engine, never by the AI, and can be checked on the proof page."],
      },
      { h: "Third-party Game Masters", p: ["Agent Marketplace personas are made by other creators and moderated by Nox. Personas that break the rules can be switched off at any time."] },
      { h: "Liability", p: ["The service is provided as is. To the extent the law allows, Nox is not liable for indirect losses from using the game."] },
      { h: "Contact", p: ["Questions and reports: " + contact + "."] },
    ],
  },
};

export const legal = { privacy, terms };
