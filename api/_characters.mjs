// Karakter orisinal (doc 49) — satu-satunya sumber daftar karakter di server.
// 6 karakter: momo/kurumi/sora/kinako/nagi/beni. Nagi & Beni "menyusul" —
// tampil abu "Segera hadir" di UI dan TIDAK punya jalur unlock (lihat doc 49:
// tanpa gembok yang tidak pernah terbuka). Server menolak keduanya di-set,
// kecuali user memang sudah punya di characters_unlocked (jalur admin/manual).
export const CHARACTERS = ['momo', 'kurumi', 'sora', 'kinako', 'nagi', 'beni'];
export const UNLOCKABLE = new Set(['momo', 'kurumi', 'sora', 'kinako']);

// Urutan unlock berdasar jumlah level completed (007 seed + aturan doc 49):
//   level 5  → pasangan gender yang belum kepilih (kurumi/sora)
//   level 15 → kinako
// Kunci harus MENAIK — loop grant berhenti di syarat pertama yang belum tercapai.
export const LEVEL_UNLOCKS = [
  { completed: 5, id: 'sora' },
  { completed: 5, id: 'kurumi' },
  { completed: 15, id: 'kinako' },
];

// Pasangan awal onboarding per gender — HARUS sama dengan GENDER_PAIRS di
// src/lib/social.jsx (yang dipakai OnboardingWizard menampilkan pilihannya) dan
// dengan backfill migrasi 008. Kolom characters_unlocked default-nya cuma
// ARRAY['momo'], jadi user yang dibuat SESUDAH 008 tidak pernah menerima pasangan
// ini dari mana pun: setiap pilihan selain momo di onboarding ditolak 403
// character_locked dan langkah 1 tidak pernah selesai. api/profile.mjs memberikannya
// saat gender di-set (idempoten), persis seperti yang 008 lakukan untuk user lama.
export const STARTER_PAIRS = {
  male: ['momo', 'sora'],
  female: ['momo', 'kurumi'],
  other: ['momo', 'kurumi', 'sora'],
  prefer_not: ['momo'],
};
