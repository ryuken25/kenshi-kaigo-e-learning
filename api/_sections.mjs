// ============================================================================
// SUMBER KEBENARAN JUMLAH LEVEL PER SECTION (sisi server).
//
// WAJIB sinkron dengan array `plans` di src/data.js — yaitu elemen ke-3 tiap
// entry plans (levelCount) yang juga = panjang array `topics` entry itu.
// Urutan array di bawah = sectionId 1..13.
//
// src/data.js SENGAJA TIDAK diimport dari sini: file itu membangun seluruh
// content tree saat import (152 level x 5 materi + 5 soal, ~1.4 MB objek),
// sementara setiap cold start Vercel Function cuma butuh 13 angka ini.
//
// Drift dijaga otomatis: `npm run validate:sections`
// (scripts/validate-sections.mjs) import src/data.js DAN file ini lalu
// bandingkan angkanya, exit non-zero kalau beda. Habis ngubah `plans`,
// jalankan script itu.
// ============================================================================
export const SECTION_LEVELS = [10, 10, 15, 13, 10, 12, 12, 9, 12, 10, 17, 10, 12];
export const SECTION_COUNT = SECTION_LEVELS.length;

// Total level di satu section. 0 kalau sectionId di luar range.
export const levelsInSection = (sectionId) => SECTION_LEVELS[Number(sectionId) - 1] || 0;

export const isValidSection = (sectionId) => Number.isInteger(sectionId) && sectionId >= 1 && sectionId <= SECTION_COUNT;
export const isValidLevel = (sectionId, levelId) => isValidSection(sectionId) && Number.isInteger(levelId) && levelId >= 1 && levelId <= levelsInSection(sectionId);

// Persen completion satu section (dibulatkan) — untuk display saja, JANGAN dipakai sebagai gate.
export const sectionPercent = (completed, sectionId) => { const t = levelsInSection(sectionId); return t ? Math.round((completed / t) * 100) : 0; };

// Gate resmi: section dianggap cukup selesai kalau >=80% levelnya completed.
// Sengaja integer math (completed*5 >= total*4), bukan float / persen yang sudah dibulatkan,
// biar tidak ada off-by-one: section yang 100% completed SELALU lolos gate-nya sendiri,
// berapapun jumlah levelnya (5n >= 4n selalu benar).
export const meetsSectionGate = (completed, sectionId) => { const t = levelsInSection(sectionId); return t > 0 && completed * 5 >= t * 4; };

// Jumlah level minimum yang harus completed supaya lolos gate 80%.
export const levelsNeededForGate = (sectionId) => Math.ceil(levelsInSection(sectionId) * 4 / 5);
