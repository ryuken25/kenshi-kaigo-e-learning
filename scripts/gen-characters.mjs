// ============================================================================
// gen-characters.mjs — bangun 36 SVG karakter orisinal + manifest.
// Output: public/assets/characters/<id>/<ekspresi>.svg + characters.manifest.json.
// Deterministik (tanpa Math.random) — regenerasi selalu byte-identik.
//
// Desain mengikuti docs/v8/49-CHARACTER-SYSTEM.md:
//   - 6 karakter orisinal, proporsi kepala:badan 1:1,2 (BUKAN chibi kepala doang)
//   - semua PUNYA MULUT (pembeda dari karakter tak bermulut yang terkenal)
//   - anggaran < 3KB per file, < 110KB total
//
// JANGAN gambar karakter milik pihak ketiga. Semua bentuk di bawah ini orisinal.
// ============================================================================
import { writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const pack = JSON.parse(readFileSync(join(root, 'docs/v8/data/characters.json'), 'utf8'));
const chars = Array.isArray(pack) ? pack : (pack.characters || Object.values(pack));

// Palet bulu/aksesori per karakter — diambil dari palet pack + turunan gelap/terang.
// `fur` = warna bulu utama, `fur2` = warna sekunder (perut/telinga dalam),
// `line` = garis luar (warna tinta palet supaya menyatu dengan tema).
const FUR = {
  momo:   { fur: '#FFFFFF', fur2: '#FFF0F5', ear: '#FFE1EC', line: '#8a6a7a', acc: '#ff9fbf', outfit: '#ffcfe0' },
  kurumi: { fur: '#8B87A3', fur2: '#B9B4CC', ear: '#6E6A85', line: '#4a4560', acc: '#5F42A8', outfit: '#5F42A8' },
  sora:   { fur: '#FFFFFF', fur2: '#EAF5FE', ear: '#F2F9FF', line: '#5c7a8c', acc: '#6db9e8', outfit: '#6db9e8' },
  kinako: { fur: '#F2CD8A', fur2: '#FBEDD3', ear: '#E3B563', line: '#8a6a3a', acc: '#8a5a2b', outfit: '#a9743d' },
  nagi:   { fur: '#7FC8B9', fur2: '#F2FBF8', ear: '#5FA898', line: '#3d6a60', acc: '#136B58', outfit: '#cfeee6' },
  beni:   { fur: '#D96A3F', fur2: '#FFE8DA', ear: '#B5502B', line: '#7a3a1f', acc: '#95300F', outfit: '#e8845e' },
};

const EXPRS = ['idle', 'happy', 'sad', 'sleepy', 'surprised', 'clap'];
const W = 120, H = 140;
// Kepala-badan 1:1,2 — kepala r33 di y50, badan dari y74.
const HEAD = { cx: 60, cy: 50, r: 33 };
const BODY = 'M40 118 C40 92 45 76 60 76 C75 76 80 92 80 118 C80 124 70 128 60 128 C50 128 40 124 40 118 Z';
const n = (v) => Math.round(v * 10) / 10;

/* ---------- potongan wajah (dipakai semua spesies) ---------- */
function eyes(e) {
  const L = { x: 48, y: 50 }, R = { x: 72, y: 50 };
  if (e === 'happy' || e === 'clap')
    return `<path d="M${L.x - 4} ${L.y + 1} Q${L.x} ${L.y - 5} ${L.x + 4} ${L.y + 1}" stroke="CUR" stroke-width="2.6" fill="none" stroke-linecap="round"/><path d="M${R.x - 4} ${R.y + 1} Q${R.x} ${R.y - 5} ${R.x + 4} ${R.y + 1}" stroke="CUR" stroke-width="2.6" fill="none" stroke-linecap="round"/>`;
  if (e === 'sleepy')
    return `<path d="M${L.x - 4} ${L.y} Q${L.x} ${L.y + 4} ${L.x + 4} ${L.y}" stroke="CUR" stroke-width="2.6" fill="none" stroke-linecap="round"/><path d="M${R.x - 4} ${R.y} Q${R.x} ${R.y + 4} ${R.x + 4} ${R.y}" stroke="CUR" stroke-width="2.6" fill="none" stroke-linecap="round"/>`;
  if (e === 'surprised')
    return `<circle cx="${L.x}" cy="${L.y}" r="4" fill="CUR"/><circle cx="${R.x}" cy="${R.y}" r="4" fill="CUR"/><circle cx="${L.x + 1.4}" cy="${L.y - 1.4}" r="1.3" fill="#fff"/><circle cx="${R.x + 1.4}" cy="${R.y - 1.4}" r="1.3" fill="#fff"/>`;
  const teary = e === 'sad' ? `<path d="M${L.x + 6} ${L.y + 6} q3 4 0 6 q-3 -2 0 -6" fill="#7ab6dd"/>` : '';
  return `<circle cx="${L.x}" cy="${L.y}" r="3.1" fill="CUR"/><circle cx="${R.x}" cy="${R.y}" r="3.1" fill="CUR"/>${teary}`;
}
function brows(e) {
  if (e === 'sad') return `<path d="M43 41 L53 45" stroke="CUR" stroke-width="2" stroke-linecap="round"/><path d="M77 41 L67 45" stroke="CUR" stroke-width="2" stroke-linecap="round"/>`;
  if (e === 'surprised') return `<path d="M44 39 Q48 36 52 38" stroke="CUR" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M68 38 Q72 36 76 39" stroke="CUR" stroke-width="2" fill="none" stroke-linecap="round"/>`;
  return '';
}
function mouth(e) {
  // Semua karakter PUNYA MULUT (aturan doc 49).
  if (e === 'happy' || e === 'clap') return `<path d="M52 60 Q60 70 68 60 Z" fill="#a3505e"/><path d="M55 64 Q60 68 65 64 Z" fill="#f2a0ac"/>`;
  if (e === 'sad') return `<path d="M54 65 Q60 59 66 65" stroke="CUR" stroke-width="2.4" fill="none" stroke-linecap="round"/>`;
  if (e === 'sleepy') return `<ellipse cx="60" cy="63" rx="2.4" ry="3" fill="CUR"/>`;
  if (e === 'surprised') return `<ellipse cx="60" cy="63" rx="4.4" ry="5.4" fill="#a3505e"/><ellipse cx="60" cy="65" rx="2.2" ry="2.4" fill="#f2a0ac"/>`;
  return `<path d="M54 61 Q60 67 66 61" stroke="CUR" stroke-width="2.4" fill="none" stroke-linecap="round"/>`;
}
function blush(e) {
  const op = e === 'happy' || e === 'clap' ? 0.65 : 0.4;
  return `<ellipse cx="42" cy="58" rx="5" ry="3" fill="#ff9fbf" opacity="${op}"/><ellipse cx="78" cy="58" rx="5" ry="3" fill="#ff9fbf" opacity="${op}"/>`;
}
function nose(id) {
  // kucing/rubah punya hidung segitiga kecil; lainnya titik.
  if (id === 'momo' || id === 'beni') return `<path d="M57.5 55.5 L62.5 55.5 L60 58.5 Z" fill="CUR"/>`;
  return `<circle cx="60" cy="56.5" r="1.6" fill="CUR"/>`;
}
/* Tangan di sisi badan; clap = terangkat ke samping atas + garis gerak. */
function arms(e, fur, line) {
  const s = `stroke="${line}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"`;
  if (e === 'clap')
    return `<ellipse cx="33" cy="80" rx="8" ry="6" fill="${fur}" ${s}/><ellipse cx="87" cy="80" rx="8" ry="6" fill="${fur}" ${s}/><path d="M24 70 l-4 -5 M96 70 l4 -5" stroke="${line}" stroke-width="2" stroke-linecap="round" opacity="0.7"/>`;
  return `<ellipse cx="39" cy="96" rx="8.5" ry="12" fill="${fur}" ${s}/><ellipse cx="81" cy="96" rx="8.5" ry="12" fill="${fur}" ${s}/>`;
}
/* Kaki kecil di bawah badan. */
function feet(fur, line) {
  return `<ellipse cx="50" cy="126" rx="8" ry="5" fill="${fur}" stroke="${line}" stroke-width="2.5"/><ellipse cx="70" cy="126" rx="8" ry="5" fill="${fur}" stroke="${line}" stroke-width="2.5"/>`;
}

/* ---------- telinga & aksesori per spesies (digambar DI BELAKANG kepala) ---------- */
function earsBack(id, f, line) {
  const s = `stroke="${line}" stroke-width="2.5" stroke-linejoin="round"`;
  switch (id) {
    case 'momo': // kucing: dua segitiga di puncak kepala
      return `<path d="M34 30 L29 8 L50 20 Z" fill="${f.fur}" ${s}/><path d="M86 30 L91 8 L70 20 Z" fill="${f.fur}" ${s}/><path d="M36 25 L33 13 L45 20 Z" fill="${f.ear}"/><path d="M84 25 L87 13 L75 20 Z" fill="${f.ear}"/>`;
    case 'kurumi': // kelinci: dua telinga panjang, satu JATUH ke samping
      return `<path d="M42 26 C36 8 40 -2 47 0 C54 2 52 16 50 26 Z" fill="${f.fur}" ${s}/><path d="M44 22 C42 10 44 4 47 4 C50 5 49 16 48 22 Z" fill="${f.ear}"/><path d="M74 24 C84 16 94 18 96 26 C97 32 88 34 78 32 Z" fill="${f.fur}" ${s}/><path d="M78 26 C85 22 91 23 92 27 C92 30 86 31 80 30 Z" fill="${f.ear}"/>`;
    case 'sora': // anjing: dua telinga menggantung di samping
      return `<path d="M32 30 C22 26 18 40 22 54 C25 62 33 60 34 50 Z" fill="${f.ear}" ${s}/><path d="M88 30 C98 26 102 40 98 54 C95 62 87 60 86 50 Z" fill="${f.ear}" ${s}/>`;
    case 'kinako': // anjing gempal: dua telinga bulat pendek ke bawah
      return `<path d="M30 34 C22 34 20 48 26 54 C31 58 36 52 35 44 Z" fill="${f.ear}" ${s}/><path d="M90 34 C98 34 100 48 94 54 C89 58 84 52 85 44 Z" fill="${f.ear}" ${s}/>`;
    case 'nagi': return ''; // pinguin: telinga tidak ada, aksesori di kepala depan
    case 'beni': // rubah: dua telinga besar runcing
      return `<path d="M32 32 L24 4 L48 20 Z" fill="${f.fur}" ${s}/><path d="M88 32 L96 4 L72 20 Z" fill="${f.fur}" ${s}/><path d="M33 26 L29 11 L43 20 Z" fill="${f.fur2}"/><path d="M87 26 L91 11 L77 20 Z" fill="${f.fur2}"/>`;
  }
}
/* Aksesori DEPAN (di atas kepala/badan) — ciri khas tiap karakter. */
function accessoryFront(id, e, f, line) {
  const s = `stroke="${line}" stroke-width="2.5" stroke-linejoin="round"`;
  switch (id) {
    case 'momo': // pita sakura di kanan atas + celemek perawat pink bersaku
      return `<g><path d="M82 18 C74 10 70 16 76 20 C70 24 74 30 82 22 Z" fill="${f.acc}" ${s}/><circle cx="82" cy="20" r="3" fill="#fff" ${s}/></g><path d="M48 78 C46 92 48 106 60 108 C72 106 74 92 72 78 C66 84 54 84 48 78 Z" fill="${f.outfit}" ${s}/><path d="M54 96 h12 v9 a3 3 0 0 1 -3 3 h-6 a3 3 0 0 1 -3 -3 Z" fill="#fff" ${s}/><path d="M58 100 h4" stroke="${f.acc}" stroke-width="2" stroke-linecap="round"/>`;
    case 'kurumi': // topi kecil ungu-hitam miring + ekor bulat
      return `<circle cx="86" cy="106" r="8" fill="${f.fur2}" ${s}/><g transform="rotate(-14 46 20)"><path d="M34 22 L46 4 L58 22 Z" fill="${f.acc}" ${s}/><rect x="30" y="20" width="32" height="5" rx="2.5" fill="#2E2440" ${s}/></g>`;
    case 'sora': // syal biru langit di leher
      return `<path d="M44 74 C50 80 70 80 76 74 L76 82 C68 88 52 88 44 82 Z" fill="${f.outfit}" ${s}/><path d="M68 82 l6 14 l-9 2 Z" fill="${f.outfit}" ${s}/>`;
    case 'kinako': // baret cokelat + perut puding
      return `<ellipse cx="60" cy="100" rx="14" ry="17" fill="${f.fur2}"/><g><ellipse cx="58" cy="20" rx="20" ry="9" fill="${f.acc}" ${s}/><path d="M40 19 C42 8 52 4 60 6 C70 8 76 12 76 18 Z" fill="${f.acc}" ${s}/><circle cx="58" cy="7" r="2.6" fill="${f.acc}" ${s}/></g>`;
    case 'nagi': // jambul kecil + papan catatan di tangan kanan
      return `<path d="M56 16 Q58 8 62 6 M60 17 Q63 10 67 9" stroke="${line}" stroke-width="2.4" fill="none" stroke-linecap="round"/><ellipse cx="60" cy="100" rx="13" ry="16" fill="${f.fur2}"/><g ${s}><rect x="78" y="86" width="20" height="26" rx="3" fill="#fdf6ec"/><rect x="84" y="83" width="8" height="6" rx="2" fill="${f.acc}"/><path d="M82 94 h12 M82 100 h12 M82 106 h8" stroke="#c9b89a" stroke-width="1.6" stroke-linecap="round"/></g>`;
    case 'beni': // ekor tebal di samping + ujung putih
      return `<path d="M78 112 C96 116 106 104 104 88 C103 82 97 82 96 90 C95 100 88 104 78 102 Z" fill="${f.fur}" ${s}/><path d="M100 84 C104 82 105 88 103 93 C99 94 96 90 100 84 Z" fill="${f.fur2}"/><ellipse cx="60" cy="102" rx="12" ry="15" fill="${f.fur2}"/>`;
  }
}

/* zzz kecil untuk sleepy. */
const sleepyZ = e => e === 'sleepy' ? `<path d="M92 30 h8 l-8 8 h8" stroke="CUR" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M100 16 h6 l-6 6 h6" stroke="CUR" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" opacity="0.6"/>` : '';

/* ---------- rakit satu SVG ---------- */
function build(id, expr) {
  const f = FUR[id], line = f.line;
  const parts = [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="${id} ${expr}">`,
    earsBack(id, f, line),
    `<path d="${BODY}" fill="${f.fur}" stroke="${line}" stroke-width="2.5" stroke-linejoin="round"/>`,
    accessoryFront(id, expr, f, line),
    arms(expr, f.fur, line),
    feet(f.fur, line),
    `<circle cx="${HEAD.cx}" cy="${HEAD.cy}" r="${HEAD.r}" fill="${f.fur}" stroke="${line}" stroke-width="2.5"/>`,
    eyes(expr), nose(id), brows(expr), mouth(expr), blush(expr), sleepyZ(expr),
    '</svg>',
  ].join('');
  // CUR = warna garis wajah (line palet) — diganti terakhir supaya konsisten.
  return parts.replace(/CUR/g, line);
}

let total = 0, worst = 0;
const manifest = { chars: {} };
for (const c of chars) {
  const dir = join(root, 'public/assets/characters', c.id);
  mkdirSync(dir, { recursive: true });
  manifest.chars[c.id] = {};
  for (const e of EXPRS) {
    const svg = build(c.id, e), bytes = Buffer.byteLength(svg, 'utf8');
    if (bytes >= 3072) { console.error(`TERLALU BESAR: ${c.id}/${e}.svg = ${bytes}B (batas 3072)`); process.exit(1); }
    total += bytes; worst = Math.max(worst, bytes);
    writeFileSync(join(dir, `${e}.svg`), svg);
    manifest.chars[c.id][e] = `/assets/characters/${c.id}/${e}.svg`;
  }
}
if (total >= 110 * 1024) { console.error(`TOTAL TERLALU BESAR: ${total}B (batas 112640)`); process.exit(1); }
manifest.exprs = EXPRS;
manifest.note = 'Digenerate scripts/gen-characters.mjs — deterministik, jangan edit manual.';
writeFileSync(join(root, 'public/assets/characters/characters.manifest.json'), JSON.stringify(manifest, null, 1) + '\n');
console.log(`OK: ${chars.length} karakter x ${EXPRS.length} ekspresi = ${chars.length * EXPRS.length} SVG | terbesar ${worst}B | total ${(total / 1024).toFixed(1)}KB (batas 110KB)`);
