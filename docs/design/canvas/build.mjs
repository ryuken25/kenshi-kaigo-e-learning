// build.mjs — tulis 44 artboard .dc.html + canvas.json ke folder ini.
//   node docs/design/canvas/build.mjs
// Setiap perubahan desain: edit screens-*.mjs, jalankan ini, lalu seed ulang.
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import * as sys from './screens-system.mjs';
import * as flow from './screens-flow.mjs';
import * as rest from './screens-rest.mjs';
import * as desk from './screens-desktop.mjs';

const out = import.meta.dirname;

/* Lane: [judul, jarak-y, [nama, w, h][] ] — x dihitung otomatis (gap 80). */
const GAP_X = 80, GAP_Y = 160;
const LANES = [
  ['A · Sistem & aset', [
    ['Sistem', 900, 1580, sys.Sistem],
    ['Komponen', 900, 1520, sys.Komponen],
    ['AsetSheet', 1360, 1080, sys.AsetSheet],
    ['AsetKecil', 1180, 900, sys.AsetKecil],
  ]],
  ['B · Masuk & onboarding', [
    ['Landing', 402, 874, flow.Landing],
    ['Login', 402, 874, flow.Login],
    ['LoginTerkirim', 402, 874, flow.LoginTerkirim],
    ['OnboardingGender', 402, 874, flow.OnboardingGender],
    ['OnboardingKarakter', 402, 900, flow.OnboardingKarakter],
    ['OnboardingHandle', 402, 874, flow.OnboardingHandle],
  ]],
  ['C · Alur belajar', [
    ['Main', 402, 1240, flow.Main],
    ['SectionOverview', 402, 1300, flow.SectionOverview],
    ['SectionPreview', 402, 1100, flow.SectionPreview],
    ['LevelHub', 402, 874, flow.LevelHub],
    ['MateriTerm', 402, 940, flow.MateriTerm],
    ['MateriCompare', 402, 940, flow.MateriCompare],
    ['MateriCase', 402, 940, flow.MateriCase],
    ['TermSheet', 402, 940, flow.TermSheet],
    ['QuizAwal', 402, 1020, flow.QuizAwal],
    ['QuizBenar', 402, 1180, flow.QuizBenar],
    ['QuizSalah', 402, 1180, flow.QuizSalah],
    ['QuizRetry', 402, 1020, flow.QuizRetry],
    ['ResultSempurna', 402, 874, flow.ResultSempurna],
    ['ResultPreview', 402, 874, flow.ResultPreview],
    ['Recap', 402, 874, flow.Recap],
    ['Practice', 402, 1020, flow.Practice],
  ]],
  ['D · Ujian akhir', [
    ['FinalHome', 402, 1000, rest.FinalHome],
    ['FinalYear', 402, 900, rest.FinalYear],
    ['FinalQuizLatihan', 402, 1060, rest.FinalQuizLatihan],
    ['FinalQuizUjian', 402, 1000, rest.FinalQuizUjian],
    ['FinalResult', 402, 874, rest.FinalResult],
    ['FinalUnlimited', 402, 1000, rest.FinalUnlimited],
  ]],
  ['E · Sosial', [
    ['Profile', 402, 1240, rest.Profile],
    ['Friends', 402, 940, rest.Friends],
    ['FriendsCari', 402, 874, rest.FriendsCari],
    ['Leaderboard', 402, 1000, rest.Leaderboard],
    ['Achievements', 402, 1000, rest.Achievements],
  ]],
  ['F · Referensi & state', [
    ['Glossary', 402, 1000, rest.Glossary],
    ['GlossaryDetail', 402, 940, rest.GlossaryDetail],
    ['StateSistem', 880, 700, rest.StateSistem],
  ]],
  ['G · Tiga tema', [
    ['TemaYuki', 402, 1240, rest.TemaYuki],
    ['TemaYukiLevel', 402, 874, rest.TemaYukiLevel],
    ['TemaYukiHasil', 402, 874, rest.TemaYukiHasil],
    ['TemaLuna', 402, 1240, rest.TemaLuna],
    ['TemaLunaLevel', 402, 874, rest.TemaLunaLevel],
    ['TemaLunaHasil', 402, 874, rest.TemaLunaHasil],
  ]],
  ['H · Desktop — terang', [
    ['DeskMomo', 1440, 1024, desk.DeskMomo],
    ['DeskYuki', 1440, 1024, desk.DeskYuki],
    ['DeskLuna', 1440, 1024, desk.DeskLuna],
    ['DesktopMateri', 1280, 900, rest.DesktopMateri],
  ]],
  ['I · Desktop — mode gelap', [
    ['DeskMomoGelap', 1440, 1024, desk.DeskMomoGelap],
    ['DeskYukiGelap', 1440, 1024, desk.DeskYukiGelap],
    ['DeskLunaGelap', 1440, 1024, desk.DeskLunaGelap],
  ]],
  ['J · Mobile — mode gelap', [
    ['GelapMomo', 402, 1240, rest.GelapMomo],
    ['GelapMomoLevel', 402, 874, rest.GelapMomoLevel],
    ['GelapYuki', 402, 1240, rest.GelapYuki],
    ['GelapYukiLevel', 402, 874, rest.GelapYukiLevel],
    ['GelapLuna', 402, 1240, rest.GelapLuna],
    ['GelapLunaLevel', 402, 874, rest.GelapLunaLevel],
  ]],
];

const NOTES = {
  'A · Sistem & aset': 'Sistem desain + lembar aset.\nSemua nilai diambil persis dari src/styles.css, themes.css, routing.css.\nEkspor PNG per elemen dari lembar aset.',
  'B · Masuk & onboarding': 'Mode tamu sudah dihapus (doc 50).\nHanya / dan /login yang terbuka tanpa akun — route lain melempar ke /login?next=…',
  'C · Alur belajar': 'Inti produk: /belajar → bab → level → materi → quiz → hasil.\nPrinsip: TIDAK ADA yang pernah terkunci. Preview hanya menandai attempt yang belum dihitung resmi.',
  'D · Ujian akhir': 'Soal asli 2021–2026, 125 butir per tahun, 5 bagian × 25.\nSemua tahun & bagian terbuka sejak awal — tidak memakai sistem preview.',
  'E · Sosial': 'Handle = identitas publik (huruf kecil, 4–14, ganti tiap 7 hari).\nPeringkat memakai XP sejak Senin 00:00 Asia/Tokyo.',
  'F · Referensi & state': '133 istilah, pencarian menerima kanji/kana/romaji/Indonesia.\nState sistem dikumpulkan jadi satu artboard.',
  'G · Tiga tema': 'Layar /belajar yang sama, empat palet.\nYozora tetap light mode — bukan dark mode.',
  'H · Desktop ≥960px': 'Di ≥960px shell berubah: sidebar 228px menggantikan bottom nav, grid bab jadi 2 kolom.\nBottom nav mobile hanya 4 item; Teman & Peringkat muncul di sidebar.',
};

const artboards = [], annotations = [];
let y = 0, files = 0;

for (const [lane, items] of LANES) {
  let x = 0;
  const laneH = Math.max(...items.map(i => i[2]));
  annotations.push({
    id: `lane-${lane.slice(0, 1).toLowerCase()}`,
    x: -360, y, w: 280,
    text: `${lane}\n\n${NOTES[lane]}`,
  });
  for (const [name, w, h, render] of items) {
    const html = render();
    // Frame canvas.json TIDAK menskalakan isi: kalau root lebih tinggi dari frame,
    // isinya terpotong diam-diam. Jadi keduanya wajib sama persis.
    const root = html.match(/width:(\d+)px;height:(\d+)px;display:flex/);
    if (!root) throw new Error(`${name}: root artboard tidak ditemukan`);
    if (Number(root[1]) !== w || Number(root[2]) !== h) {
      throw new Error(`${name}: root ${root[1]}x${root[2]} != frame ${w}x${h} — samakan di screens-*.mjs dan LANES`);
    }
    writeFileSync(join(out, `${name}.dc.html`), html, 'utf8');
    artboards.push({ file: `${name}.dc.html`, x, y, w, h });
    x += w + GAP_X;
    files++;
  }
  y += laneH + GAP_Y;
}

writeFileSync(join(out, 'canvas.json'),
  JSON.stringify({ artboards, annotations, launch: { view: 'canvas' } }, null, 2), 'utf8');

console.log(`ok: ${files} artboard + canvas.json ditulis ke ${out}`);
console.log(`   kanvas ${Math.max(...artboards.map(a => a.x + a.w))} x ${y - GAP_Y} px`);
