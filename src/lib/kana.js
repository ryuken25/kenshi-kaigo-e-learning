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
    .replace(/[ー－―‐\-・.,、。･\s'"’”()（），．！？]/g, '');
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

/* ---------- kana \u2192 romaji (Hepburn) ----------
   Semua romaji UI dihasilkan dari sini, jangan diketik tangan \u2014
   audit v8 menemukan seed lama salah: `shicchoushou` seharusnya `shitchoushou`. */

const KANA_DIGRAPH = {
  \u304D\u3083:'kya',\u304D\u3085:'kyu',\u304D\u3087:'kyo', \u304E\u3083:'gya',\u304E\u3085:'gyu',\u304E\u3087:'gyo',
  \u3057\u3083:'sha',\u3057\u3085:'shu',\u3057\u3087:'sho', \u3058\u3083:'ja', \u3058\u3085:'ju', \u3058\u3087:'jo',
  \u3061\u3083:'cha',\u3061\u3085:'chu',\u3061\u3087:'cho', \u3062\u3083:'ja', \u3062\u3085:'ju', \u3062\u3087:'jo',
  \u306B\u3083:'nya',\u306B\u3085:'nyu',\u306B\u3087:'nyo', \u3072\u3083:'hya',\u3072\u3085:'hyu',\u3072\u3087:'hyo',
  \u3073\u3083:'bya',\u3073\u3085:'byu',\u3073\u3087:'byo', \u3074\u3083:'pya',\u3074\u3085:'pyu',\u3074\u3087:'pyo',
  \u307F\u3083:'mya',\u307F\u3085:'myu',\u307F\u3087:'myo', \u308A\u3083:'rya',\u308A\u3085:'ryu',\u308A\u3087:'ryo',
  \u3057\u3047:'she',\u3061\u3047:'che',\u3058\u3047:'je',  \u3066\u3043:'ti', \u3067\u3043:'di', \u3068\u3045:'tu', \u3069\u3045:'du',
  \u3064\u3041:'tsa',\u3064\u3043:'tsi',\u3064\u3047:'tse',\u3064\u3049:'tso',
  \u3075\u3041:'fa', \u3075\u3043:'fi', \u3075\u3047:'fe', \u3075\u3049:'fo', \u3075\u3085:'fyu',
  \u3094\u3041:'va', \u3094\u3043:'vi', \u3094\u3047:'ve', \u3094\u3049:'vo',
  \u3046\u3043:'wi', \u3046\u3047:'we', \u3046\u3049:'wo',
};

const KANA_MONO = {
  \u3042:'a',\u3044:'i',\u3046:'u',\u3048:'e',\u304A:'o',
  \u304B:'ka',\u304D:'ki',\u304F:'ku',\u3051:'ke',\u3053:'ko',
  \u304C:'ga',\u304E:'gi',\u3050:'gu',\u3052:'ge',\u3054:'go',
  \u3055:'sa',\u3057:'shi',\u3059:'su',\u305B:'se',\u305D:'so',
  \u3056:'za',\u3058:'ji',\u305A:'zu',\u305C:'ze',\u305E:'zo',
  \u305F:'ta',\u3061:'chi',\u3064:'tsu',\u3066:'te',\u3068:'to',
  \u3060:'da',\u3062:'ji',\u3065:'zu',\u3067:'de',\u3069:'do',
  \u306A:'na',\u306B:'ni',\u306C:'nu',\u306D:'ne',\u306E:'no',
  \u306F:'ha',\u3072:'hi',\u3075:'fu',\u3078:'he',\u307B:'ho',
  \u3070:'ba',\u3073:'bi',\u3076:'bu',\u3079:'be',\u307C:'bo',
  \u3071:'pa',\u3074:'pi',\u3077:'pu',\u307A:'pe',\u307D:'po',
  \u307E:'ma',\u307F:'mi',\u3080:'mu',\u3081:'me',\u3082:'mo',
  \u3084:'ya',\u3086:'yu',\u3088:'yo',
  \u3089:'ra',\u308A:'ri',\u308B:'ru',\u308C:'re',\u308D:'ro',
  \u308F:'wa',\u3090:'i',\u3091:'e',\u3092:'o',\u3093:'n',
  \u3094:'vu',\u3041:'a',\u3043:'i',\u3045:'u',\u3047:'e',\u3049:'o',
  \u3083:'ya',\u3085:'yu',\u3087:'yo',
  '\u3000':' ', ' ':' ', '\u30FB':' ',
};

const VOWELS = new Set(['a', 'i', 'u', 'e', 'o']);

/**
 * \u300C\u3058\u3093\u3051\u3093\u300D\u2192 "jinken" \u30FB \u300C\u30CE\u30FC\u30DE\u30E9\u30A4\u30BC\u30FC\u30B7\u30E7\u30F3\u300D\u2192 "noomaraizeeshon"
 * \u300C\u3057\u3093\u3044\u3061\u300D\u2192 "shin'ichi" (apostrof supaya tidak terbaca "shinichi")
 */
export function kanaToRomaji(input) {
  const s = kataToHira(String(input ?? ''));
  let out = '';
  let i = 0;
  while (i < s.length) {
    const ch = s[i];
    if (ch === '\u3063') { // gandakan konsonan berikutnya; \u3063\u3061 \u2192 tchi
      const nxt = s.slice(i + 1, i + 3);
      const r = KANA_DIGRAPH[nxt] ?? KANA_MONO[s[i + 1]] ?? '';
      if (r) out += r[0] === 'c' ? 't' : r[0];
      i += 1;
      continue;
    }
    if (ch === '\u30FC') { // panjangkan vokal sebelumnya
      const last = out[out.length - 1];
      if (VOWELS.has(last)) out += last;
      i += 1;
      continue;
    }
    const pair = s.slice(i, i + 2);
    if (KANA_DIGRAPH[pair]) { out += KANA_DIGRAPH[pair]; i += 2; continue; }
    if (ch === '\u3093') { // \u3093 sebelum vokal/y butuh apostrof
      const nx = KANA_DIGRAPH[s.slice(i + 1, i + 3)] ?? KANA_MONO[s[i + 1]] ?? '';
      out += (nx && (VOWELS.has(nx[0]) || nx[0] === 'y')) ? "n'" : 'n';
      i += 1;
      continue;
    }
    if (KANA_MONO[ch]) { out += KANA_MONO[ch]; i += 1; continue; }
    out += ch; // tanda baca / karakter tak dikenal
    i += 1;
  }
  return out.replace(/\s{2,}/g, ' ').trim();
}

/** Untuk ditampilkan di kartu istilah. */
export function romajiDisplay(kana, { capitalize = false } = {}) {
  const r = kanaToRomaji(kana);
  return capitalize ? r.charAt(0).toUpperCase() + r.slice(1) : r;
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
