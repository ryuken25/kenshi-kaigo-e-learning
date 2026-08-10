# 52 — PEROMBAKAN UI

## A. Daftar section

### Kartu baru

```
┌──────────────────────────────────────┐
│ ┌────┐  BAB 01                       │
│ │ ◈  │  人間の尊厳と自立               │
│ └────┘  Martabat & Kemandirian        │
│                                      │
│  Kenapa martabat jadi dasar dari     │
│  setiap tindakan perawatan.          │
│                                      │
│  ▓▓▓▓▓▓░░░░░░░░  4/10                │
│  ● ● ● ● ○ ○ ○ ○ ○ ○                 │
└──────────────────────────────────────┘
```

Perubahan dari yang sekarang:

| Sekarang | Jadi |
|---|---|
| "SECTION 01" | "BAB 01" — konsisten bahasa Indonesia |
| Judul Jepang saja | Judul Jepang + terjemahan Indonesia di bawahnya |
| Deskripsi terpotong "..." | Deskripsi muat penuh dalam 2 baris |
| Ikon emoji | Ikon SVG satu set |
| Bar progres kosong | Bar + titik per level, kelihatan berapa yang selesai |
| Tinggi kartu goyah | `grid-auto-rows: 1fr`, judul `min-height: 2.6em` |
| 12 dari 13 terkunci | 3 pertama terbuka |

### Ikon per bab

Satu set SVG, gaya sama: garis 2,5px, sudut bulat, satu warna dari palet
karakter aktif. Bukan emoji.

| Bab | Ikon | Alasan |
|---|---|---|
| 01 Martabat & Kemandirian | Dua telapak tangan menopang | Menopang, bukan mengambil alih |
| 02 Hubungan & Komunikasi | Dua balon percakapan bertumpuk | |
| 03 Pemahaman Masyarakat | Bangunan + orang | Sistem & lembaga |
| 04 Tubuh & Pikiran | Siluet kepala + garis detak | |
| 05 Perkembangan & Lansia | Tunas tumbuh jadi pohon | |
| 06 Demensia | Kepala + benang terurai lembut | Bukan otak realistis |
| 07 Disabilitas | Kursi roda + jalur landai | |
| 08 Perawatan Medis | Selang + tetesan | |
| 09 Dasar Kaigo | Tangan + tanda centang | |
| 10 Teknik Komunikasi | Telinga + gelombang suara | Mendengar, bukan bicara |
| 11 Teknik Dukungan Hidup | Sendok + gelas + handuk | |
| 12 Proses Kaigo | Lingkaran empat tahap | Asesmen → rencana → laksana → tinjau |
| 13 Soal Terpadu | Kertas ujian + pensil | |

Ikon 06 sengaja bukan gambar otak. Demensia bukan penyakit otak yang
digambar di poster medis — ini bab tentang mendampingi orang.

### Interaksi

- Ketuk kartu → **buka detail langsung**, jangan popover dua langkah
- Tekan → `translateY(3px)`, bayangan mengecil (`--shadow-btn`)
- Kartu bab yang sedang dikerjakan: border 2px warna aksen + label "Lanjut di sini"
- Bab terkunci: opacity 0,55, gembok kecil, ketuk → toast
  "Selesaikan Bab 3 dulu ya" — sebutkan **bab mana**, jangan pesan umum
- Muncul berurutan 45ms (maks 12 kartu, sisanya langsung tampil)

### Grid

```css
.section-grid {
  display: grid; gap: 12px;
  grid-template-columns: 1fr;              /* HP: satu kolom */
  grid-auto-rows: 1fr;
}
@media (min-width: 560px)  { .section-grid { grid-template-columns: 1fr 1fr; } }
@media (min-width: 1100px) { .section-grid { grid-template-columns: repeat(3, 1fr); } }
```

Di HP **satu kolom**, bukan dua. Dua kolom di 360px memaksa judul Jepang
patah — itu penyebab `コミュニケ / ーション` di screenshot. Satu kolom
memberi ruang untuk judul + terjemahan + deskripsi utuh.

---

## B. Teks Jepang jangan patah

```css
.jp {
  line-break: strict;        /* kinsoku shori: ー、っ、、。tidak di awal baris */
  word-break: normal;
  overflow-wrap: anywhere;   /* jaring terakhir */
}
.section-card__title {
  font-size: clamp(17px, 4.2vw, 21px);
  min-height: 2.6em;
}
```

Uji dengan judul terpanjang: `コミュニケーション技術` dan
`こころとからだのしくみ` (11 karakter). Kalau masih patah di tengah,
kecilkan font — jangan biarkan patah.

---

## C. Hapus teks pengisi, ganti kutipan

Hapus:
```
Belajar merawat dengan hati.
13 bab · 152 level · dikerjakan sedikit demi sedikit.
```
Kalimat begini tidak menambah apa pun setelah dibaca sekali.

Ganti dengan kutipan acak tiap muat ulang — `data/quotes.json`, 20 kutipan,
campuran pepatah Jepang (dengan terjemahan) dan kalimat praktis soal merawat.

```
       継続は力なり
       Ketekunan itu sendiri adalah kekuatan.
```

Acak dengan benih tanggal supaya **tidak berubah di tengah sesi** —
kutipan yang berganti waktu orang lagi baca itu mengganggu:

```js
const seed = new Date().toISOString().slice(0, 10) + userId;
const i = hash(seed) % quotes.length;
```

Ganti tiap hari, bukan tiap render.

---

## D. Hapus label internal

`official-style · easy` → hapus dari UI. Itu metadata untuk pembuat konten.

Kalau mau menampilkan asal soal, yang berguna buat pelajar:
```
第31回 · 2019          ← asal soal, bisa dicocokkan dengan buku
● ○ ○                  ← tingkat kesulitan sebagai titik
```

Bukan `easy` dalam bahasa Inggris di aplikasi berbahasa Indonesia.

---

## E. Emoji → aset karakter

Ganti 📖 🔎 🌸 🔥 dan sejenisnya dengan PNG/SVG yang mengikuti karakter aktif:

| Emoji sekarang | Ganti jadi |
|---|---|
| 📖 (Materi) | Ikon buku bergaya, warna aksen karakter |
| 🔎 (Istilah di kartu ini) | Ikon kaca pembesar satu set |
| 🔥 (streak) | Ikon api bergaya, menyala/abu |
| 🌸 (XP) | Lambang khas karakter — sakura untuk Momo, tetes awan untuk Sora, bulan sabit untuk Kurumi |
| 🏅 (achievement) | Lencana per tingkat |

Aturan: **nol emoji di elemen UI tetap.** Emoji boleh muncul di teks
percakapan maskot ("Yeay! 🌸") karena di situ dia memang ekspresi, bukan ikon.

---

## F. Kotak "Istilah di kartu ini"

Sekarang enam istilah ditumpuk vertikal, masing-masing tiga baris —
memakan lebih dari satu layar penuh.

Jadi chip mendatar yang bisa diketuk:

```
🔎 Istilah di kartu ini
┌────────┐ ┌────────┐ ┌──────────┐
│  報告   │ │  自立   │ │ 自立支援  │  →
│houkoku │ │ jiritsu│ │jiritsu…  │
└────────┘ └────────┘ └──────────┘
```

Ketuk → bottom sheet berisi kanji besar, kana, romaji, arti, contoh kalimat,
tombol "Halaman lengkap". Chip menampilkan kanji + romaji saja.

Hemat sekitar 400px ruang vertikal di HP.

---

## G. TTS yang tidak ngebug

Tombol `用語を聞く · Dengarkan istilah` sekarang bercampur dua bahasa dan
tidak jelas membacakan apa.

### Masalah umum `speechSynthesis`

| Masalah | Penanganan |
|---|---|
| `getVoices()` kosong saat pertama dipanggil | Tunggu event `voiceschanged` sebelum menandai siap |
| Tidak ada suara Jepang di perangkat | **Sembunyikan tombolnya**, jangan tampilkan lalu gagal |
| iOS butuh interaksi user | Panggil hanya dari handler klik, jangan autoplay |
| Ucapan menumpuk kalau diketuk cepat | `cancel()` sebelum `speak()` |
| Kanji dibaca dengan bacaan salah | **Ucapkan kana, bukan kanji** — pakai `toKana()` dari teks beranotasi |
| Tetap berbunyi setelah pindah halaman | `cancel()` di cleanup |
| Kecepatan bawaan terlalu cepat | `rate = 0.85` untuk pemula |

Poin "ucapkan kana" itu yang paling penting. `行` bisa dibaca `い`, `おこな`,
`ぎょう`, `こう` — mesin TTS akan menebak, dan tebakannya sering salah.
Karena teks sudah beranotasi `漢字[かな]`, `toKana()` menghasilkan bacaan
yang **pasti benar**. Kirim itu ke TTS.

Kode: `snippets/tts.js`.

### UI tombol
```
[ ♪ ]  Dengarkan          ← satu bahasa, ikon jelas
```
Saat berbunyi: ikon jadi gelombang beranimasi + tombol jadi "Berhenti".
Kalau tidak ada suara Jepang: tombol tidak dirender sama sekali.

---

## H. Kontras tombol — wajib

Nilai terukur, bukan perkiraan:
```
#FFFFFF di #FF6F9C = 2.62  GAGAL
#3A2A33 di #FF6F9C = 5.14  OK
```

Pakai `btnBg` / `btnText` dari `data/characters.json`. Sudah diverifikasi
lolos untuk keenam karakter.
