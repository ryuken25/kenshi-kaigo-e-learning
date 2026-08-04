// glossarySearch.js — pencarian istilah lintas skrip.
// Bisa dicari pakai: kanji, hiragana, katakana, romaji, Indonesia, atau Inggris.

import { normalize, romajiToKana, hasJapanese, buildKeys } from './kana';

/* ---------- indeks ---------- */

let INDEX = null;

/** Bangun sekali di app load. entries = isi glossary.json (array). */
export function buildIndex(entries) {
  INDEX = entries.map((e) => ({
    entry: e,
    keys: buildKeys(e),
    kanjiN: normalize(e.kanji),
    readingN: normalize(e.reading),
    romajiN: normalize(e.romaji),
    idN: normalize(e.id?.short),
    idLongN: normalize(e.id?.long).slice(0, 400),
    enN: normalize(e.en),
    freq: e.occurrences ?? 0,
  }));
  return INDEX;
}

/* ---------- skor ---------- */

const S = {
  EXACT_KANJI: 1000,
  EXACT_READING: 950,
  EXACT_ROMAJI: 900,
  EXACT_ID: 850,
  PREFIX_KANJI: 700,
  PREFIX_READING: 680,
  PREFIX_ROMAJI: 650,
  PREFIX_ID: 600,
  SUB_KANJI: 450,
  SUB_READING: 430,
  SUB_ROMAJI: 400,
  SUB_ID: 350,
  SUB_ID_LONG: 150,
  SUB_EN: 300,
  FUZZY: 120,
};

function scoreOne(rec, q, qKana) {
  let best = 0;
  const hit = (v) => { if (v > best) best = v; };

  const fields = [
    [rec.kanjiN,   S.EXACT_KANJI,   S.PREFIX_KANJI,   S.SUB_KANJI],
    [rec.readingN, S.EXACT_READING, S.PREFIX_READING, S.SUB_READING],
    [rec.romajiN,  S.EXACT_ROMAJI,  S.PREFIX_ROMAJI,  S.SUB_ROMAJI],
    [rec.idN,      S.EXACT_ID,      S.PREFIX_ID,      S.SUB_ID],
  ];

  for (const [val, ex, pre, sub] of fields) {
    if (!val) continue;
    for (const needle of [q, qKana]) {
      if (!needle) continue;
      if (val === needle) hit(ex);
      else if (val.startsWith(needle)) hit(pre);
      else if (val.includes(needle)) hit(sub);
    }
  }

  if (rec.enN && q && rec.enN.includes(q)) hit(S.SUB_EN);
  if (rec.idLongN && q.length >= 3 && rec.idLongN.includes(q)) hit(S.SUB_ID_LONG);

  // kunci tambahan (sinonim, tag, katakana)
  if (!best) {
    for (const k of rec.keys) {
      for (const needle of [q, qKana]) {
        if (needle && k.includes(needle)) { hit(S.SUB_ID); break; }
      }
    }
  }

  // toleransi salah ketik, hanya kalau belum ada kecocokan sama sekali
  if (!best && q.length >= 4) {
    const maxDist = q.length <= 6 ? 1 : 2;
    for (const val of [rec.romajiN, rec.idN, rec.readingN]) {
      if (val && Math.abs(val.length - q.length) <= maxDist && levenshtein(val, q) <= maxDist) {
        hit(S.FUZZY);
        break;
      }
    }
  }

  if (!best) return 0;

  // istilah yang lebih sering muncul di soal naik duluan
  return best + Math.min(80, Math.log2(1 + rec.freq) * 20);
}

/**
 * @param query  apa yang diketik user
 * @param opts   { limit, section, tag }
 * @returns { results, total }
 */
export function searchGlossary(query, opts = {}) {
  if (!INDEX) throw new Error('buildIndex() belum dipanggil');
  const { limit = 24, offset = 0, section = null, tag = null } = opts;

  let pool = INDEX;
  if (section) pool = pool.filter((r) => r.entry.sections?.includes(section));
  if (tag)     pool = pool.filter((r) => r.entry.tags?.includes(tag));

  const raw = String(query ?? '').trim();

  // tanpa query: urut berdasarkan frekuensi kemunculan di soal
  if (!raw) {
    const sorted = [...pool].sort(
      (a, b) => b.freq - a.freq || a.entry.reading.localeCompare(b.entry.reading, 'ja')
    );
    return {
      results: sorted.slice(offset, offset + limit).map((r) => r.entry),
      total: sorted.length,
    };
  }

  const q = normalize(raw);
  // kalau input latin, coba juga sebagai romaji → kana
  const qKana = hasJapanese(raw) ? '' : normalize(romajiToKana(raw));

  const scored = [];
  for (const rec of pool) {
    const sc = scoreOne(rec, q, qKana);
    if (sc > 0) scored.push({ rec, sc });
  }

  scored.sort(
    (a, b) => b.sc - a.sc || a.rec.entry.reading.localeCompare(b.rec.entry.reading, 'ja')
  );

  return {
    results: scored.slice(offset, offset + limit).map((x) => x.rec.entry),
    total: scored.length,
  };
}

/** 10 istilah paling sering muncul di soal + materi. */
export function topTerms(n = 10) {
  if (!INDEX) throw new Error('buildIndex() belum dipanggil');
  return [...INDEX]
    .filter((r) => r.freq > 0)
    .sort((a, b) => b.freq - a.freq)
    .slice(0, n)
    .map((r) => r.entry);
}

export function getBySlug(slug) {
  return INDEX?.find((r) => r.entry.slug === slug)?.entry ?? null;
}

/** Cari entri dari potongan kanji — dipakai waktu istilah di soal diketuk. */
export function getByKanji(kanji) {
  const n = normalize(kanji);
  return INDEX?.find((r) => r.kanjiN === n)?.entry ?? null;
}

/* ---------- util ---------- */

function levenshtein(a, b) {
  if (a === b) return 0;
  const m = a.length, n = b.length;
  if (!m) return n;
  if (!n) return m;
  let prev = Array.from({ length: n + 1 }, (_, i) => i);
  const cur = new Array(n + 1);
  for (let i = 1; i <= m; i++) {
    cur[0] = i;
    for (let j = 1; j <= n; j++) {
      cur[j] = Math.min(
        prev[j] + 1,
        cur[j - 1] + 1,
        prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
    }
    prev = [...cur];
  }
  return prev[n];
}

/** Sorot bagian yang cocok — untuk ditampilkan di hasil pencarian. */
export function highlight(text, query) {
  if (!query) return [{ t: text, hit: false }];
  const nText = normalize(text);
  const nQ = normalize(query);
  const i = nText.indexOf(nQ);
  if (i < 0 || !nQ) return [{ t: text, hit: false }];
  // perkiraan posisi (normalisasi bisa menggeser indeks sedikit)
  return [
    { t: text.slice(0, i), hit: false },
    { t: text.slice(i, i + nQ.length), hit: true },
    { t: text.slice(i + nQ.length), hit: false },
  ].filter((p) => p.t);
}
