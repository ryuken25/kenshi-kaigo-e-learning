// screens-rest.mjs — lane D (ujian akhir), E (sosial), F (referensi & state),
// G (tema), H (desktop >=960px). Copy dari FinalTest.jsx, Social.jsx, GlossaryPage.jsx.
import {
  T, THEMES, phone, doc, mascot, charSvg, ja, ruby, icon, iconFill, navIcon, primary, secondary,
  back, eyebrow, langSwitch, header, bottomNav, CHAR_IDS, CHAR_META,
} from './kit.mjs';
import { iconBox } from './icons.mjs';
import { Main, LevelHub, ResultSempurna, SECTIONS } from './screens-flow.mjs';

const th = T;

/* ======================= LANE D — ujian akhir ======================= */

const YEARS = [
  [2026, '第38回', 3], [2025, '第37回', 5], [2024, '第36回', 0],
  [2023, '第35回', 0], [2022, '第34回', 0], [2021, '第33回', 0],
];

export const FinalHome = () => phone({
  h: 1000, nav: 'exam',
  body: `${back('Belajar')}
<div style="text-align:center;padding:6px 0 16px">
  ${eyebrow('Simulasi ujian')}
  <h1 style="font:600 30px Fredoka,sans-serif;margin:0 0 8px">Ujian Akhir</h1>
  <p style="color:${th.muted};font-size:13px;line-height:1.55">Pilih tahun ujian. Semua bagian terbuka sejak awal.</p>
</div>
<div style="display:flex;flex-direction:column;gap:4px;margin:0 0 18px;padding:16px 18px;border:1px solid #ffc8dc;border-radius:18px;background:linear-gradient(135deg,#fff0f7,#ffe3ef)">
  <b style="font:700 18px Fredoka,sans-serif;color:${th.pinkDeep};display:flex;align-items:center;gap:8px">${iconBox('sakura', { size: 20, fill: th.pinkDeep, tint: th.pinkPale })} Latihan tanpa batas</b>
  <span style="font-size:12px;color:${th.muted}">Jawab soal random seperti mode Latihan sebelumnya →</span>
</div>
<div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px">
  ${YEARS.map(([y, exam, done]) => `<div style="display:flex;flex-direction:column;gap:2px;padding:16px 18px;background:#fff;border:1px solid ${th.line};border-radius:20px;box-shadow:${th.shadow}">
    <b style="font:600 26px Fredoka,sans-serif;color:${th.pinkDeep}">${y}</b>
    <strong style="font-size:14px;font-family:'Noto Sans JP',sans-serif">${exam}</strong>
    <span style="color:${th.muted};font-size:12px">${done}/5 bagian</span>
    <small style="color:${th.muted};font-size:12px">125 soal</small>
  </div>`).join('')}
</div>`,
});

export const FinalYear = () => phone({
  h: 900, nav: 'exam',
  body: `${back('Semua tahun')}
<h1 style="font:600 28px Fredoka,sans-serif;margin:6px 0 4px">2026 · <span style="font-family:'Noto Sans JP',sans-serif">第38回</span></h1>
<p style="color:${th.muted};font-size:13px;margin-bottom:18px">63/125 terbaik</p>
<div style="display:grid;gap:10px">
  ${[[1, '1–25', '21/25'], [2, '26–50', '18/25'], [3, '51–75', '24/25'], [4, '76–100', null], [5, '101–125', null]]
      .map(([n, range, best]) => `<div style="display:flex;flex-direction:column;gap:2px;padding:14px 16px;background:${th.pinkPaler};border-left:4px solid ${th.pink};border-radius:14px">
    <b style="font:600 15px Fredoka,sans-serif">Bagian ${n}</b>
    <span style="font-size:12px;color:${th.muted}">soal ${range}</span>
    <small style="font-size:12px;color:${best ? th.pinkDeep : th.muted};font-weight:${best ? 700 : 400}">${best || 'Belum dikerjakan'}</small>
  </div>`).join('')}
</div>`,
});

const EX = {
  ja: '人間[にんげん]の尊厳[そんげん]と自立[じりつ]について、事故[じこ]を防[ふせ]ぐための対応[たいおう]として最[もっと]も適切[てきせつ]なものを1つ選[えら]びなさい。',
  opts: [
    ['1', 'ヒヤリハットは報告せず個人で気をつける'],
    ['2', '事故が起きてから対策を考える'],
    ['3', '危険の要因を環境の側から見直し、本人の活動を制限しすぎない'],
    ['4', '転倒の恐れがあるので歩行はやめてもらう'],
    ['5', '安全のためにベッド周囲を柵で囲む'],
  ],
  explId: 'Manajemen risiko menyeimbangkan keselamatan dan kemandirian, bukan menghentikan aktivitas. Berbagi laporan near-miss itulah yang mencegah kejadian terulang.',
};

const finalQuizTop = (mode) => `<div style="display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;padding:0 0 12px">
  <a style="color:${th.muted};font-size:13px">× Tutup</a>
  <span style="font-size:12px;font-weight:700;color:${th.muted};font-family:'Noto Sans JP',sans-serif">問題 12 · 12/25</span>
  <span style="font-size:13px;padding:8px 10px;border-radius:12px;border:1px solid ${th.line};background:#fff;color:${th.ink}">${mode === 'exam' ? 'Mode Ujian' : 'Mode Latihan'} ▾</span>
</div>`;

const finalOption = (k, text, { selected = false } = {}) =>
  `<div style="display:flex;gap:10px;align-items:flex-start;text-align:left;width:100%;padding:14px;border-radius:14px;border:1px solid ${selected ? th.pinkDeep : th.line};background:${selected ? th.pinkPale : th.soft};min-height:44px">
  <b style="font:700 15px Fredoka,sans-serif;color:${th.pinkDeep};flex:none">${k}</b>
  <span style="line-height:1.6;font-size:14px;font-family:'Noto Sans JP',sans-serif">${text}</span>
</div>`;

export const FinalQuizLatihan = () => phone({
  h: 1060, nav: 'exam',
  body: `${finalQuizTop('practice')}
<div style="display:flex;gap:4px;width:max-content;padding:4px;background:${th.pinkPale};border-radius:999px;margin-bottom:14px">
  ${[['漢字', false], ['ふり', true], ['ID', false]].map(([l, on]) => `<span style="border-radius:999px;padding:8px 14px;font-weight:700;font-size:13px;color:${th.pinkDeep};${on ? 'background:#fff;box-shadow:0 3px 8px -4px rgba(255,100,160,.5)' : ''}">${l}</span>`).join('')}
</div>
<div style="margin-bottom:12px">${ja(EX.ja, { size: 20, weight: 700, lh: 2.3 })}</div>
<div style="display:grid;gap:8px;padding-top:12px">${EX.opts.map(([k, t]) => finalOption(k, t, { selected: k === '3' })).join('')}</div>
<div style="margin-top:14px;padding:14px 16px;background:linear-gradient(135deg,#fff9e8,#fff3d3);border:1px solid #f6dfa3;border-radius:18px;font-size:13px;line-height:1.6;color:#8a6a3a">
  <b style="color:#9a6b1f">Benar</b> — ${EX.explId}
</div>
<div style="display:flex;gap:10px;margin-top:16px">${secondary('Sebelumnya', th, 'flex:1')}${primary('Berikutnya', th, 'flex:1')}</div>`,
});

export const FinalQuizUjian = () => phone({
  h: 1000, nav: 'exam',
  body: `${finalQuizTop('exam')}
<div style="display:flex;gap:4px;width:max-content;padding:4px;background:${th.pinkPale};border-radius:999px;margin-bottom:14px">
  ${[['漢字', true], ['ふり', false], ['ID', false]].map(([l, on]) => `<span style="border-radius:999px;padding:8px 14px;font-weight:700;font-size:13px;color:${th.pinkDeep};${on ? 'background:#fff;box-shadow:0 3px 8px -4px rgba(255,100,160,.5)' : ''}">${l}</span>`).join('')}
</div>
<div style="margin-bottom:12px">${ja(EX.ja, { size: 20, weight: 700, mode: 'kanji' })}</div>
<div style="display:grid;gap:8px;padding-top:12px">${EX.opts.map(([k, t]) => finalOption(k, t, { selected: k === '5' })).join('')}</div>
<p style="margin-top:14px;font-size:12px;color:${th.muted};line-height:1.55">Mode ujian: jawaban tidak dikoreksi sampai satu bagian dikirim.</p>
<div style="display:flex;gap:10px;margin-top:12px">${secondary('Sebelumnya', th, 'flex:1')}${primary('Kirim bagian', th, 'flex:1')}</div>
<div style="margin-top:14px;background:#fff1f3;border:1px solid #f4849b;color:#8a3049;font-size:13px;line-height:1.5;padding:10px 12px;border-radius:12px">Gagal menyimpan progress. Coba lagi.</div>`,
});

export const FinalResult = () => phone({
  h: 874, nav: 'exam',
  body: `<div style="text-align:center;padding-top:16px">
  <div style="display:flex;justify-content:center">${mascot('momo', 'happy', 150)}</div>
  ${eyebrow('Hasil bagian 3')}
  <h1 style="font:700 48px Fredoka,sans-serif;margin:6px 0;background:linear-gradient(135deg,${th.pinkDeep},${th.goldDeep});-webkit-background-clip:text;background-clip:text;color:transparent">24 / 25</h1>
  <p style="color:${th.muted};font-size:13px;margin-bottom:24px">Jawaban tersimpan di akunmu.</p>
  ${primary('Kembali ke tahun 2026', th)}
</div>`,
});

export const FinalUnlimited = () => phone({
  h: 1000, nav: 'exam',
  body: `${back('Ujian Akhir')}
<div style="margin:18px 0">
  ${eyebrow('Unlimited practice')}
  <h1 style="font:600 28px Fredoka,sans-serif;margin:0 0 8px">Latihan tanpa batas</h1>
  <p style="color:${th.muted};font-size:13px;line-height:1.55;margin-bottom:10px">Soal terus berputar. Tidak memengaruhi skor resmi, XP, atau progress ujian.</p>
  <span style="display:inline-flex;align-items:center;gap:6px;background:${th.lavender};color:#8354c9;font-weight:700;font-size:10.5px;padding:5px 11px;border-radius:999px">42/100 soal — maraton</span>
</div>
<div style="display:flex;gap:4px;width:max-content;padding:4px;background:${th.pinkPale};border-radius:999px;margin-bottom:14px">
  ${[['漢字', false], ['ふり', true], ['ID', false]].map(([l, on]) => `<span style="border-radius:999px;padding:8px 14px;font-weight:700;font-size:13px;color:${th.pinkDeep};${on ? 'background:#fff;box-shadow:0 3px 8px -4px rgba(255,100,160,.5)' : ''}">${l}</span>`).join('')}
</div>
<section>
  <small style="font-size:11px;color:${th.muted};font-weight:700;letter-spacing:.6px">Soal latihan #42</small>
  <div style="margin:8px 0 12px">${ja(EX.ja, { size: 19, weight: 700, lh: 2.3 })}</div>
  <div style="display:grid;gap:8px">${EX.opts.slice(0, 4).map(([k, t]) => finalOption(k, t)).join('')}</div>
</section>
<div style="margin-top:16px">${primary(`Soal berikutnya ${icon('chevron', 16)}`, th)}</div>`,
});

/* ======================= LANE E — sosial ======================= */

const FRAMES = {
  none: null, bronze: ['#cd9b6a', '#8a5a2b'], silver: ['#eef0f6', '#9aa0b5'],
  gold: ['#ffe08a', '#e0a93e'], sakura: ['#ffc2dd', '#ff7bab'],
  rainbow: ['conic', 'conic-gradient(#ff8fb3,#ffd47e,#9fe6a0,#8fd3ff,#c9a6ff,#ff8fb3)'],
};
export const avatar = (charId, frame = 'none', size = 56) => {
  const f = FRAMES[frame];
  const ring = !f ? '' : f[0] === 'conic'
    ? `<span style="position:absolute;inset:-4px;border-radius:50%;background:${f[1]}"></span>`
    : `<span style="position:absolute;inset:-4px;border-radius:50%;background:linear-gradient(135deg,${f[0]},${f[1]})"></span>`;
  return `<span style="position:relative;display:inline-grid;place-items:center;border-radius:50%;flex:none;width:${size}px;height:${size}px;background:${th.pinkPale}">${ring}<span style="position:relative;z-index:1;width:${size}px;height:${size}px;border-radius:50%;background:#fff;border:2px solid #fff;display:grid;place-items:center;overflow:hidden">${charSvg(charId, 'idle', size - 8)}</span></span>`;
};

export const Profile = () => phone({
  h: 1240, nav: 'profile',
  body: `<div style="text-align:center;background:linear-gradient(160deg,#fff,${th.pinkPaler});border:1px solid ${th.line};border-radius:26px;padding:28px 20px;margin:0 0 20px;box-shadow:${th.shadow}">
  ${avatar('momo', 'silver', 84)}
  <h1 style="font:600 24px Fredoka,sans-serif;margin:12px 0 4px">Halo, Rina</h1>
  <span style="display:inline-block;font-size:12px;font-weight:700;color:${th.pinkDeep};background:${th.pinkPale};border-radius:999px;padding:4px 12px;margin-bottom:8px">@rina_kaigo</span>
  <p style="color:${th.muted};font-size:13px">Progress kamu tersimpan otomatis di akun.</p>
  <div style="display:flex;justify-content:center;gap:26px;margin-top:18px">
    ${[['412', 'total XP'], ['7', 'day streak'], ['9', 'levels']].map(([v, l]) =>
    `<div style="display:flex;flex-direction:column;align-items:center"><b style="font:700 22px Fredoka,sans-serif;color:${th.pinkDeep}">${v}</b><small style="font-size:10px;color:${th.muted};letter-spacing:.5px">${l}</small></div>`).join('')}
  </div>
</div>
<div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-bottom:18px">
  ${[['users', 'Teman'], ['trophy', 'Peringkat'], ['medal', 'Achievement']].map(([ic, l]) =>
    `<div style="display:flex;flex-direction:column;align-items:center;gap:6px;padding:16px 8px;background:#fff;border:1px solid ${th.line};border-radius:20px;box-shadow:0 5px 16px -8px rgba(255,130,170,.3);font-size:12px;font-weight:700;color:${th.pinkDeep}">${icon(ic, 21)}${l}</div>`).join('')}
</div>
<div style="padding:18px;background:#fff;border:1px solid ${th.line};border-radius:26px;box-shadow:${th.shadow};margin-bottom:16px">
  <b style="font:600 16px Fredoka,sans-serif;display:block;margin-bottom:12px">Tampilan</b>
  <small style="font-size:11px;font-weight:700;color:${th.muted};letter-spacing:.4px">KARAKTER</small>
  <div style="display:flex;gap:8px;margin:8px 0 14px">
    ${['momo', 'yuki', 'luna'].map((id, i) => `<span style="display:grid;place-items:center;width:62px;height:62px;border-radius:18px;border:${i === 0 ? `2px solid ${CHAR_META[id].acc}` : `1.5px solid ${th.line}`};background:${i === 0 ? th.pinkPaler : '#fff'}">${charSvg(id, 'idle', 46)}</span>`).join('')}
  </div>
  <small style="font-size:11px;font-weight:700;color:${th.muted};letter-spacing:.4px">TEMA</small>
  <div style="display:flex;gap:8px;margin-top:8px">
    ${[['Momo', '#ff6f9c'], ['Yuki', '#3aa7e8'], ['Luna', '#8b5cf6']].map(([n, c], i) =>
      `<span style="flex:1;display:flex;flex-direction:column;align-items:center;gap:5px;padding:10px 4px;border-radius:16px;border:${i === 0 ? `2px solid ${th.pinkDeep}` : `1.5px solid ${th.line}`};background:#fff"><span style="width:22px;height:22px;border-radius:50%;background:${c}"></span><small style="font-size:10.5px;font-weight:700">${n}</small></span>`).join('')}
  </div>
</div>
<div style="display:flex;gap:10px;background:#fffaf0;border:1px solid #f8e6bc;border-radius:20px;padding:14px 16px;margin-bottom:16px">
  ${iconFill('star', 18, '#ffb73b')}
  <span style="font-size:13px;line-height:1.55"><b>Pelan saja</b><br>Tidak harus sempurna. Yang penting jalan terus.</span>
</div>
${secondary('Logout', th)}`,
});

const friendRow = (name, handle, charId, frame, xp, action) =>
  `<div style="display:flex;align-items:center;gap:12px;padding:14px 15px;border:1px solid ${th.line};background:#fff;border-radius:20px;box-shadow:0 5px 16px -8px rgba(255,130,170,.3)">
  ${avatar(charId, frame, 44)}
  <div style="flex:1;min-width:0"><b style="font:600 15px Fredoka,sans-serif;display:block">${name}</b><small style="color:${th.muted};font-size:11px">@${handle} · ${xp} XP minggu ini</small></div>
  ${action}
</div>`;

const tabs = (items, active) => `<div style="display:flex;gap:6px;background:${th.pinkPale};border-radius:999px;padding:4px;margin-bottom:16px">
  ${items.map(t => `<span style="flex:1;text-align:center;padding:9px 8px;border-radius:999px;font-size:12.5px;font-weight:700;color:${th.pinkDeep};${t === active ? 'background:#fff;box-shadow:0 3px 8px -4px rgba(255,100,160,.5)' : ''}">${t}</span>`).join('')}
</div>`;

export const Friends = () => phone({
  h: 940, nav: 'profile',
  body: `<h1 style="font:600 26px Fredoka,sans-serif;display:flex;align-items:baseline;gap:8px;margin:0 0 16px">Teman <span style="font-size:12px;color:${th.muted};font-weight:400">· 4 terhubung</span></h1>
${tabs(['Teman', 'Masuk 2', 'Keluar'], 'Teman')}
<div style="display:grid;gap:10px">
  ${friendRow('Dewi', 'dewi_care', 'luna', 'gold', 240, `<span style="font-size:11px;font-weight:700;color:${th.muted}">▲ 2</span>`)}
  ${friendRow('Bagus', 'bagus21', 'yuki', 'bronze', 180, `<span style="font-size:11px;font-weight:700;color:${th.muted}">▼ 1</span>`)}
  ${friendRow('Sari', 'sari_n', 'luna', 'none', 95, `<span style="font-size:11px;font-weight:700;color:${th.muted}">—</span>`)}
  ${friendRow('Tomo', 'tomo_kaigo', 'momo', 'sakura', 60, `<span style="font-size:11px;font-weight:700;color:${th.muted}">▲ 5</span>`)}
</div>
<div style="margin-top:18px;padding:16px;border:1px dashed #e7cede;border-radius:20px;background:linear-gradient(135deg,#fff,#faf6fb);text-align:center">
  <p style="font-size:12.5px;color:${th.muted};line-height:1.55;margin-bottom:12px">Punya teman yang juga belajar kaigo? Cari lewat handle mereka.</p>
  ${secondary(`${icon('search', 17)} Cari handle`, th)}
</div>`,
});

export const FriendsCari = () => phone({
  h: 874, nav: 'profile',
  body: `<h1 style="font:600 26px Fredoka,sans-serif;margin:0 0 16px">Cari teman</h1>
<div style="display:flex;align-items:center;gap:10px;width:100%;padding:14px 16px;border:1px solid ${th.pink};border-radius:20px;background:#fff;margin-bottom:16px">
  <span style="color:${th.pink}">${icon('search', 18)}</span>
  <span style="font-size:14px;font-weight:600">@dewi_care</span>
</div>
${friendRow('Dewi', 'dewi_care', 'luna', 'gold', 240, `<span style="display:inline-flex;align-items:center;gap:5px;background:${th.btnBg};color:${th.btnText};font-size:12px;font-weight:700;padding:10px 13px;border-radius:14px;min-height:44px">${icon('plus', 14)} Tambah</span>`)}
<div style="margin-top:20px;padding:26px 20px;border:1px dashed #e7cede;border-radius:20px;text-align:center;background:linear-gradient(135deg,#fff,#faf6fb)">
  <div style="display:flex;justify-content:center;margin-bottom:8px">${charSvg('momo', 'sad', 72)}</div>
  <b style="font:600 15px Fredoka,sans-serif;display:block;margin-bottom:4px">Tidak ditemukan</b>
  <p style="font-size:12.5px;color:${th.muted};line-height:1.55">Handle <b>@dewi.care</b> belum terdaftar. Cek lagi ejaannya — handle hanya memakai huruf kecil, angka, dan underscore.</p>
</div>`,
});

export const Leaderboard = () => phone({
  h: 1000, nav: 'profile',
  body: `<h1 style="font:600 26px Fredoka,sans-serif;display:flex;align-items:baseline;gap:8px;margin:0 0 16px">Papan Peringkat <span style="font-size:12px;color:${th.muted};font-weight:400">· XP minggu ini</span></h1>
${tabs(['Teman', 'Global Top 100'], 'Global Top 100')}
<div style="display:grid;gap:9px">
  ${[[1, 'Dewi', 'dewi_care', 'luna', 'gold', 240, '▲ 2'],
      [2, 'Bagus', 'bagus21', 'yuki', 'bronze', 180, '▼ 1'],
      [3, 'Rina (kamu)', 'rina_kaigo', 'momo', 'silver', 155, '▲ 4'],
      [4, 'Sari', 'sari_n', 'luna', 'none', 95, '—'],
      [5, 'Tomo', 'tomo_kaigo', 'momo', 'sakura', 60, '▲ 5']]
      .map(([rank, name, handle, ch, fr, xp, delta]) => {
        const me = String(name).includes('kamu');
        return `<div style="display:flex;align-items:center;gap:11px;padding:12px 14px;border-radius:18px;border:${me ? `2px solid ${th.pinkDeep}` : `1px solid ${th.line}`};background:${me ? th.pinkPaler : '#fff'};box-shadow:0 5px 16px -8px rgba(255,130,170,.3)">
      <b style="font:700 16px Fredoka,sans-serif;color:${rank <= 3 ? th.goldDeep : th.muted};width:22px;text-align:center">${rank}</b>
      ${avatar(ch, fr, 40)}
      <div style="flex:1;min-width:0"><b style="font:600 14.5px Fredoka,sans-serif;display:block">${name}</b><small style="font-size:11px;color:${th.muted}">@${handle}</small></div>
      <div style="text-align:right"><b style="font:700 15px Fredoka,sans-serif;color:${th.pinkDeep}">${xp}</b><small style="display:block;font-size:10px;color:${th.muted}">${delta}</small></div>
    </div>`;
      }).join('')}
</div>
<p style="margin-top:16px;font-size:11.5px;color:${th.muted};line-height:1.55;text-align:center">Peringkat dihitung dari XP sejak Senin 00:00 waktu Jepang.</p>`,
});

const ACH = [
  ['Langkah pertama', 'Selesaikan level pertamamu', true],
  ['10 level', 'Selesaikan 10 level', false],
  ['Skor sempurna', 'Dapat 100 di satu level', true],
  ['Streak 3 hari', 'Belajar 3 hari berturut-turut', true],
  ['Streak 7 hari', 'Belajar 7 hari berturut-turut', true],
  ['Burung pagi', 'Selesaikan level sebelum jam 8 pagi', false],
];

export const Achievements = () => phone({
  h: 1000, nav: 'profile',
  body: `<h1 style="font:600 26px Fredoka,sans-serif;display:flex;align-items:baseline;gap:8px;margin:0 0 16px">Achievement <span style="font-size:12px;color:${th.muted};font-weight:400">· 12/35</span></h1>
<div style="display:flex;align-items:center;gap:14px;padding:18px;background:linear-gradient(160deg,#fff,${th.pinkPaler});border:1px solid ${th.line};border-radius:26px;box-shadow:${th.shadow};margin-bottom:18px">
  ${avatar('momo', 'silver', 76)}
  <div><b style="font:600 18px Fredoka,sans-serif;display:block">12 terbuka</b><small style="font-size:12px;color:${th.muted};display:inline-flex;align-items:center;gap:5px">· bingkai: ${iconBox('medali', { size: 15, fill: '#9aa0b5', tint: '#eef0f6' })} Silver</small>
  <p style="font-size:11.5px;color:${th.muted};margin-top:6px;line-height:1.5">8 lagi menuju bingkai Gold.</p></div>
</div>
<small style="font-size:11px;font-weight:700;color:${th.muted};letter-spacing:.5px">PROGRES BELAJAR</small>
<div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-top:10px">
  ${ACH.map(([name, desc, on]) => `<div style="display:flex;flex-direction:column;align-items:center;gap:6px;text-align:center;padding:16px 10px;border-radius:20px;border:1px solid ${on ? th.line : '#eee3e9'};background:${on ? '#fff' : '#faf6f8'};${on ? `box-shadow:${th.shadow}` : 'opacity:.6'}">
    <span style="width:44px;height:44px;border-radius:50%;display:grid;place-items:center;background:${on ? `linear-gradient(135deg,${th.gold},${th.goldDeep})` : '#e9dee4'};color:${on ? '#7a4a15' : '#b9a6b0'}">${on ? icon('check', 22) : icon('lock', 20)}</span>
    <b style="font:600 13px Fredoka,sans-serif">${name}</b>
    <small style="font-size:10.5px;color:${th.muted};line-height:1.4">${desc}</small>
  </div>`).join('')}
</div>`,
});

/* ======================= LANE F — referensi & state ======================= */

const GLOSS = [
  ['ADL', 'えーでぃーえる', 'eediieru', 'aktivitas hidup sehari-hari'],
  ['アドボカシー', 'あどぼかしー', 'adobokashii', 'advokasi hak pengguna'],
  ['尊厳', 'そんげん', 'songen', 'martabat manusia'],
  ['自立支援', 'じりつしえん', 'jiritsushien', 'dukungan kemandirian'],
  ['誤嚥', 'ごえん', 'goen', 'aspirasi ke saluran napas'],
  ['褥瘡', 'じょくそう', 'jokusou', 'luka tekan'],
];

export const Glossary = () => phone({
  h: 1000, nav: 'terms',
  body: `<h1 style="font:600 26px Fredoka,sans-serif;display:flex;align-items:baseline;gap:8px;margin:0 0 16px">Istilah <span style="font-size:12px;color:${th.muted};font-weight:400">· 133 kata</span></h1>
<div style="display:flex;align-items:center;gap:10px;width:100%;padding:14px 16px;border:1px solid ${th.line};border-radius:20px;background:#fff;margin-bottom:14px">
  <span style="color:${th.pink}">${icon('search', 18)}</span>
  <span style="font-size:14px;color:#b9a3ae">Cari kanji, kana, romaji, atau arti…</span>
</div>
<div style="display:flex;gap:8px;overflow:hidden;margin-bottom:16px;padding-bottom:2px">
  ${['Semua', 'Fondasi', 'Hak', 'Tubuh', 'Demensia', 'Alat'].map((c, i) =>
    `<span style="flex:none;padding:9px 14px;border-radius:999px;font-size:12px;font-weight:700;min-height:44px;display:grid;place-items:center;border:1px solid ${i === 0 ? th.pinkDeep : th.line};background:${i === 0 ? th.pinkPale : '#fff'};color:${th.pinkDeep};white-space:nowrap">${c}</span>`).join('')}
</div>
<div style="display:grid;gap:10px">
  ${GLOSS.map(([k, r, rom, short]) => `<div style="display:flex;align-items:center;gap:12px;padding:14px 15px;border:1px solid ${th.line};background:#fff;border-radius:20px;box-shadow:0 5px 16px -8px rgba(255,130,170,.3)">
    <div style="flex:1;min-width:0"><b style="font:600 17px Fredoka,sans-serif;display:block;font-family:'Noto Sans JP',sans-serif">${k}</b><small style="color:${th.muted};font-size:11px">${r} · ${rom}</small></div>
    <span style="font-size:12px;color:#c48fa3;text-align:right;max-width:130px;line-height:1.4">${short}</span>
  </div>`).join('')}
</div>`,
});

export const GlossaryDetail = () => phone({
  h: 940, nav: 'terms',
  body: `${back('Istilah')}
<div style="text-align:center;padding:8px 0 18px">
  <small style="color:#9f8191;letter-spacing:.14em;font-size:12px">そんげん · songen</small>
  <h1 style="font:700 52px Fredoka,sans-serif;margin:8px 0 12px">${ruby('尊厳', 'そんげん', { furi: th.furi })}</h1>
  <p style="font-weight:700;color:${th.pinkDeep};font-size:15px">martabat manusia</p>
</div>
<p style="line-height:1.75;font-size:14px;margin-bottom:18px">Nilai yang melekat pada setiap manusia sejak lahir. Dalam kaigo, 尊厳 bukan sesuatu yang diberikan oleh fasilitas atau diperoleh karena seseorang mampu melakukan banyak hal. Nilai ini tetap ada ketika pengguna menua, sakit, mengalami disabilitas, tidak dapat berbicara, atau membutuhkan bantuan penuh.</p>
<div style="padding:16px 18px;background:${th.pinkPaler};border:1px solid ${th.line};border-radius:20px;margin-bottom:16px">
  <small style="font-size:11px;font-weight:700;color:${th.muted};letter-spacing:.5px">CONTOH KALIMAT</small>
  <div style="margin:8px 0 6px">${ja('尊厳[そんげん]についてチームで確認[かくにん]します。', { size: 16 })}</div>
  <p style="font-size:13px;color:${th.muted};line-height:1.55">Tim memeriksa dan membahas martabat manusia.</p>
</div>
<small style="font-size:11px;font-weight:700;color:${th.muted};letter-spacing:.5px">MUNCUL DI</small>
<div style="display:flex;gap:8px;margin-top:8px;flex-wrap:wrap">
  ${['BAB 01 · 人間の尊厳と自立', 'BAB 09 · 介護の基本'].map(c =>
    `<span style="padding:9px 13px;border-radius:999px;font-size:11.5px;font-weight:700;background:#fff;border:1px solid ${th.line};color:${th.ink};min-height:44px;display:grid;place-items:center;font-family:'Noto Sans JP',sans-serif">${c}</span>`).join('')}
</div>`,
});

export const StateSistem = () => doc({
  w: 880, h: 700, theme: th,
  body: `<h1 style="font:600 26px Fredoka,sans-serif;margin-bottom:6px">State sistem</h1>
<p style="color:${th.muted};font-size:13px;margin-bottom:22px">Empat kondisi yang muncul di banyak route sekaligus. Diambil dari KawaiiLoader, emptyState, dan .submitError.</p>
<div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px">
  ${[
      ['Memuat halaman', `<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;padding:40px 20px;text-align:center">${charSvg('momo', 'sleepy', 84)}<p style="color:${th.muted};font-size:13px;font-weight:600">Menyiapkan materi…</p></div>`],
      ['Belum login', `<div style="display:flex;flex-direction:column;align-items:center;gap:12px;padding:34px 20px;text-align:center">${iconBox('label', { size: 34, fill: th.pinkDeep, tint: th.pinkPale })}<p style="font-size:13px;color:${th.ink};line-height:1.55">Login dulu untuk memakai fitur teman.</p><span style="display:inline-flex;background:${th.btnBg};color:${th.btnText};font-weight:700;font-size:13px;padding:12px 20px;border-radius:16px">Masuk</span></div>`],
      ['Sedang memuat data', `<div style="display:flex;flex-direction:column;align-items:center;gap:12px;padding:44px 20px;text-align:center">${iconBox('jejak', { size: 34, fill: th.pink, tint: th.pinkPale })}<p style="font-size:13px;color:${th.muted}">Memuat…</p></div>`],
      ['Gagal menyimpan', `<div style="padding:34px 20px"><div style="background:#fff1f3;border:1px solid #f4849b;color:#8a3049;font-size:13px;line-height:1.5;padding:10px 12px;border-radius:12px">Sesi kamu habis — masuk lagi dulu biar nilainya tersimpan.</div><div style="margin-top:10px;background:#fff1f3;border:1px solid #f4849b;color:#8a3049;font-size:13px;line-height:1.5;padding:10px 12px;border-radius:12px">Gagal menyimpan nilai — cek koneksi lalu coba lagi.</div></div>`],
    ].map(([label, inner]) => `<div>
    <small style="font-size:11px;font-weight:700;letter-spacing:.5px;color:${th.muted};display:block;margin-bottom:8px">${label.toUpperCase()}</small>
    <div style="background:#fff;border:1px solid ${th.line};border-radius:26px;box-shadow:${th.shadow};overflow:hidden">${inner}</div>
  </div>`).join('')}
</div>`,
});

/* ======================= LANE G — tema ======================= */
// Tiap tema tampil di TIGA layar, bukan cuma beranda: maskot, logo header, tombol,
// kotak tujuan, node, dan gradien skor semuanya ikut. Momo tidak muncul di sini.
export const TemaYuki = () => Main(THEMES.yuki, 'yuki');
export const TemaYukiLevel = () => LevelHub(THEMES.yuki, 'yuki');
export const TemaYukiHasil = () => ResultSempurna(THEMES.yuki, 'yuki');
export const TemaLuna = () => Main(THEMES.luna, 'luna');
export const TemaLunaLevel = () => LevelHub(THEMES.luna, 'luna');
export const TemaLunaHasil = () => ResultSempurna(THEMES.luna, 'luna');

/* Mode gelap mobile — palet gelap cuma varian tema, jadi layar yang sudah menerima
   parameter tema langsung bisa dipakai tanpa markup baru. */
export const GelapMomo = () => Main(THEMES.momoDark, 'momo');
export const GelapMomoLevel = () => LevelHub(THEMES.momoDark, 'momo');
export const GelapYuki = () => Main(THEMES.yukiDark, 'yuki');
export const GelapYukiLevel = () => LevelHub(THEMES.yukiDark, 'yuki');
export const GelapLuna = () => Main(THEMES.lunaDark, 'luna');
export const GelapLunaLevel = () => LevelHub(THEMES.lunaDark, 'luna');

/* ======================= LANE H — desktop >=960px ======================= */

const sidebar = (active) => {
  const items = [['learn', 'Belajar'], ['exam', 'Ujian'], ['terms', 'Istilah'], ['friends', 'Teman'], ['rank', 'Peringkat'], ['profile', 'Profil']];
  return `<nav style="width:228px;flex:none;display:flex;flex-direction:column;gap:8px;padding:28px 16px;background:#fffafd;border-right:1px solid ${th.line};box-shadow:8px 0 28px -18px rgba(255,120,170,.45)">
  ${items.map(([k, l]) => {
    const on = k === active;
    return `<a style="display:flex;flex-direction:row;align-items:center;justify-content:flex-start;gap:12px;padding:12px 14px;border-radius:16px;font-size:13px;font-weight:700;text-decoration:none;color:${on ? th.pinkDeep : th.muted};${on ? `background:${th.pinkPale}` : ''}"><span style="width:36px;height:36px;display:grid;place-items:center;border-radius:12px;background:${th.pinkPaler}">${navIcon(k, 20)}</span>${l}</a>`;
  }).join('')}
</nav>`;
};

export const DesktopHome = () => doc({
  w: 1280, h: 900, theme: th, pad: false,
  body: `<div style="display:flex;height:100%;overflow:hidden">
  ${sidebar('learn')}
  <div style="flex:1;min-width:0;display:flex;flex-direction:column;overflow:hidden">
    ${header(th)}
    <main style="flex:1;overflow:hidden;padding:0 0 20px">
      <section style="display:flex;justify-content:space-between;align-items:center;gap:12px;padding:32px 30px 22px">
        <div>
          ${eyebrow('Ohayō, Kenshi')}
          <h1 lang="ja" style="font-family:'Noto Sans JP',sans-serif;font-size:34px;line-height:1.5;font-weight:700;margin:0">継続は力なり</h1>
          <p style="font-size:12.5px;color:${th.muted};margin:6px 0 8px;font-style:italic">Ketekunan itu sendiri adalah kekuatan. — pepatah Jepang</p>
          <p style="color:${th.muted};font-size:13px">13 bab · 152 level · dikerjakan sedikit demi sedikit.</p>
        </div>
        ${mascot('momo', 'idle', 140)}
      </section>
      <div style="display:flex;gap:16px;margin:0 30px 22px">
        <div style="flex:1;padding:18px 20px;border:1px solid ${th.line};background:linear-gradient(135deg,#fff,${th.pinkPaler});border-radius:26px;display:flex;justify-content:space-between;align-items:center;box-shadow:${th.shadow}">
          <div><b style="font:600 15px Fredoka,sans-serif">Hari ini</b><p style="margin:4px 0 10px;font-size:12px;color:${th.muted}">Satu kartu sekali duduk sudah cukup.</p>
          <div style="height:10px;width:220px;background:${th.pinkPale};border-radius:999px;overflow:hidden"><i style="display:block;height:100%;width:6%;border-radius:999px;background:linear-gradient(90deg,${th.pink},${th.pinkDeep} 55%,${th.gold})"></i></div></div>
          <span style="background:linear-gradient(135deg,${th.gold},${th.goldDeep});color:#7a4a15;font:700 12px Fredoka,sans-serif;padding:8px 14px;border-radius:999px">9 selesai</span>
        </div>
        <div style="flex:1;display:flex;align-items:center;gap:12px;padding:16px 18px;border:1px solid ${th.line};border-radius:26px;background:linear-gradient(135deg,#fff,${th.pinkPaler});box-shadow:${th.shadow}">
          <div style="flex:1"><b style="display:block;font:600 17px Fredoka,sans-serif;color:${th.pinkDeep}">Ujian Akhir</b><span style="font-size:12.5px;color:${th.muted}">Soal asli 2021–2026 · 125 butir tiap tahun</span></div>
          <span style="color:${th.pinkDeep}">${icon('chevron', 20)}</span>
        </div>
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center;padding:2px 30px 14px">
        <div><h2 style="font:600 22px Fredoka,sans-serif">Urutan belajar</h2><p style="margin:2px 0 0;font-size:12px;color:${th.muted}">Mulai dari martabat, berakhir di studi kasus</p></div>
      </div>
      <div style="padding:2px 30px;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px">
        ${SECTIONS.slice(0, 4).map((s, i) => `<div style="display:flex;align-items:center;gap:13px;padding:16px;border:1px solid ${th.line};background:#fff;border-radius:26px;box-shadow:${th.shadow};min-height:126px">
          <div style="width:52px;height:52px;border-radius:18px;background:linear-gradient(145deg,${th.pinkPale},${th.pink}55);display:grid;place-items:center;font-size:26px;flex:none">${s[3]}</div>
          <div style="flex:1;min-width:0">
            <small style="display:block;color:${th.muted}99;font-size:9px;letter-spacing:1.2px;font-weight:700">BAB ${s[0]}</small>
            <b style="display:block;font:600 17px Fredoka,sans-serif;margin:2px 0;font-family:'Noto Sans JP',Fredoka,sans-serif">${s[1]}</b>
            <span style="display:block;font-size:11.5px;color:${th.muted}">${s[2]}</span>
            <em style="display:block;font-size:10px;color:${th.muted}b3;font-style:normal;line-height:1.5;margin-top:2px">${s[6]}</em>
            <div style="height:6px;background:${th.pinkPale};border-radius:6px;margin-top:8px;overflow:hidden"><i style="display:block;height:100%;width:${Math.round((s[5] / s[4]) * 100)}%;background:linear-gradient(90deg,${th.pink},${th.gold})"></i></div>
          </div>
          <span style="color:${th.muted}80">${icon('chevron', 20)}</span>
        </div>`).join('')}
      </div>
    </main>
  </div>
</div>`,
});

export const DesktopMateri = () => doc({
  w: 1280, h: 900, theme: th, pad: false,
  body: `<div style="display:flex;height:100%;overflow:hidden">
  ${sidebar('learn')}
  <div style="flex:1;min-width:0;display:flex;flex-direction:column;overflow:hidden">
    ${header(th)}
    <main style="flex:1;overflow:hidden;padding:22px 52px 40px">
      <div style="display:flex;align-items:center;gap:12px;margin:0 0 16px;max-width:960px;margin-inline:auto">
        <a style="color:${th.muted};font-size:13px;font-weight:600">× Tutup</a>
        <div style="display:flex;gap:5px;flex:1">${[0, 1, 2, 3, 4].map(i => `<span style="height:8px;flex:1;border-radius:99px;background:${i === 1 ? th.pinkDeep : i < 1 ? '#ffabc5' : th.pinkPale}"></span>`).join('')}</div>
        ${langSwitch('furigana', th)}
      </div>
      <article style="max-width:960px;margin:0 auto;padding:42px 54px;background:#fff;border:1px solid ${th.line};border-radius:26px;box-shadow:${th.shadow};min-height:360px">
        <div style="text-align:center">
          <span style="display:block;font-weight:800;font-size:56px;margin:4px 0 10px">${ruby('尊厳', 'そんげん', { furi: th.furi })}</span>
          <div style="font-weight:700;color:${th.muted};margin-bottom:26px;font-size:18px">songen / martabat manusia</div>
        </div>
        <div style="max-width:34em;margin:0 auto">
          ${ja('尊厳[そんげん]は、その人[ひと]が生[う]まれながらに持[も]っている価値[かち]です。', { size: 20, lh: 2.2 })}
          <p style="margin-top:14px;font-size:17px;line-height:1.75;color:${th.muted};font-weight:600">Martabat adalah nilai yang dimiliki seseorang sejak lahir — tidak berkurang karena ia menua, sakit, atau membutuhkan bantuan penuh.</p>
        </div>
      </article>
      <div style="display:flex;gap:10px;margin:18px auto 0;max-width:960px">
        ${secondary('Kembali', th, 'flex:0 0 200px')}${primary(`Lanjut ${icon('chevron', 16)}`, th, 'flex:1')}
      </div>
    </main>
  </div>
</div>`,
});
