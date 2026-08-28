// kit.mjs — primitif bersama untuk semua artboard .dc.html
// Semua nilai diambil persis dari src/styles.css, src/routing.css, src/themes.css.
// Jangan bulatkan ke grid 4/8px: angka ganjil (13px, 1.5px, 66px) memang begitu di produk.


/* ---------- token ----------
   TIGA tema, satu per karakter utama. Peta ke permintaan "kitty / cinnamoroll /
   kuromi" memakai karakter orisinal yang sudah ada di produk (migrasi 008):
     Momo  kucing putih, pita merah muda   aksen #ff6f9c
     Yuki  anjing awan, telinga berbulu     aksen #3aa7e8
     Luna  kelinci malam, bulan sabit       aksen #8b5cf6
   CATATAN KONTRAS: #3aa7e8 dengan teks putih cuma 2,63:1 dan #8b5cf6 cuma 4,26:1 —
   dua-duanya gagal ambang 4.5:1 yang dipakai produk. Jadi hex itu dipakai sebagai
   --pink (aksen), sementara --btn-bg memakai turunan gelap yang lolos: #1a6fae
   (5,30:1) dan #7c3aed (5,71:1). Kunci 'momo' di DB masih bernama 'kitty';
   jangan ubah nilai kolomnya tanpa migrasi. */
export const THEMES = {
  momo: {
    ink: '#5b3f52', muted: '#7a5f6c', pink: '#ff7bab', pinkDeep: '#ff5c9a',
    pinkPale: '#ffe3ef', pinkPaler: '#fff2f8', lavender: '#efe3ff',
    gold: '#ffcd6e', goldDeep: '#ffb84d', mint: '#c9f7e6',
    soft: '#fff7fb', card: '#ffffff', line: '#f6def0', furi: '#8a6e7c',
    btnBg: '#ff6f9c', btnText: '#3a2a33', btnShadow: '#c22a5e',
    bg: 'radial-gradient(circle at 10% 0%, #ffe9f4 0%, transparent 45%),radial-gradient(circle at 90% 10%, #eee3ff 0%, transparent 40%),linear-gradient(180deg,#fff8fc,#fffdfa 60%)',
    shadow: '0 10px 30px -8px rgba(255,110,160,.35)',
    shadowLg: '0 18px 45px -10px rgba(255,110,160,.4)',
  },
  yuki: {
    ink: '#27455e', muted: '#5b7a94', pink: '#3aa7e8', pinkDeep: '#1f8bd0',
    pinkPale: '#d6ecfb', pinkPaler: '#edf7fe', lavender: '#e0eefb',
    gold: '#ffd966', goldDeep: '#f0be3c', mint: '#d3f3ee',
    soft: '#f6fbff', card: '#ffffff', line: '#d8e9f7', furi: '#5d7d99',
    btnBg: '#1a6fae', btnText: '#ffffff', btnShadow: 'rgba(10,50,85,.45)',
    bg: 'radial-gradient(circle at 10% 0%, #dcefff 0%, transparent 45%),radial-gradient(circle at 90% 10%, #e6f6f4 0%, transparent 40%),linear-gradient(180deg,#f4fbff,#fdfeff 60%)',
    shadow: '0 10px 30px -8px rgba(80,160,220,.32)',
    shadowLg: '0 18px 45px -10px rgba(80,160,220,.38)',
  },
  luna: {
    ink: '#3a2f56', muted: '#6b6091', pink: '#8b5cf6', pinkDeep: '#7042d8',
    pinkPale: '#e7ddfd', pinkPaler: '#f5f0ff', lavender: '#ded4fa',
    gold: '#ffe08a', goldDeep: '#f2c65c', mint: '#dcd4f5',
    soft: '#faf7ff', card: '#ffffff', line: '#e3dbf7', furi: '#7d719f',
    btnBg: '#7c3aed', btnText: '#ffffff', btnShadow: 'rgba(50,18,110,.45)',
    bg: 'radial-gradient(circle at 10% 0%, #e9deff 0%, transparent 45%),radial-gradient(circle at 90% 10%, #f8e8f8 0%, transparent 40%),linear-gradient(180deg,#f9f6ff,#fffcff 60%)',
    shadow: '0 10px 30px -8px rgba(120,90,200,.32)',
    shadowLg: '0 18px 45px -10px rgba(120,90,200,.38)',
  },
};

/* ---------- MODE GELAP ----------
   Bukan sekadar membalik luminansi: kartu tetap lebih terang dari latar (elevasi),
   aksen dinaikkan sedikit supaya tidak tenggelam, dan pasangan tombol diaudit ulang
   karena ambang 4.5:1 berlaku di dua arah. Nilai kontras tombol pada latar gelap:
     momo  #ff6f9c + #2a121c = 8,1:1   yuki #2b8fd4 + #04161f = 5,3:1
     luna  #9d76f8 + #150a2b = 5,6:1   (#8b5cf6 + putih cuma 4,3:1 — ditolak) */
THEMES.momoDark = {
  ink: '#f7eaf4', muted: '#a892b8', pink: '#ff7bb0', pinkDeep: '#ff5fa0',
  pinkPale: '#2a1a2e', pinkPaler: '#1d1424', lavender: '#2a1f3d',
  gold: '#ffd47e', goldDeep: '#f5bf5c', mint: '#1e3a35',
  soft: '#120d1a', card: '#171020', line: '#2e2038', furi: '#b89ac4',
  btnBg: '#ff6f9c', btnText: '#2a121c', btnShadow: 'rgba(0,0,0,.7)',
  bg: 'radial-gradient(circle at 78% 6%, #2d1338 0%, transparent 46%),radial-gradient(circle at 10% 2%, #1b1030 0%, transparent 40%),linear-gradient(180deg,#0e0a13,#0a070f 65%)',
  shadow: '0 14px 34px -12px rgba(0,0,0,.85)', shadowLg: '0 24px 54px -14px rgba(0,0,0,.9)',
};
THEMES.yukiDark = {
  ink: '#e8f4fe', muted: '#8fadc8', pink: '#4fb4f0', pinkDeep: '#33a2e6',
  pinkPale: '#14263a', pinkPaler: '#101c2b', lavender: '#182c42',
  gold: '#ffd966', goldDeep: '#eec24c', mint: '#153b36',
  soft: '#0b131d', card: '#101a26', line: '#20344a', furi: '#86a6c2',
  btnBg: '#2b8fd4', btnText: '#04161f', btnShadow: 'rgba(0,0,0,.7)',
  bg: 'radial-gradient(circle at 78% 6%, #103049 0%, transparent 46%),radial-gradient(circle at 10% 2%, #0d2436 0%, transparent 40%),linear-gradient(180deg,#080e16,#060a11 65%)',
  shadow: '0 14px 34px -12px rgba(0,0,0,.85)', shadowLg: '0 24px 54px -14px rgba(0,0,0,.9)',
};
THEMES.lunaDark = {
  ink: '#ece4fd', muted: '#9d90c2', pink: '#a084f9', pinkDeep: '#8b5cf6',
  pinkPale: '#241b3a', pinkPaler: '#1b1430', lavender: '#291f45',
  gold: '#ffe08a', goldDeep: '#efcb6e', mint: '#1f3446',
  soft: '#0e0a18', card: '#151027', line: '#2c2246', furi: '#9689bd',
  btnBg: '#9d76f8', btnText: '#150a2b', btnShadow: 'rgba(0,0,0,.7)',
  bg: 'radial-gradient(circle at 78% 6%, #2a1650 0%, transparent 46%),radial-gradient(circle at 10% 2%, #1a1038 0%, transparent 40%),linear-gradient(180deg,#0c0916,#080611 65%)',
  shadow: '0 14px 34px -12px rgba(0,0,0,.85)', shadowLg: '0 24px 54px -14px rgba(0,0,0,.9)',
};
export const DARK_OF = { momo: 'momoDark', yuki: 'yukiDark', luna: 'lunaDark' };
export const isDark = (t) => t === THEMES.momoDark || t === THEMES.yukiDark || t === THEMES.lunaDark;

export const T = THEMES.momo;

export const CHAR_IDS = ['momo', 'yuki', 'luna'];
export const CHAR_EXPRS = ['idle', 'happy', 'sad', 'sleepy', 'surprised', 'clap'];
export const CHAR_META = {
  momo: { name: 'Momo', species: 'Kucing putih', desc: 'Hangat & telaten', acc: '#ff6f9c', btn: '#ff6f9c', btnText: '#3a2a33' },
  yuki: { name: 'Yuki', species: 'Anjing awan', desc: 'Tenang & penyabar', acc: '#3aa7e8', btn: '#1a6fae', btnText: '#ffffff' },
  luna: { name: 'Luna', species: 'Kelinci malam', desc: 'Jenaka & penuh akal', acc: '#8b5cf6', btn: '#7c3aed', btnText: '#ffffff' },
};

/* Karakter = PNG hasil potong dari lembar referensi (extract-characters.py).
   Bukan SVG lagi: ilustrasi raster berbayang lembut tidak bisa ditiru path bezier
   yang ditulis tanpa melihat hasilnya. Berkas ada di chars/<id>-<ekspresi>.png,
   di-seed ke kanvas lewat --image sehingga bisa dirujuk cukup dengan nama berkas. */
export function charSvg(id, expr = 'idle', w = 120) {
  const m = CHAR_META[id];
  if (!m) throw new Error(`karakter tidak dikenal: ${id}`);
  return `<img src="${id}-${expr}.png" alt="${m.name} ${expr}" style="width:${w}px;height:auto;display:block">`;
}
export const mascot = (id, expr, w, t = T) =>
  `<div style="filter:drop-shadow(0 14px 18px ${t.pink}73)">${charSvg(id, expr, w)}</div>`;

/* ---------- ruby: satu-satunya markup ruby, meniru .fg-ruby / .fg-rb / .fg-rt ---------- */
export function ruby(base, reading, { furi = T.furi, mode = 'furigana' } = {}) {
  const rt = mode === 'kanji'
    ? ''
    : `<span style="display:block;font-size:max(13px,.55em);font-weight:500;line-height:1.28;margin-bottom:.16em;letter-spacing:0;white-space:nowrap;text-align:center;color:${furi}">${reading}</span>`;
  return `<span style="display:inline-flex;flex-direction:column-reverse;align-items:center;vertical-align:text-bottom;margin-inline:.1em;line-height:1.2;text-align:center;white-space:nowrap"><span style="display:block;line-height:1.1;white-space:nowrap">${base}</span>${rt}</span>`;
}
/** Teks Jepang beranotasi: "尊厳[そんげん]を守[まも]る" -> markup ruby. */
export function ja(text, { size = 17, mode = 'furigana', theme = T, weight = 700, lh = 2.35 } = {}) {
  const body = text.replace(/([一-鿿々〆ヶ]+)\[([ぁ-ゟァ-ーー]+)\]/g,
    (_, b, r) => ruby(b, r, { furi: theme.furi, mode }));
  return `<span style="font-family:'Noto Sans JP','Hiragino Kaku Gothic ProN',sans-serif;font-size:${size}px;font-weight:${weight};line-height:${mode === 'kanji' ? 1.7 : lh};letter-spacing:.01em">${body}</span>`;
}

/* ---------- ikon (inline SVG, meniru NavIcon + lucide yang dipakai app) ---------- */
const NAV_PATHS = {
  learn: '<path d="M3 10.5 12 4l9 6.5"/><path d="M5.5 9.5V20h13V9.5"/><path d="M9 20v-6h6v6"/>',
  exam: '<path d="M6 3h12v18H6z"/><path d="M9 7h6M9 11h6M9 15h3"/><path d="m16 18 1.5 1.5L21 16"/>',
  terms: '<path d="M5 4h10a4 4 0 0 1 4 4v12H9a4 4 0 0 1-4-4z"/><path d="M9 4v16"/><path d="M12 9h4M12 12h4"/>',
  friends: '<circle cx="9" cy="8" r="3"/><path d="M3.5 19c.7-2.8 2.9-4.5 5.5-4.5s4.8 1.7 5.5 4.5"/><circle cx="17" cy="9" r="2.4"/><path d="M15.6 14.6c2.6.2 4.3 1.7 4.9 4.4"/>',
  rank: '<path d="M8 21h8"/><path d="M12 17v4"/><path d="M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M7 6H4a2 2 0 0 0 2 4h1"/><path d="M17 6h3a2 2 0 0 1-2 4h-1"/>',
  profile: '<circle cx="12" cy="8" r="3"/><path d="M5 20c.8-3.2 3.1-5 7-5s6.2 1.8 7 5"/>',
};
export const navIcon = (kind, size = 22) =>
  `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${NAV_PATHS[kind]}</svg>`;

const ICONS = {
  chevron: '<path d="m9 18 6-6-6-6"/>',
  arrowLeft: '<path d="M19 12H5"/><path d="m12 19-7-7 7-7"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
  lock: '<rect width="18" height="11" x="3" y="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
  star: '<path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z"/>',
  flame: '<path d="M12 2s4 4.5 4 8a4 4 0 0 1-8 0c0-1.2.4-2.2 1-3-.2 2 .6 3 1.5 3 1.4 0 1.5-2 1.5-8z"/><path d="M6 14a6 6 0 0 0 12 0c0 5-3 8-6 8s-6-3-6-8z"/>',
  heart: '<path d="M19 5.6a4.6 4.6 0 0 0-7-.6l-.9 1-.9-1a4.6 4.6 0 1 0-6.6 6.4l7.5 7.4 7.5-7.4A4.6 4.6 0 0 0 19 5.6z"/>',
  volume: '<path d="M11 5 6 9H2v6h4l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M18.5 5.5a9 9 0 0 1 0 13"/>',
  info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>',
  rotate: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/>',
  shuffle: '<path d="M16 3h5v5"/><path d="M4 20 21 3"/><path d="M21 16v5h-5"/><path d="m15 15 6 6"/><path d="M4 4l5 5"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>',
  users: NAV_PATHS.friends,
  trophy: NAV_PATHS.rank,
  medal: '<circle cx="12" cy="15" r="6"/><path d="m8.5 9.5-3-6.5h5l2 4"/><path d="m15.5 9.5 3-6.5h-5l-2 4"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
};
export const icon = (name, size = 18, extra = '') =>
  `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" style="flex:none;${extra}">${ICONS[name]}</svg>`;
export const iconFill = (name, size = 16, color = '#ff718f') =>
  `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="${color}" stroke="${color}" stroke-width="1.6" stroke-linejoin="round" style="flex:none">${ICONS[name]}</svg>`;

/* ---------- kerangka halaman ---------- */
export function header(th = T, charId = 'momo') {
  return `<header style="height:76px;display:flex;align-items:center;justify-content:space-between;padding:0 20px;border-bottom:1px solid ${th.line};background:${th.pinkPaler}d9;gap:10px;flex:none">
  <div style="display:flex;align-items:center;gap:10px;flex:1;min-width:0;overflow:hidden">
    <div style="width:42px;height:42px;border-radius:15px;background:linear-gradient(145deg,${th.pinkPale},${th.pink}55);display:grid;place-items:center;box-shadow:0 4px 14px -3px ${th.pink}80;transform:rotate(-4deg);overflow:hidden;flex:none;padding:4px">${charSvg(charId, 'idle', 34)}</div>
    <div><b style="display:block;font:700 20px Fredoka,sans-serif;color:${th.pinkDeep};letter-spacing:-.4px;white-space:nowrap">kenshi kaigo e-learning</b><small style="font-size:9px;color:${th.muted};letter-spacing:1.4px;text-transform:uppercase;white-space:nowrap">belajar kaigo</small></div>
  </div>
  <div style="display:flex;align-items:center;gap:8px;color:${th.pinkDeep};font-weight:700;font-size:12.5px;flex:none">
    <span style="display:flex;align-items:center;gap:4px;background:${th.pinkPale};padding:6px 9px;border-radius:999px;white-space:nowrap">${iconFill('flame', 16, th.pink)} 7<span style="font-size:9px;font-weight:600;opacity:.6;letter-spacing:.03em">hari</span></span>
  </div>
</header>`;
}

/** Bottom nav — MOBILE = 4 item. Teman & Peringkat sengaja tidak ada di <1024px. */
export function bottomNav(active = 'learn', th = T) {
  const items = [
    ['learn', 'Belajar'], ['exam', 'Ujian'], ['terms', 'Istilah'], ['profile', 'Profil'],
  ];
  return `<nav style="height:76px;background:${th.pinkPaler}ee;border-top:1px solid ${th.line};display:flex;justify-content:space-around;padding-top:6px;box-shadow:0 -8px 24px -12px ${th.pink}40;flex:none">
  ${items.map(([k, label]) => {
    const on = k === active;
    return `<a style="display:flex;flex-direction:column;gap:3px;align-items:center;font-size:10.5px;font-weight:700;padding-top:2px;flex:1;text-decoration:none;color:${on ? th.pinkDeep : th.muted}"><span style="width:34px;height:34px;display:grid;place-items:center;border-radius:12px;${on ? `background:${th.pinkPale};box-shadow:0 4px 10px -3px ${th.pink}80;transform:translateY(-2px)` : ''}">${navIcon(k)}</span><span>${label}</span></a>`;
  }).join('')}
</nav>`;
}

/* ---------- tombol ---------- */
export const primary = (label, th = T, extra = '') =>
  `<a style="display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:16px 20px;border-radius:16px;font:700 14px 'DM Sans',sans-serif;text-decoration:none;background:${th.btnBg};color:${th.btnText};box-shadow:0 10px 24px -8px ${th.btnShadow};width:100%;${extra}">${label}</a>`;
export const secondary = (label, th = T, extra = '') =>
  `<a style="display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:16px 20px;border-radius:16px;font:700 14px 'DM Sans',sans-serif;text-decoration:none;background:${th.card};color:${th.pinkDeep};border:1.5px solid ${th.pinkPale};box-shadow:0 4px 14px -6px ${th.pink}4d;width:100%;${extra}">${label}</a>`;

export const back = (label, th = T) =>
  `<a style="display:inline-flex;align-items:center;gap:6px;color:${th.muted};font-size:13px;text-decoration:none;font-weight:600;padding:4px 0 14px">${icon('arrowLeft', 16)} ${label}</a>`;

export const eyebrow = (t, th = T) =>
  `<p style="font-size:11px;letter-spacing:1.6px;color:${th.pink};font-weight:700;margin:0 0 10px;text-transform:uppercase">${t}</p>`;

/** Language switch — 漢字 / ふり / ID, tinggi tombol 44px seperti produk. */
export const langSwitch = (active = 'kanji', th = T, scale = 1) => {
  const modes = [['kanji', '漢字'], ['furigana', 'ふり'], ['id', 'ID']];
  return `<div style="display:flex;gap:3px;flex:none;background:${th.pinkPale};border-radius:999px;padding:3px;transform:scale(${scale});transform-origin:right center">${modes.map(([k, l]) => `<span style="font-size:11px;font-weight:700;padding:6px 10px;border-radius:999px;line-height:1;min-height:44px;min-width:44px;display:grid;place-items:center;${k === active ? `background:${th.card};color:${th.pinkDeep};box-shadow:0 3px 8px -3px ${th.pink}80` : `color:${th.muted}`}">${l}</span>`).join('')}</div>`;
};

// Pill & banner preview sengaja TIDAK ikut tema: kuning-amber adalah warna status
// (sama seperti hijau benar / merah salah), bukan warna merek. Ikut tema justru
// menghapus artinya — di tema Luna pill ungu tidak lagi terbaca sebagai peringatan.
export const previewPill = (_t = T) =>
  `<span style="position:absolute;top:10px;right:14px;display:flex;align-items:center;gap:4px;font-size:9.5px;font-weight:700;color:#b98a6d;background:#fff3e2;border:1px solid #f4dcb8;padding:3px 8px;border-radius:999px;letter-spacing:.4px">${icon('lock', 10)} preview</span>`;

export const previewBanner = (text) =>
  `<div style="display:flex;align-items:center;gap:10px;background:#fff3e2;border:1px solid #f4dcb8;color:#a1723f;border-radius:20px;padding:12px 15px;margin-bottom:16px;font-size:12.5px;font-weight:600;line-height:1.45">${icon('lock', 16)}<span>${text}</span></div>`;

/* ---------- pembungkus artboard ---------- */
export function doc({ body, w, h, theme = T, pad = true, scroll = false }) {
  const inner = pad
    ? `<main style="padding:22px 20px 40px;flex:1;${scroll ? 'overflow:hidden' : ''}">${body}</main>`
    : body;
  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Fredoka:wght@400;500;600;700&family=Noto+Sans+JP:wght@400;500;700;800&display=swap">
  <style>
    body { margin: 0; }
    * { box-sizing: border-box; }
    a { color: ${theme.pinkDeep}; text-decoration: none; }
    a:hover { color: ${theme.pink}; }
    p { margin: 0; }
    h1, h2, h3 { margin: 0; }
  </style>
</helmet>
<div style="width:${w}px;height:${h}px;display:flex;flex-direction:column;background:${theme.bg};color:${theme.ink};font-family:'DM Sans',sans-serif;overflow:hidden">
${inner}
</div>
</x-dc>
</body>
</html>
`;
}

/** Layar telepon lengkap: header + isi + bottom nav. */
export function phone({ body, h = 874, theme = T, nav = 'learn', charId = 'momo', pad = true }) {
  const inner = `${header(theme, charId)}<main style="flex:1;min-height:0;overflow:hidden;${pad ? 'padding:22px 20px 24px' : ''}">${body}</main>${bottomNav(nav, theme)}`;
  return doc({ body: inner, w: 402, h, theme, pad: false });
}
