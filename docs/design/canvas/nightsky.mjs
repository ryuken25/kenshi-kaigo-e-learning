// nightsky.mjs — lapisan dekorasi langit malam untuk mode gelap.
//
// Hanya dipasang saat dark: di mode terang latarnya gradasi pastel dan tambahan ini
// justru bikin ramai. Semua posisi ditulis tetap (bukan acak) supaya regenerasi
// selalu menghasilkan berkas identik — sama seperti aturan di src/data.js yang
// melarang Math.random() karena konten dibangun ulang tiap import.

/* [x%, y%, radius px, opacity] */
const STARS = [
  [6, 8, 1.4, .5], [12, 22, 1, .35], [17, 5, 1.8, .6], [21, 34, 1.1, .3],
  [26, 12, 1.3, .45], [31, 27, 1, .3], [34, 6, 1.6, .55], [39, 18, 1.2, .4],
  [43, 31, 1, .28], [47, 9, 1.5, .5], [52, 24, 1.1, .35], [56, 4, 1.7, .6],
  [59, 16, 1.2, .4], [63, 29, 1, .3], [66, 8, 1.4, .5], [70, 20, 1.1, .35],
  [74, 33, 1.3, .4], [77, 6, 1.6, .55], [81, 26, 1, .3], [85, 14, 1.4, .45],
  [88, 30, 1.1, .32], [91, 5, 1.5, .5], [94, 21, 1.2, .38], [97, 11, 1, .3],
  [9, 40, 1.2, .28], [15, 46, 1, .22], [24, 43, 1.3, .3], [36, 48, 1, .22],
  [45, 41, 1.2, .26], [55, 45, 1, .2], [68, 42, 1.3, .28], [79, 47, 1, .22],
  [4, 15, 1.1, .34], [29, 3, 1.2, .42], [50, 35, 1.1, .25], [86, 39, 1.2, .26],
];

/* [x%, y%, ukuran px, rotasi deg, opacity] — kelopak sakura melayang */
const PETALS = [
  [22, 14, 13, 18, .35], [33, 30, 10, -24, .28], [58, 11, 12, 40, .3],
  [72, 26, 14, -12, .32], [83, 9, 10, 28, .26], [46, 22, 11, -38, .24],
  [90, 33, 12, 14, .28], [15, 33, 9, 52, .22],
];

const petal = (c) =>
  `<svg viewBox="0 0 24 24" width="100%" height="100%"><path d="M12 2c3.4 3.6 5 7 5 9.6 0 3.6-2.4 6.4-5 6.4s-5-2.8-5-6.4C7 9 8.6 5.6 12 2Z" fill="${c}"/></svg>`;

const moon = (c, glow) => `
<svg viewBox="0 0 64 64" width="64" height="64" style="filter:drop-shadow(0 0 18px ${glow})">
  <path d="M46 40A22 22 0 0 1 24 10a24 24 0 1 0 26 26 22 22 0 0 1-4 4Z" fill="${c}" opacity=".85"/>
</svg>`;

/* Siluet pagoda — bentuk datar, hanya sebagai kedalaman latar. */
const pagoda = (c) => `
<svg viewBox="0 0 220 180" width="220" height="180" style="opacity:.5">
  <g fill="${c}">
    <path d="M110 4 150 26H70Z"/><rect x="96" y="26" width="28" height="14"/>
    <path d="M60 44h100l16 12H44Z"/><rect x="86" y="56" width="48" height="20"/>
    <path d="M46 80h128l20 13H26Z"/><rect x="78" y="93" width="64" height="26"/>
    <path d="M32 123h156l22 14H10Z"/><rect x="66" y="137" width="88" height="43"/>
  </g>
</svg>`;

/** Lapisan dekorasi absolut. Dipanggil hanya kalau dark === true. */
export function nightSky(t) {
  return `<div style="position:absolute;inset:0;overflow:hidden;pointer-events:none">
  ${STARS.map(([x, y, r, o]) =>
    `<span style="position:absolute;left:${x}%;top:${y}%;width:${r * 2}px;height:${r * 2}px;border-radius:50%;background:${t.ink};opacity:${o};box-shadow:0 0 ${r * 4}px ${t.pink}"></span>`).join('')}
  ${PETALS.map(([x, y, s, rot, o]) =>
    `<span style="position:absolute;left:${x}%;top:${y}%;width:${s}px;height:${s}px;transform:rotate(${rot}deg);opacity:${o}">${petal(t.pink)}</span>`).join('')}
  <span style="position:absolute;left:62%;top:4%">${moon(t.gold, `${t.gold}66`)}</span>
  <span style="position:absolute;left:48%;top:9%;color:${t.pink}">${pagoda(`${t.pinkPale}`)}</span>
</div>`;
}
