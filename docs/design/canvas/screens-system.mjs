// screens-system.mjs — lane A: sistem desain, inventaris komponen, lembar aset.
// Lembar aset dipakai untuk ekspor PNG per elemen.
import {
  T, THEMES, doc, charSvg, mascot, ja, ruby, icon, iconFill, navIcon, primary, secondary,
  langSwitch, previewPill, previewBanner, CHAR_IDS, CHAR_EXPRS, CHAR_META,
} from './kit.mjs';
import { iconBox, SECTION_ICONS, UI_ICONS, SECTION_ICON_ORDER } from './icons.mjs';

const th = T;

const label = (t) => `<small style="display:block;font-size:10.5px;font-weight:700;letter-spacing:.6px;color:${th.muted};text-transform:uppercase;margin-bottom:10px">${t}</small>`;
const panel = (title, inner, extra = '') =>
  `<section style="margin-bottom:26px;${extra}">${label(title)}${inner}</section>`;

const swatch = (name, hex, textOn = '#fff') =>
  `<div style="display:flex;flex-direction:column;gap:6px">
  <div style="height:56px;border-radius:14px;background:${hex};border:1px solid rgba(0,0,0,.06);display:grid;place-items:end;padding:6px 8px"><small style="font-size:9px;color:${textOn};font-weight:700;opacity:.85">${hex}</small></div>
  <small style="font-size:10.5px;font-weight:700;color:${th.ink}">${name}</small>
</div>`;

export const Sistem = () => doc({
  w: 900, h: 1580, theme: th,
  body: `<h1 style="font:600 30px Fredoka,sans-serif;margin-bottom:4px">Sistem desain</h1>
<p style="color:${th.muted};font-size:13px;margin-bottom:26px">Nilai diambil persis dari <b>src/styles.css</b>, <b>src/themes.css</b>, <b>src/routing.css</b>. Jangan dibulatkan ke grid 4/8px.</p>

${panel('Palet dasar — tema kitty', `<div style="display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:12px">
  ${swatch('--ink', '#5b3f52')}${swatch('--muted', '#7a5f6c')}${swatch('--pink', '#ff7bab')}${swatch('--pink-deep', '#ff5c9a')}${swatch('--pink-pale', '#ffe3ef', '#8a6e7c')}${swatch('--pink-paler', '#fff2f8', '#8a6e7c')}
  ${swatch('--lavender', '#efe3ff', '#7a5f6c')}${swatch('--gold', '#ffcd6e', '#7a4a15')}${swatch('--gold-deep', '#ffb84d', '#7a4a15')}${swatch('--mint', '#c9f7e6', '#3f7a63')}${swatch('--soft', '#fff7fb', '#8a6e7c')}${swatch('--line', '#f6def0', '#8a6e7c')}
</div>`)}

${panel('Token tombol — ikut karakter aktif', `<div style="display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:12px">
  ${CHAR_IDS.map(id => `<div style="display:flex;flex-direction:column;gap:7px;align-items:center">
    <div style="width:100%;padding:13px 8px;border-radius:16px;background:${CHAR_META[id].btn};color:${CHAR_META[id].btnText};font:700 13px 'DM Sans',sans-serif;text-align:center">Lanjut</div>
    <small style="font-size:10px;font-weight:700">${CHAR_META[id].name}</small>
    <small style="font-size:9px;color:${th.muted}">${CHAR_META[id].btn}</small>
  </div>`).join('')}
</div>
<p style="margin-top:10px;font-size:11.5px;color:${th.muted};line-height:1.55">Semua pasangan sudah lolos kontras ≥ 4.5:1. Momo dan Kinako memakai teks gelap; sisanya putih.</p>`)}

${panel('Tiga tema — satu per karakter utama', `<div style="display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px">
  ${Object.entries(THEMES).map(([name, t]) => `<div style="border:1px solid ${t.line};border-radius:20px;overflow:hidden;background:#fff">
    <div style="height:64px;background:${t.bg}"></div>
    <div style="padding:12px 14px">
      <b style="font:600 15px Fredoka,sans-serif;text-transform:capitalize">${name}</b>
      <div style="display:flex;gap:5px;margin-top:8px">${[t.ink, t.pink, t.pinkPale, t.gold, t.line].map(c => `<span style="width:22px;height:22px;border-radius:7px;background:${c};border:1px solid rgba(0,0,0,.05)"></span>`).join('')}</div>
    </div>
  </div>`).join('')}
</div>
<p style="margin-top:10px;font-size:11.5px;color:${th.muted};line-height:1.55">Ketiganya <b>light mode</b>. Tema Luna memakai ungu pastel, bukan dark mode — keputusan kontras. Kunci tema <code>momo</code> di DB masih tersimpan sebagai <code>kitty</code> (default lama); jangan diubah tanpa migrasi.</p>`)}

${panel('Tipografi', `<div style="background:#fff;border:1px solid ${th.line};border-radius:20px;padding:22px 24px;display:grid;gap:14px">
  <div><small style="font-size:10px;color:${th.muted}">Fredoka 600 · 38/1.1 — .welcome h1</small><div style="font:600 38px/1.1 Fredoka,sans-serif;letter-spacing:-1px">Urutan belajar</div></div>
  <div><small style="font-size:10px;color:${th.muted}">Fredoka 600 · 26px — h1 halaman</small><div style="font:600 26px Fredoka,sans-serif">Papan Peringkat</div></div>
  <div><small style="font-size:10px;color:${th.muted}">Fredoka 600 · 17px — judul kartu</small><div style="font:600 17px Fredoka,sans-serif">Ujian Akhir</div></div>
  <div><small style="font-size:10px;color:${th.muted}">DM Sans 400 · 13/1.55 — .muted</small><div style="font-size:13px;line-height:1.55;color:${th.muted}">Satu kartu sekali duduk sudah cukup.</div></div>
  <div><small style="font-size:10px;color:${th.muted}">DM Sans 700 · 11px/1.6px — .eyebrow</small><div style="font-size:11px;letter-spacing:1.6px;color:${th.pink};font-weight:700;text-transform:uppercase">Simulasi ujian</div></div>
  <div><small style="font-size:10px;color:${th.muted}">Noto Sans JP 700 · 28px — kutipan harian</small><div lang="ja" style="font-family:'Noto Sans JP',sans-serif;font-size:28px;font-weight:700;line-height:1.55">継続は力なり</div></div>
</div>`)}

${panel('Furigana — kontrak layout', `<div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px">
  <div style="background:#fff;border:1px solid ${th.line};border-radius:20px;padding:22px 24px">
    <small style="font-size:10.5px;font-weight:700;color:${th.pinkDeep}">MODE ふり</small>
    <div style="margin-top:14px">${ja('尊厳[そんげん]を守[まも]り、自立支援[じりつしえん]を考[かんが]える。', { size: 19 })}</div>
    <div style="margin-top:16px">${ja('統合失調症[とうごうしっちょうしょう]', { size: 22 })}</div>
  </div>
  <div style="background:#fff;border:1px solid ${th.line};border-radius:20px;padding:22px 24px">
    <small style="font-size:10.5px;font-weight:700;color:${th.pinkDeep}">MODE 漢字</small>
    <div style="margin-top:14px">${ja('尊厳[そんげん]を守[まも]り、自立支援[じりつしえん]を考[かんが]える。', { size: 19, mode: 'kanji' })}</div>
    <div style="margin-top:16px">${ja('統合失調症[とうごうしっちょうしょう]', { size: 22, mode: 'kanji' })}</div>
  </div>
</div>
<div style="margin-top:12px;padding:14px 16px;background:#fff9e8;border:1px solid #f6dfa3;border-radius:16px;font-size:12px;line-height:1.6;color:#8a6a3a">
  Bacaan selalu <b>di atas</b> base, rata tengah, tidak pernah menyentuh baris di atasnya — hasil <code>flex-direction:column-reverse</code>, bukan mesin ruby browser. Di mode 漢字 bacaan dibuang dari layout (<code>display:none</code>), jadi baris memang jadi lebih rapat: itu keputusan sadar, bukan bug. Ukuran bacaan <code>max(13px, .55em)</code>, warna <code>--kk-furi #8a6e7c</code>.
</div>`)}`,
});

/* ---------- inventaris komponen ---------- */
export const Komponen = () => doc({
  w: 900, h: 1520, theme: th,
  body: `<h1 style="font:600 30px Fredoka,sans-serif;margin-bottom:4px">Komponen</h1>
<p style="color:${th.muted};font-size:13px;margin-bottom:26px">Anatomi dan status seperti yang benar-benar ada di produk. Semua target sentuh ≥ 44px.</p>

${panel('Tombol', `<div style="display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px;align-items:start">
  <div>${primary('Lanjut', th)}<small style="display:block;margin-top:7px;font-size:10px;color:${th.muted}">primary</small></div>
  <div>${secondary('Ulangi', th)}<small style="display:block;margin-top:7px;font-size:10px;color:${th.muted}">secondary</small></div>
  <div>${primary('Menyimpan…', th, 'opacity:.55')}<small style="display:block;margin-top:7px;font-size:10px;color:${th.muted}">disabled</small></div>
  <div><div style="display:inline-flex;align-items:center;gap:7px;border:1px solid #f5dbe4;color:#ff7393;background:#fff7fa;padding:9px 12px;border-radius:12px;font-size:12px">${icon('volume', 17)} 聞く · Dengarkan</div><small style="display:block;margin-top:7px;font-size:10px;color:${th.muted}">listen</small></div>
</div>`)}

${panel('Pengalih bahasa & mode ujian', `<div style="display:flex;gap:26px;align-items:center;flex-wrap:wrap">
  ${langSwitch('kanji', th)}${langSwitch('furigana', th)}${langSwitch('id', th)}
  <div style="display:flex;gap:4px;width:max-content;padding:4px;background:${th.pinkPale};border-radius:999px">
    ${[['漢字', false], ['ふり', true], ['ID', false]].map(([l, on]) => `<span style="border-radius:999px;padding:8px 14px;font-weight:700;font-size:13px;color:${th.pinkDeep};${on ? 'background:#fff;box-shadow:0 3px 8px -4px rgba(255,100,160,.5)' : ''}">${l}</span>`).join('')}
  </div>
</div>`)}

${panel('Kartu pilihan quiz — 3 status', `<div style="display:grid;gap:10px;max-width:520px">
  ${[['idle', '#fff', '1.5px solid #efdfe5', ''],
      ['benar', '#effcf5', '2px solid #63c89a', `<span style="color:#4cba89">${icon('check', 18)}</span>`],
      ['salah', '#fff1f3', '2px solid #f4849b', `<span style="color:#e0577c">${icon('x', 18)}</span>`]]
      .map(([name, bg, border, mark]) => `<div style="border-radius:18px;border:${border};background:${bg};padding:16px;min-height:66px;display:flex;align-items:center;gap:8px;box-shadow:0 4px 14px -8px rgba(255,150,190,.3)">
    <span style="flex:1;font-size:14px;font-weight:600;font-family:'Noto Sans JP',sans-serif">家族の負担や思いを聴き、本人の意思と家族の希望の両方を確認する</span>${mark}
    <small style="font-size:10px;color:${th.muted};font-weight:700;flex:none">${name}</small>
  </div>`).join('')}
</div>`)}

${panel('Banner & pill', `<div style="display:grid;gap:12px;max-width:560px">
  <div style="position:relative;height:44px;background:#fff;border:1px dashed #e7cede;border-radius:18px">${previewPill()}</div>
  ${previewBanner('Level ini belum resmi terbuka. Kamu tetap bisa coba — tapi XP-nya kecil &amp; belum dihitung completed resmi.')}
  <div style="display:flex;align-items:center;gap:12px;background:linear-gradient(135deg,#ffe3ef,#ffd7e8);border:1px solid #ffc0da;border-radius:26px;padding:14px 16px">
    <span style="color:${th.pinkDeep}">${icon('rotate', 22)}</span>
    <div style="flex:1"><b style="font:700 14px Fredoka,sans-serif;color:${th.pinkDeep};display:block">Yuk ulangi soal yang belum tepat!</b><span style="font-size:11.5px;color:#a8637f">Ronde retry #1 · 2 soal tersisa</span></div>
  </div>
  <div style="background:#fff1f3;border:1px solid #f4849b;color:#8a3049;font-size:13px;padding:10px 12px;border-radius:12px">Gagal menyimpan nilai — cek koneksi lalu coba lagi.</div>
  <div style="background:linear-gradient(135deg,#fff9e8,#fff3d3);border:1px solid #f6dfa3;border-radius:26px;padding:16px 18px">
    <div style="display:flex;align-items:center;gap:8px;font:700 13px Fredoka,sans-serif;color:#9a6b1f;margin-bottom:10px">${icon('info', 16)}<span style="flex:1">Kenapa jawaban ini benar?</span></div>
    <p style="font-size:13px;color:#8a6a3a;line-height:1.6">Keluarga adalah pihak yang didukung sekaligus mitra kerja.</p>
  </div>
</div>`)}

${panel('Popup jawaban & toast', `<div style="display:flex;gap:14px;flex-wrap:wrap;align-items:center">
  <div style="display:inline-flex;align-items:center;gap:10px;padding:16px 26px;border-radius:999px;font:700 18px Fredoka,sans-serif;color:#fff;background:linear-gradient(135deg,#5fd68a,#3bbf72);box-shadow:0 16px 40px -10px rgba(0,0,0,.35)">${iconBox('konfeti', { size: 26, fill: '#fff', tint: 'rgba(255,255,255,.35)' })} Yeayy!</div>
  <div style="display:inline-flex;align-items:center;gap:10px;padding:16px 26px;border-radius:999px;font:700 18px Fredoka,sans-serif;color:#fff;background:linear-gradient(135deg,#ff8fa8,#ff5c8a);box-shadow:0 16px 40px -10px rgba(0,0,0,.35)">${iconBox('sedih', { size: 26, fill: '#fff', tint: 'rgba(255,255,255,.3)' })} Zannen…</div>
  <div style="display:inline-flex;align-items:center;gap:11px;padding:12px 18px 12px 12px;border-radius:20px;background:#fff;border:1px solid ${th.line};box-shadow:${th.shadowLg}">
    ${charSvg('luna', 'happy', 42)}
    <div><b style="font:600 14px Fredoka,sans-serif;display:block">Luna bergabung!</b><small style="font-size:11px;color:${th.muted}">Karakter baru terbuka di level 5</small></div>
  </div>
</div>`)}

${panel('Chip istilah & progress', `<div style="display:flex;gap:22px;align-items:center;flex-wrap:wrap">
  ${[['尊厳', 'songen'], ['自立支援', 'jiritsushien'], ['誤嚥', 'goen']].map(([k, r]) =>
    `<span style="display:inline-flex;align-items:baseline;gap:6px;min-height:44px;padding:9px 13px;border-radius:999px;background:#fff;border:1px solid ${th.pink};box-shadow:0 3px 10px -6px rgba(255,110,160,.35)"><b style="font:700 17px Fredoka,sans-serif;font-family:'Noto Sans JP',sans-serif">${k}</b><small style="font-size:11px;color:${th.furi}">${r}</small></span>`).join('')}
  <div style="height:10px;width:190px;background:${th.pinkPale};border-radius:999px;overflow:hidden"><i style="display:block;height:100%;width:62%;border-radius:999px;background:linear-gradient(90deg,${th.pink} 0%,${th.pinkDeep} 55%,${th.gold} 100%)"></i></div>
  <span style="background:linear-gradient(135deg,${th.gold},${th.goldDeep});color:#7a4a15;font:700 12px Fredoka,sans-serif;padding:8px 14px;border-radius:999px">9 selesai</span>
</div>`)}`,
});

/* ---------- lembar aset: kisi karakter x ekspresi, siap ekspor ---------- */
// Ikon pil header: 'kit:' = ikon garis dari kit.mjs, 'set:' = ikon dua-nada dari icons.mjs.
const EXPR_LABEL = [
  ['idle', 'IDLE', 'kit:heart'], ['happy', 'HAPPY', 'kit:star'], ['sad', 'SAD', 'set:sedih'],
  ['sleepy', 'SLEEPY', 'set:jejak'], ['surprised', 'SURPRISED', 'set:konfeti'], ['clap', 'CLAP', 'set:kilau'],
];
const pillIcon = (ref, color) => ref.startsWith('kit:')
  ? `<span style="color:${color};display:grid;place-items:center">${icon(ref.slice(4), 14)}</span>`
  : iconBox(ref.slice(4), { size: 15, fill: color, tint: '#fff' });
const ROW_TINT = {
  momo: ['#ffeaf3', '#fff5f9'], yuki: ['#e4f2fd', '#f2f9fe'], luna: ['#ece2fd', '#f7f2ff'],
};

export const AsetSheet = () => doc({
  w: 1360, h: 1080, theme: th,
  body: `<h1 style="font:600 30px Fredoka,sans-serif;margin-bottom:4px">Lembar karakter</h1>
<p style="color:${th.muted};font-size:13px;margin-bottom:20px">Tiga karakter × enam ekspresi = 18 aset. Semua SVG, di bawah 4KB, tanpa gradient ber-id supaya aman di-inline berdampingan. Ekspor per kartu untuk dipakai di produk.</p>

<div style="display:grid;grid-template-columns:206px repeat(6, minmax(0, 1fr));gap:10px">
  <div style="display:grid;place-items:center;padding:10px;border-radius:16px;background:${th.pinkPale};font:700 12px 'DM Sans',sans-serif;letter-spacing:1.4px;color:${th.pinkDeep}">KARAKTER</div>
  ${EXPR_LABEL.map(([, label, ic]) => `<div style="display:flex;align-items:center;justify-content:center;gap:6px;padding:10px;border-radius:16px;background:${th.pinkPale};font:700 12px 'DM Sans',sans-serif;letter-spacing:1.2px;color:${th.pinkDeep}">${label}${pillIcon(ic, th.pinkDeep)}</div>`).join('')}

  ${CHAR_IDS.map(id => {
    const m = CHAR_META[id]; const t1 = ROW_TINT[id][0], t2 = ROW_TINT[id][1];
    return `
    <div style="display:flex;flex-direction:column;align-items:center;justify-content:flex-end;gap:8px;padding:14px 12px;border-radius:22px;background:linear-gradient(160deg,${t1},${t2});border:1.5px dashed ${m.acc}80">
      ${charSvg(id, 'idle', 118)}
      <div style="display:flex;align-items:center;gap:8px;background:${m.acc};color:${m.btnText === '#ffffff' ? '#fff' : '#3a2a33'};padding:6px 14px;border-radius:999px;box-shadow:0 4px 12px -4px ${m.acc}">
        <b style="font:700 17px Fredoka,sans-serif">${m.name}</b>
      </div>
      <small style="font-size:11px;font-weight:700;color:${th.muted}">${m.species}</small>
    </div>
    ${EXPR_LABEL.map(([expr]) => `<div style="display:grid;place-items:center;padding:12px 8px;border-radius:20px;background:linear-gradient(170deg,${t2},#ffffff);border:1px solid ${m.acc}33">${charSvg(id, expr, 104)}</div>`).join('')}`;
  }).join('')}
</div>

<div style="display:flex;gap:14px;justify-content:center;margin-top:20px">
  ${CHAR_IDS.map(id => {
    const m = CHAR_META[id];
    return `<div style="display:flex;align-items:center;gap:10px;padding:8px 18px 8px 8px;border-radius:999px;background:${m.acc};box-shadow:0 6px 18px -8px ${m.acc}">
      <span style="width:40px;height:40px;border-radius:50%;background:#fff;display:grid;place-items:center;overflow:hidden">${charSvg(id, 'idle', 34)}</span>
      <div style="color:${m.btnText === '#ffffff' ? '#fff' : '#3a2a33'}">
        <b style="font:700 15px Fredoka,sans-serif;display:block;line-height:1.1">${m.name}</b>
        <small style="font-size:11.5px;font-weight:600;opacity:.9">${m.acc}</small>
      </div>
    </div>`;
  }).join('')}
</div>

<p style="margin-top:16px;font-size:11.5px;color:${th.muted};line-height:1.6;text-align:center">
  Hex di chip adalah warna <b>aksen</b> tema. Latar tombol berbeda untuk Yuki (<b>#1a6fae</b>) dan Luna (<b>#7c3aed</b>) karena aksennya sendiri gagal kontras 4.5:1 dengan teks putih.
</p>`,
});

/* ---------- inventaris ikon & elemen kecil ---------- */
export const AsetKecil = () => doc({
  w: 1180, h: 900, theme: th,
  body: `<h1 style="font:600 30px Fredoka,sans-serif;margin-bottom:4px">Ikon &amp; elemen</h1>
<p style="color:${th.muted};font-size:13px;margin-bottom:22px">Pengganti emoji. Semua dua-nada dan mengambil warna dari tema, jadi satu ikon tampil benar di ketiga palet — sesuatu yang tidak bisa dilakukan PNG emoji.</p>

${panel('13 ikon bab — pengganti emoji di kartu bab', `<div style="display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:12px">
  ${SECTION_ICON_ORDER.map((n, i) => `<div style="display:flex;flex-direction:column;align-items:center;gap:7px;padding:12px 6px;background:#fff;border:1px solid ${th.line};border-radius:18px">
    <span style="width:52px;height:52px;border-radius:18px;background:linear-gradient(145deg,${th.pinkPale},${th.pink}55);display:grid;place-items:center">${iconBox(n, { size: 32, fill: th.pinkDeep, tint: '#fff' })}</span>
    <small style="font-size:9.5px;font-weight:700;color:${th.muted}">BAB ${String(i + 1).padStart(2, '0')}</small>
    <small style="font-size:9px;color:${th.muted}">${n}</small>
  </div>`).join('')}
</div>`)}

${panel('Ikon UI', `<div style="display:flex;gap:14px;flex-wrap:wrap">
  ${Object.keys(UI_ICONS).map(n => `<div style="display:flex;flex-direction:column;align-items:center;gap:7px;padding:12px 14px;background:#fff;border:1px solid ${th.line};border-radius:18px;min-width:88px">
    ${iconBox(n, { size: 30, fill: th.pinkDeep, tint: th.pinkPale })}
    <small style="font-size:10px;font-weight:700;color:${th.muted}">${n}</small>
  </div>`).join('')}
</div>`)}

${panel('Satu ikon, tiga tema', `<div style="display:flex;gap:16px;flex-wrap:wrap">
  ${Object.entries(THEMES).map(([name, t]) => `<div style="display:flex;align-items:center;gap:12px;padding:14px 18px;border-radius:20px;background:${t.bg};border:1px solid ${t.line}">
    ${['sakura', 'jantung', 'otak', 'pita'].map(n => `<span style="width:46px;height:46px;border-radius:15px;background:${t.pinkPale};display:grid;place-items:center">${iconBox(n, { size: 28, fill: t.pinkDeep, tint: '#fff' })}</span>`).join('')}
    <b style="font:600 14px Fredoka,sans-serif;color:${t.ink};text-transform:capitalize;margin-left:4px">${name}</b>
  </div>`).join('')}
</div>`)}

${panel('Bingkai avatar & node jalur', `<div style="display:flex;gap:24px;align-items:center;flex-wrap:wrap">
  ${[['none', ''], ['bronze', 'linear-gradient(135deg,#cd9b6a,#8a5a2b)'], ['silver', 'linear-gradient(135deg,#eef0f6,#9aa0b5)'], ['gold', 'linear-gradient(135deg,#ffe08a,#e0a93e)'], ['sakura', 'linear-gradient(135deg,#ffc2dd,#ff7bab)'], ['rainbow', 'conic-gradient(#ff8fb3,#ffd47e,#9fe6a0,#8fd3ff,#c9a6ff,#ff8fb3)']]
      .map(([name, g]) => `<div style="display:flex;flex-direction:column;align-items:center;gap:7px">
    <span style="position:relative;display:inline-grid;place-items:center;width:58px;height:58px;border-radius:50%;background:${th.pinkPale}">
      ${g ? `<span style="position:absolute;inset:-4px;border-radius:50%;background:${g}"></span>` : ''}
      <span style="position:relative;z-index:1;width:58px;height:58px;border-radius:50%;background:#fff;border:2px solid #fff;display:grid;place-items:center;overflow:hidden">${charSvg('momo', 'idle', 48)}</span>
    </span><small style="font-size:10px;font-weight:700">${name}</small>
  </div>`).join('')}
  ${[['selesai', 'linear-gradient(150deg,#ffe27a,#ffc94d)', '#d9a53a', '#7a4a15', icon('check', 20)],
      ['sekarang', `linear-gradient(150deg,${th.pinkPale},${th.pink})`, th.pinkDeep, '#fff', '<span>4</span>'],
      ['belum', `linear-gradient(150deg,${th.line},${th.pinkPale})`, `${th.muted}66`, `${th.muted}b3`, icon('lock', 16)]]
      .map(([name, bg, sh, col, inner]) => `<div style="display:flex;flex-direction:column;align-items:center;gap:8px">
    <div style="width:66px;height:66px;border-radius:50%;display:grid;place-items:center;background:${bg};color:${col};font:700 20px Fredoka,sans-serif;box-shadow:0 8px 0 -1px ${sh},0 12px 20px -6px rgba(255,110,160,.5);border:3px solid #fff">${inner}</div>
    <small style="font-size:10px;font-weight:700;color:#b596a5">${name}</small>
  </div>`).join('')}
</div>`)}`,
});
