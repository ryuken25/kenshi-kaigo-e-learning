// screens-flow.mjs — lane B (masuk & onboarding) + lane C (alur belajar).
// Copy diambil apa adanya dari src/main.jsx, src/Login.jsx, src/data.js.
import {
  T, THEMES, phone, doc, mascot, charSvg, ja, ruby, icon, iconFill, primary, secondary,
  back, eyebrow, langSwitch, previewPill, previewBanner, bottomNav, header,
  CHAR_IDS, CHAR_META,
} from './kit.mjs';
import { iconBox } from './icons.mjs';

const th = T;

/* ---------- data nyata dari src/data.js ---------- */
export const SECTIONS = [
  ['01', '人間の尊厳と自立', 'Kenapa martabat jadi dasar tiap tindakan', 'sakura', 10, 6,
    'Memahami martabat, hak asasi, dan kemandirian sebagai fondasi setiap tindakan perawatan.'],
  ['02', '人間関係とコミュニケーション', 'Membangun kepercayaan lewat cara bicara', 'surat', 10, 3,
    'Melatih cara membangun hubungan dan menyampaikan maksud tanpa melukai.'],
  ['03', '社会の理解', 'Asuransi kaigo dan aturan yang mengikat', 'rumah', 15, 0,
    'Menyelami sistem jaminan sosial, asuransi kaigo, dan kerangka hukum yang mengikat praktik di Jepang.'],
  ['04', 'こころとからだのしくみ', 'Cara kerja tubuh dan pikiran lansia', 'jantung', 13, 0,
    'Mengenali cara kerja tubuh dan pikiran agar perubahan kecil pada pengguna cepat terbaca.'],
];

const sectionCard = (s, { preview = false, t = th } = {}) => {
  const [no, jaTitle, idTitle, ic, total, done, desc] = s;
  const pct = Math.round((done / total) * 100);
  const border = preview ? `dashed ${t.line}` : `solid ${t.line}`;
  const bg = preview ? `linear-gradient(135deg,${t.card},${t.pinkPaler})` : t.card;
  return `<div style="display:flex;align-items:center;gap:13px;padding:16px;border:1px ${border};background:${bg};border-radius:26px;box-shadow:${t.shadow};position:relative">
  ${preview ? previewPill(t) : ''}
  <div style="width:52px;height:52px;border-radius:18px;background:linear-gradient(145deg,${t.pinkPale},${t.pink}55);display:grid;place-items:center;flex:none;${preview ? 'opacity:.75' : ''}"><span style="width:30px;height:30px;display:block">${iconBox(ic, { size: 30, fill: t.pinkDeep, tint: '#fff' })}</span></div>
  <div style="flex:1;min-width:0">
    <small style="display:block;color:${t.muted}99;font-size:9px;letter-spacing:1.2px;font-weight:700">BAB ${no}</small>
    <b style="display:block;font:600 17px Fredoka,sans-serif;margin:2px 0;font-family:'Noto Sans JP',Fredoka,sans-serif;color:${t.ink}">${jaTitle}</b>
    <span style="display:block;font-size:11.5px;color:${t.muted};white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${idTitle}</span>
    <em style="display:block;font-size:10px;color:${t.muted}b3;font-style:normal;line-height:1.5;margin-top:2px">${desc}</em>
    <div style="height:6px;background:${t.pinkPale};border-radius:6px;margin-top:8px;overflow:hidden"><i style="display:block;height:100%;width:${pct}%;background:linear-gradient(90deg,${t.pink},${t.gold});border-radius:6px"></i></div>
    <em style="display:block;font-size:10px;color:${t.muted}b3;font-style:normal;margin-top:5px">${done}/${total} level selesai</em>
  </div>
  <span style="color:${t.muted}80">${icon('chevron', 20)}</span>
</div>`;
};

/* ======================= LANE B — masuk & onboarding ======================= */

export const Landing = () => doc({
  w: 402, h: 874, theme: th, pad: false,
  body: `<main style="flex:1;display:flex;align-items:center;justify-content:center;padding:24px 20px">
  <div style="width:100%;text-align:center;background:linear-gradient(160deg,#fff,${th.pinkPaler});border:1px solid ${th.line};border-radius:26px;padding:30px 22px 26px;box-shadow:${th.shadowLg}">
    <div style="display:flex;justify-content:center;margin-bottom:6px">${mascot('momo', 'idle', 132)}</div>
    ${eyebrow('Kenshi Kaigo E-Learning')}
    <h1 style="font:600 30px/1.18 Fredoka,sans-serif;letter-spacing:-.6px;margin:0 0 16px">Belajar <span style="font-family:'Noto Sans JP',sans-serif">介護福祉士</span><br>dengan bahasa Indonesia</h1>
    <ul style="list-style:none;padding:0;margin:0 0 22px;display:flex;flex-direction:column;gap:9px">
      ${[['13 bab · 152 level'], ['Soal ujian asli 2021–2026'], ['Furigana, romaji, terjemahan'], ['Gratis']].map(([t]) =>
    `<li style="display:flex;align-items:center;gap:9px;font-size:13.5px;font-weight:600;color:${th.ink};background:#fff;border:1px solid ${th.line};border-radius:14px;padding:11px 14px"><span style="color:#4cba89">${icon('check', 16)}</span>${t}</li>`).join('')}
    </ul>
    ${primary('Masuk dengan email', th)}
    <p style="font-size:11.5px;color:${th.muted};line-height:1.55;margin-top:14px">Tanpa password — kami kirim tautan sekali pakai ke email kamu.</p>
  </div>
</main>`,
});

const loginPerks = [
  ['heart', 'Streak & XP tersimpan permanen di akunmu'],
  ['users', 'Teman & papan peringkat mingguan'],
  ['trophy', '35 achievement + bingkai avatar eksklusif'],
  ['star', '3 tema tampilan: Momo, Yuki, Luna'],
];

export const Login = () => phone({
  h: 874, nav: 'profile',
  body: `<div style="text-align:center;display:flex;flex-direction:column;align-items:center">
  ${mascot('momo', 'idle', 104)}
  <h1 style="font:600 26px Fredoka,sans-serif;margin:10px 0 6px">Masuk dulu, yuk</h1>
  <p style="color:${th.muted};font-size:13px;line-height:1.55;margin-bottom:18px">Kami kirim tautan ajaib ke emailmu. Tanpa password, 20 detik selesai.</p>
</div>
<div style="display:flex;flex-direction:column;gap:12px">
  <label style="font-size:12px;font-weight:700;color:${th.muted};text-align:left">Email kamu
    <input style="display:block;width:100%;margin-top:6px;padding:14px 16px;border:1px solid ${th.line};border-radius:20px;font:inherit;font-size:14px;background:#fff;color:#b9a3ae" value="you@example.com">
  </label>
  ${primary(`Kirim magic link ${icon('chevron', 16)}`, th)}
</div>
<div style="display:flex;flex-direction:column;gap:8px;margin-top:20px">
  ${loginPerks.map(([ic, t]) => `<span style="display:flex;align-items:center;gap:9px;font-size:12px;color:${th.muted};font-weight:600"><span style="color:${th.pink}">${icon(ic, 16)}</span>${t}</span>`).join('')}
</div>
<p style="font-size:11px;color:${th.muted};margin-top:16px;text-align:center">Tautannya berlaku 20 menit dan sekali pakai.</p>`,
});

export const LoginTerkirim = () => phone({
  h: 874, nav: 'profile',
  body: `<div style="text-align:center;display:flex;flex-direction:column;align-items:center">
  ${mascot('momo', 'happy', 104)}
  <h1 style="font:600 26px Fredoka,sans-serif;margin:10px 0 6px">Masuk dulu, yuk</h1>
  <p style="color:${th.muted};font-size:13px;line-height:1.55;margin-bottom:18px">Kami kirim tautan ajaib ke emailmu. Tanpa password, 20 detik selesai.</p>
</div>
<div style="display:flex;gap:12px;padding:15px 16px;background:${th.lavender};border-radius:20px;align-items:flex-start;border:1px solid #e4d3ff;text-align:left">
  <span style="color:#9b7ae0;margin-top:2px">${icon('check', 20)}</span>
  <div><b style="font:600 14px Fredoka,sans-serif;display:flex;align-items:center;gap:7px;margin-bottom:2px">Link sudah dikirim ${iconBox('kilau', { size: 17, fill: th.gold, tint: th.goldDeep })}</b>
  <p style="font-size:12.5px;color:#7d6a9a;line-height:1.5">Cek inbox you@example.com. Link berlaku 20 menit dan sekali pakai. Klik dari perangkat ini ya.</p></div>
</div>
<div style="display:flex;flex-direction:column;gap:8px;margin-top:20px">
  ${loginPerks.map(([ic, t]) => `<span style="display:flex;align-items:center;gap:9px;font-size:12px;color:${th.muted};font-weight:600"><span style="color:${th.pink}">${icon(ic, 16)}</span>${t}</span>`).join('')}
</div>`,
});

const stepDots = (active) => `<div style="display:flex;gap:6px;justify-content:center;margin-bottom:18px">${[0, 1, 2].map(i =>
  `<span style="height:6px;width:${i === active ? 26 : 14}px;border-radius:99px;background:${i === active ? th.pinkDeep : th.pinkPale}"></span>`).join('')}</div>`;

export const OnboardingGender = () => phone({
  h: 874, nav: 'profile',
  body: `${stepDots(0)}
<div style="text-align:center;display:flex;flex-direction:column;align-items:center">
  ${mascot('momo', 'happy', 96)}
  <h1 style="font:600 26px Fredoka,sans-serif;margin:8px 0 6px;display:flex;align-items:center;gap:9px">Kenalan dulu yuk ${iconBox('lambai', { size: 26, fill: th.pinkDeep, tint: th.pinkPale })}</h1>
  <p style="color:${th.muted};font-size:13px;line-height:1.55;margin-bottom:20px">Kami pakai ini cuma untuk memilih pasangan karakter awalmu. Bisa diganti kapan saja.</p>
</div>
<div style="display:grid;gap:10px">
  ${[['Perempuan', 'Mulai dengan Momo', true], ['Laki-laki', 'Mulai dengan Yuki', false], ['Lainnya', 'Mulai dengan Luna', false], ['Tidak ingin menjawab', 'Momo, bisa diganti nanti', false]]
      .map(([label, hint, on]) => `<div style="display:flex;align-items:center;gap:12px;padding:16px;border-radius:20px;border:${on ? `2px solid ${th.pinkDeep}` : `1.5px solid ${th.line}`};background:${on ? th.pinkPaler : '#fff'};min-height:66px">
    <span style="width:22px;height:22px;border-radius:50%;border:2px solid ${on ? th.pinkDeep : '#e3cdd8'};display:grid;place-items:center;flex:none">${on ? `<span style="width:11px;height:11px;border-radius:50%;background:${th.pinkDeep}"></span>` : ''}</span>
    <div><b style="display:block;font:600 15px Fredoka,sans-serif">${label}</b><small style="font-size:11.5px;color:${th.muted}">${hint}</small></div>
  </div>`).join('')}
</div>
<div style="margin-top:22px">${primary(`Lanjut ${icon('chevron', 16)}`, th)}</div>`,
});

export const OnboardingKarakter = () => phone({
  h: 900, nav: 'profile',
  body: `${stepDots(1)}
<h1 style="font:600 26px Fredoka,sans-serif;margin:0 0 6px;display:flex;align-items:center;justify-content:center;gap:9px">Pilih temanmu ${iconBox('pita', { size: 26, fill: th.pinkDeep, tint: th.pinkPale })}</h1>
<p style="color:${th.muted};font-size:13px;line-height:1.55;margin-bottom:20px;text-align:center">Karakter menentukan maskot dan warna tombol di seluruh aplikasi. Bisa diganti kapan saja lewat profil.</p>
<div style="display:grid;gap:12px">
  ${CHAR_IDS.map((id) => {
    const m = CHAR_META[id];
    const on = id === 'momo';
    return `<div style="display:flex;align-items:center;gap:14px;padding:14px 16px;border-radius:22px;border:${on ? `2px solid ${m.acc}` : `1.5px solid ${th.line}`};background:${on ? th.pinkPaler : '#fff'};box-shadow:${on ? th.shadow : '0 4px 14px -8px rgba(255,150,190,.4)'};min-height:96px">
      <span style="width:74px;height:74px;border-radius:22px;background:${m.acc}1f;display:grid;place-items:center;flex:none">${charSvg(id, on ? 'happy' : 'idle', 62)}</span>
      <div style="flex:1;min-width:0">
        <b style="font:600 18px Fredoka,sans-serif;display:block">${m.name}</b>
        <small style="font-size:11.5px;color:${th.muted};display:block;margin-top:1px">${m.species}</small>
        <small style="font-size:12px;color:${th.ink};display:block;margin-top:3px">${m.desc}</small>
      </div>
      <span style="display:flex;flex-direction:column;align-items:center;gap:5px;flex:none">
        <span style="width:26px;height:26px;border-radius:9px;background:${m.acc}"></span>
        <small style="font-size:8.5px;color:${th.muted};font-weight:700">${m.acc}</small>
      </span>
    </div>`;
  }).join('')}
</div>
<div style="margin-top:20px">${primary(`Pilih Momo ${icon('chevron', 16)}`, th)}</div>`,
});

export const OnboardingHandle = () => phone({
  h: 874, nav: 'profile',
  body: `${stepDots(2)}
<div style="text-align:center;display:flex;flex-direction:column;align-items:center">
  ${mascot('momo', 'surprised', 96)}
  <h1 style="font:600 26px Fredoka,sans-serif;margin:8px 0 6px;display:flex;align-items:center;gap:9px">Buat handle-mu ${iconBox('label', { size: 24, fill: th.pinkDeep, tint: th.pinkPale })}</h1>
  <p style="color:${th.muted};font-size:13px;line-height:1.55;margin-bottom:20px">Nama unik yang dipakai teman untuk menemukanmu di papan peringkat.</p>
</div>
<div style="display:flex;align-items:center;gap:8px;padding:14px 16px;border:1.5px solid ${th.pink};border-radius:20px;background:#fff">
  <b style="font:700 18px Fredoka,sans-serif;color:${th.pinkDeep}">@</b>
  <span style="font-size:15px;font-weight:600">rina_kaigo</span>
  <span style="margin-left:auto;color:#4cba89">${icon('check', 18)}</span>
</div>
<div style="display:flex;flex-direction:column;gap:7px;margin-top:14px">
  ${[['Huruf kecil, angka, dan underscore', true], ['4–14 karakter', true], ['Belum dipakai orang lain', true], ['Hanya bisa diganti tiap 7 hari', false]]
      .map(([t, ok]) => `<span style="display:flex;align-items:center;gap:8px;font-size:12px;color:${th.muted};font-weight:600"><span style="color:${ok ? '#4cba89' : '#c9a86f'}">${icon(ok ? 'check' : 'info', 15)}</span>${t}</span>`).join('')}
</div>
<div style="margin-top:22px">${primary('Selesai, mulai belajar', th)}</div>`,
});

/* ======================= LANE C — alur belajar ======================= */

// charId diikat ke tema: layar bertema Yuki memakai maskot & logo Yuki.
// Momo tidak boleh muncul di tema lain — itu inti keluhan "jangan ada kitty nyelip".
export const Main = (theme = th, charId = 'momo') => {
  const t = theme;
  return doc({
    w: 402, h: 1240, theme: t, pad: false,
    body: `${header(t, charId)}
<main style="flex:1;min-height:0;overflow:hidden">
  <section style="display:flex;justify-content:space-between;align-items:center;gap:12px;padding:32px 22px 22px">
    <div style="flex:1;min-width:0">
      <p style="font-size:11px;letter-spacing:1.6px;color:${t.pink};font-weight:700;margin:0 0 10px;text-transform:uppercase;display:flex;align-items:center;gap:5px">OHAYŌ, KENSHI ${iconBox('tulip', { size: 15, fill: t.pink, tint: t.pinkPale })}</p>
      <h1 lang="ja" style="font-family:'Noto Sans JP',sans-serif;font-size:28px;line-height:1.55;font-weight:700;margin:0">継続は力なり</h1>
      <p style="font-size:12.5px;color:${t.muted};margin:6px 0 8px;font-style:italic">Ketekunan itu sendiri adalah kekuatan. — pepatah Jepang</p>
      <p style="color:${t.muted};font-size:13px;line-height:1.55">13 bab · 152 level · dikerjakan sedikit demi sedikit.</p>
    </div>
    ${mascot(charId, 'idle', 108, t)}
  </section>
  <div style="margin:0 20px 26px;padding:18px 20px;border:1px solid ${t.line};background:linear-gradient(135deg,${t.card},${t.pinkPaler});border-radius:26px;display:flex;justify-content:space-between;align-items:center;box-shadow:${t.shadow};gap:10px;flex-wrap:wrap">
    <div><b style="font:600 15px Fredoka,sans-serif">Hari ini</b>
      <p style="margin:4px 0 10px;font-size:12px;color:${t.muted}">Satu kartu sekali duduk sudah cukup.</p>
      <div style="height:10px;width:190px;background:${t.pinkPale};border-radius:999px;overflow:hidden"><i style="display:block;height:100%;width:6%;border-radius:999px;background:linear-gradient(90deg,${t.pink} 0%,${t.pinkDeep} 55%,${t.gold} 100%)"></i></div>
    </div>
    <span style="background:linear-gradient(135deg,${t.gold},${t.goldDeep});color:#7a4a15;font:700 12px Fredoka,sans-serif;padding:8px 14px;border-radius:999px;box-shadow:0 6px 16px -4px ${t.goldDeep}99;white-space:nowrap">9 selesai</span>
  </div>
  <div style="display:flex;align-items:center;gap:12px;margin:0 20px 22px;padding:16px 18px;border:1px solid ${t.pinkPale};border-radius:26px;background:linear-gradient(135deg,${t.card},${t.pinkPaler});box-shadow:${t.shadow}">
    <div style="flex:1"><b style="display:block;font:600 17px Fredoka,sans-serif;color:${t.pinkDeep}">Ujian Akhir</b><span style="font-size:12.5px;color:${t.muted};line-height:1.45">Soal asli 2021–2026 · 125 butir tiap tahun</span></div>
    <span style="color:${t.pinkDeep}">${icon('chevron', 20)}</span>
  </div>
  <div style="display:flex;justify-content:space-between;align-items:center;padding:2px 20px 14px">
    <div><h2 style="font:600 22px Fredoka,sans-serif">Urutan belajar</h2><p style="margin:2px 0 0;font-size:12px;color:${t.muted}">Mulai dari martabat, berakhir di studi kasus</p></div>
  </div>
  <div style="padding:2px 20px 30px;display:grid;gap:13px">
    ${sectionCard(SECTIONS[0], { t })}
    ${sectionCard(SECTIONS[1], { t })}
    ${sectionCard(SECTIONS[2], { preview: true, t })}
  </div>
</main>
${bottomNav('learn', t)}`,
  });
};

const NODE_STATES = [
  { n: 1, s: 'done', label: 'Martabat dan hak asasi', off: 0 },
  { n: 2, s: 'done', label: 'Penentuan diri', off: 54 },
  { n: 3, s: 'done', label: 'Kualitas hidup', off: 84 },
  { n: 4, s: 'current', label: 'Normalisasi', off: 54 },
  { n: 5, s: 'todo', label: 'Pembelaan hak', off: 0 },
  { n: 6, s: 'todo', label: 'Advokasi', off: -54 },
  { n: 7, s: 'milestone', label: 'Ulasan', off: -84, ribbon: true },
];

const skillNode = (st, { locked = false, t = th } = {}) => {
  const milestone = st.s === 'milestone';
  const size = milestone ? 76 : 66;
  let bg = `linear-gradient(150deg,${t.pinkPale},${t.pink})`, sh = t.pinkDeep, col = '#fff';
  if (st.s === 'done') { bg = 'linear-gradient(150deg,#ffe27a,#ffc94d)'; sh = '#d9a53a'; col = '#7a4a15'; }
  if (milestone) { bg = `linear-gradient(150deg,${t.pink},${t.pinkDeep})`; sh = t.btnShadow; }
  if (locked) { bg = `linear-gradient(150deg,${t.line},${t.pinkPale})`; sh = `${t.muted}66`; col = `${t.muted}b3`; }
  const inner = locked ? icon('lock', milestone ? 22 : 16)
    : st.s === 'done' ? icon('check', milestone ? 26 : 20)
      : milestone ? `<span style="color:#fff">${iconFill('star', 24, '#fff')}</span>`
        : `<span>${st.n}</span>`;
  return `<div style="display:flex;flex-direction:column;align-items:center;gap:6px;padding:9px 0;margin-left:${st.off}px">
  <div style="position:relative;width:${size}px;height:${size}px;border-radius:50%;display:grid;place-items:center;background:${bg};color:${col};font:700 20px Fredoka,sans-serif;box-shadow:0 8px 0 -1px ${sh},0 12px 20px -6px ${t.pink}80;border:3px solid #fff">${inner}${st.s === 'current' ? `<span style="position:absolute;inset:-6px;border-radius:50%;border:3px solid ${t.pink};opacity:.55"></span>` : ''}</div>
  <span style="font-size:10.5px;font-weight:700;color:${t.muted}b3;text-align:center;max-width:110px;line-height:1.3;display:flex;align-items:center;gap:4px">${st.ribbon ? iconBox('pita', { size: 13, fill: `${t.muted}b3`, tint: t.pinkPale }) : ''}${st.label}</span>
</div>`;
};

const sectionHero = (no, jaTitle, idTitle, ic) => `<div style="display:flex;gap:16px;align-items:center;margin:12px 0 16px">
  <span style="width:56px;height:56px;border-radius:18px;background:linear-gradient(145deg,${th.pinkPale},${th.pink}55);display:grid;place-items:center;flex:none">${iconBox(ic, { size: 34, fill: th.pinkDeep, tint: '#fff' })}</span>
  <div><small style="font-size:10px;letter-spacing:1.4px;color:${th.muted}99;font-weight:700">BAB ${no}</small>
  <h1 style="font:600 28px Fredoka,sans-serif;margin:4px 0;font-family:'Noto Sans JP',Fredoka,sans-serif">${jaTitle}</h1>
  <p style="margin:0;color:${th.muted};font-size:13px">${idTitle}</p></div>
</div>`;

export const SectionOverview = () => phone({
  h: 1300, nav: 'learn',
  body: `${back('Urutan belajar')}
${sectionHero('01', '人間の尊厳と自立', 'Kenapa martabat jadi dasar tiap tindakan', 'sakura')}
<p style="color:${th.muted};font-size:13px;line-height:1.55;margin-bottom:6px">Memahami martabat, hak asasi, dan kemandirian sebagai fondasi setiap tindakan perawatan.</p>
<div style="display:flex;flex-direction:column;align-items:center;padding:20px 0 10px">
  ${NODE_STATES.slice(0, 6).map(skillNode).join('')}
  <div style="margin:6px 0 -4px;transform:translateX(-54px) scale(.85)">${charSvg('momo', 'happy', 78)}</div>
  ${skillNode(NODE_STATES[6])}
</div>
<div style="margin:6px 0 20px"><div style="display:flex;align-items:center;gap:9px;padding:15px;border-radius:20px;background:linear-gradient(135deg,#fff9e8,#fff3d3);border:1px solid #f8e3b4;color:#987744;font-weight:700;font-size:13px;box-shadow:0 6px 18px -8px rgba(255,190,90,.4)">${iconFill('star', 18, '#ffb73b')} Section recap <span style="font-weight:400;margin-left:auto;font-size:11px">10 level review</span>${icon('chevron', 18)}</div></div>`,
});

export const SectionPreview = () => phone({
  h: 1100, nav: 'learn',
  body: `${back('Urutan belajar')}
${sectionHero('03', '社会の理解', 'Asuransi kaigo dan aturan yang mengikat', 'rumah')}
<p style="color:${th.muted};font-size:13px;line-height:1.55;margin-bottom:14px">Menyelami sistem jaminan sosial, asuransi kaigo, dan kerangka hukum yang mengikat praktik di Jepang.</p>
${previewBanner('Section ini belum resmi terbuka — kamu tetap bisa preview materi &amp; coba quiz, tapi progress tidak dihitung completed sampai section sebelumnya selesai.')}
<div style="display:flex;flex-direction:column;align-items:center;padding:14px 0 10px">
  ${[{ n: 1, s: 'todo', label: 'Gambaran jaminan sosial', off: 0 },
      { n: 2, s: 'todo', label: 'Konstitusi dan kesejahteraan', off: 54 },
      { n: 3, s: 'todo', label: 'Sistem asuransi kaigo', off: 84 },
      { n: 4, s: 'todo', label: 'Penetapan tingkat kebutuhan', off: 54 },
      { n: 5, s: 'todo', label: 'Layanan di rumah', off: 0 }].map(s => skillNode(s, { locked: true })).join('')}
</div>`,
});

export const LevelHub = (t = th, charId = 'momo') => phone({
  h: 874, nav: 'learn', theme: t, charId,
  body: `${back('人間の尊厳と自立', t)}
<div style="display:flex;gap:16px;align-items:center;margin:8px 0 18px">
  ${mascot(charId, 'idle', 104, t)}
  <div><small style="font-size:10px;letter-spacing:1.4px;color:${t.muted}99;font-weight:700">LEVEL 4</small>
  <h1 style="font:600 28px Fredoka,sans-serif;margin:4px 0;font-family:'Noto Sans JP',Fredoka,sans-serif;color:${t.ink}">ノーマライゼーション</h1>
  <p style="margin:0;color:${t.muted};font-size:13px">Normalisasi</p></div>
</div>
<div style="display:flex;gap:12px;padding:15px 16px;background:${t.lavender};border-radius:20px;margin-bottom:18px;align-items:flex-start;border:1px solid ${t.pink}4d">
  <span style="color:${t.pinkDeep};margin-top:2px">${icon('info', 20)}</span>
  <div><b style="font:600 14px Fredoka,sans-serif;display:block;margin-bottom:2px;font-family:'Noto Sans JP',Fredoka,sans-serif;color:${t.ink}">今日の目標</b>
  <p style="font-size:12.5px;color:${t.muted};line-height:1.5">Memahami Normalisasi dan menerapkannya pada kasus.</p></div>
</div>
<div style="display:flex;flex-direction:column;gap:10px;margin-bottom:20px">
  ${primary(`${icon('terms', 18)} Baca materi dulu ${icon('chevron', 16)}`, t)}
  ${secondary(`${icon('star', 18)} Langsung quiz ${icon('chevron', 16)}`, t)}
</div>
<div style="padding:16px;border:1px solid ${t.line};background:${t.card};border-radius:20px;box-shadow:${t.shadow}">
  <b style="font:600 14px Fredoka,sans-serif;color:${t.ink}">5 kartu materi · 5 soal</b>
  <p style="margin-top:4px;font-size:12px;color:${t.muted}">Materi bisa di-next atau langsung di-skip kapan saja.</p>
</div>`,
});

const materiTop = (active, total, mode = 'furigana') => `<div style="display:flex;align-items:center;gap:12px;margin:0 0 16px">
  <a style="color:${th.muted};font-size:13px;font-weight:600;white-space:nowrap">× Tutup</a>
  <div style="display:flex;gap:5px;flex:1;min-width:0">${Array.from({ length: total }, (_, i) =>
  `<span style="height:8px;flex:1;border-radius:99px;background:${i === active ? th.pinkDeep : i < active ? '#ffabc5' : th.pinkPale}"></span>`).join('')}</div>
  ${langSwitch(mode, th, .9)}
</div>`;

const materiCard = (inner, { minH = 280 } = {}) =>
  `<article style="padding:28px 24px;background:#fff;border:1px solid ${th.line};border-radius:26px;box-shadow:${th.shadow};text-align:left;min-height:${minH}px">${inner}</article>`;

const materiNav = () => `<div style="display:flex;gap:10px;margin-top:18px">
  ${secondary('Kembali', th, 'flex:1')}${primary(`Lanjut ${icon('chevron', 16)}`, th, 'flex:1')}
</div>
<div style="text-align:center;margin-top:14px"><span style="color:${th.muted};font-weight:700;text-decoration:underline;font-size:13px">Lewati ke quiz</span></div>`;

export const MateriTerm = () => phone({
  h: 940, nav: 'learn',
  body: `${materiTop(1, 5)}
${materiCard(`<div style="text-align:center">
  <span style="display:block;font-weight:800;color:${th.ink};margin:4px 0 10px;font-size:44px">${ruby('尊厳', 'そんげん', { furi: th.furi })}</span>
  <div style="font-weight:700;color:${th.muted};margin-bottom:22px">songen / martabat manusia</div>
  <div style="text-align:left">${ja('尊厳[そんげん]についてチームで確認[かくにん]します。', { size: 17 })}
  <p style="margin-top:10px;font-size:15px;color:${th.muted};line-height:1.65;font-weight:600">Tim memeriksa dan membahas martabat manusia.</p></div>
</div>`)}
<section style="margin-top:18px">
  <h3 style="font:600 14px Fredoka,sans-serif;margin-bottom:9px;display:flex;align-items:center;gap:7px">${iconBox('gelembung', { size: 18, fill: th.pinkDeep, tint: th.pinkPale })} Istilah di kartu ini</h3>
  <div style="display:flex;gap:8px;flex-wrap:wrap">
    ${[['尊厳', 'songen'], ['自立支援', 'jiritsushien'], ['自己決定', 'jikokettei']].map(([k, r]) =>
      `<span style="display:inline-flex;align-items:baseline;gap:6px;min-height:44px;padding:9px 13px;border-radius:999px;background:#fff;border:1px solid ${th.pink};box-shadow:0 3px 10px -6px rgba(255,110,160,.35)"><b style="font:700 17px Fredoka,sans-serif;color:${th.ink};font-family:'Noto Sans JP',sans-serif">${k}</b><small style="font-size:11px;color:${th.furi}">${r}</small></span>`).join('')}
  </div>
</section>
${materiNav()}`,
});

export const MateriCompare = () => phone({
  h: 940, nav: 'learn',
  body: `${materiTop(2, 5)}
${materiCard(`<h2 style="font:600 24px/1.35 Fredoka,sans-serif;margin:0 0 16px;font-family:'Noto Sans JP',Fredoka,sans-serif">${ja('尊厳[そんげん]と自立[じりつ]の違[ちが]い', { size: 24, lh: 2.1 })}</h2>
<div style="display:grid;gap:14px">
  ${[['尊厳', 'そんげん', 'Nilai yang melekat sejak lahir, tidak bergantung kemampuan.', 'Dipakai saat menimbang cara memperlakukan pengguna.'],
      ['自立支援', 'じりつしえん', 'Mendukung pengguna melakukan sendiri apa yang masih bisa.', 'Dipakai saat menyusun rencana bantuan harian.']]
      .map(([k, r, meaning, when]) => `<div style="padding:14px 16px;border:1px solid ${th.line};border-radius:18px;background:${th.pinkPaler}">
    <span style="display:block;font-weight:800;font-size:24px;margin-bottom:8px">${ruby(k, r, { furi: th.furi })}</span>
    <p style="font-size:14px;line-height:1.6;font-weight:600;margin-bottom:6px">${meaning}</p>
    <p style="font-size:13px;line-height:1.55;color:${th.muted}">${when}</p>
  </div>`).join('')}
</div>
<span style="display:block;margin-top:16px;padding:14px 16px;background:#fff9e8;border-radius:14px;color:#8a6a3a;font-size:13.5px;line-height:1.6">Keduanya sering muncul berpasangan di soal ujian: 尊厳 alasannya, 自立支援 caranya.</span>`, { minH: 320 })}
${materiNav()}`,
});

export const MateriCase = () => phone({
  h: 940, nav: 'learn',
  body: `${materiTop(3, 5)}
${materiCard(`<span style="display:inline-block;font-size:10.5px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#8354c9;background:${th.lavender};padding:5px 11px;border-radius:999px;margin-bottom:12px">Kasus lapangan</span>
<h2 style="font:600 22px/1.35 Fredoka,sans-serif;margin:0 0 14px">Menolak mandi pagi</h2>
<div style="margin-bottom:14px">${ja('田中[たなか]さんは朝[あさ]の入浴[にゅうよく]を断[ことわ]りました。', { size: 17 })}</div>
<p style="font-size:15px;line-height:1.65;color:${th.muted};font-weight:600;margin-bottom:16px">Bu Tanaka menolak dijadwalkan mandi pagi ini.</p>
<span style="display:block;padding:14px 16px;background:#fff9e8;border-radius:14px;color:#8a6a3a;font-size:14px;line-height:1.6;font-weight:700">Apa yang kamu lakukan lebih dulu?</span>
<span style="display:block;margin-top:12px;padding:14px 16px;background:#fff9e8;border-radius:14px;color:#8a6a3a;font-size:13.5px;line-height:1.65">Tanya alasannya dulu. Menolak bisa berarti kedinginan, malu, atau sedang tidak enak badan — jadwal bisa digeser, martabat tidak bisa.</span>`, { minH: 320 })}
${materiNav()}`,
});

export const TermSheet = () => phone({
  h: 940, nav: 'learn', pad: false,
  body: `<div style="position:relative;height:100%;overflow:hidden">
  <div style="padding:22px 20px;filter:blur(1px);opacity:.55">
    ${materiTop(1, 5)}
    ${materiCard(`<div style="text-align:center"><span style="display:block;font-weight:800;font-size:44px;margin:4px 0 10px">${ruby('尊厳', 'そんげん', { furi: th.furi })}</span><div style="font-weight:700;color:${th.muted}">songen / martabat manusia</div></div>`)}
  </div>
  <div style="position:absolute;inset:0;background:rgba(68,30,52,.42)"></div>
  <div style="position:absolute;left:0;right:0;bottom:0;background:#fff;border-radius:24px 24px 0 0;padding:28px 22px 24px;box-shadow:0 -12px 40px -16px rgba(68,30,52,.5)">
    <span style="position:absolute;right:14px;top:12px;background:${th.pinkPale};color:${th.pinkDeep};border-radius:50%;width:32px;height:32px;display:grid;place-items:center;font-size:22px">×</span>
    <small style="color:#9f8191;letter-spacing:.14em;font-size:12px">そんげん · songen</small>
    <h2 style="font:700 48px Fredoka,sans-serif;margin:5px 0 10px">${ruby('尊厳', 'そんげん', { furi: th.furi })}</h2>
    <p style="font-weight:700;color:${th.pinkDeep};margin-bottom:10px">martabat manusia</p>
    <p style="line-height:1.7;font-size:14px;color:${th.ink}">Nilai yang melekat pada setiap manusia sejak lahir. Dalam kaigo, 尊厳 bukan sesuatu yang diberikan oleh fasilitas atau diperoleh karena seseorang mampu melakukan banyak hal.</p>
    <p style="margin-top:14px;color:${th.pinkDeep};font-weight:700;font-size:13.5px">Buka halaman lengkapnya →</p>
  </div>
</div>`,
});

/* ---------- quiz ---------- */
const Q = {
  ja: 'ノーマライゼーションについて、家族への対応として、最も適切なものを1つ選びなさい。',
  id: 'Topik Normalisasi: apa bentuk pendampingan keluarga yang paling tepat?',
  choices: [
    ['家族の希望を本人の意思より優先する', 'Mengutamakan harapan keluarga di atas kehendak pengguna'],
    ['本人の前で家族の対応を批判する', 'Mengkritik cara keluarga di depan pengguna'],
    ['家族の負担や思いを聴き、本人の意思と家族の希望の両方を確認する', 'Mendengarkan beban dan perasaan keluarga, lalu memastikan kehendak pengguna maupun harapan keluarga'],
    ['介護は専門職の仕事なので家族には関わらせない', 'Tidak melibatkan keluarga karena kaigo adalah pekerjaan tenaga profesional'],
    ['家族の不安には触れず、事務的な連絡だけを行う', 'Tidak menyentuh kecemasan keluarga dan hanya memberi kabar administratif'],
  ],
  correct: 2,
  explId: 'Keluarga adalah pihak yang didukung sekaligus mitra kerja. Terima perasaan mereka, lalu tetap jadikan kehendak pengguna sebagai pusat penyesuaian.',
};

const quizTop = (label, pct) => `<div style="display:flex;justify-content:space-between;align-items:center;margin:0 0 12px;font-size:11px;font-weight:700;letter-spacing:.6px;color:${th.muted}">
  <a style="color:${th.muted}">‹ Exit</a><span>${label}</span>
</div>
<div style="height:9px;background:${th.pinkPale};border-radius:99px;overflow:hidden;margin-bottom:18px"><i style="display:block;height:100%;width:${pct}%;background:linear-gradient(90deg,${th.pink},${th.gold});border-radius:99px"></i></div>`;

const qCard = (mode = 'kanji') => `<div style="margin-bottom:14px;border-radius:26px;padding:20px 20px 18px;background:#fff;border:1px solid ${th.line};box-shadow:0 12px 30px -10px rgba(255,150,190,.4)">
  <div style="display:flex;justify-content:flex-end;margin-bottom:4px">${langSwitch(mode, th, .95)}</div>
  ${mode === 'id'
    ? `<h1 style="font:600 22px/1.5 Fredoka,sans-serif;margin:7px 0 0">${Q.id}</h1>`
    : `<h1 style="margin:7px 0 0">${ja('ノーマライゼーションについて、家族[かぞく]への対応[たいおう]として、最[もっと]も適切[てきせつ]なものを1つ選[えら]びなさい。', { size: 22, mode, weight: 600 })}</h1>`}
</div>`;

const choice = (i, { state = 'idle', mode = 'kanji' } = {}) => {
  const [jaText, idText] = Q.choices[i];
  const border = state === 'correct' ? '2px solid #63c89a' : state === 'wrong' ? '2px solid #f4849b' : `1.5px solid #efdfe5`;
  const bg = state === 'correct' ? '#effcf5' : state === 'wrong' ? '#fff1f3' : '#fff';
  const mark = state === 'correct' ? `<span style="color:#4cba89;margin-left:6px">${icon('check', 18)}</span>`
    : state === 'wrong' ? `<span style="color:#e0577c;margin-left:6px">${icon('x', 18)}</span>` : '';
  return `<div style="border-radius:18px;border:${border};background:${bg};padding:16px;min-height:66px;box-shadow:0 4px 14px -8px rgba(255,150,190,.3);display:flex;align-items:center;gap:8px">
  <span style="flex:1;font-size:14px;line-height:1.55;font-weight:600;${mode === 'id' ? '' : "font-family:'Noto Sans JP',sans-serif"}">${mode === 'id' ? idText : jaText}</span>${mark}
</div>`;
};

const listenBtn = () => `<div style="display:inline-flex;align-items:center;gap:7px;border:1px solid #f5dbe4;color:#ff7393;background:#fff7fa;padding:9px 12px;border-radius:12px;font-size:12px;margin:4px 0 12px">${icon('volume', 17)} 聞く · Dengarkan soal</div>`;

const explainBox = () => `<div style="background:linear-gradient(135deg,#fff9e8,#fff3d3);border:1px solid #f6dfa3;border-radius:26px;padding:16px 18px;margin:6px 0 16px">
  <div style="display:flex;align-items:center;gap:8px;font:700 13px Fredoka,sans-serif;color:#9a6b1f;margin-bottom:10px">${icon('info', 16)}<span style="flex:1">Kenapa jawaban ini benar?</span></div>
  <p style="margin:0;font-size:13px;color:#8a6a3a;line-height:1.6">${Q.explId}</p>
</div>`;

export const QuizAwal = () => phone({
  h: 1020, nav: 'learn',
  body: `${quizTop('2 / 5', 40)}${qCard('kanji')}${listenBtn()}
<div style="display:grid;gap:10px">${Q.choices.map((_, i) => choice(i)).join('')}</div>
<div style="margin-top:16px">${primary(`Lanjut ${icon('chevron', 16)}`, th, 'opacity:.55')}</div>`,
});

export const QuizBenar = () => phone({
  h: 1180, nav: 'learn', pad: false,
  body: `<div style="position:relative;height:100%;padding:22px 20px;overflow:hidden">
  ${quizTop('2 / 5', 40)}${qCard('kanji')}
  <div style="display:grid;gap:10px">${Q.choices.map((_, i) => choice(i, { state: i === 2 ? 'correct' : 'idle' })).join('')}</div>
  ${explainBox()}
  ${primary(`Lanjut ${icon('chevron', 16)}`, th)}
  <div style="position:absolute;top:20%;left:50%;transform:translateX(-50%);display:flex;align-items:center;gap:10px;padding:16px 26px;border-radius:999px;font:700 18px Fredoka,sans-serif;color:#fff;background:linear-gradient(135deg,#5fd68a,#3bbf72);box-shadow:0 16px 40px -10px rgba(0,0,0,.35);white-space:nowrap">${iconBox('konfeti', { size: 26, fill: '#fff', tint: 'rgba(255,255,255,.35)' })} Yeayy!</div>
</div>`,
});

export const QuizSalah = () => phone({
  h: 1180, nav: 'learn', pad: false,
  body: `<div style="position:relative;height:100%;padding:22px 20px;overflow:hidden">
  ${quizTop('2 / 5', 40)}${qCard('id')}
  <div style="display:grid;gap:10px">${Q.choices.map((_, i) => choice(i, { state: i === 2 ? 'correct' : i === 0 ? 'wrong' : 'idle', mode: 'id' })).join('')}</div>
  ${explainBox()}
  <div style="position:absolute;top:20%;left:50%;transform:translateX(-50%);display:flex;align-items:center;gap:10px;padding:16px 26px;border-radius:999px;font:700 18px Fredoka,sans-serif;color:#fff;background:linear-gradient(135deg,#ff8fa8,#ff5c8a);box-shadow:0 16px 40px -10px rgba(0,0,0,.35);white-space:nowrap">${iconBox('sedih', { size: 26, fill: '#fff', tint: 'rgba(255,255,255,.3)' })} Zannen…</div>
</div>`,
});

export const QuizRetry = () => phone({
  h: 1020, nav: 'learn',
  body: `${quizTop('RETRY · 1 / 2', 50)}
<div style="display:flex;align-items:center;gap:12px;background:linear-gradient(135deg,#ffe3ef,#ffd7e8);border:1px solid #ffc0da;border-radius:26px;padding:14px 16px;margin-bottom:16px">
  <span style="color:${th.pinkDeep}">${icon('rotate', 22)}</span>
  <div style="flex:1"><b style="font:700 14px Fredoka,sans-serif;color:${th.pinkDeep};display:block">Yuk ulangi soal yang belum tepat!</b><span style="font-size:11.5px;color:#a8637f">Ronde retry #1 · 2 soal tersisa</span></div>
  <div style="display:flex;gap:4px">${[1, 0].map(d => `<span style="width:8px;height:8px;border-radius:50%;background:${d ? th.pinkDeep : '#ffc0da'}"></span>`).join('')}</div>
</div>
${qCard('kanji')}${listenBtn()}
<div style="display:grid;gap:10px">${Q.choices.slice(0, 4).map((_, i) => choice(i)).join('')}</div>
<div style="margin-top:16px">${primary('Ulangi soal yang salah ↻', th)}</div>`,
});

const resultScreen = ({ preview, t = th, charId = 'momo' }) => phone({
  h: 874, nav: 'learn', theme: t, charId,
  body: `<div style="text-align:center;padding-top:8px">
  <div style="display:flex;justify-content:center">${mascot(charId, preview ? 'idle' : 'clap', 168, t)}</div>
  <p style="font-size:11px;letter-spacing:1.6px;color:${t.pink};font-weight:700;margin:10px 0;text-transform:uppercase">${preview ? 'Preview attempt' : 'Level complete'}</p>
  <h1 style="font:700 48px Fredoka,sans-serif;margin:6px 0;background:linear-gradient(135deg,${t.pinkDeep},${t.goldDeep});-webkit-background-clip:text;background-clip:text;color:transparent">${preview ? '3 / 5' : '5 / 5'}</h1>
  <p style="color:${t.muted};font-size:13px;line-height:1.55;max-width:300px;margin:0 auto">${preview
      ? 'Latihan preview — belum resmi completed sampai prasyarat sebelumnya selesai.'
      : '完璧！Perfect!'}</p>
  <div style="display:flex;flex-direction:column;align-items:center;gap:4px;margin:18px auto 24px;background:#fff;border:1px solid ${t.line};border-radius:26px;padding:18px 20px;box-shadow:${t.shadow};max-width:340px">
    <b style="font:700 26px Fredoka,sans-serif;color:${t.goldDeep}">+${preview ? 3 : 25} XP</b>
    <span style="font-size:12px;color:${t.muted}">Materi: Normalisasi</span>
  </div>
  <div style="display:flex;flex-direction:column;gap:10px">
    ${primary(`Level berikutnya ${icon('chevron', 16)}`, t)}
    ${secondary(`${icon('rotate', 18)} Ulangi`, t)}
  </div>
</div>`,
});

export const ResultSempurna = (t, charId) => resultScreen({ preview: false, t, charId });
export const ResultPreview = () => resultScreen({ preview: true });

export const Recap = () => phone({
  h: 874, nav: 'learn',
  body: `<div style="text-align:center">
  <div style="display:flex;gap:16px;align-items:center;margin:12px 0 16px;text-align:left">
    <span style="width:56px;height:56px;border-radius:18px;background:linear-gradient(145deg,${th.pinkPale},${th.pink}55);display:grid;place-items:center;flex:none">${iconBox('sakura', { size: 34, fill: th.pinkDeep, tint: '#fff' })}</span>
    <div><small style="font-size:10px;letter-spacing:1.4px;color:${th.muted}99;font-weight:700">RECAP</small>
    <h1 style="font:600 28px Fredoka,sans-serif;margin:4px 0;font-family:'Noto Sans JP',Fredoka,sans-serif">人間の尊厳と自立</h1>
    <p style="margin:0;color:${th.muted};font-size:13px">Section review · Kenapa martabat jadi dasar tiap tindakan</p></div>
  </div>
  <div style="display:flex;justify-content:center;margin:10px 0">${mascot('momo', 'happy', 136)}</div>
  <h2 style="font:600 24px Fredoka,sans-serif;margin:14px 0 6px">Siap diuji?</h2>
  <p style="color:${th.muted};font-size:13px;line-height:1.55;margin-bottom:22px">Soal campuran dari semua level di section ini.</p>
  ${primary(`Mulai recap ${icon('star', 18)}`, th)}
</div>`,
});

export const Practice = () => phone({
  h: 1020, nav: 'learn',
  body: `<div style="text-align:center;margin-bottom:12px">
  <div style="display:flex;justify-content:center">${charSvg('momo', 'idle', 78)}</div>
  <span style="display:inline-flex;align-items:center;gap:6px;background:${th.lavender};color:#8354c9;font-weight:700;font-size:10.5px;padding:5px 11px;border-radius:999px;margin:8px 0 10px">${icon('shuffle', 12)} Practice · unlimited</span>
  <p style="color:${th.muted};font-size:13px;line-height:1.55">Soal acak dari semua section — 12 dijawab, 9 benar. XP tidak resmi &amp; tidak memengaruhi unlock.</p>
</div>
<div style="display:flex;justify-content:space-between;align-items:center;margin:6px 0 12px;font-size:11px;font-weight:700;letter-spacing:.6px;color:${th.muted}"><span>Kenapa martabat jadi dasar tiap tindakan · Normalisasi</span></div>
${qCard('kanji')}${listenBtn()}
<div style="display:grid;gap:10px">${Q.choices.map((_, i) => choice(i)).join('')}</div>
<div style="margin-top:16px">${primary(`Soal berikutnya ${icon('chevron', 16)}`, th)}</div>`,
});
