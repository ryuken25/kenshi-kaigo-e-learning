// kana.js — normalisasi teks Jepang + konversi romaji → kana.
//
// Inti dari pencarian glossary: apapun yang diketik user
// (kanji / hiragana / katakana / romaji / Indonesia) diubah ke satu bentuk
// kanonik dulu, baru dicocokkan.

/* ---------- konversi dasar ---------- */

/** カタカナ → ひらがな (termasuk ヴ, ー dipertahankan) */
export function kataToHira(s) {
  return String(s).replace(/[\u30A1-\u30F6]/g, (c) =>
    String.fromCharCode(c.charCodeAt(0) - 0x60)
  );
}

/** ひらがな → カタカナ */
export function hiraToKata(s) {
  return String(s).replace(/[\u3041-\u3096]/g, (c) =>
    String.fromCharCode(c.charCodeAt(0) + 0x60)
  );
}

/**
 * Bentuk kanonik untuk pencocokan.
 * NFKC (lebar penuh → biasa), huruf kecil, katakana → hiragana,
 * buang spasi & tanda baca, buang tanda panjang ー.
 */
export function normalize(s) {
  return kataToHira(String(s ?? '').normalize('NFKC').toLowerCase())
    .replace(/[ー－―‐\-・.,、。･\s'"’”()（）]/g, '');
}

/* ---------- romaji → kana ---------- */
// Mendukung Hepburn (shi, tsu, chi, fu, ji) DAN Kunrei (si, tu, ti, hu, zi),
// karena orang Indonesia sering ngetik campur.

const DIGRAPH = {
  kya:'きゃ',kyu:'きゅ',kyo:'きょ', gya:'ぎゃ',gyu:'ぎゅ',gyo:'ぎょ',
  sha:'しゃ',shu:'しゅ',sho:'しょ', sya:'しゃ',syu:'しゅ',syo:'しょ',
  ja:'じゃ',ju:'じゅ',jo:'じょ',   jya:'じゃ',jyu:'じゅ',jyo:'じょ',
  zya:'じゃ',zyu:'じゅ',zyo:'じょ',
  cha:'ちゃ',chu:'ちゅ',cho:'ちょ', tya:'ちゃ',tyu:'ちゅ',tyo:'ちょ',
  nya:'にゃ',nyu:'にゅ',nyo:'にょ', hya:'ひゃ',hyu:'ひゅ',hyo:'ひょ',
  bya:'びゃ',byu:'びゅ',byo:'びょ', pya:'ぴゃ',pyu:'ぴゅ',pyo:'ぴょ',
  mya:'みゃ',myu:'みゅ',myo:'みょ', rya:'りゃ',ryu:'りゅ',ryo:'りょ',
  she:'しぇ',che:'ちぇ',je:'じぇ',
  tsa:'つぁ',tse:'つぇ',tso:'つぉ',
  fa:'ふぁ',fi:'ふぃ',fe:'ふぇ',fo:'ふぉ',
  va:'ゔぁ',vi:'ゔぃ',vu:'ゔ',ve:'ゔぇ',vo:'ゔぉ',
  ti:'てぃ',di:'でぃ',du:'どぅ',tu:'つ',
  wi:'うぃ',we:'うぇ',wo:'を',
};

const MONO = {
  a:'あ',i:'い',u:'う',e:'え',o:'お',
  ka:'か',ki:'き',ku:'く',ke:'け',ko:'こ',
  ga:'が',gi:'ぎ',gu:'ぐ',ge:'げ',go:'ご',
  sa:'さ',si:'し',shi:'し',su:'す',se:'せ',so:'そ',
  za:'ざ',zi:'じ',ji:'じ',zu:'ず',ze:'ぜ',zo:'ぞ',
  ta:'た',ti:'ち',chi:'ち',tsu:'つ',te:'て',to:'と',
  da:'だ',de:'で',do:'ど',
  na:'な',ni:'に',nu:'ぬ',ne:'ね',no:'の',
  ha:'は',hi:'ひ',hu:'ふ',fu:'ふ',he:'へ',ho:'ほ',
  ba:'ば',bi:'び',bu:'ぶ',be:'べ',bo:'ぼ',
  pa:'ぱ',pi:'ぴ',pu:'ぷ',pe:'ぺ',po:'ぽ',
  ma:'ま',mi:'み',mu:'む',me:'め',mo:'も',
  ya:'や',yu:'ゆ',yo:'よ',
  ra:'ら',ri:'り',ru:'る',re:'れ',ro:'ろ',
  wa:'わ',
  n:'ん', nn:'ん',
};

/**
 * "songen" → "そんげん", "ninchisyou" → "にんちしょう", "kaigo" → "かいご"
 * Sisa huruf yang belum lengkap (user masih ngetik) dibiarkan apa adanya
 * supaya pencarian tetap jalan sambil mengetik.
 */
export function romajiToKana(input) {
  let s = String(input ?? '').toLowerCase().replace(/[^a-z']/g, '');
  let out = '';
  let i = 0;

  while (i < s.length) {
    // konsonan ganda → っ  (kekka → けっか)
    if (
      i + 1 < s.length &&
      s[i] === s[i + 1] &&
      !'aiueon'.includes(s[i])
    ) {
      out += 'っ';
      i += 1;
      continue;
    }

    // ん sebelum konsonan (bukan y/n) → んn' juga ditangani
    if (
      s[i] === 'n' &&
      i + 1 < s.length &&
      !'aiueoy'.includes(s[i + 1]) &&
      s[i + 1] !== 'n'
    ) {
      out += 'ん';
      i += 1;
      continue;
    }
    if (s[i] === 'n' && s[i + 1] === "'") { out += 'ん'; i += 2; continue; }

    // digraf 3 huruf
    const tri = s.slice(i, i + 3);
    if (DIGRAPH[tri]) { out += DIGRAPH[tri]; i += 3; continue; }

    // 3 huruf mono (shi, tsu, chi)
    if (MONO[tri]) { out += MONO[tri]; i += 3; continue; }

    // 2 huruf
    const bi = s.slice(i, i + 2);
    if (DIGRAPH[bi]) { out += DIGRAPH[bi]; i += 2; continue; }
    if (MONO[bi])    { out += MONO[bi];    i += 2; continue; }

    // 1 huruf
    const uni = s[i];
    if (MONO[uni]) { out += MONO[uni]; i += 1; continue; }

    // belum lengkap — simpan mentah, biar prefix-match tetap bisa
    out += uni;
    i += 1;
  }

  return out;
}

/** Ada karakter Jepang atau tidak. */
export function hasJapanese(s) {
  return /[\u3040-\u30FF\u4E00-\u9FFF]/.test(String(s ?? ''));
}

/** Bangun semua kunci pencarian untuk satu entri glossary. */
export function buildKeys(entry) {
  const keys = new Set();
  const add = (v) => { const n = normalize(v); if (n) keys.add(n); };

  add(entry.kanji);
  add(entry.reading);
  add(hiraToKata(entry.reading || ''));
  add(entry.romaji);
  (entry.romajiAlt || []).forEach(add);
  add(entry.en);
  add(entry.id?.short);
  (entry.synonyms || []).forEach(add);
  (entry.tags || []).forEach(add);

  // romaji juga disimpan sebagai kana, biar "songen" ketemu そんげん
  if (entry.romaji) add(romajiToKana(entry.romaji));

  return [...keys];
}
