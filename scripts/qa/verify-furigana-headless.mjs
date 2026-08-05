/* verify-furigana-headless.mjs
 *
 * Versi headless dari scripts/qa/verify-furigana.js (yang manual, di-paste ke console
 * 4 browser). Yang manual TETAP dipakai sebagai bukti lintas-browser — file ini bukan
 * penggantinya, tapi supaya assertion yang sama bisa jalan di `npm run` tiap saat.
 *
 *   node scripts/qa/verify-furigana-headless.mjs            # CSS statis saja (selalu jalan)
 *   node scripts/qa/verify-furigana-headless.mjs --measure   # + ukur kotak glyph via Chrome CDP
 *
 * DUA LAPIS:
 *   LAPIS 1 (statis, tanpa browser) — parse src/routing.css + src/styles.css pakai postcss,
 *     assert kontrak layout yang bikin furigana rusak 3x: rt tidak absolute, tidak ada
 *     ruby-position, .fg-ruby column-reverse, mode kanji menyembunyikan bacaan (display:none
 *     ATAU visibility:hidden — user memilih display:none supaya mode 漢字 rapat).
 *   LAPIS 2 (--measure) — render markup furigana di Chrome headless yang SUDAH ada di mesin
 *     ini via CDP (Node 24 punya WebSocket bawaan, jadi nol dependensi baru; puppeteer /
 *     playwright TIDAK dipasang karena butuh download browser ratusan MB = keputusan user).
 *     Di sini baru bisa cek posisi sungguhan: rt di atas rb, pusat sejajar, rt tidak tabrakan,
 *     font tidak terlalu kecil, kanji tidak melar.
 *
 * Exit code: 0 lulus, 1 ada pelanggaran, 2 tidak bisa menjalankan pengukuran (mis. Chrome
 * tidak ketemu saat --measure) — 2 sengaja dibedakan supaya "tidak terverifikasi" tidak
 * pernah terbaca sebagai "lulus".
 */
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawn } from 'node:child_process';
import postcss from 'postcss';

const ROOT = path.resolve(import.meta.dirname, '../..');
const CENTER_TOL = 3;   // px, sama seperti versi manual
const OVERLAP_TOL = 1;  // px
const MIN_RT_PX = 13;   // .fg-rt = max(13px,.55em) di routing.css (dinaikkan dari 11px demi keterbacaan)
const wantMeasure = process.argv.includes('--measure');
const fails = [];
const notes = [];
const fail = (layer, msg) => fails.push(`[${layer}] ${msg}`);

// ---------------------------------------------------------------- LAPIS 1: CSS statis
const cssFiles = ['src/routing.css', 'src/styles.css', 'src/translation.css'].filter(f => fs.existsSync(path.join(ROOT, f)));
if (!cssFiles.length) fail('css', 'tidak ada file CSS yang ditemukan — path berubah?');

// Kumpulkan semua deklarasi jadi daftar {selector, prop, value, file, line} biar bisa di-query.
const decls = [];
for (const f of cssFiles) {
  const root = postcss.parse(fs.readFileSync(path.join(ROOT, f), 'utf8'), { from: f });
  root.walkDecls(d => {
    const rule = d.parent;
    if (rule.type !== 'rule') return;
    for (const sel of rule.selectors) decls.push({ sel, prop: d.prop.toLowerCase(), value: d.value.toLowerCase(), important: d.important, file: f, line: d.source?.start?.line ?? 0 });
  });
}
notes.push(`CSS diparse: ${cssFiles.join(', ')} (${decls.length} deklarasi)`);

const where = (fn) => decls.filter(fn);
// Selector yang menyasar bacaan (rt), tapi abaikan reset defensif seperti
// `.fg rt:not(.fg-rt){position:static}` yang justru MEMAKSA tidak-absolute.
const targetsReading = (sel) => /(^|[\s,>+~])rt\b/.test(sel) || sel.includes('.fg-rt');

// (a) rt TIDAK BOLEH position:absolute/fixed — ini akar bug "bacaan menumpuk di pojok".
for (const d of where(x => targetsReading(x.sel) && x.prop === 'position' && /absolute|fixed/.test(x.value)))
  fail('css', `${d.file}:${d.line} — '${d.sel}' set position:${d.value} pada bacaan (harus static/relative)`);

// (b) ruby-position / -webkit-ruby-position dilarang: kita pakai flex, bukan ruby native.
for (const d of where(x => x.prop.includes('ruby-position')))
  fail('css', `${d.file}:${d.line} — '${d.sel}' pakai ${d.prop} (layout ini flex, bukan ruby native)`);

// (c) .fg-ruby wajib inline-flex + column-reverse (DOM: rb dulu, rt sesudahnya).
const rubyRule = where(x => x.sel === '.fg-ruby');
const dirDecl = rubyRule.filter(x => x.prop === 'flex-direction' || x.prop === 'flex-flow');
const dispDecl = rubyRule.filter(x => x.prop === 'display');
if (!dispDecl.some(x => x.value.includes('flex'))) fail('css', `.fg-ruby tidak display:*flex (dapat: ${dispDecl.map(x => x.value).join('/') || 'tidak ada'})`);
if (!dirDecl.some(x => x.value.includes('column-reverse'))) fail('css', `.fg-ruby bukan column-reverse (dapat: ${dirDecl.map(x => x.value).join('/') || 'tidak ada'}) — bacaan akan tampil DI BAWAH kanji`);
if (!rubyRule.some(x => x.prop === 'align-items' && x.value.includes('center'))) fail('css', '.fg-ruby tanpa align-items:center — pusat rt/rb tidak akan sejajar');

// (d) mode kanji WAJIB menyembunyikan bacaan. Cara menyembunyikannya adalah keputusan produk:
//     - display:none  -> mode 漢字 rapat (79px), TAPI toggle 漢字⇄ふり menggeser teks ~9px/baris.
//     - visibility:hidden -> tinggi kedua mode sama (87.8px), toggle tidak menggeser, tapi
//       mode 漢字 menyisakan ruang kosong di atas tiap baris.
//     User memilih display:none (mode 漢字 rapat) — jadi gate ini TIDAK LAGI menolaknya.
//     Yang tetap dijaga: harus ada aturan yang menyembunyikan, dan cuma boleh salah satu dari
//     dua cara itu (bukan opacity:0 / font-size:0 / color:transparent yang menyisakan artefak).
const kanjiHide = where(x => x.sel.includes('[data-mode="kanji"]') && targetsReading(x.sel));
if (!kanjiHide.length) fail('css', 'tidak ada aturan menyembunyikan .fg-rt di [data-mode="kanji"]');
const caraSah = kanjiHide.some(x => (x.prop === 'display' && x.value === 'none')
                                 || (x.prop === 'visibility' && x.value === 'hidden'));
if (kanjiHide.length && !caraSah)
  fail('css', 'mode kanji menyembunyikan bacaan dengan cara tak sah (harus display:none atau visibility:hidden)');

// (e) order:1/2 dilarang — urutan visual harus dari column-reverse, bukan tambal per-anak.
for (const d of where(x => (x.sel.includes('.fg-rt') || x.sel.includes('.fg-rb')) && x.prop === 'order'))
  fail('css', `${d.file}:${d.line} — '${d.sel}' pakai order:${d.value} (urutan sudah dari column-reverse)`);

// (f) .fg-rt & .fg-rb harus block/nowrap: kalau inline, bacaan bisa putus di tengah kata.
for (const cls of ['.fg-rt', '.fg-rb']) {
  const r = where(x => x.sel === cls);
  if (!r.length) { fail('css', `${cls} tidak punya aturan sama sekali`); continue; }
  if (!r.some(x => x.prop === 'white-space' && /nowrap/.test(x.value))) fail('css', `${cls} tanpa white-space:nowrap — bacaan bisa terputus`);
  if (!r.some(x => x.prop === 'display' && /block/.test(x.value))) fail('css', `${cls} tanpa display:block`);
}
// Font bacaan tidak boleh lebih kecil dari MIN_RT_PX; pola yang dipakai `max(11px,.55em)`.
const rtSize = where(x => x.sel === '.fg-rt' && x.prop === 'font-size');
if (!rtSize.length) fail('css', '.fg-rt tanpa font-size eksplisit');
for (const d of rtSize) {
  const m = d.value.match(/max\(\s*([\d.]+)px/);
  if (m && parseFloat(m[1]) < MIN_RT_PX) fail('css', `${d.file}:${d.line} — .fg-rt font-size floor ${m[1]}px < ${MIN_RT_PX}px`);
  else if (!m && /^[\d.]+px$/.test(d.value) && parseFloat(d.value) < MIN_RT_PX) fail('css', `${d.file}:${d.line} — .fg-rt font-size ${d.value} < ${MIN_RT_PX}px`);
}

// ---------------------------------------------------- LAPIS 2: pengukuran nyata via CDP
// Halaman uji dibangun sendiri (bukan `vite preview`): kita hanya perlu markup furigana +
// CSS asli, dan itu menghindari ketergantungan pada dev server / auth / DB.
//
// SAMPLES bukan lagi pilihan tangan. Grup 2 & 3 diambil dari audit 510 pasang ruby unik di
// src/furigana.generated.js (base terpanjang, dan rasio kana:kanji terburuk) — dua dimensi
// itulah yang benar-benar mematahkan layout ruby, dan sebelumnya TIDAK ADA yang terukur:
// token terpanjang di daftar lama cuma 認知症 (3 kanji), padahal konten memuat token 8 kanji.
const SAMPLES = [
  // --- Grup 1: token umum, ukuran "normal" (daftar asli, tetap dipertahankan) ---
  ['尊厳', 'そんげん'], ['介護', 'かいご'], ['自己決定', 'じこけってい'], ['利用者', 'りようしゃ'],
  ['身体', 'しんたい'], ['清潔', 'せいけつ'], ['嚥下', 'えんげ'], ['口腔', 'こうくう'],
  ['移乗', 'いじょう'], ['排泄', 'はいせつ'], ['認知症', 'にんちしょう'],
  // base non-CJK dengan bacaan kana — SENGAJA, buat menguji base yang lebih sempit dari
  // bacaannya karena skrip Latin, bukan salah tulis dari 医療.
  ['medical', 'いりょう'],

  // --- Grup 2: base TERPANJANG yang nyata ada di konten (src/furigana.generated.js) ---
  // Ini kasus overflow horizontal: .fg-rt & .fg-ruby dua-duanya white-space:nowrap, jadi
  // token selebar ini TIDAK BISA pecah baris dan wajib tetap muat di viewport 360px.
  ['前頭側頭型認知症', 'ぜんとうそくとうがたにんちしょう'], // 8 kanji / 16 kana — terpanjang di seluruh konten
  ['経鼻経管栄養', 'けいびけいかんえいよう'],                 // 6 kanji / 11 kana
  ['骨粗鬆症', 'こつそしょうしょう'],                        // 4 kanji / 9 kana
  ['残存機能', 'ざんぞんきのう'],
  ['自己覚知', 'じこかくち'],
  ['最小限', 'さいしょうげん'], ['白内障', 'はくないしょう'], ['見当識', 'けんとうしき'],
  // 清拭 & 見当識 = kandidat REGRESI, bukan cuma uji panjang. Pernah ada kelas bug di mana
  // kuromoji mengembalikan kanji sebagai "bacaan" (`拭[拭]`, `識[識]`) — isi bracket yang
  // bukan kana tidak match RUBY_RE di src/Furigana.jsx, jadi bracket-nya bocor literal ke
  // layar alih-alih jadi ruby. Sudah diperbaiki di sisi generator. Kalau regresi itu kembali,
  // di sini kelihatan sebagai pelanggaran `markup` (base tanpa <rt>), bukan cuma layout.
  ['清拭', 'せいしき'],

  // --- Grup 3: rasio kana:kanji terburuk — bacaan jauh lebih lebar dari basenya ---
  // Di sinilah ruby melar / bacaan tabrakan. Semuanya nyata ada di konten, rasio 3.00x:
  ['考', 'かんが'], ['最', 'もっと'], ['行', 'おこな'], ['疑', 'うたが'],
  ['省略', 'しょうりゃく'], ['収集', 'しゅうしゅう'],

  // --- Grup 4: rasio EKSTREM, semata-mata fixture LAYOUT ---
  // Rasio terburuk yang dulu ada di konten adalah 柵[しがらみ] = 4.00x, tapi bacaan itu SALAH
  // untuk konteks 介護 dan sudah diganti jadi 柵[さく] oleh audit bacaan. Jadi 柵[しがらみ]
  // TIDAK dipakai di sini: fixture uji tidak boleh memuat bacaan yang sudah dinyatakan salah,
  // karena orang berikutnya akan "membetulkannya" jadi 2.00x dan cakupan rasio ekstrem hilang
  // tanpa ada yang sadar.
  //
  // Sesudah koreksi itu, rasio terburuk yang NYATA di konten = 3.00x (grup 3, semuanya sudah
  // terukur di atas). Dua pasangan di bawah bacaannya benar dan dipakai murni sebagai headroom
  // layout — supaya kalau nanti ada istilah baru dengan rasio 4-5x masuk ke konten, kita sudah
  // tahu lebih dulu bahwa layout-nya sanggup. Ini BUKAN klaim bahwa keduanya ada di konten.
  ['志', 'こころざし'],   // 1 kanji / 4 kana = 4.00x — setara worst case konten sebelum koreksi 柵
  ['承', 'うけたまわ'],   // 1 kanji / 5 kana = 5.00x — melampaui apapun yang ada di konten

  // --- Grup 5: worst case GLOSSARY, yang dirender di varian xl (38-56px) ---
  // src/main.jsx:249 termField() membungkus tiap istilah pure-kanji jadi `kanji[reading]`,
  // lalu main.jsx:269/277 merendernya dengan variant="xl". Jadi token panjang di glossary
  // TIDAK cuma tampil di ukuran body — dia tampil di font terbesar yang ada di app.
  // Ini pasangan pure-kanji terpanjang dari 79 istilah pure-kanji di glossary.json.
  ['障害者総合支援法', 'しょうがいしゃそうごうしえんほう'], // 8 kanji / 16 kana
  ['若年性認知症', 'じゃくねんせいにんちしょう'],
  ['介護支援専門員', 'かいごしえんせんもんいん'],
  ['統合失調症', 'とうごうしっちょうしょう'],
];

// Token yang ditempel berdempetan, dipisah paling banyak satu kana okurigana. Ini bentuk
// yang sebenarnya muncul di konten (15.276 kemunculan ruby yang berjarak 0-1 kana di
// src/furigana.generated.js), sementara blok utama merangkai token pakai `、` yang memberi
// jeda lebar. Tanpa blok ini, cek tabrakan nyaris tidak ada artinya: `、` sendiri sudah
// cukup lebar untuk memisahkan bacaan sepanjang apapun.
const DENSE = [
  ['考', 'かんが'], ['行', 'おこな'], ['最', 'もっと'], ['疑', 'うたが'], ['志', 'こころざし'], ['承', 'うけたまわ'],
];

// Token terpanjang dipasang ulang di DUA container NYATA dari app, bukan cuma di <div> polos
// selebar body. Ini penting karena container asli JAUH lebih sempit dan font-nya JAUH lebih
// besar dari yang diasumsikan blok sintetis di atas:
//   .termSheet    → routing.css:43 `width:min(640px,100%)` + padding 22px, dan
//                   `.termSheet h2{font:700 48px Fredoka}` MENIMPA clamp() milik .fg--xl,
//                   jadi base terkunci 48px berapapun lebar layarnya.
//   .japaneseTerm → styles.css:211 `font-size:clamp(34px,10vw,50px)` di <=600px dan
//                   styles.css:219 `font-size:60px` di >=960px.
// Tanpa blok ini, pengukuran understate masalahnya: token yang sama terbaca 333.6px di
// container sintetis tapi 421.3px di .termSheet yang sesungguhnya.
const REAL_CONTEXTS = [
  ['障害者総合支援法', 'しょうがいしゃそうごうしえんほう'],
  ['前頭側頭型認知症', 'ぜんとうそくとうがたにんちしょう'],
  ['介護支援専門員', 'かいごしえんせんもんいん'],
  ['若年性認知症', 'じゃくねんせいにんちしょう'],
];
function buildTestHtml() {
  const css = cssFiles.map(f => fs.readFileSync(path.join(ROOT, f), 'utf8')).join('\n');
  const ruby = ([b, r]) => `<ruby class="fg-ruby"><span class="fg-rb">${b}</span><rt class="fg-rt">${r}</rt></ruby>`;
  const tokens = SAMPLES.map(ruby).join('、');
  // okurigana satu kana di antara token — persis pola `考[かんが]え行[おこな]う` di konten.
  const dense = DENSE.map(ruby).join('え') + 'う' + DENSE.map(ruby).join('');
  // Semua varian ukuran diuji: .fg--opt (kecil, dipakai di pilihan jawaban) sampai .fg--xl
  // (judul besar) — di sanalah bug melar/tabrakan biasanya muncul, bukan di ukuran default.
  const variants = ['', 'fg--opt', 'fg--tight', 'fg--lg', 'fg--xl'];
  const blocks = variants.map(v => `<div class="fg ${v} kkProbe" lang="ja" data-mode="furigana" data-variant="${v || 'default'}">${tokens}</div>`).join('\n')
    + '\n' + variants.map(v => `<div class="fg ${v} kkProbe" lang="ja" data-mode="furigana" data-variant="dense:${v || 'default'}">${dense}</div>`).join('\n')
    // Struktur di bawah menyalin markup asli main.jsx:269 (term sheet) & main.jsx:277 +
    // main.jsx:281 (istilah di kartu materi). Kalau markup di main.jsx berubah, samakan di sini.
    + '\n' + REAL_CONTEXTS.map(t => `<div class="termSheetBackdrop"><section class="termSheet"><h2 class="fg fg--xl kkProbe" lang="ja" data-mode="furigana" data-variant="real:termSheet-h2">${ruby(t)}</h2></section></div>`).join('\n')
    + '\n<main class="page richMateriPage"><div class="richMateriCard">'
    + REAL_CONTEXTS.map(t => `<span class="fg fg--xl japaneseTerm kkProbe" lang="ja" data-mode="furigana" data-variant="real:japaneseTerm">${ruby(t)}</span>`).join('\n')
    + '</div></main>'
    // .detailHero h1 (halaman detail glossary, GlossaryPage.jsx). Kontainer ini DULU tidak diukur,
    // dan itu sebabnya trap `font:` shorthand di sini lolos padahal pola yang sama sudah difix di
    // .termSheet h2 — luber ~136px di 320px tanpa ada satu gate pun yang gagal.
    + '\n<main class="page glossaryDetail"><section class="detailHero">'
    + REAL_CONTEXTS.map(t => `<h1 class="fg fg--xl kkProbe" lang="ja" data-mode="furigana" data-variant="real:detailHero-h1">${ruby(t)}</h1>`).join('\n')
    + '</section></main>';
  // Blok mode kanji dipakai membandingkan tinggi baris (harus sama — visibility, bukan display:none).
  //
  // <meta name="viewport"> WAJIB ada dan harus sama dengan index.html. Tanpa itu, Chrome
  // dengan Emulation.setDeviceMetricsOverride({mobile:true}) memakai layout viewport fallback
  // ~980px, jadi pengukuran "360px" sebenarnya diukur pada lebar desktop — clamp() berbasis vw
  // ikut salah dan seluruh uji mobile jadi tidak ada artinya. Sudah terverifikasi: sebelum meta
  // ini ditambahkan, token terlebar di "360px" terbaca 491.6px dengan induk selebar 948px,
  // yaitu ANGKA YANG SAMA dengan hasil 1280px.
  return `<!doctype html><html lang="id"><head><meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0,viewport-fit=cover">
  <style>${css}
  body{margin:0;padding:16px;font-family:system-ui,sans-serif}</style></head><body>
  <div class="app"><div id="furi">${blocks}</div>
  <div id="kanji" class="fg" lang="ja" data-mode="kanji">${tokens}</div>
  <div id="kanjiRef" class="fg" lang="ja" data-mode="furigana">${tokens}</div></div>
  </body></html>`;
}

// Fungsi pengukur ini di-stringify dan dieval di dalam browser. Assertion-nya SAMA
// dengan versi manual: urutan, pusat, tabrakan, ukuran, melar, markup.
function browserProbe(CENTER_TOL, OVERLAP_TOL, MIN_RT_PX) {
  const out = { checked: 0, order: [], center: [], overlap: [], size: [], stretch: [], markup: [], overflow: [], minRt: Infinity, heights: {}, widest: null };
  const blocks = [...document.querySelectorAll('#furi .kkProbe')];
  if (!blocks.length) { out.markup.push('tidak ada blok uji .kkProbe'); return out; }
  // Batas overflow horizontal: .fg-rt DAN .fg-ruby dua-duanya white-space:nowrap di
  // routing.css, jadi satu token tidak bisa pecah baris sama sekali. Token yang lebih lebar
  // dari kotak induknya akan terpotong / memaksa scroll horizontal — dan justru token
  // TERPANJANG-lah yang paling mungkin kena, di viewport paling sempit.
  const viewport = document.documentElement.clientWidth;
  for (const scope of blocks) {
    const vlabel = scope.dataset.variant;
    const scopeBox = scope.getBoundingClientRect();
    const rubies = [...scope.querySelectorAll('ruby')];
    if (!rubies.length) { out.markup.push(vlabel + ' — tidak ada <ruby>'); continue; }
    const rtBoxes = [];
    for (const ruby of rubies) {
      const rt = ruby.querySelector('rt'), rb = ruby.querySelector('.fg-rb') || ruby.querySelector('rb');
      if (!rt) { out.markup.push(vlabel + ' ' + (ruby.textContent || '').slice(0, 12) + ' — tidak punya <rt>'); continue; }
      if (!rb) { out.markup.push(vlabel + ' ' + (ruby.textContent || '').slice(0, 12) + ' — base bukan .fg-rb'); continue; }
      if (!rt.classList.contains('fg-rt')) out.markup.push(vlabel + ' ' + rb.textContent + ' — <rt> tanpa class fg-rt');
      if (!ruby.classList.contains('fg-ruby')) out.markup.push(vlabel + ' ' + rb.textContent + ' — <ruby> tanpa class fg-ruby');
      const rtB = rt.getBoundingClientRect(), rbB = rb.getBoundingClientRect();
      const label = vlabel + ' ' + rb.textContent + '[' + rt.textContent + ']';
      out.checked++;
      if (rtB.bottom > rbB.top + 2) out.order.push(label + ' — rt.bottom=' + rtB.bottom.toFixed(1) + ' > rb.top=' + rbB.top.toFixed(1));
      const dc = Math.abs((rtB.left + rtB.right) / 2 - (rbB.left + rbB.right) / 2);
      if (dc > CENTER_TOL) out.center.push(label + ' — geser ' + dc.toFixed(1) + 'px');
      const fs = parseFloat(getComputedStyle(rt).fontSize);
      if (fs < MIN_RT_PX) out.size.push(label + ' — ' + fs.toFixed(1) + 'px');
      if (fs < out.minRt) out.minRt = fs;
      const baseFs = parseFloat(getComputedStyle(rb).fontSize);
      const expected = rb.textContent.length * baseFs;
      if (rbB.width > expected * 1.25) out.stretch.push(label + ' — lebar ' + rbB.width.toFixed(1) + 'px, wajar ~' + expected.toFixed(1) + 'px');
      if (/absolute|fixed/.test(getComputedStyle(rt).position)) out.markup.push(label + ' — computed position:' + getComputedStyle(rt).position);
      // Token nowrap yang lebih lebar dari kotak induk = terpotong atau memaksa scroll.
      // Dibandingkan ke induk DAN ke viewport, karena keduanya bisa jadi pengekang, dan
      // dilaporkan terpisah: luber-dari-induk bisa masih terlihat (kalau induknya tidak
      // overflow:hidden), tapi keluar-viewport berarti glyph-nya benar-benar tidak terbaca.
      const tokenW = Math.max(rtB.width, rbB.width);
      const limit = Math.min(scopeBox.width, viewport);
      if (tokenW > limit + 1) out.overflow.push(label + ' — token ' + tokenW.toFixed(1) + 'px > muat ' + limit.toFixed(1) + 'px (induk ' + scopeBox.width.toFixed(1) + 'px, viewport ' + viewport + 'px, nowrap tidak bisa pecah baris)');
      if (Math.max(rtB.right, rbB.right) > viewport + 1 || Math.min(rtB.left, rbB.left) < -1) out.overflow.push(label + ' — KELUAR VIEWPORT: kanan ' + Math.max(rtB.right, rbB.right).toFixed(1) + 'px vs lebar ' + viewport + 'px');
      if (!out.widest || tokenW > out.widest.w) out.widest = { label: label, w: tokenW, limit: limit };
      rtBoxes.push({ label, box: rtB });
    }
    // tabrakan hanya dibandingkan DALAM satu blok/varian (antar blok memang beda baris)
    for (let i = 0; i < rtBoxes.length; i++) for (let j = i + 1; j < rtBoxes.length; j++) {
      const a = rtBoxes[i].box, b = rtBoxes[j].box;
      const ox = Math.min(a.right, b.right) - Math.max(a.left, b.left);
      const oy = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
      if (ox > OVERLAP_TOL && oy > OVERLAP_TOL) out.overlap.push(rtBoxes[i].label + ' x ' + rtBoxes[j].label + ' — tumpang ' + ox.toFixed(1) + 'x' + oy.toFixed(1) + 'px');
    }
  }
  // tinggi baris mode furigana vs kanji harus sama (visibility:hidden, bukan display:none)
  out.heights.furi = document.getElementById('kanjiRef').getBoundingClientRect().height;
  out.heights.kanji = document.getElementById('kanji').getBoundingClientRect().height;
  if (out.minRt === Infinity) out.minRt = null;
  return out;
}

function findChrome() {
  const c = [
    process.env.CHROME_PATH,
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
    'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    '/usr/bin/google-chrome', '/usr/bin/chromium', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  ].filter(Boolean);
  return c.find(p => { try { return fs.statSync(p).isFile(); } catch { return false; } }) || null;
}

// CDP minimal lewat WebSocket bawaan Node — cukup untuk load halaman + evaluate.
async function cdp(ws, method, params) {
  const id = ++cdp.seq;
  ws.send(JSON.stringify({ id, method, params: params || {} }));
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('CDP timeout: ' + method)), 20000);
    const on = (ev) => { const m = JSON.parse(ev.data); if (m.id !== id) return; clearTimeout(t); ws.removeEventListener('message', on); m.error ? reject(new Error(m.error.message)) : resolve(m.result); };
    ws.addEventListener('message', on);
  });
}
cdp.seq = 0;

async function measure(widths) {
  const bin = findChrome();
  if (!bin) return { skipped: 'Chrome/Edge tidak ditemukan (set CHROME_PATH untuk menunjuk manual)' };
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'kk-furi-'));
  const htmlPath = path.join(tmp, 'furi.html');
  fs.writeFileSync(htmlPath, buildTestHtml());
  const port = 9500 + Math.floor(Math.random() * 400);
  const proc = spawn(bin, [`--remote-debugging-port=${port}`, '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check', `--user-data-dir=${path.join(tmp, 'profile')}`, 'about:blank'], { stdio: 'ignore' });
  const results = {};
  try {
    let wsUrl = null;
    for (let i = 0; i < 60 && !wsUrl; i++) {
      try { wsUrl = (await (await fetch(`http://127.0.0.1:${port}/json/version`)).json()).webSocketDebuggerUrl; }
      catch { await new Promise(r => setTimeout(r, 250)); }
    }
    if (!wsUrl) return { skipped: `Chrome tidak merespons di port ${port}` };
    const ws = new WebSocket(wsUrl);
    await new Promise((res, rej) => { ws.addEventListener('open', res, { once: true }); ws.addEventListener('error', () => rej(new Error('WebSocket CDP gagal')), { once: true }); });
    const { targetId } = await cdp(ws, 'Target.createTarget', { url: 'about:blank' });
    const { sessionId } = await cdp(ws, 'Target.attachToTarget', { targetId, flatten: true });
    const send = async (method, params) => {
      const id = ++cdp.seq;
      ws.send(JSON.stringify({ sessionId, id, method, params: params || {} }));
      return new Promise((resolve, reject) => {
        const t = setTimeout(() => reject(new Error('CDP timeout: ' + method)), 20000);
        const on = (ev) => { const m = JSON.parse(ev.data); if (m.id !== id) return; clearTimeout(t); ws.removeEventListener('message', on); m.error ? reject(new Error(m.error.message)) : resolve(m.result); };
        ws.addEventListener('message', on);
      });
    };
    await send('Page.enable');
    const fileUrl = 'file:///' + htmlPath.replace(/\\/g, '/');
    for (const w of widths) {
      await send('Emulation.setDeviceMetricsOverride', { width: w, height: 900, deviceScaleFactor: 1, mobile: w < 500 });
      await send('Page.navigate', { url: fileUrl });
      await new Promise(r => setTimeout(r, 700)); // beri waktu layout + font
      const r = await send('Runtime.evaluate', {
        expression: `(${browserProbe.toString()})(${CENTER_TOL},${OVERLAP_TOL},${MIN_RT_PX})`,
        returnByValue: true, awaitPromise: false,
      });
      if (r.exceptionDetails) throw new Error('probe error: ' + JSON.stringify(r.exceptionDetails.exception?.description || r.exceptionDetails.text));
      results[w] = r.result.value;
    }
    ws.close();
  } finally {
    try { proc.kill(); } catch {}
    try { fs.rmSync(tmp, { recursive: true, force: true }); } catch {}
  }
  return { results };
}

// ------------------------------------------------------------------------------- lapor
console.log('=== VERIFIKASI FURIGANA (headless) ===');
const staticFailCount = fails.length;
console.log(`Lapis 1 — CSS statis : ${staticFailCount === 0 ? 'LULUS' : 'GAGAL (' + staticFailCount + ')'}`);
notes.forEach(n => console.log('  ' + n));

let measured = false, measureUnavailable = null, measuredWidths = [];
if (wantMeasure) {
  // 320px ikut diukur: itu lebar terkecil yang realistis (iPhone SE lama), dan beberapa bug
  // luber HANYA muncul di sana — di 360px kebetulan pas. Tanpa 320px, gate-nya bilang hijau
  // padahal glyph-nya kepotong senyap oleh .app{overflow-x:hidden}.
  // 402px = iPhone 17 (1206px fisik / DPR 3). 444px = Poco F6 (1220px / DPR 2.75).
  // 1920px = desktop 1080p. Lebar CSS, bukan piksel fisik — itu yang dipakai clamp() berbasis vw.
  const widths = [320, 360, 402, 444, 768, 1280, 1920]; // terkecil, mobile-first, iPhone 17, Poco F6, tablet, desktop, 1080p
  let m;
  try { m = await measure(widths); } catch (e) { m = { skipped: e.message }; }
  if (m.skipped) { measureUnavailable = m.skipped; }
  else {
    measured = true;
    measuredWidths = widths;
    for (const w of widths) {
      const r = m.results[w];
      if (!r) { fail('measure', `lebar ${w}px: tidak ada hasil`); continue; }
      const total = r.markup.length + r.order.length + r.center.length + r.overlap.length + r.size.length + r.stretch.length + r.overflow.length;
      console.log(`Lapis 2 — ukur ${String(w).padStart(4)}px: token=${r.checked} markup=${r.markup.length} urutan=${r.order.length} pusat=${r.center.length} tabrakan=${r.overlap.length} ukuran=${r.size.length} melar=${r.stretch.length} luber=${r.overflow.length} rtMin=${r.minRt ?? 'n/a'}px ${total === 0 ? 'LULUS' : 'GAGAL'}`);
      if (r.widest) console.log(`                       token terlebar: ${r.widest.label} = ${r.widest.w.toFixed(1)}px (batas muat ${r.widest.limit.toFixed(1)}px)`);
      // Maksimal 6 contoh per kategori supaya laporan tidak banjir, TAPI sisanya harus
      // disebut eksplisit — angka di baris ringkasan di atas tidak boleh berbeda dari
      // jumlah pelanggaran yang terbaca tanpa penjelasan.
      for (const k of ['markup', 'order', 'center', 'overlap', 'size', 'stretch', 'overflow']) {
        for (const msg of r[k].slice(0, 6)) fail(`measure ${w}px/${k}`, msg);
        if (r[k].length > 6) fail(`measure ${w}px/${k}`, `... dan ${r[k].length - 6} pelanggaran ${k} lain di lebar ini (total ${r[k].length})`);
      }
      // Selisih tinggi antar mode: DILAPORKAN, bukan digagalkan. Dulu ini fail karena mode 漢字
      // memakai visibility:hidden sehingga tinggi kedua mode identik. User memilih display:none
      // (mode 漢字 rapat) dan menerima konsekuensinya: teks bergeser saat toggle. Angkanya tetap
      // dicetak supaya kalau suatu saat geserannya jadi ekstrem, ketahuan dari output.
      const dh = Math.abs(r.heights.furi - r.heights.kanji);
      if (dh > 1) console.log(`  [info ${w}px] tinggi ふり ${r.heights.furi.toFixed(1)}px vs 漢字 ${r.heights.kanji.toFixed(1)}px — geser ${dh.toFixed(1)}px saat toggle (konsekuensi display:none yang dipilih)`);
    }
  }
} else {
  console.log('Lapis 2 — pengukuran : DILEWATI (jalankan dengan --measure)');
}

if (fails.length) {
  console.error('\n--- PELANGGARAN (' + fails.length + ') ---');
  fails.forEach(f => console.error('  ' + f));
}
if (measureUnavailable) {
  console.error(`\nTIDAK BISA MENGUKUR: ${measureUnavailable}`);
  console.error('Lapis 1 (CSS statis) ' + (staticFailCount === 0 ? 'lulus' : 'GAGAL') + ', tapi posisi glyph BELUM terverifikasi.');
  console.error('Bukti lintas-browser tetap wajib: paste scripts/qa/verify-furigana.js ke console iOS Safari / Chrome Android / Chrome desktop / Firefox.');
  process.exit(fails.length ? 1 : 2);
}
if (fails.length) process.exit(1);
console.log(`\nLULUS — CSS statis bersih${measured ? ` + posisi glyph terukur di ${measuredWidths.join('/')}px` : ' (posisi glyph belum diukur; pakai --measure)'}`);
