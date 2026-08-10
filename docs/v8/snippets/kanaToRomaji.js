// kanaToRomaji.js — kana → romaji Hepburn.
// Dipakai supaya mode ID tetap menampilkan cara baca istilah Jepang.
// Contoh: 「人権 / jinken / hak asasi manusia」 — "jinken" tidak boleh hilang di mode ID.

const DIGRAPH = {
  きゃ:'kya',きゅ:'kyu',きょ:'kyo', ぎゃ:'gya',ぎゅ:'gyu',ぎょ:'gyo',
  しゃ:'sha',しゅ:'shu',しょ:'sho', じゃ:'ja', じゅ:'ju', じょ:'jo',
  ちゃ:'cha',ちゅ:'chu',ちょ:'cho', ぢゃ:'ja', ぢゅ:'ju', ぢょ:'jo',
  にゃ:'nya',にゅ:'nyu',にょ:'nyo', ひゃ:'hya',ひゅ:'hyu',ひょ:'hyo',
  びゃ:'bya',びゅ:'byu',びょ:'byo', ぴゃ:'pya',ぴゅ:'pyu',ぴょ:'pyo',
  みゃ:'mya',みゅ:'myu',みょ:'myo', りゃ:'rya',りゅ:'ryu',りょ:'ryo',
  しぇ:'she',ちぇ:'che',じぇ:'je',  てぃ:'ti', でぃ:'di', とぅ:'tu', どぅ:'du',
  つぁ:'tsa',つぃ:'tsi',つぇ:'tse',つぉ:'tso',
  ふぁ:'fa', ふぃ:'fi', ふぇ:'fe', ふぉ:'fo', ふゅ:'fyu',
  ゔぁ:'va', ゔぃ:'vi', ゔぇ:'ve', ゔぉ:'vo',
  うぃ:'wi', うぇ:'we', うぉ:'wo',
};

const MONO = {
  あ:'a',い:'i',う:'u',え:'e',お:'o',
  か:'ka',き:'ki',く:'ku',け:'ke',こ:'ko',
  が:'ga',ぎ:'gi',ぐ:'gu',げ:'ge',ご:'go',
  さ:'sa',し:'shi',す:'su',せ:'se',そ:'so',
  ざ:'za',じ:'ji',ず:'zu',ぜ:'ze',ぞ:'zo',
  た:'ta',ち:'chi',つ:'tsu',て:'te',と:'to',
  だ:'da',ぢ:'ji',づ:'zu',で:'de',ど:'do',
  な:'na',に:'ni',ぬ:'nu',ね:'ne',の:'no',
  は:'ha',ひ:'hi',ふ:'fu',へ:'he',ほ:'ho',
  ば:'ba',び:'bi',ぶ:'bu',べ:'be',ぼ:'bo',
  ぱ:'pa',ぴ:'pi',ぷ:'pu',ぺ:'pe',ぽ:'po',
  ま:'ma',み:'mi',む:'mu',め:'me',も:'mo',
  や:'ya',ゆ:'yu',よ:'yo',
  ら:'ra',り:'ri',る:'ru',れ:'re',ろ:'ro',
  わ:'wa',ゐ:'i',ゑ:'e',を:'o',ん:'n',
  ゔ:'vu',ぁ:'a',ぃ:'i',ぅ:'u',ぇ:'e',ぉ:'o',
  ゃ:'ya',ゅ:'yu',ょ:'yo',
  '　':' ', ' ':' ', '・':' ',
};

const VOWELS = new Set(['a', 'i', 'u', 'e', 'o']);

export function kataToHira(s) {
  return String(s).replace(/[\u30A1-\u30F6]/g, (c) =>
    String.fromCharCode(c.charCodeAt(0) - 0x60));
}

/**
 * 「じんけん」→ "jinken"
 * 「ノーマライゼーション」→ "noomaraizeeshon"
 * 「しんいち」→ "shin'ichi"  (pemisah supaya tidak terbaca "shinichi")
 */
export function kanaToRomaji(input) {
  const s = kataToHira(String(input ?? ''));
  let out = '';
  let i = 0;

  while (i < s.length) {
    const ch = s[i];

    // っ → gandakan konsonan berikutnya
    if (ch === 'っ') {
      const nxt = s.slice(i + 1, i + 3);
      const r = DIGRAPH[nxt] ?? MONO[s[i + 1]] ?? '';
      if (r) out += r[0] === 'c' ? 't' : r[0];   // っち → tchi
      i += 1;
      continue;
    }

    // ー → panjangkan vokal sebelumnya
    if (ch === 'ー') {
      const last = out[out.length - 1];
      if (VOWELS.has(last)) out += last;
      i += 1;
      continue;
    }

    const pair = s.slice(i, i + 2);
    if (DIGRAPH[pair]) { out += DIGRAPH[pair]; i += 2; continue; }

    // ん sebelum vokal atau y butuh apostrof
    if (ch === 'ん') {
      const nx = DIGRAPH[s.slice(i + 1, i + 3)] ?? MONO[s[i + 1]] ?? '';
      out += (nx && (VOWELS.has(nx[0]) || nx[0] === 'y')) ? "n'" : 'n';
      i += 1;
      continue;
    }

    if (MONO[ch]) { out += MONO[ch]; i += 1; continue; }

    out += ch;   // tanda baca / karakter tak dikenal
    i += 1;
  }
  return out.replace(/\s{2,}/g, ' ').trim();
}

/** Untuk ditampilkan di kartu istilah. */
export function romajiDisplay(kana, { capitalize = false } = {}) {
  const r = kanaToRomaji(kana);
  return capitalize ? r.charAt(0).toUpperCase() + r.slice(1) : r;
}
