# 48 — AUDIT BUG

## A. Dari screenshot daftar section

### A1 — Teks Jepang patah di tengah kata ⭐
```
人間関係とコミュニケ      ← salah
ーション

こころとからだのしく
み

コミュニケーション技
術
```

`ー` (choonpu) **tidak boleh** memulai baris — itu aturan kinsoku shori dalam
penataan teks Jepang. Sama seperti tanda koma tidak boleh jatuh di awal baris
dalam bahasa Latin. Buat orang yang sedang belajar membaca kanji, ini terbaca
seperti dua kata terpisah.

```css
.jp-title {
  line-break: strict;          /* aktifkan kinsoku shori */
  word-break: normal;
  overflow-wrap: anywhere;     /* hanya kalau benar-benar tidak muat */
  hanging-punctuation: allow-end;
}
```

Kalau judulnya tetap tidak muat dalam 2 baris, **kecilkan fontnya**, jangan
biarkan patah. Judul terpanjang: `コミュニケーション技術` (11 karakter) dan
`こころとからだのしくみ` (11 karakter). Kartu selebar 300px dengan font 19px
muat 11 karakter dalam 2 baris — jadi turunkan judul ke `clamp(17px, 4.5vw, 20px)`.

### A2 — Deskripsi terpotong "..."
```
Kenapa martabat jadi dasar tiap t...
Membangun kepercayaan lewat c...
Apa yang berubah seiring bertam...
```
Semua terpotong di tengah kata. Ini bukan ringkasan, ini kalimat yang hilang.

Perbaikan: tulis deskripsi yang memang muat dalam **2 baris penuh** (maks
~52 karakter), lalu `-webkit-line-clamp: 2` sebagai jaring pengaman —
bukan sebagai cara utama.

### A3 — Tinggi kartu tidak seragam
Baris pertama: kartu kiri lebih pendek dari kanan karena judulnya 1 baris
vs 2 baris. Bikin grid terlihat goyah.

```css
.section-grid { display: grid; grid-auto-rows: 1fr; }
.section-card { display: flex; flex-direction: column; height: 100%; }
.section-card__title { min-height: 2.6em; }   /* selalu sedia 2 baris */
```

### A4 — Ikon emoji tidak konsisten
🌺 💗 🏠 ❤️ 🌷 🧠 🧸 🩺 🍓 💭 🛁 📋 — campur bunga, hati, rumah, organ,
boneka, stetoskop, buah, balon pikiran. Tidak ada logika yang menghubungkan
🍓 dengan 介護の基本 atau 🌷 dengan 発達と老化の理解.

Selain itu emoji dirender oleh font sistem, jadi bentuknya berbeda di iOS
dan Android — identitas visualnya tidak terkendali.

Ganti dengan ikon SVG bikinan sendiri, satu set, gaya sama. Lihat `52-UI-OVERHAUL.md`.

### A5 — Semua section terkunci "preview"
12 dari 13 section terkunci. Buat orang yang baru buka, layar ini didominasi
gembok. Saran: buka **3 section pertama**, sisanya terkunci. Cukup untuk
memberi arah tanpa terasa seperti tembok.

### A6 — Latar gradien hijau-teal di tepi
Tidak nyambung dengan palet manapun. Kalau ini sisa gradien lama, hapus;
latar cukup `--bg` datar.

---

## B. Kontras tombol utama — terukur, dan spec gue sebelumnya salah

Pack v2 menyebut `#FF6F9C` + teks putih = 4,6:1. **Itu keliru.**
Nilai terukurnya:

```
#FFFFFF di #FF6F9C  = 2.62   GAGAL (min 4.5)
#3A2A33 di #FF6F9C  = 5.14   OK
```

Jadi tombol "Lanjut" / "Periksa" yang sekarang **gagal kontras**. Di HP
di bawah matahari, praktis tidak terbaca.

Dua jalan keluar, dan yang pertama lebih baik:

| Cara | Hasil | Efek |
|---|---|---|
| Pink terang + **teks tinta gelap** | 5,14:1 ✓ | Tetap pastel, tetap imut |
| Pink digelapkan ke `#C22A5E` + putih | 5,55:1 ✓ | Lolos, tapi kehilangan kesan pastel |

`data/characters.json` sudah memakai cara pertama untuk karakter berwarna
terang (Momo, Kinako) dan cara kedua untuk yang gelap (Kurumi, Sora, Nagi, Beni).
Semua sudah diverifikasi lolos.

---

## C. Kesalahan di data gue sendiri

Romaji `統合失調症` di seed glossary v4 tertulis `tougou shicchoushou`.
Yang benar **`tougou shitchoushou`** — `っち` jadi `tch` dalam Hepburn,
sama seperti 抹茶 → `matcha`, bukan `maccha`.

`snippets/kanaToRomaji.js` menghasilkan bentuk yang benar (19/20 test lulus;
satu "kegagalan" ternyata ekspektasi tesnya yang salah). Pakai konverter itu
untuk **menghasilkan ulang seluruh field romaji** di glossary, jangan diketik tangan.

---

## D. Selisih antara klaim dan isi repo

Per pemeriksaan hari ini, `github.com/ryuken25/kenshi-kaigo-e-learning`
menampilkan:

- **18 commit** — sama seperti pemeriksaan sebelum pack v5
- Tidak ada folder `.github/` → workflow CI tidak ada di repo
- Tidak ada folder `docs/` → dokumen v7 tidak ada
- Tidak ada folder `sql/` → migrasi masih di `scripts/`
- `.backup/20260804_145646/` masih ter-commit
- `public/assets/hellokitty/` masih ada
- README masih memuat route lama saja (tanpa `/final`, `/friends`, `/leaderboard`)

Sementara laporan agent menyebut commit `6d5bcb7` dan `91fe39e` sudah di-push
ke main, dan CI GitHub Actions "sudah jalan: ✅ success".

Dua kemungkinan: halaman GitHub yang gue baca ter-cache, atau push-nya tidak
mendarat di remote ini. Gue tidak bisa memastikan yang mana — API GitHub
kena rate limit waktu gue coba.

**Cara memastikan, jalankan sendiri:**
```bash
git log --oneline -5
git status -sb                    # cek "ahead of origin"
git ls-remote origin main         # SHA di remote
gh run list --limit 5             # riwayat CI
```
Kalau `git log` lokal menunjukkan commit itu tapi `git ls-remote` menunjukkan
SHA lama, berarti push-nya belum mendarat.

Ini bukan tuduhan — ini satu-satunya cara memisahkan "sudah jalan" dari
"dilaporkan sudah jalan", dan lebih murah dikerjakan sekarang daripada
setelah menumpuk sepuluh commit lagi.
