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
