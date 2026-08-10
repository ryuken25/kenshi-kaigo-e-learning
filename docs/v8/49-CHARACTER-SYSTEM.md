# 49 — SISTEM KARAKTER

## Soal Sanrio — sekali, lalu lanjut

Gue gak bisa bantu bikin alur ambil gambar Hello Kitty / Kuromi / Cinnamoroll /
Pompompurin dari Google, hapus latarnya, dan pasang di produk yang sudah live
di domain publik.

Bukan karena aturan kaku — tapi karena taruhannya sekarang beda dari waktu ini
masih eksperimen di localhost:

- `kaigo.wyna.dev` sudah publik dan terindeks
- Karakter jadi **arsitektur fitur** (pilihan awal, unlock level 5, roadmap
  Pompompurin dkk), bukan sekadar tempelan yang gampang dicabut
- Sanrio termasuk pemegang IP yang paling aktif menegakkan haknya, dan
  aplikasi belajar berbayar/berpengguna adalah target yang jelas
- Gambar hasil hapus latar tetap karya turunan — menghilangkan latar tidak
  mengubah status hak ciptanya

Kalau app ini kena takedown, yang hilang bukan cuma gambarnya: seluruh sistem
karakter, palet, unlock, dan aset harus dibongkar ulang. Lebih murah dibangun
benar sekarang.

**Yang gue kerjakan:** seluruh sistem yang lu minta — enam karakter, palet
sendiri per karakter termasuk warna bayangan, pasangan awal per gender,
unlock di level 5, sisanya menyusul — dengan karakter orisinal.

Lu tetap dapat rasa koleksi dan personalisasinya. Yang gak dipakai cuma
desain milik orang lain.

---

## Enam karakter

Data lengkap: `data/characters.json`. Semua palet **sudah diverifikasi kontras**.

| Karakter | Jenis | Warna | Sifat | Terbuka |
|---|---|---|---|---|
| **Momo** | Kucing putih | Pink | Hangat, telaten | Bawaan, semua |
| **Kurumi** | Kelinci malam | Ungu | Jenaka, sedikit nakal | Awal untuk perempuan |
| **Sora** | Anjing awan | Biru | Tenang, sabar | Awal untuk laki-laki |
| **Kinako** | Anjing kue | Kuning | Santai, ramah | Level 5 |
| **Nagi** | Pinguin laut | Teal | Cermat, teliti | Menyusul |
| **Beni** | Rubah senja | Merah bata | Bersemangat | Menyusul |

### Desain (untuk yang menggambar)

- **Momo** — kucing putih bulat, pita sakura di atas kanan kepala, celemek
  perawat pink dengan saku, **punya mulut kecil**, pipi merona
- **Kurumi** — kelinci abu gelap, telinga panjang jatuh sebelah, topi kecil
  ungu-hitam, senyum miring, ekor bulat
- **Sora** — anjing putih telinga panjang menggantung, syal biru langit,
  mata bulat tenang
- **Kinako** — anjing kuning gempal, baret cokelat, badan seperti puding
- **Nagi** — pinguin kecil teal, memegang papan catatan
- **Beni** — rubah merah bata, ekor tebal, telinga runcing

Semua **SVG bikinan sendiri**, 6 ekspresi per karakter (idle, senang, sedih,
ngantuk, kaget, tepuk tangan). Anggaran: < 3KB per SVG, < 110KB total.

Aturan supaya tidak tanpa sengaja mirip karakter yang ada: setiap karakter
**punya mulut**, dan proporsi kepala-badan dibuat 1:1,2 (bukan kepala besar
tanpa badan). Dua hal itu yang paling membedakan.

---

## Palet per karakter

Tiap karakter membawa temanya sendiri — bukan cuma warna aksen, tapi
latar, permukaan, tinta, **warna bayangan**, dan warna furigana.

```json
{
  "id": "kurumi",
  "p50":"#F5F1FC", "p100":"#E7DEF8", "p300":"#C3AEEB",
  "p400":"#A98FE0", "p500":"#8B6FD4", "p600":"#5F42A8",
  "bg":"#FAF8FE", "surface":"#FFFFFF", "surface2":"#F5F1FC",
  "ink":"#2E2440", "soft":"#6B6080",
  "shadow":"#B9A4E4",          // bayangan padat ala tombol fisik
  "furi":"#7A6E90",
  "btnBg":"#5F42A8", "btnText":"#FFFFFF", "btnContrast": 7.42
}
```

### Kenapa ada `btnBg` terpisah dari `p500`

Karena warna aksen yang cantik belum tentu lolos kontras sebagai isian tombol.
Hasil pengukuran:

```
Momo    #FF6F9C + tinta gelap  = 5.14  OK   (pastel dipertahankan)
Kurumi  #5F42A8 + putih        = 7.42  OK
Sora    #1F5F9E + putih        = 6.59  OK
Kinako  #D99A16 + tinta gelap  = 5.23  OK
Nagi    #136B58 + putih        = 6.42  OK
Beni    #95300F + putih        = 7.76  OK
```

Untuk karakter berwarna terang (Momo, Kinako), isian tetap terang dan
**teksnya yang digelapkan** — jadi kesan pastelnya tidak hilang.

### Penerapan

`<html data-char="kurumi">` mengganti seluruh blok variabel. Semua komponen
sudah memakai `var(--kk-*)`, jadi tidak ada komponen yang perlu diubah.

Bayangan ikut ganti:
```css
--shadow-btn: 0 4px 0 var(--kk-shadow);
--shadow-card: 0 2px 12px color-mix(in srgb, var(--kk-shadow) 45%, transparent);
```

---

## Alur pemilihan

```
Onboarding
  └─ Pilih gender
       laki-laki  → pasangan awal: Momo + Sora
       perempuan  → pasangan awal: Momo + Kurumi
       lainnya    → pasangan awal: Momo + Kurumi + Sora (ketiganya)
       tidak isi  → Momo saja

  └─ Pilih karakter dari pasangan itu → tema langsung terpasang
```

**Level 5** → karakter ketiga terbuka (yang dari pasangan gender satunya).
Notifikasi: "Sora sekarang bisa dipakai! 🌸"

**Level 15** → Kinako terbuka.

**Nagi & Beni** → tampil di kisi dalam keadaan abu dengan label
"Segera hadir" — bukan gembok, karena tidak ada syarat yang bisa dikejar.
Menampilkan yang belum ada itu bagus: memberi tahu ada lanjutannya.
Yang tidak bagus adalah memasang gembok yang tidak pernah terbuka.

### Ganti karakter kapan saja

Di `/profile/settings` → kisi karakter. Yang terbuka bisa dipakai bebas,
tidak ada cooldown. Ini beda dari handle: ganti karakter tidak merugikan
siapa pun.

Karena tema ikut karakter, mengganti karakter = mengganti tema. Itu memang
yang diinginkan, dan lebih intuitif daripada dua setelan terpisah.

---

## Database

```sql
ALTER TABLE app_users ADD COLUMN IF NOT EXISTS character_id text NOT NULL DEFAULT 'momo';
ALTER TABLE app_users ADD COLUMN IF NOT EXISTS characters_unlocked text[] NOT NULL DEFAULT ARRAY['momo'];

DO $$ BEGIN
  ALTER TABLE app_users ADD CONSTRAINT app_users_character_valid
    CHECK (character_id IN ('momo','kurumi','sora','kinako','nagi','beni'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
```

Kolom `theme` lama bisa ditinggalkan; karakter yang menentukan tema sekarang.
Petakan nilai lama: `sakura→momo`, `sora→sora`, `matcha→nagi`, `yozora→kurumi`.

Server **wajib** memeriksa karakter yang dipilih ada di `characters_unlocked`.
Kalau tidak, orang bisa memakai karakter terkunci lewat API.
