// screens-desktop.mjs — dashboard desktop (>=1280px), terang & gelap, tiga tema.
//
// Perbedaan dari shell desktop lama: sidebar penuh dengan brand + kartu semangat +
// sakelar mode gelap, kartu bab BERWARNA PER BAB (bukan semua merah muda), tombol
// "Lihat roadmap", dan panel "Ringkasan progres" berisi empat statistik.
//
// Warna per bab sengaja bukan token tema: 13 bab yang semuanya sewarna bikin grid
// jadi dinding datar, dan warna itulah yang dipakai orang untuk mengingat bab mana.
// Tema tetap menguasai latar, kartu, teks, sidebar, dan tombol.
import { THEMES, doc, charSvg, ja, icon, iconFill, navIcon, isDark, CHAR_META } from './kit.mjs';
import { iconBox } from './icons.mjs';
import { nightSky } from './nightsky.mjs';

/* [nomor, judul JP, judul ID, deskripsi, ikon, persen, aksen terang, aksen gelap] */
export const DESK_SECTIONS = [
  ['01', '人間の尊厳と自立', 'Membangun martabat jadi dasar tiap tindakan',
    'Memahami martabat, hak asasi, dan kemandirian sebagai fondasi setiap tindakan perawatan.',
    'sakura', 72, '#ff7bab', '#ff92c0'],
  ['02', '人間関係とコミュニケーション', 'Membangun kepercayaan lewat cara bicara',
    'Melatih cara membangun hubungan dan menyampaikan maksud tanpa melukai.',
    'surat', 48, '#9d8bf0', '#ab9bf7'],
  ['03', '社会の理解', 'Memahami kaigo dan aturan yang mengikat',
    'Menyelami sistem jaminan sosial, asuransi kaigo, dan kerangka hukum yang mengikat praktik di Jepang.',
    'rumah', 61, '#e8a33c', '#f0b552'],
  ['04', 'こころとからだのしくみ', 'Mengenali tubuh dan pikiran lansia',
    'Mengenali cara kerja tubuh dan pikiran agar perubahan kecil pada pengguna cepat terbaca.',
    'jantung', 55, '#4d9fd8', '#5cb3ea'],
];

const NAV = [
  ['learn', 'Belajar'], ['exam', 'Ujian'], ['terms', 'Istilah'],
  ['friends', 'Teman'], ['rank', 'Peringkat'], ['profile', 'Profil'],
];

const sidebar = (t, charId, dark) => `
<nav style="width:268px;flex:none;display:flex;flex-direction:column;padding:26px 20px;background:${dark ? t.soft : `${t.card}b3`};${dark ? `border:1px solid ${t.line};border-radius:30px` : `border-right:1px solid ${t.line}`}">
  <div style="display:flex;align-items:center;gap:12px;margin:0 6px 26px">
    <span style="width:56px;height:56px;border-radius:20px;background:${t.pinkPale};display:grid;place-items:center;overflow:hidden;flex:none">${charSvg(charId, 'idle', 46)}</span>
    <div><b style="display:block;font:700 26px Fredoka,sans-serif;color:${t.pinkDeep};letter-spacing:-.5px;line-height:1">kenshi</b>
    <small style="font-size:12px;color:${t.muted}">kaigo e-learning</small></div>
  </div>
  <div style="display:flex;flex-direction:column;gap:5px">
    ${NAV.map(([k, l], i) => {
      const on = i === 0;
      const glow = on && dark ? `border:1px solid ${t.pink}80;box-shadow:0 0 24px -8px ${t.pink},inset 0 0 22px -14px ${t.pink}` : 'border:1px solid transparent';
      return `<a style="display:flex;align-items:center;gap:13px;padding:11px 13px;border-radius:18px;font:600 15px 'DM Sans',sans-serif;text-decoration:none;color:${on ? t.pinkDeep : t.muted};background:${on ? t.pinkPale : 'transparent'};${glow}">
      <span style="width:40px;height:40px;border-radius:14px;display:grid;place-items:center;background:${on ? t.card : `${t.pinkPale}80`};color:${on ? t.pinkDeep : t.muted};${on && dark ? `box-shadow:0 0 18px -6px ${t.pink}` : ''}">${navIcon(k, 21)}</span>${l}</a>`;
    }).join('')}
  </div>
  <div style="flex:1"></div>
  <div style="display:flex;align-items:center;gap:11px;padding:12px 14px;border-radius:20px;background:${t.pinkPaler};border:1px solid ${t.line};margin-bottom:12px">
    ${charSvg(charId, 'happy', 46)}
    <small style="font-size:12px;line-height:1.4;color:${t.ink};font-weight:600">Sedikit setiap hari,<br>hasil luar biasa!</small>
  </div>
  <div style="display:flex;align-items:center;gap:11px;padding:13px 15px;border-radius:20px;border:1px solid ${t.line};background:${t.card}">
    <span style="color:${t.pinkDeep}">${moonIcon(dark)}</span>
    <span style="flex:1;font-size:13.5px;font-weight:600;color:${t.ink}">Mode gelap</span>
    <span style="width:46px;height:26px;border-radius:999px;background:${dark ? t.btnBg : t.line};position:relative;flex:none">
      <span style="position:absolute;top:3px;${dark ? 'right:3px' : 'left:3px'};width:20px;height:20px;border-radius:50%;background:${dark ? t.card : '#fff'};box-shadow:0 2px 5px rgba(0,0,0,.28)"></span>
    </span>
  </div>
</nav>`;

const moonIcon = (dark) => `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">${dark
  ? '<circle cx="12" cy="12" r="4.2"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.5 1.5M16.9 16.9l1.5 1.5M18.4 5.6l-1.5 1.5M7.1 16.9l-1.5 1.5"/>'
  : '<path d="M20 13.6A8 8 0 0 1 10.4 4a8.4 8.4 0 1 0 9.6 9.6Z"/>'}</svg>`;

const statTile = (t, ic, accent, big, small, label) => `
<div style="display:flex;align-items:center;gap:13px;flex:1;min-width:0">
  <span style="width:52px;height:52px;border-radius:18px;background:${accent}26;display:grid;place-items:center;flex:none">${iconBox(ic, { size: 28, fill: accent, tint: `${accent}40` })}</span>
  <div style="min-width:0">
    <div style="font:700 26px Fredoka,sans-serif;color:${t.ink};line-height:1.1">${big}<span style="font-size:14px;color:${t.muted};font-weight:600"> ${small}</span></div>
    <small style="font-size:12px;color:${t.muted}">${label}</small>
  </div>
</div>`;

const chapterCard = (t, dark, row) => {
  const [no, jaTitle, idTitle, desc, ic, pct] = row;
  const accent = dark ? row[7] : row[6];
  const skin = dark
    ? `background:${t.card};border:1px solid ${accent}59;box-shadow:0 0 30px -10px ${accent},${t.shadow}`
    : `background:linear-gradient(150deg,${t.card},${accent}0d);border:1px solid ${accent}2e;box-shadow:${t.shadow}`;
  const tileGlow = dark ? `box-shadow:0 0 28px -6px ${accent}b3,inset 0 0 26px -14px ${accent}` : '';
  return `<div style="display:flex;gap:16px;padding:20px;border-radius:26px;${skin};position:relative">
  <span style="width:96px;height:96px;border-radius:24px;background:${accent}${dark ? '26' : '1f'};display:grid;place-items:center;flex:none;${tileGlow}">${iconBox(ic, { size: 54, fill: accent, tint: `${accent}4d` })}</span>
  <div style="flex:1;min-width:0;display:flex;flex-direction:column">
    <span style="align-self:flex-start;font:700 11px 'DM Sans',sans-serif;letter-spacing:.9px;color:${accent};background:${accent}24;padding:4px 10px;border-radius:8px;margin-bottom:7px">BAB ${no}</span>
    <b lang="ja" style="font-family:'Noto Sans JP',sans-serif;font-size:21px;font-weight:700;color:${t.ink};line-height:1.35">${jaTitle}</b>
    <span style="font-size:13px;color:${t.muted};margin-top:3px">${idTitle}</span>
    <em style="font-size:12.5px;color:${t.muted};font-style:normal;line-height:1.55;margin-top:6px;flex:1">${desc}</em>
    <div style="display:flex;align-items:center;gap:10px;margin-top:11px">
      <div style="flex:1;height:8px;border-radius:999px;background:${accent}24;overflow:hidden"><i style="display:block;height:100%;width:${pct}%;border-radius:999px;background:${accent};${dark ? `box-shadow:0 0 12px ${accent}` : ''}"></i></div>
      <b style="font:700 13px 'DM Sans',sans-serif;color:${accent};flex:none">${pct}%</b>
    </div>
  </div>
  <span style="position:absolute;right:18px;top:50%;transform:translateY(-50%);width:34px;height:34px;border-radius:50%;border:1.5px solid ${accent}59;color:${accent};display:grid;place-items:center;background:${t.card}">${icon('chevron', 17)}</span>
</div>`;
};

export function DesktopDashboard(themeKey = 'momo', dark = false) {
  const t = dark ? THEMES[`${themeKey}Dark`] : THEMES[themeKey];
  const charId = themeKey;
  const acc1 = dark ? DESK_SECTIONS[0][7] : DESK_SECTIONS[0][6];
  return doc({
    w: 1440, h: 1024, theme: t, pad: false,
    body: `<div style="display:flex;height:100%;overflow:hidden;${dark ? 'gap:12px;padding:12px' : ''}">
  ${sidebar(t, charId, dark)}
  <main style="flex:1;min-width:0;overflow:hidden;padding:26px 32px;position:relative;${dark ? `background:${t.soft};border:1px solid ${t.line};border-radius:30px` : ''}">
    ${dark ? nightSky(t) : ''}
    <div style="position:absolute;right:26px;top:78px;pointer-events:none;${dark ? `filter:drop-shadow(0 0 30px ${t.pink}66)` : ''}">${charSvg(charId, 'idle', 240)}</div>

    <div style="display:flex;justify-content:flex-end;margin-bottom:6px">
      <span style="display:inline-flex;align-items:center;gap:8px;padding:10px 18px;border-radius:999px;background:${t.card};border:1px solid ${t.line};box-shadow:${dark ? `0 0 26px -8px ${t.pink}` : t.shadow};font:700 13.5px 'DM Sans',sans-serif;color:${t.pinkDeep};${dark ? `border-color:${t.pink}59` : ''}">${iconFill('flame', 17, t.pinkDeep)} 7 hari berturut-turut</span>
    </div>

    <p style="font-size:12px;letter-spacing:1.7px;color:${t.pink};font-weight:700;text-transform:uppercase;margin-bottom:8px">Ohayō, Kenshi</p>
    <h1 lang="ja" style="font-family:'Noto Sans JP',sans-serif;font-size:44px;font-weight:700;line-height:1.3;color:${t.ink};display:flex;align-items:center;gap:12px">継続は力なり ${iconBox('sakura', { size: 26, fill: t.pink, tint: t.pinkPale })}</h1>
    <p style="font-size:15px;font-style:italic;color:${t.muted};margin-top:8px">Ketekunan itu sendiri adalah kekuatan. — pepatah Jepang</p>
    <p style="font-size:15px;color:${t.ink};margin-top:8px">13 bab · 152 level · dikerjakan sedikit demi sedikit.</p>

    <div style="display:flex;gap:18px;margin-top:22px">
      <div style="flex:1;display:flex;align-items:center;gap:15px;padding:20px 22px;border-radius:24px;background:${t.card};border:1px solid ${t.line};box-shadow:${t.shadow}">
        <span style="width:56px;height:56px;border-radius:18px;background:${t.pinkPale};display:grid;place-items:center;flex:none">${iconBox('catatan', { size: 30, fill: t.pinkDeep, tint: t.card })}</span>
        <div style="flex:1;min-width:0">
          <b style="font:600 17px Fredoka,sans-serif;color:${t.ink}">Hari ini</b>
          <p style="font-size:13px;color:${t.muted};margin:3px 0 10px">Satu kartu sekali duduk sudah cukup.</p>
          <div style="display:flex;align-items:center;gap:10px">
            <div style="flex:1;height:9px;border-radius:999px;background:${t.pinkPale};overflow:hidden"><i style="display:block;height:100%;width:65%;border-radius:999px;background:linear-gradient(90deg,${t.pink},${t.pinkDeep})"></i></div>
            <b style="font-size:13px;color:${t.pinkDeep}">65%</b>
          </div>
        </div>
        <span style="display:flex;flex-direction:column;align-items:center;gap:3px;padding:12px 16px;border-radius:18px;background:${t.gold}${dark ? '1f' : '33'};flex:none;${dark ? `border:1px solid ${t.gold}66;box-shadow:0 0 22px -8px ${t.gold}` : ''}">
          ${iconFill('star', 20, t.goldDeep)}<b style="font:700 12.5px Fredoka,sans-serif;color:${t.goldDeep};white-space:nowrap">9 selesai</b>
        </span>
      </div>
      <div style="flex:1;display:flex;align-items:center;gap:15px;padding:20px 22px;border-radius:24px;background:${t.card};border:1px solid ${t.line};box-shadow:${t.shadow}">
        <span style="width:56px;height:56px;border-radius:18px;background:${t.lavender};display:grid;place-items:center;flex:none">${iconBox('stetoskop', { size: 30, fill: t.pinkDeep, tint: t.card })}</span>
        <div style="flex:1;min-width:0">
          <b style="font:600 17px Fredoka,sans-serif;color:${t.ink}">Ujian Akhir</b>
          <p style="font-size:13px;color:${t.muted};margin-top:4px">Soal asli 2021–2026 · 125 butir tiap tahun</p>
        </div>
        <span style="width:34px;height:34px;border-radius:50%;border:1.5px solid ${t.pink}59;color:${t.pinkDeep};display:grid;place-items:center;flex:none">${icon('chevron', 17)}</span>
      </div>
    </div>

    <div style="display:flex;align-items:flex-end;justify-content:space-between;margin:26px 0 14px">
      <div>
        <h2 style="font:600 24px Fredoka,sans-serif;color:${t.ink};display:flex;align-items:center;gap:9px">Urutan belajar ${iconBox('kilau', { size: 19, fill: t.gold, tint: t.goldDeep })}</h2>
        <p style="font-size:13px;color:${t.muted};margin-top:3px">Mulai dari martabat, berakhir di studi kasus</p>
      </div>
      <span style="display:inline-flex;align-items:center;gap:9px;padding:11px 18px;border-radius:999px;background:${t.card};border:1px solid ${t.line};color:${t.pinkDeep};font:700 13.5px 'DM Sans',sans-serif;box-shadow:${t.shadow}">${icon('terms', 17)} Lihat roadmap</span>
    </div>

    <div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px">
      ${DESK_SECTIONS.map(r => chapterCard(t, dark, r)).join('')}
    </div>

    <div style="margin-top:18px;padding:20px 24px;border-radius:26px;background:${dark ? t.soft : `linear-gradient(135deg,${t.card},${t.pinkPaler})`};border:1px solid ${t.line};box-shadow:${t.shadow};position:relative;overflow:hidden">
      <h3 style="font:600 16px Fredoka,sans-serif;color:${t.ink};display:flex;align-items:center;gap:8px;margin-bottom:14px">Ringkasan progres ${iconBox('kilau', { size: 16, fill: t.gold, tint: t.goldDeep })}</h3>
      <div style="display:flex;gap:10px;padding-right:170px">
        ${statTile(t, 'catatan', acc1, '4', '/ 13', 'Bab selesai')}
        ${statTile(t, 'gelembung', dark ? DESK_SECTIONS[1][7] : DESK_SECTIONS[1][6], '38', '/ 152', 'Level selesai')}
        ${statTile(t, 'pita', t.goldDeep, '68', '%', 'Rata-rata benar')}
        ${statTile(t, 'jantung', dark ? DESK_SECTIONS[0][7] : DESK_SECTIONS[0][6], '7', '', 'Hari berturut-turut')}
      </div>
      <div style="position:absolute;right:18px;bottom:-6px">${charSvg(charId, 'sleepy', 150)}</div>
    </div>
  </main>
</div>`,
  });
}

export const DeskMomo = () => DesktopDashboard('momo', false);
export const DeskMomoGelap = () => DesktopDashboard('momo', true);
export const DeskYuki = () => DesktopDashboard('yuki', false);
export const DeskYukiGelap = () => DesktopDashboard('yuki', true);
export const DeskLuna = () => DesktopDashboard('luna', false);
export const DeskLunaGelap = () => DesktopDashboard('luna', true);
