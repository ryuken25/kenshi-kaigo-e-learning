// Helper bersama ujian akhir (api/final.mjs & api/final/local-merge.mjs).
export const PARTS = 5, PER_PART = 25;
export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Jawaban divalidasi ketat di server: kunci soal bagian itu (no global), nilai
// harus salah satu kunci '1'..'5'. Entri di luar bagian dibuang (bukan error —
// payload merge boleh kotor). Max 25 entri per bagian.
export function sanitizeAnswers(raw, part) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const from = (part - 1) * PER_PART + 1, to = part * PER_PART, clean = {};
  for (const [k, v] of Object.entries(raw)) {
    if (Object.keys(clean).length >= PER_PART) break;
    const kn = Number(k);
    if (Number.isInteger(kn) && kn >= from && kn <= to && ['1', '2', '3', '4', '5'].includes(v)) clean[String(kn)] = v;
  }
  return clean;
}

// XP bagian ujian: skala linear benar/25 (max 20), nol kalau tidak ada yang benar,
// replay bagian yang sudah pernah dicoba cuma 20% (min 2) — pola replay level.
export function finalXpFor({ correct, isRepeat }) {
  if (correct === 0) return 0;
  const full = Math.max(2, Math.round((correct / PER_PART) * 20));
  return isRepeat ? Math.max(2, Math.round(full * 0.2)) : full;
}

// Review per-soal untuk layar hasil. Bentuk entri SENGAJA cuma {no, chosen, correct}:
// kunci jawaban, teks opsi benar, maupun indeksnya TIDAK BOLEH ikut keluar — soal yang
// salah harus tetap salah sampai user mencoba ulang. Soal tak terjawab / nilai di luar
// '1'..'5' → chosen null, correct false. Selalu terurut menurut nomor soal global.
export function buildReview(questions, answers) {
  const src = answers && typeof answers === 'object' && !Array.isArray(answers) ? answers : {};
  return (Array.isArray(questions) ? questions : []).map(q => {
    const v = src[String(q.no)], chosen = ['1', '2', '3', '4', '5'].includes(v) ? v : null;
    return { no: q.no, chosen, correct: chosen !== null && chosen === q.answer };
  }).sort((a, b) => a.no - b.no);
}
