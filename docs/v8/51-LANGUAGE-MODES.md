# 51 — MODE BAHASA: ROMAJI JANGAN HILANG ⭐

## Masalah yang lu tunjuk

```
Mode 漢字:
  人権
  jinken / hak asasi manusia
  高齢でも人権は変わりません。

Mode ID:
  人権
  hak asasi manusia                        ← "jinken" HILANG
  Meskipun lanjut usia, hak asasinya tidak berubah.
```

Cara bacanya hilang justru di mode yang paling dipakai pemula. Padahal orang
yang membaca versi Indonesia itu yang **paling butuh** tahu cara melafalkannya.

## Aturan baru

**Romaji selalu tampil, di ketiga mode.** Yang berubah antar mode cuma
bahasa penjelasannya, bukan alat bantu bacanya.

| Elemen | 漢字 | ふり | ID |
|---|---|---|---|
| Kanji istilah | ✓ | ✓ | ✓ |
| Furigana kana | tersembunyi | ✓ | tersembunyi |
| **Romaji** | ✓ | ✓ | **✓** |
| Arti Indonesia | ✓ | ✓ | ✓ |
| Contoh kalimat | Jepang | Jepang + furi | Indonesia |

Kartu istilah di mode ID jadi:

```
        人権
        jinken
        hak asasi manusia

        高齢でも人権は変わりません。
        Meskipun lanjut usia, hak asasinya tidak berubah.
```

Contoh kalimat Jepangnya **tetap ditampilkan** di atas terjemahannya —
itu yang sedang dipelajari.

## Istilah katakana di dalam teks Indonesia

Kalau kalimat Indonesia memuat istilah Jepang, terutama katakana, tempelkan
romajinya di atas seperti furigana:

```
              noomaraizeeshon
ノーマライゼーション berarti menjamin hak menjalani
ritme hidup yang normal.
```

Bukan `ノーマライゼーション (noomaraizeeshon)` dalam kurung — itu memutus
alur baca. Ruby di atas jauh lebih enak dibaca dan konsisten dengan mode ふり.

Implementasi: `Furigana.jsx` dengan `rubyStyle="romaji"`. Di mode ID,
`<rt>` diisi hasil `kanaToRomaji(reading)`, bukan kana-nya.

```jsx
const rt = mode === 'id' ? kanaToRomaji(tok.rt) : tok.rt;
```

CSS-nya sama persis — flex column-reverse, jadi tidak ada perilaku baru
yang perlu diuji ulang.

## Konverter romaji

`snippets/kanaToRomaji.js` — Hepburn, sudah dites 19/20.

Menangani: konsonan ganda (`けっか` → `kekka`), tanda panjang
(`ノーマライゼーション` → `noomaraizeeshon`), dan `ん` sebelum vokal
(`しんいち` → `shin'ichi`, bukan `shinichi` yang salah baca).

```
じんけん              → jinken
にんちしょう          → ninchishou
かくたんきゅういん     → kakutankyuuin
とうごうしっちょうしょう → tougoushitchoushou
パーソン・センタード・ケア → paason sentaado kea
```

**Hasilkan ulang seluruh field romaji dari kana**, jangan ketik tangan.
Romaji ketikan tangan di seed glossary v4 sudah terbukti ada yang salah
(`shicchoushou` seharusnya `shitchoushou`).

```js
for (const t of glossary.terms) t.romaji = kanaToRomaji(t.reading);
```

## Kalimat tidak boleh berkurang

Auditor v7 (`audit-translation-quality.mjs`) sudah memeriksa jumlah
paragraf dan rasio panjang. Tambahkan satu pemeriksaan lagi:

**Jumlah kalimat.** Hitung `。` di sumber Jepang dan `.` di terjemahan
Indonesia. Kalau Indonesia punya lebih sedikit, ada kalimat yang hilang.

```js
const sJa = (ja.match(/。/g) ?? []).length;
const sId = (id.match(/[.!?](\s|$)/g) ?? []).length;
if (sId < sJa) flag('sentence_loss', `${sJa} kalimat → ${sId}`);
```

Toleransi 0. Satu kalimat Jepang boleh jadi dua kalimat Indonesia
(itu wajar), tapi tidak boleh jadi nol.

## Contoh kalimat di kartu istilah

Sekarang mode ID kemungkinan menyembunyikan kalimat Jepangnya. Jangan.
Tampilkan keduanya, Jepang di atas:

```jsx
<div className="term-example">
  <Furigana field={{ ja: ex.ja }} mode={mode === 'id' ? 'furi' : mode} />
  <p className="term-example__id">{ex.id}</p>
</div>
```

Perhatikan: di mode ID, contoh kalimatnya dirender dengan mode `furi`,
bukan `id`. Kalimat contoh ada untuk **dibaca dalam bahasa Jepang** —
terjemahannya pendamping, bukan pengganti.
