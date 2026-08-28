// Cek luber horizontal untuk elemen NON-ruby di lebar device nyata.
// Gate furigana cuma ngukur token ruby; bug kayak .sectionGrid (grid track minmax(auto,1fr))
// dan .materiTop lolos dari situ. Dipotong senyap oleh .app{overflow-x:hidden}, jadi mata
// nggak lihat, cuma glyph-nya ilang.
//
// Dijalankan: node scripts/qa/check-overflow.mjs
// Lebar: 320 (SE), 360 (android umum), 402 (iPhone 17), 444 (Poco F6), 768, 1280, 1920.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawn } from 'node:child_process';

const ROOT = process.cwd();
// themes.css & social.css ikut dibaca: sejak port kanvas v9 beranda memakai token
// --card/--accent (themes.css) dan sakelar .darkRow di sidebar (social.css). Tanpa
// keduanya elemen baru terukur dengan nilai fallback, bukan yang benar-benar tampil.
const CSS = ['src/styles.css', 'src/routing.css', 'src/translation.css', 'src/auth.css', 'src/themes.css', 'src/social.css']
  .filter(f => fs.existsSync(path.join(ROOT, f)))
  .map(f => fs.readFileSync(path.join(ROOT, f), 'utf8')).join('\n');

// Ikon bab/statistik dirender <Icon> sebagai <svg viewBox="0 0 32 32"> dengan atribut
// width/height dari JSX; CSS boleh menimpanya. Kotak kosong sudah cukup untuk diukur.
const svgBox = (n) => `<svg viewBox="0 0 32 32" width="${n}" height="${n}"></svg>`;
const SVG = svgBox(30), SVG26 = svgBox(26), SVG54 = svgBox(54);

// Markup dicopy dari JSX yang asli, dengan isi TERPANJANG yang benar-benar ada di data.
const HTML = `<!doctype html><html lang="id"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0,viewport-fit=cover">
<style>${CSS}</style></head><body><div class="app appHome">
<header><a class="brand"><span class="kitty"></span><span><b>kenshi kaigo e-learning</b><small>KAIGO FUKUSHISHI</small></span></a>
<div class="topStats"><span>🔥 12</span><span class="xpStat">⭐ 1240 XP</span></div></header>
<main class="page">
<div class="nightSky"><i class="nightStar" style="left:6%;top:8%;--r:1.4px;opacity:0.5"></i><i class="nightStar" style="left:12%;top:22%;--r:1px;opacity:0.35"></i><i class="nightStar" style="left:17%;top:5%;--r:1.8px;opacity:0.6"></i><i class="nightStar" style="left:21%;top:34%;--r:1.1px;opacity:0.3"></i><i class="nightStar" style="left:26%;top:12%;--r:1.3px;opacity:0.45"></i><i class="nightStar" style="left:31%;top:27%;--r:1px;opacity:0.3"></i><i class="nightStar" style="left:34%;top:6%;--r:1.6px;opacity:0.55"></i><i class="nightStar" style="left:39%;top:18%;--r:1.2px;opacity:0.4"></i><i class="nightStar" style="left:43%;top:31%;--r:1px;opacity:0.28"></i><i class="nightStar" style="left:47%;top:9%;--r:1.5px;opacity:0.5"></i><i class="nightStar" style="left:52%;top:24%;--r:1.1px;opacity:0.35"></i><i class="nightStar" style="left:56%;top:4%;--r:1.7px;opacity:0.6"></i><i class="nightStar" style="left:59%;top:16%;--r:1.2px;opacity:0.4"></i><i class="nightStar" style="left:63%;top:29%;--r:1px;opacity:0.3"></i><i class="nightStar" style="left:66%;top:8%;--r:1.4px;opacity:0.5"></i><i class="nightStar" style="left:70%;top:20%;--r:1.1px;opacity:0.35"></i><i class="nightStar" style="left:74%;top:33%;--r:1.3px;opacity:0.4"></i><i class="nightStar" style="left:77%;top:6%;--r:1.6px;opacity:0.55"></i><i class="nightStar" style="left:81%;top:26%;--r:1px;opacity:0.3"></i><i class="nightStar" style="left:85%;top:14%;--r:1.4px;opacity:0.45"></i><i class="nightStar" style="left:88%;top:30%;--r:1.1px;opacity:0.32"></i><i class="nightStar" style="left:91%;top:5%;--r:1.5px;opacity:0.5"></i><i class="nightStar" style="left:94%;top:21%;--r:1.2px;opacity:0.38"></i><i class="nightStar" style="left:97%;top:11%;--r:1px;opacity:0.3"></i><i class="nightPetal" style="left:22%;top:14%;width:13px;height:13px;transform:rotate(18deg)"></i><i class="nightPetal" style="left:33%;top:30%;width:10px;height:10px;transform:rotate(-24deg)"></i><i class="nightPetal" style="left:58%;top:11%;width:12px;height:12px;transform:rotate(40deg)"></i><i class="nightPetal" style="left:72%;top:26%;width:14px;height:14px;transform:rotate(-12deg)"></i><i class="nightPetal" style="left:83%;top:9%;width:10px;height:10px;transform:rotate(28deg)"></i><i class="nightPetal" style="left:46%;top:22%;width:11px;height:11px;transform:rotate(-38deg)"></i><i class="nightMoon"></i><i class="nightPagoda"></i></div>
<div class="homeTop"><span class="streakPill">🔥 12 hari berturut-turut</span></div>
<section class="welcome"><div><p class="eyebrow">OHAYŌ, KENSHI</p>
<h1 class="quoteJa" lang="ja">継続は力なり</h1><p class="quoteNote">Ketekunan itu sendiri adalah kekuatan. — pepatah Jepang</p>
<p class="muted">13 bab · 152 level · dikerjakan sedikit demi sedikit.</p></div>
<span class="homeHeroArt"><img alt=""></span></section>
<div class="homeCards">
  <div class="homeCard"><span class="homeCardArt">${SVG}</span>
    <div class="homeCardBody"><b>Hari ini</b><p>Satu kartu sekali duduk sudah cukup.</p>
      <div class="sectionRow"><div class="homeBar"><i style="width:66%"></i></div><b class="homeBarPct">66%</b></div></div>
    <span class="homeCardBadge">⭐<b>128 selesai</b></span></div>
  <a class="homeCard tap"><span class="homeCardArt">${SVG}</span>
    <div class="homeCardBody"><b>Ujian Akhir</b><p>Soal asli 2021–2026 · 125 butir tiap tahun</p></div>
    <span class="homeCardGo">›</span></a>
</div>
<div class="sectionHead"><div><h2>Urutan belajar</h2><p>Mulai dari martabat, berakhir di studi kasus</p></div>
<a class="roadmapBtn tap">📖 Lihat roadmap</a></div>
<div class="sectionGrid">
  <a class="sectionCard" style="--accent:#ff7bab"><span class="sectionIcon">${SVG54}</span><div class="sectionCopy"><small class="sectionBadge">BAB 01</small><b lang="ja">人間の尊厳と自立</b><span>Kenapa martabat jadi dasar tiap tindakan</span><em class="sectionDesc">Memahami martabat, hak asasi, dan kemandirian sebagai fondasi setiap tindakan perawatan.</em><div class="sectionRow"><div class="miniProgress"><i style="width:72%"></i></div><b class="sectionPct">72%</b></div></div><span class="sectionGo">›</span></a>
  <a class="sectionCard preview-only" style="--accent:#9d8bf0"><span class="previewPill">🔒 preview</span><span class="sectionIcon">${SVG54}</span><div class="sectionCopy"><small class="sectionBadge">BAB 02</small><b lang="ja">人間関係とコミュニケーション</b><span>Membangun kepercayaan lewat cara bicara</span><em class="sectionDesc">Melatih cara membangun hubungan dan menyampaikan maksud tanpa melukai.</em><div class="sectionRow"><div class="miniProgress"><i style="width:0%"></i></div><b class="sectionPct">0%</b></div></div><span class="sectionGo">›</span></a>
</div>
<section class="progressSummary"><h3 class="summaryHead">Ringkasan progres</h3>
<div class="statRow">
  <div class="statTile" style="--accent:#ff7bab"><span class="statTileArt">${SVG26}</span><div><p class="statTileNum">4<span class="statTileOf">/ 13</span></p><small class="statTileLabel">Bab selesai</small></div></div>
  <div class="statTile" style="--accent:#9d8bf0"><span class="statTileArt">${SVG26}</span><div><p class="statTileNum">128<span class="statTileOf">/ 152</span></p><small class="statTileLabel">Level selesai</small></div></div>
  <div class="statTile" style="--accent:#ffb84d"><span class="statTileArt">${SVG26}</span><div><p class="statTileNum">84<span class="statTileOf">%</span></p><small class="statTileLabel">Kurikulum tercakup</small></div></div>
  <div class="statTile" style="--accent:#4d9fd8"><span class="statTileArt">${SVG26}</span><div><p class="statTileNum">12</p><small class="statTileLabel">Hari berturut-turut</small></div></div>
</div>
<span class="summaryArt"><img alt=""></span></section>
<div class="materiTop"><a class="back">← Kembali</a><div class="materiDots">
${Array.from({length:10},()=>'<button></button>').join('')}
</div><div class="langSwitch"><button>漢字</button><button>ふり</button><button>ID</button></div></div>
<div class="compareGrid">
  <div class="compareRow"><span>権利擁護</span><span>Advokasi — membela hak orang yang sulit menyuarakan sendiri</span><span>Saat hak seseorang sedang terancam</span></div>
</div>
<div class="finalYearGrid">
  <a class="finalYearCard"><b>2026</b><strong>第38回</strong><span>0/5 bagian</span><small>125 soal</small></a>
  <a class="finalYearCard"><b>2025</b><strong>第37回</strong><span>3/5 bagian</span><small>125 soal</small></a>
</div>
<div class="finalParts"><a class="finalPart"><b>Bagian 1</b><span>soal 1–25</span><small>Belum dikerjakan</small></a></div>
<div class="finalQuizTop"><a>× Tutup</a><span>問題 125 · 25/25</span><select><option>Mode Latihan</option></select></div>
<div class="finalQuestion"><h2>介護福祉士として最も適切な対応はどれか</h2>
<div class="finalOptions"><button><b>1</b><span>Menentukan prioritas masalah dari yang paling ringan bebannya bagi staf panti</span></button></div>
<div class="finalFeedback">Benar — penjelasan panjang tentang alasan jawaban ini paling tepat menurut prinsip martabat.</div></div>
<div class="finalQuizNav"><button>Sebelumnya</button><button>Berikutnya</button></div>
<div class="daily"><div><b>Target harian</b><p>2 dari 3 level selesai</p><div class="progress"><i style="width:66%"></i></div></div><span class="badge">+120 XP</span></div>
</main>
<nav><a class="sideBrand"><span class="sideBrandArt"><img alt=""></span><span><b class="sideBrandName">kenshi</b><small class="sideBrandSub">kaigo e-learning</small></span></a>
<a class="active"><span class="navEmoji"><svg class="navSvg" viewBox="0 0 24 24" width="22" height="22"></svg></span><span>Belajar</span></a><a class=""><span class="navEmoji"><svg class="navSvg" viewBox="0 0 24 24" width="22" height="22"></svg></span><span>Ujian</span></a><a class=""><span class="navEmoji"><svg class="navSvg" viewBox="0 0 24 24" width="22" height="22"></svg></span><span>Istilah</span></a><a class="navFriends"><span class="navEmoji"><svg class="navSvg" viewBox="0 0 24 24" width="22" height="22"></svg></span><span>Teman</span></a><a class="navRank"><span class="navEmoji"><svg class="navSvg" viewBox="0 0 24 24" width="22" height="22"></svg></span><span>Peringkat</span></a><a class=""><span class="navEmoji"><svg class="navSvg" viewBox="0 0 24 24" width="22" height="22"></svg></span><span>Profil</span></a>
<span class="sideSpacer"></span>
<div class="sideCheer"><span class="sideCheerArt"><img alt=""></span><small class="sideCheerText">Sedikit setiap hari,<br>hasil luar biasa!</small></div>
<div class="sideDark"><button class="darkRow tap"><span class="darkRowIcon">☾︎</span><span class="darkRowLabel">Mode gelap</span><span class="darkSwitch"><i></i></span></button></div></nav>
</div></body></html>`;

const EXPR = `(()=>{const vw=document.documentElement.clientWidth;const out=[];
const name=el=>{const c=(el.className&&typeof el.className==='string')?'.'+el.className.trim().split(/\\s+/).join('.'):el.tagName.toLowerCase();
 const p=el.parentElement;const pc=(p&&p.className&&typeof p.className==='string')?'.'+p.className.trim().split(/\\s+/)[0]:(p?p.tagName.toLowerCase():'');
 return pc?pc+' > '+c:c};
document.querySelectorAll('.app *').forEach(el=>{const r=el.getBoundingClientRect();
 if(r.width===0&&r.height===0)return;
 const cls=name(el);
 if(r.right>vw+0.5)out.push({sel:cls,right:+r.right.toFixed(1),vw,over:+(r.right-vw).toFixed(1),kind:'keluar-viewport'});
 const p=el.parentElement;if(p){const pr=p.getBoundingClientRect();
  if(pr.width>0&&r.right>pr.right+0.5)out.push({sel:cls,right:+r.right.toFixed(1),parent:+pr.right.toFixed(1),over:+(r.right-pr.right).toFixed(1),kind:'lewat-induk'});}});
const tap=[];document.querySelectorAll('.app button,.app a').forEach(el=>{const r=el.getBoundingClientRect();
 if(r.width===0&&r.height===0)return;
 // Titik progres materi: LEBARNYA memang fungsi — sepuluh titik membagi satu batang,
 // 44px per titik butuh 440px. Tingginya tetap wajib >=44px.
 const seg=el.parentElement&&el.parentElement.classList.contains('materiDots');
 if(r.height<44||(!seg&&r.width<44)){tap.push({sel:name(el),w:+r.width.toFixed(1),h:+r.height.toFixed(1)})}});
return JSON.stringify({vw,overflow:out,tap})})()`;

function findChrome() {
  const c = [process.env.CHROME_PATH,
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    'C:/Program Files/Microsoft/Edge/Application/msedge.exe'].filter(Boolean);
  return c.find(p => { try { return fs.existsSync(p) } catch { return false } });
}

const WIDTHS = [320, 360, 402, 444, 768, 1280, 1920];
const LABEL = { 320:'SE lama', 360:'Android umum', 402:'iPhone 17', 444:'Poco F6', 768:'tablet', 1280:'laptop', 1920:'desktop 1080p' };

const bin = findChrome();
if (!bin) { console.error('Tidak ada Chrome/Edge — set CHROME_PATH.'); process.exit(2); }

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'kkovf-'));
const page = path.join(tmp, 'p.html');
fs.writeFileSync(page, HTML);
const port = 9400 + Math.floor(Math.random() * 300);
const proc = spawn(bin, [`--remote-debugging-port=${port}`, `--user-data-dir=${path.join(tmp,'prof')}`,
  '--headless=new', '--no-first-run', '--no-default-browser-check', '--disable-gpu', 'about:blank'],
  { stdio: 'ignore' });

const sleep = ms => new Promise(r => setTimeout(r, ms));
async function ws() {
  for (let i = 0; i < 60; i++) {
    try { const r = await fetch(`http://127.0.0.1:${port}/json/version`); const j = await r.json();
      if (j.webSocketDebuggerUrl) return j.webSocketDebuggerUrl } catch {}
    await sleep(250);
  }
  throw new Error('CDP tidak siap');
}

let totalOver = 0, totalTap = 0;
try {
  const url = await ws();
  const sock = new WebSocket(url);
  await new Promise((res, rej) => { sock.onopen = res; sock.onerror = rej });
  let id = 0; const waiters = new Map();
  sock.onmessage = e => { const m = JSON.parse(e.data); if (m.id && waiters.has(m.id)) { waiters.get(m.id)(m); waiters.delete(m.id) } };
  const send = (method, params = {}, sessionId) => new Promise(res => {
    const myId = ++id; waiters.set(myId, res);
    sock.send(JSON.stringify({ id: myId, method, params, ...(sessionId ? { sessionId } : {}) })); });

  const { result: { targetId } } = await send('Target.createTarget', { url: 'about:blank' });
  const { result: { sessionId } } = await send('Target.attachToTarget', { targetId, flatten: true });
  await send('Page.enable', {}, sessionId);
  await send('Runtime.enable', {}, sessionId);

  for (const w of WIDTHS) {
    await send('Emulation.setDeviceMetricsOverride',
      { width: w, height: 900, deviceScaleFactor: 1, mobile: w < 700 }, sessionId);
    await send('Page.navigate', { url: 'file:///' + page.replace(/\\/g, '/') + '?w=' + w }, sessionId);
    // 1800ms, bukan 700: animasi riseIn (src/social.css) punya delay bertingkat sampai
    // .25s + durasi .32s = .57s, dan .currentPing beranimasi terus. Sampel di 700ms
    // menangkap elemen MID-ANIMASI sehingga gate ini melaporkan target sentuh <44px
    // yang sebenarnya tidak ada — kegagalan yang hilang sendiri kalau dijalankan ulang.
    // Gate yang kadang merah tanpa sebab lebih buruk daripada gate yang lambat.
    await sleep(1800);
    const r = await send('Runtime.evaluate', { expression: EXPR, returnByValue: true }, sessionId);
    const v = r.result?.result?.value;
    if (!v) { console.log(`${String(w).padStart(5)}px  — gagal evaluasi`); continue; }
    const d = JSON.parse(v);
    const uniqOver = [...new Map(d.overflow.map(o => [o.sel + o.kind, o])).values()];
    const uniqTap = [...new Map(d.tap.map(o => [o.sel, o])).values()];
    totalOver += uniqOver.length; totalTap += uniqTap.length;
    console.log(`${String(w).padStart(5)}px (${LABEL[w]}) luber=${uniqOver.length} tap<44px=${uniqTap.length} ${uniqOver.length ? 'GAGAL' : 'LULUS'}`);
    uniqOver.slice(0, 6).forEach(o => console.log(`        ${o.kind}: ${o.sel} kanan=${o.right} > ${o.kind === 'keluar-viewport' ? 'vw ' + o.vw : 'induk ' + o.parent} (+${o.over}px)`));
    if (uniqTap.length) console.log(`        tap kecil: ${uniqTap.slice(0,6).map(t=>`${t.sel} ${t.w}x${t.h}`).join(', ')}`);
  }
  sock.close();
} finally {
  try { proc.kill() } catch {}
  await sleep(400);
  try { fs.rmSync(tmp, { recursive: true, force: true }) } catch {}
}

console.log(`\n${totalOver ? 'GAGAL' : 'LULUS'} — luber total=${totalOver}, target tap <44px total=${totalTap}`);
process.exit(totalOver ? 1 : 0);
