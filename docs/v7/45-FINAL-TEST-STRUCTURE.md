# 45 — STRUKTUR FINAL TEST: 5 BAGIAN vs 3 PART

Dokumen yang lu kirim menyebut struktur ujian resmi **3 part** (A/B/C),
sementara spec v5 memakai **5 bagian × 25 soal** sesuai permintaan lu waktu itu.
Perlu diputuskan sebelum 750 soal diisi.

## Ada kesalahan aritmetika di dokumen itu

Sebelum apa pun dibangun di atasnya, cek dulu angkanya:

**Part A, katanya 60 soal:**
```
Perkembangan & lansia      8
Demensia                  10
Disabilitas               10
Tubuh & pikiran           12
Martabat & kemandirian     2
Hubungan & komunikasi      4
Pemahaman masyarakat      12
──────────────────────────
                          58   ← bukan 60
```

**Part B, katanya 45:** 10 + 6 + 26 + 3 = **45** ✓
**Part C, katanya 20:** 5 + 12 + 3 = **20** ✓

**Total: 58 + 45 + 20 = 123**, bukan 125. Ada 2 soal yang tidak terhitung.

Kemungkinannya: ada mata pelajaran yang terlewat di rincian Part A
(kandidat: 介護の基本 atau 介護過程 yang mungkin masuk Part A, bukan B).

**Jangan bangun data di atas angka ini sebelum diverifikasi** ke
`sssc.or.jp` — itu situs resmi penyelenggara ujian. Kalau pembagian
per bagian salah, seluruh 750 soal harus dipetakan ulang nanti.

Sumber `agaroot.jp` dan `kaigojob-academy.com` itu situs kursus, bukan
penyelenggara. Berguna sebagai rujukan, tapi bukan sumber akhir.

## Dua pilihan

### A. Tetap 5 bagian × 25 (spec v5)
- Sesuai permintaan lu semula
- Tiap sesi 25 soal ≈ 35 menit — enak dikerjakan di sela kerja shift
- Pembagiannya sederhana: 1–25, 26–50, 51–75, 76–100, 101–125
- **Tidak** mencerminkan struktur ujian aslinya

### B. Ikut 3 part resmi (A=60, B=45, C=20)
- Mencerminkan ujian sungguhan, termasuk sistem kelulusan per part
  kalau memang sudah berlaku
- Part A 60 soal ≈ 85 menit — berat untuk sekali duduk di HP
- Butuh pemetaan mata pelajaran → part yang akurat per tahun
- Struktur ini **berubah antar tahun**; data lama (2021–2023) mungkin
  belum pakai pembagian ini

### C. Keduanya — yang gue sarankan

Simpan soal dengan `subjectGroup` dan nomor asli, lalu **pembagian jadi
lapisan tampilan**, bukan bagian dari data.

```json
{
  "year": 2026,
  "views": [
    { "id": "official", "label": "Ikut ujian asli", "parts": [
        { "part": "A", "from": 1,  "to": 60 },
        { "part": "B", "from": 61, "to": 105 },
        { "part": "C", "from": 106,"to": 125 } ] },
    { "id": "bite", "label": "Sesi pendek", "parts": [
        { "part": 1, "from": 1,   "to": 25 },
        { "part": 2, "from": 26,  "to": 50 },
        { "part": 3, "from": 51,  "to": 75 },
        { "part": 4, "from": 76,  "to": 100 },
        { "part": 5, "from": 101, "to": 125 } ] }
  ]
}
```

User memilih di halaman tahun:

```
┌─────────────────────────────────┐
│  2026 · 第38回                   │
│  Mau dikerjakan bagaimana?      │
│  ( ) Ikut ujian asli — 3 part   │
│  (•) Sesi pendek — 5 × 25 soal  │
└─────────────────────────────────┘
```

Keuntungannya: satu kumpulan soal, dua cara mengerjakan, dan kalau
pembagian resmi ternyata berubah lagi, yang diedit cuma `views` —
bukan 125 baris soal.

### Dampak ke database

`final_progress` sekarang memakai `part int CHECK (part BETWEEN 1 AND 5)`.
Untuk mendukung kedua tampilan, perlu:

```sql
ALTER TABLE final_progress ADD COLUMN IF NOT EXISTS view_id text NOT NULL DEFAULT 'bite';
ALTER TABLE final_progress ADD COLUMN IF NOT EXISTS part_key text;

UPDATE final_progress SET part_key = part::text WHERE part_key IS NULL;

ALTER TABLE final_progress DROP CONSTRAINT IF EXISTS final_part_range;

DO $$ BEGIN
  ALTER TABLE final_progress ADD CONSTRAINT final_part_key_valid
    CHECK (part_key ~ '^([1-5]|[ABC])$');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
```

Kunci utamanya jadi `(user_id, year, view_id, part_key)`. Progres di
tampilan "sesi pendek" dan "ujian asli" dihitung terpisah — itu memang
seharusnya, karena kondisi mengerjakannya beda.

Total per tahun tetap diturunkan dari soal yang benar, bukan dari bagian,
jadi angka 125-nya tetap konsisten di kedua tampilan.

## Yang perlu diverifikasi dulu

1. Pembagian resmi per part untuk **tiap tahun** 2021–2026 —
   struktur 3 part kemungkinan baru berlaku dari 第37回 atau 第38回
2. Kesalahan 2 soal di rincian Part A
3. Apakah sistem kelulusan per part sudah berlaku, dan berapa lama
   kelulusan sebagian itu berlaku
4. Apakah 11 rumpun mata pelajaran masih sama setelah perubahan struktur

Semuanya dari `sssc.or.jp`. Ini menyangkut ujian sertifikasi orang —
salah struktur berarti mereka berlatih dengan pembagian yang keliru.
