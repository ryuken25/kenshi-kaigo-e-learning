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
const CSS = ['src/styles.css', 'src/routing.css', 'src/translation.css', 'src/auth.css']
  .filter(f => fs.existsSync(path.join(ROOT, f)))
  .map(f => fs.readFileSync(path.join(ROOT, f), 'utf8')).join('\n');

// Markup dicopy dari JSX yang asli, dengan isi TERPANJANG yang benar-benar ada di data.
const HTML = `<!doctype html><html lang="id"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0,viewport-fit=cover">
<style>${CSS}</style></head><body><div class="app">
<header><a class="brand"><span class="kitty"></span><span><b>kenshi kaigo e-learning</b><small>KAIGO FUKUSHISHI</small></span></a>
<div class="topStats"><span>🔥 12</span><span class="xpStat">⭐ 1240 XP</span></div></header>
<main class="page">
<div class="sectionGrid">
  <a class="sectionCard"><span class="sectionIcon">🌸</span><span class="sectionCopy"><b>人間の尊厳と自立</b><span>Soal Komprehensif &amp; Case Study</span></span></a>
  <a class="sectionCard"><span class="sectionIcon">🧠</span><span class="sectionCopy"><b>認知症の理解</b><span>Dukungan Hidup Sehari-hari &amp; Komunikasi</span></span></a>
</div>
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
<nav><a>Belajar</a><a>Ujian</a><a>Istilah</a><a>Profil</a></nav>
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
 if(r.width===0&&r.height===0)return;if(r.height<44||r.width<44){tap.push({sel:name(el),w:+r.width.toFixed(1),h:+r.height.toFixed(1)})}});
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
    await sleep(700);
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
