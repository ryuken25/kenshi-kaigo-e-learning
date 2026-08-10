# Kaigo Kitty — Pack v7: Audit Progres & Mutu Terjemahan

Audit atas apa yang sudah mendarat, plus perbaikan untuk masalah yang
lu laporkan: **"kanji/furi udah bener, tapi terjemahan Indonesia gak lengkap terus."**

## Temuan utama

Terjemahan Indonesia bukan tidak lengkap — **isinya kalimat cetakan.**

```
Mode 漢字 : 3 paragraf materi lengkap (~200 karakter)
Mode ID   : "事例の読み方 adalah materi penting. Hubungkan teori dengan
             martabat, keamanan, pilihan, dan kehidupan pengguna."
```

Kalimat yang sama dipakai berulang di banyak kartu, judulnya saja yang diganti.
Yang berbahasa Indonesia tidak mendapat materinya sama sekali.

**Dan ini lolos karena lubang di validator gue sendiri.**
`audit-content-coverage.mjs` dari pack v6 cuma memeriksa apakah field `id` kosong.
Field-nya terisi — isinya saja yang bukan terjemahan.

## Isi

| File | Isi |
|---|---|
| `43-AUDIT-REPORT.md` | Yang sudah mendarat ✅ dan yang masih rusak ❌ |
| `44-TRANSLATION-QUALITY.md` | ⭐ Auditor baru + cara menambal + prompt terjemah ulang |
| `45-FINAL-TEST-STRUCTURE.md` | 5 bagian vs 3 part, plus kesalahan hitung di sumbernya |
| `46-REMAINING-GAPS.md` | Checklist bawaan v1–v6.1 yang belum tertutup |
| `47-QA-V7.md` | Test acceptance |
| `scripts/audit-translation-quality.mjs` | Auditor mutu terjemahan |

## Auditor baru — sudah dites

Enam pemeriksaan: kanji bocor ke ID · rasio panjang · jumlah paragraf ·
frasa cetakan · **kerangka kalimat berulang** · kombinasi penanda.

```
Data uji: 4 kartu template + 1 dipotong + 1 terjemahan benar

field diperiksa : 6
error           : 19
per jenis       : { japanese_in_id: 4, too_short: 5, paragraph_loss: 5,
                    filler_phrase: 4, template: 1 }
```

Kelima yang bermasalah tertangkap. Yang terjemahannya benar lolos bersih —
tidak ada positif palsu.

Pemeriksaan yang paling menentukan adalah **kerangka kalimat berulang**:
buang bagian yang berubah-ubah (judul, angka), sisakan kerangkanya,
hitung kemunculannya. Kerangka sama di ≥3 kartu bukan kebetulan.

## Yang perlu diputuskan

**Struktur Final Test.** Dokumen yang lu kirim bilang ujian resmi dibagi
3 part (A=60, B=45, C=20), sementara spec v5 pakai 5 bagian × 25 sesuai
permintaan lu. Sebelum 750 soal diisi, ini harus diputuskan.

Catatan: rincian di dokumen itu ada kesalahan hitung — Part A dirinci
per mata pelajaran hasilnya **58**, bukan 60, dan totalnya **123**, bukan 125.
Verifikasi ke `sssc.or.jp` dulu. Detailnya di `45-FINAL-TEST-STRUCTURE.md`.

## Kabar baik

Furigana yang gagal tiga kali itu **sekarang beres**. Dari dumping halaman:
`事例[じれい]`, `読[よ]み方[かた]`, `介護福祉士[かいごふくしし]` — semuanya benar,
mode 漢字 dan ふり dua-duanya jalan. Migrasi 006 dan 007 sudah live di Neon,
`kaigo.wyna.dev` sudah 200.
