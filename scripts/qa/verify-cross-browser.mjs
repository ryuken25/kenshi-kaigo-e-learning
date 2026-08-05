// Verifikasi lintas-browser pakai Playwright: WebKit (mesin Safari/iOS — SATU-SATUNYA cara
// dapet bukti Safari di mesin ini), Firefox (Gecko), dan Chromium sebagai pembanding.
//
// Ini nutup lubang yang verify-furigana-headless.mjs nggak bisa: dia Chromium-only, jadi
// klaim "Safari matches Chrome" di CLAUDE.md selama ini nggak pernah diuji di Safari asli.
// Juga ngukur safe-area-inset-bottom, yang di Chromium selalu 0px.
//
// Jalan: node scripts/qa/verify-cross-browser.mjs [url]
// Default URL = produksi. Kasih argumen buat nguji build lokal.
// Playwright BUKAN dependency repo ini (sengaja — biar package.json nggak nambah beban).
// Dia diambil dari cache npx yang sudah ada di mesin. Set PLAYWRIGHT_PATH kalau lokasinya lain.
//
// PENTING: cache npx bisa berisi BEBERAPA versi playwright, dan tiap versi minta revisi browser
// yang beda (pw 1.41.1 -> webkit-1967, pw 1.43.1 -> webkit-1992). Kalau kita ambil versi yang
// revisi browsernya belum ke-download, WebKit & Firefox gagal launch padahal binary-nya ADA
// untuk versi lain. Jadi jangan ambil yang pertama ketemu — ambil yang revisinya cocok dengan
// isi ~/AppData/Local/ms-playwright.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const BROWSER_CACHE = process.env.PLAYWRIGHT_BROWSERS_PATH
  || path.join(os.homedir(), 'AppData', 'Local', 'ms-playwright');

function revisiTersedia(coreDir) {
  // Balikin jumlah engine (webkit+firefox) yang revisinya benar-benar ada di disk.
  try {
    const bj = JSON.parse(fs.readFileSync(path.join(coreDir, 'browsers.json'), 'utf8'));
    let ok = 0;
    for (const nama of ['webkit', 'firefox']) {
      const b = bj.browsers.find(x => x.name === nama);
      if (b && fs.existsSync(path.join(BROWSER_CACHE, `${nama}-${b.revision}`))) ok++;
    }
    return ok;
  } catch { return 0 }
}

function findPlaywright() {
  if (process.env.PLAYWRIGHT_PATH) return process.env.PLAYWRIGHT_PATH;
  const local = path.join(process.cwd(), 'node_modules', 'playwright');
  if (fs.existsSync(local)) return local;
  const npx = path.join(os.homedir(), 'AppData', 'Local', 'npm-cache', '_npx');
  if (!fs.existsSync(npx)) return null;
  const kandidat = [];
  for (const d of fs.readdirSync(npx)) {
    const p = path.join(npx, d, 'node_modules', 'playwright');
    const core = path.join(npx, d, 'node_modules', 'playwright-core');
    if (fs.existsSync(p)) kandidat.push({ p, skor: fs.existsSync(core) ? revisiTersedia(core) : 0 });
  }
  if (!kandidat.length) return null;
  kandidat.sort((a, b) => b.skor - a.skor); // yang browsernya paling lengkap menang
  return kandidat[0].p;
}

const pwPath = findPlaywright();
if (!pwPath) {
  // Exit 2 = "tidak mengukur apa-apa", sengaja dibedakan dari lulus(0) & gagal(1),
  // pola yang sama dengan verify-furigana-headless.mjs.
  console.error('Playwright tidak ditemukan. Jalankan `npx playwright@1.43.1 --version` dulu, atau set PLAYWRIGHT_PATH.');
  process.exit(2);
}
const pwMod = await import('file:///' + path.join(pwPath, 'index.js').replace(/\\/g, '/'));
// playwright itu CJS, jadi named export bisa undefined — ambil dari .default kalau perlu.
const pw = pwMod.webkit ? pwMod : (pwMod.default || {});
const { webkit, firefox, chromium } = pw;
if (!webkit || !firefox || !chromium) {
  console.error('Engine playwright tidak terbaca dari ' + pwPath + ' (export: ' + Object.keys(pwMod).join(',') + ')');
  process.exit(2);
}

const URL_BASE = process.argv[2] || 'https://kaigo-kitty.vercel.app';

// Lebar CSS device target user + batas bawah/atas.
const VIEWPORTS = [
  { w: 320, h: 568, label: 'SE lama', mobile: true },
  { w: 360, h: 800, label: 'Android umum', mobile: true },
  { w: 402, h: 874, label: 'iPhone 17', mobile: true },
  { w: 444, h: 986, label: 'Poco F6', mobile: true },
  { w: 768, h: 1024, label: 'tablet', mobile: false },
  { w: 1280, h: 800, label: 'laptop', mobile: false },
  { w: 1920, h: 1080, label: 'desktop 1080p', mobile: false },
];

// Halaman yang mewakili tiap permukaan. Route param dipilih yang PASTI ada.
const ROUTES = ['/', '/glossary', '/final', '/final/2026', '/final/2026/part/1',
  '/section/1', '/section/1/level/1', '/section/1/level/1/materi',
  '/section/1/level/1/quiz', '/profile', '/login'];

// Dijalankan di dalam halaman. Cari luber horizontal + ruby rusak + safe-area.
//
// PENTING — dua kelas FALSE POSITIVE yang sudah kejadian dan sengaja dikecualikan:
// 1. Kontainer yang memang bisa di-scroll horizontal (.glossaryChips itu overflow-x:auto,
//    scrollWidth 1377 vs client 324 — strip chip yang niatnya digeser). Anak yang "keluar"
//    dari induk begitu BUKAN bug; itu justru cara kerjanya. Jadi elemen yang punya leluhur
//    scrollable-x dilewati.
// 2. Dekorasi position:absolute (.sparkle di mascot) yang keluar dari kotak induk secara
//    sengaja tapi TIDAK bikin scrollbar halaman. Diukur ke viewport, bukan ke induk.
// Patokan paling jujur: html.scrollWidth > html.clientWidth. Kalau itu false, halaman
// benar-benar tidak bisa digeser ke samping, apa pun kata bounding box tiap elemen.
const PROBE = `(()=>{
  const vw=document.documentElement.clientWidth, out=[], seen=new Set();
  const name=el=>{const c=(el.className&&typeof el.className==='string')?'.'+el.className.trim().split(/\\s+/).slice(0,2).join('.'):el.tagName.toLowerCase();
    const p=el.parentElement, pc=(p&&p.className&&typeof p.className==='string')?'.'+p.className.trim().split(/\\s+/)[0]:(p?p.tagName.toLowerCase():'');
    return pc?pc+' > '+c:c};
  const dalamScroller=el=>{for(let p=el.parentElement;p&&p!==document.body;p=p.parentElement){
    const o=getComputedStyle(p).overflowX; if(o==='auto'||o==='scroll')return true} return false};
  document.querySelectorAll('body *').forEach(el=>{
    const r=el.getBoundingClientRect(); if(r.width===0&&r.height===0)return;
    if(dalamScroller(el))return;                       // strip yang memang digeser
    const cs=getComputedStyle(el);
    if(cs.position==='absolute'||cs.position==='fixed')return;  // dekorasi
    if(r.right>vw+1){const k='vp:'+name(el); if(!seen.has(k)){seen.add(k);out.push({kind:'keluar-viewport',sel:name(el),right:+r.right.toFixed(1),lim:vw,over:+(r.right-vw).toFixed(1)})}}
    const p=el.parentElement; if(p){const pr=p.getBoundingClientRect();
      if(pr.width>0&&r.right>pr.right+1){const k='pa:'+name(el); if(!seen.has(k)){seen.add(k);out.push({kind:'lewat-induk',sel:name(el),right:+r.right.toFixed(1),lim:+pr.right.toFixed(1),over:+(r.right-pr.right).toFixed(1)})}}}
  });
  const ruby=[];
  document.querySelectorAll('ruby.fg-ruby').forEach(el=>{
    const rb=el.querySelector('.fg-rb'), rt=el.querySelector('.fg-rt'); if(!rb||!rt)return;
    const a=rb.getBoundingClientRect(), b=rt.getBoundingClientRect();
    if(b.bottom>a.top+1)ruby.push({why:'bacaan tidak di atas base',t:rb.textContent});
    if(Math.abs((a.left+a.right)/2-(b.left+b.right)/2)>2)ruby.push({why:'pusat tidak sejajar',t:rb.textContent});
  });
  const leak=(document.body.innerText.match(/[\\u4e00-\\u9fff]\\[[\\u3040-\\u309f]+\\]/g)||[]).slice(0,3);
  const rawRuby=document.body.innerText.includes('<ruby')||document.body.innerText.includes('<rt>');
  const nav=document.querySelector('nav');
  const cs=nav?getComputedStyle(nav):null;
  const html=document.documentElement;
  return JSON.stringify({vw,overflow:out.slice(0,8),ruby:ruby.slice(0,5),rubyCount:document.querySelectorAll('ruby.fg-ruby').length,
    leak,rawRuby,
    scrollbarHorizontal:html.scrollWidth>html.clientWidth+1,
    scrollW:html.scrollWidth,clientW:html.clientWidth,
    navPadBottom:cs?cs.paddingBottom:null,
    bodyText:document.body.innerText.trim().length});
})()`;

const engines = [['webkit', webkit], ['firefox', firefox], ['chromium', chromium]];
let totalFail = 0, totalBlank = 0, enginesRun = 0;

for (const [engName, engine] of engines) {
  let browser;
  try { browser = await engine.launch(); }
  catch (e) { console.log(`\n### ${engName.toUpperCase()} — GAGAL LAUNCH: ${e.message.slice(0, 90)}`); continue }
  enginesRun++;
  console.log(`\n### ${engName.toUpperCase()} (${browser.version()})`);

  for (const vp of VIEWPORTS) {
    const ctx = await browser.newContext({ viewport: { width: vp.w, height: vp.h }, isMobile: false, deviceScaleFactor: 1 });
    const page = await ctx.newPage();
    let bad = 0, blank = 0, rubyTotal = 0, detail = [];
    for (const route of ROUTES) {
      try {
        await page.goto(URL_BASE + route, { waitUntil: 'networkidle', timeout: 45000 });
        await page.waitForTimeout(350);
        const d = JSON.parse(await page.evaluate(PROBE));
        rubyTotal += d.rubyCount;
        if (d.bodyText < 40) { blank++; detail.push(`${route}: HALAMAN KOSONG (${d.bodyText} char)`) }
        if (d.rawRuby) { bad++; detail.push(`${route}: tag <ruby> mentah kelihatan sebagai teks`) }
        if (d.leak.length) { bad++; detail.push(`${route}: bracket bocor -> ${d.leak.join(' ')}`) }
        // Ini patokan paling jujur: halaman benar-benar bisa digeser ke samping.
        if (d.scrollbarHorizontal) { bad++; detail.push(`${route}: HALAMAN BISA DIGESER SAMPING (${d.scrollW} > ${d.clientW})`) }
        d.overflow.forEach(o => { bad++; if (detail.length < 10) detail.push(`${route}: ${o.kind} ${o.sel} +${o.over}px`) });
        d.ruby.forEach(r => { bad++; if (detail.length < 10) detail.push(`${route}: ruby ${r.why} (${r.t})`) });
      } catch (e) { bad++; detail.push(`${route}: ERROR ${e.message.split('\n')[0].slice(0, 60)}`) }
    }
    totalFail += bad; totalBlank += blank;
    const st = (bad || blank) ? 'GAGAL' : 'LULUS';
    console.log(`  ${String(vp.w).padStart(5)}px ${vp.label.padEnd(14)} masalah=${String(bad).padStart(3)} kosong=${blank} ruby=${String(rubyTotal).padStart(4)} ${st}`);
    detail.slice(0, 6).forEach(d => console.log(`         ${d}`));
    await ctx.close();
  }
  await browser.close();
}

// "Nol engine jalan" TIDAK BOLEH kelihatan seperti lulus — itu pelajaran dari gate furigana
// yang dulu lulus palsu. Exit 2 = tidak mengukur apa-apa.
if (!enginesRun) {
  console.error('\nGAGAL DIUKUR — nol engine berhasil dijalankan. Jalankan `npx playwright@1.43.1 install` dulu.');
  process.exit(2);
}
console.log(`\n${(totalFail || totalBlank) ? 'GAGAL' : 'LULUS'} — ${enginesRun}/3 engine, total masalah=${totalFail}, halaman kosong=${totalBlank}`);
process.exit((totalFail || totalBlank) ? 1 : 0);
