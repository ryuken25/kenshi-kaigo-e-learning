// SOAL ASLI 介護福祉士国家試験 — 6 sesi × 125 soal, teks resmi sssc.or.jp.
// data/{tahun}.json = hasil pipeline: PDF resmi (第33〜35回 via Wayback Machine karena
// situs resmi hanya menyimpan 3 sesi terakhir) → ekstraksi → terjemahan Indonesia →
// anotasi furigana inline (scripts/annotate-final-data.mjs). Kunci jawaban diverifikasi
// silang: PDF 正答一覧 resmi ↔ kaigojob.com, 750/750 posisi.
// Pemetaan sesi: 2021=第33回 … 2026=第38回 (tanggal ujian asli di examDate).
//
// URUTAN SOAL = penomoran resmi 問題1〜125 per sesi. JANGAN diacak/renumber.
// Anomali resmi lewat field OPSIONAL `accepted` (lihat isCorrectAnswer):
//   2021 no116 — 問題不成立 (dianulir, 全員に得点) → accepted ['1'..'5'], semua jawaban benar.
//   2024 no46  — 採点上、選択肢4及び5に得点 → accepted ['4','5'].
// `answer` tetap satu key sah ('1'-'5') supaya bentuk lama & validate:final tidak berubah.
// Soal bergambar membawa `image` (file di public/assets/final/) dan opsi 図1〜図5.
import y2021 from './data/2021.json' with { type: 'json' };
import y2022 from './data/2022.json' with { type: 'json' };
import y2023 from './data/2023.json' with { type: 'json' };
import y2024 from './data/2024.json' with { type: 'json' };
import y2025 from './data/2025.json' with { type: 'json' };
import y2026 from './data/2026.json' with { type: 'json' };

// Kunci non-tunggal ujian asli lewat field OPSIONAL `accepted` (array key '1'-'5').
// DUPLIKAT SADAR di api/_final.mjs (buildReview tidak boleh menyeret modul konten
// ~1MB ke tiap cold start) — ubah dua-duanya.
export const isCorrectAnswer=(q,v)=>Array.isArray(q.accepted)?q.accepted.includes(v):v===q.answer;

// Bagian 1-5 × 25 soal = pembagian UI milik app (PK final_progress CHECK part 1..5),
// bukan pembagian mapel resmi — mapel resmi tersimpan per soal di `subject`.
const shape=(d)=>({year:d.year,exam:`第${d.kai}回`,examDate:d.examDate,totalQuestions:d.questions.length,available:true,parts:[1,2,3,4,5].map(part=>({part,from:(part-1)*25+1,to:part*25})),questions:d.questions});
export default Object.fromEntries([y2021,y2022,y2023,y2024,y2025,y2026].map(d=>[d.year,shape(d)]));
