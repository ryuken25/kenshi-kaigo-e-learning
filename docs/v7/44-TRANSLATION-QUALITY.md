# 44 — MUTU TERJEMAHAN ⭐

## Kenapa ini lolos sampai production

`audit-content-coverage.mjs` memeriksa: **apakah `id` kosong?**
Jawabannya tidak — field-nya terisi. Lolos.

Yang tidak diperiksa: **apakah isinya benar-benar terjemahan?**

Ini kesalahan spec di pack v6. Auditor baru menutupnya.

## Auditor baru

`scripts/audit-translation-quality.mjs` — enam pemeriksaan:

| # | Pemeriksaan | Menangkap |
|---|---|---|
| 1 | Jepang bocor ke `id` | Judul kanji muncul di mode ID (> 4 karakter CJK) |
| 2 | Rasio panjang | `len(id) / len(ja)` < 0,9 → terjemahan dipotong |
| 3 | Jumlah paragraf | Sumber 3 paragraf, terjemahan 1 → ada yang hilang |
| 4 | Frasa cetakan | "adalah materi penting", "hubungkan teori dengan", "TBD", dst |
| 5 | **Kerangka kalimat berulang** | Kalimat yang sama dipakai ≥3 kartu dengan judul diganti |
| 6 | Kombinasi | Beberapa penanda sekaligus = hampir pasti template |

Pemeriksaan **5** yang paling menentukan. Dia membuang bagian yang berubah-ubah
(judul Jepang, angka), menyisakan kerangkanya, lalu menghitung kemunculan.
Kalau kerangka yang sama muncul di 4 kartu, itu bukan kebetulan.

### Kenapa rasio panjang berfungsi

Bahasa Jepang jauh lebih padat per karakter daripada Indonesia. Terjemahan
yang benar biasanya **1,5–3×** panjang sumbernya. Kalau lebih pendek dari
sumbernya, hampir pasti ada yang tidak diterjemahkan.

Dari data uji:
```
template : 105 karakter vs sumber 123  → rasio 0,85  ✗
dipotong :  31 karakter vs sumber 123  → rasio 0,25  ✗
benar    : 434 karakter vs sumber 123  → rasio 3,53  ✓
```

### Hasil tes

```
field diperiksa : 6
error           : 19
per jenis       : { japanese_in_id: 4, too_short: 5, paragraph_loss: 5,
                    filler_phrase: 4, template: 1 }
```

4 kartu template dan 1 yang dipotong tertangkap. Terjemahan yang benar
lolos tanpa satupun temuan — jadi tidak ada positif palsu.

## Cara menambal

### Langkah 1 — Ukur dulu
```bash
node scripts/audit-translation-quality.mjs
```
Laporkan angkanya. Kalau 600 dari 900 field kena, itu pekerjaan besar
dan perlu dijadwalkan, bukan dikerjakan sambil lalu.

### Langkah 2 — Cari sumber template-nya
Kalimat cetakan itu datang dari suatu tempat: skrip pembuat konten,
prompt generator, atau fungsi fallback. Cari:

```bash
grep -rn "adalah materi penting\|Hubungkan teori dengan" src/ scripts/
```

**Matikan sumbernya dulu** sebelum menerjemahkan ulang. Kalau tidak,
generator berikutnya akan menimpa hasil terjemahan dengan template lagi.

### Langkah 3 — Terjemahkan ulang per batch

Prompt:

```
Terjemahkan teks materi Kaigo Kitty berikut ke bahasa Indonesia.

Audiens: perawat lansia Indonesia yang bekerja di Jepang, JLPT N3–N4,
sedang menyiapkan ujian 介護福祉士.

Aturan:
- Terjemahkan SELURUH isinya. Jumlah paragraf harus sama dengan sumber.
- Jangan meringkas. Jangan menambahkan kalimat pembuka atau penutup sendiri.
- Bahasa Indonesia yang wajar, bukan terjemahan harfiah.
  「尊厳を保持する」 → "menjaga martabat", bukan "mempertahankan martabat".
- Istilah teknis: tulis Indonesianya, lalu kanji dalam kurung saat pertama muncul.
  Contoh: "pencatatan (記録)". Setelah itu cukup bahasa Indonesia.
- JANGAN menyalin judul Jepang ke dalam teks Indonesia.
- Panjang hasil biasanya 1,5–3× sumbernya. Kalau hasilmu lebih pendek
  dari sumbernya, berarti ada yang terlewat.

Sumber:
{ja tanpa anotasi ruby}

Balas HANYA teks Indonesia, tanpa penjelasan.
```

Kirim per kartu, bukan per section. Batch besar bikin model meringkas
di bagian akhir — persis masalah yang sedang diperbaiki.

### Langkah 4 — Verifikasi ulang
```bash
node scripts/audit-translation-quality.mjs --strict
```
Harus exit 0. Laporkan angka sebelum dan sesudah.

## Perbaiki kebocoran kanji di mode ID

Judul di mode ID masih `Belajar 事例の読み方`. Dua kemungkinan:

1. Field `title` tidak punya `id`, jadi jatuh ke fallback `ja`
2. Ada teks yang dirangkai di kode: `"Belajar " + title.ja`

Cari:
```bash
grep -rn "Belajar \${\|'Belajar ' +\|\`Belajar " src/
```

Yang benar: judul juga bilingual, dan mode ID memakai versi Indonesianya.

```jsx
// SALAH
<h1>Belajar {level.title.ja}</h1>

// BENAR
<h1><Furigana field={level.title} mode={mode} variant="tight" /></h1>
```

## Masuk ke CI

Tambahkan ke `.github/workflows/ci.yml`, setelah audit cakupan:

```yaml
- name: Mutu terjemahan
  run: node scripts/audit-translation-quality.mjs --strict
```

Dan ke `package.json`:
```json
"validate:coverage": "node scripts/audit-content-coverage.mjs --strict && node scripts/audit-translation-quality.mjs --strict"
```

Dua auditor ini saling melengkapi: yang satu memastikan field-nya **ada**,
yang satu memastikan isinya **benar**. Satu saja tidak cukup — buktinya
konten ini lolos yang pertama dan sampai ke production.

## Ambang yang bisa disetel

Kalau ternyata terlalu galak, setel di bagian atas file:

```js
const MIN_RATIO       = 0.9;   // di bawah ini = error
const SUSPECT_RATIO   = 1.2;   // di bawah ini = peringatan
const MAX_CJK_IN_ID   = 4;     // "martabat (尊厳)" wajar
const TEMPLATE_REPEAT = 3;     // kerangka sama ≥3× = template
```

Jangan longgarkan `TEMPLATE_REPEAT` di bawah 3 — itu pemeriksaan
yang paling berguna dan paling jarang salah.
