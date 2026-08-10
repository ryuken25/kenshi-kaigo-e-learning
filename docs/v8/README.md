# Kaigo Kitty — Pack v8: Audit + Perombakan UI/UX

## Isi

| File | Isi |
|---|---|
| `48-BUG-AUDIT.md` | Bug dari screenshot + kontras terukur + selisih klaim vs repo |
| `49-CHARACTER-SYSTEM.md` | 6 karakter, palet per karakter, unlock, pasangan per gender |
| `50-AUTH-GATE.md` | Wajib login, mode tamu dihapus |
| `51-LANGUAGE-MODES.md` | ⭐ Romaji jangan hilang di mode ID |
| `52-UI-OVERHAUL.md` | Daftar bab, ikon, kutipan, emoji, TTS, kontras |
| `53-QA-V8.md` | 57 test |
| `snippets/kanaToRomaji.js` | Kana → romaji Hepburn. **19/20 test lulus** |
| `snippets/tts.js` | TTS produksi + hook React |
| `data/characters.json` | 6 karakter, palet lengkap, **semua lolos kontras** |
| `data/quotes.json` | 20 kutipan belajar |

## Empat temuan yang paling penting

**1. Teks Jepang patah di tengah kata.** `コミュニケ / ーション` — `ー`
tidak boleh memulai baris (kinsoku shori). Penyebabnya grid 2 kolom di HP.
Perbaikan: satu kolom di HP + `line-break: strict`.

**2. Kontras tombol utama gagal — dan angka yang gue kasih di pack v2 salah.**
Terukur: `#FFFFFF` di `#FF6F9C` = **2,62:1**, bukan 4,6:1 seperti yang gue
tulis dulu. Perbaikan terbaik bukan menggelapkan pinknya, tapi memakai
**teks tinta gelap** di atas pink terang → 5,14:1, dan kesan pastelnya tetap.

**3. Romaji hilang di mode ID.** Justru orang yang membaca versi Indonesia
yang paling butuh tahu cara melafalkannya. Romaji sekarang tampil di ketiga mode.

**4. Romaji di seed glossary gue ada yang salah.** `統合失調症` tertulis
`shicchoushou`, seharusnya `shitchoushou` (っち → tch, seperti 抹茶 → matcha).
Hasilkan ulang seluruh romaji dari `kanaToRomaji.js`, jangan ketik tangan.

## Soal Sanrio

Gue gak bisa bantu ambil gambar Hello Kitty / Kuromi / Cinnamoroll dari Google,
hapus latarnya, dan pasang di produk yang sudah live di domain publik.
Alasannya di `49-CHARACTER-SYSTEM.md` — singkatnya, karakter sekarang jadi
arsitektur fitur, bukan tempelan, jadi kalau kena takedown yang dibongkar
bukan cuma gambarnya.

Yang gue kerjakan: **seluruh sistemnya** — 6 karakter dengan palet sendiri
termasuk warna bayangan, pasangan awal per gender, unlock level 5, sisanya
menyusul — dengan karakter orisinal. Rasa koleksi dan personalisasinya tetap.

| Karakter | Warna | Terbuka |
|---|---|---|
| Momo (kucing) | Pink | Bawaan |
| Kurumi (kelinci malam) | Ungu | Awal, perempuan |
| Sora (anjing awan) | Biru | Awal, laki-laki |
| Kinako (anjing kue) | Kuning | Level 5 |
| Nagi (pinguin) | Teal | Menyusul |
| Beni (rubah) | Merah bata | Menyusul |

## Yang perlu lu cek sendiri

Repo di GitHub hari ini menunjukkan **18 commit**, tanpa folder `.github/`,
`docs/`, atau `sql/` — sementara laporan agent menyebut commit `6d5bcb7`
dan `91fe39e` sudah di-push dan CI sudah hijau. Mungkin halamannya ter-cache,
mungkin push-nya belum mendarat. Gue gak bisa memastikan (API GitHub kena
rate limit).

```bash
git log --oneline -5
git ls-remote origin main     # bandingkan SHA-nya
gh run list --limit 5
```

Dua menit sekarang, jauh lebih murah daripada menemukannya sepuluh commit lagi.
