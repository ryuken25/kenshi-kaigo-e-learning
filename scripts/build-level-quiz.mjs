// build-level-quiz.mjs — petakan tiap level di /belajar ke 5 soal ujian ASLI.
//
//   node scripts/build-level-quiz.mjs        # tulis src/content/level-quiz.json
//   node scripts/build-level-quiz.mjs --dry  # laporan saja
//
// KENAPA: soal level dulu dibangun dari 12 template yang sama untuk SELURUH 152 level,
// jadi bab 認知症 dan bab 生活支援技術 menanyakan hal yang praktis sama dan tidak nyambung
// dengan materi kartunya. Sekarang tiap level mengambil soal ujian nasional sungguhan
// dari mapel yang sama dengan babnya — 13 bab aplikasi ini memang bernama persis seperti
// 13 mapel resmi ujian — lalu dipilih yang teksnya paling dekat dengan topik level.
//
// Output HANYA rujukan [tahun, nomor], bukan salinan teks: teks soal hidup di
// src/content/final/data/*.json yang dimuat dinamis oleh Quiz, sehingga bundle utama
// tidak ikut membesar.
//
// Deterministik: tie-break memakai hash nama level, bukan Math.random.
import { readFileSync, writeFileSync } from 'node:fs';
import { sections } from '../src/data.js';

const DRY = process.argv.includes('--dry');
const RUBY = /([一-鿿々〆ヶ]+)\[([ぁ-ゟァ-ーー]+)\]/g;
const strip = (s) => String(s || '').replace(RUBY, '$1');
const hash = (s) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) } return h >>> 0 };

// Kata kunci tambahan untuk topik yang di soal ujian memakai istilah lain.
// Kunci = judul topik apa adanya di src/data.js.
const SINONIM = {
  '尊厳と人権': ['尊厳', '人権', '権利'], '自己決定': ['自己決定', '意思決定', '意向'], 'QOL': ['生活の質', 'QOL', '満足'],
  'ノーマライゼーション': ['ノーマライゼーション', '地域で暮ら', '共生'], '権利擁護': ['権利', '擁護', '虐待', '成年後見'],
  'アドボカシー': ['代弁', '権利', '意思'], '自立支援': ['自立', '残存能力', 'できること'], '生活者主体': ['生活歴', '習慣', '本人の望'],
  '倫理的ジレンマ': ['倫理', 'ジレンマ', '身体拘束'], '人間関係の基本': ['信頼関係', 'ラポール', '人間関係'],
  '傾聴': ['傾聴', '聴く', '話を聞'], '受容と共感': ['受容', '共感'], '非言語コミュニケーション': ['表情', '視線', 'うなず', '非言語'],
  '信頼関係': ['信頼', 'ラポール'], '家族との関係': ['家族', '介護者'], 'チームコミュニケーション': ['報告', '申し送り', 'チーム'],
  '記録と報告': ['記録', '報告', '事実'], '難しい場面': ['苦情', '拒否', 'クレーム'],
  '社会保障の全体像': ['社会保障', '社会保険'], '日本国憲法と福祉': ['憲法', '生存権'], '介護保険制度': ['介護保険', '保険者', '被保険者'],
  '要介護認定': ['要介護認定', '認定調査', '審査'], '居宅サービス': ['居宅', '訪問介護', '通所'], '施設サービス': ['施設', '入所'],
  '地域包括ケア': ['地域包括', '地域ケア'], '障害者総合支援法': ['障害者総合支援', '障害福祉サービス', '障害支援区分'],
  '生活保護': ['生活保護', '扶助'], '成年後見制度': ['成年後見', '後見', '補助', '保佐'], '虐待防止と権利': ['虐待', '通報'],
  '高齢者施策': ['高齢者', '老人福祉'], '地域福祉': ['地域', '民生委員', 'ボランティア'], '制度比較': ['制度', '給付'],
  'こころのしくみ': ['心理', '欲求', 'マズロー', '感情'], '身体の構造': ['骨', '筋', '関節', '臓器'], '加齢と身体': ['加齢', '老化'],
  'バイタルサイン': ['バイタル', '体温', '脈拍', '血圧', '呼吸'], '感染予防': ['感染', '消毒', '手洗'],
  '栄養と水分': ['栄養', '水分', '脱水', '低栄養'], '睡眠': ['睡眠', '不眠', '眠'], '排泄のしくみ': ['排泄', '排尿', '排便', '尿'],
  '呼吸と循環': ['呼吸', '循環', '心臓', '血液'], '消化と嚥下': ['嚥下', '消化', '誤嚥'], '褥瘡予防': ['褥瘡', '体位変換', '圧'],
  '急変の観察': ['急変', '観察', '救急'],
  '発達の原則': ['発達', '乳児', '幼児'], '青年期と成人期': ['青年期', '成人', '中年'], '老化の変化': ['老化', '加齢'],
  '高齢者の心理': ['高齢者', '心理', '喪失'], 'フレイル': ['フレイル', '虚弱'], 'サルコペニア': ['サルコペニア', '筋力', '筋肉'],
  '認知機能の加齢': ['認知機能', '記憶', '知能'], '死と喪失': ['死', '喪失', '悲嘆', '看取'], '生活機能': ['生活機能', 'ICF', 'ADL'],
  '認知症の定義': ['認知症', '定義', '診断'], '中核症状': ['記憶障害', '見当識', '中核症状'], 'BPSD': ['BPSD', '徘徊', '妄想', '興奮'],
  'アルツハイマー型': ['アルツハイマー'], 'レビー小体型': ['レビー小体', '幻視'], '血管性認知症': ['血管性', '脳梗塞', '脳血管'],
  '前頭側頭型': ['前頭側頭', '脱抑制'], '本人中心のケア': ['本人', 'パーソン', '中心'], '環境調整': ['環境', '照明', '音'],
  '家族支援': ['家族', '負担', 'レスパイト'], '意思決定支援': ['意思決定', '意思', '選択'],
  '障害の理念': ['ノーマライゼーション', '社会モデル', '合理的配慮'], '身体障害': ['身体障害', '肢体', '麻痺'],
  '知的障害': ['知的障害'], '精神障害': ['精神障害', '統合失調', 'うつ'], '発達障害': ['発達障害', '自閉症', '学習障害'],
  '高次脳機能障害': ['高次脳機能', '遂行機能', '注意障害'], '視覚障害': ['視覚障害', '見え', '点字', '盲'],
  '聴覚障害': ['聴覚障害', '難聴', '手話'], '重症心身障害': ['重症心身', '重度'], '合理的配慮': ['合理的配慮', '差別'],
  '医療的ケアの倫理': ['医療的ケア', '医行為', '同意'], 'バイタル観察': ['バイタル', '観察'],
  '喀痰吸引の準備': ['喀痰吸引', '吸引', '準備'], '口腔内吸引': ['口腔内', '吸引'], '鼻腔内吸引': ['鼻腔', '吸引'],
  '経管栄養': ['経管栄養', '胃ろう', '注入'], '異常時の対応': ['異常', '出血', '嘔吐', '急変'],
  '介護福祉士の役割': ['介護福祉士', '役割', '義務'], '専門職倫理': ['倫理', '秘密保持', '信用失墜'],
  'ICF': ['ICF', '生活機能', '参加'], '安全とリスク': ['リスク', '安全', '事故'], '事故予防': ['事故', '転倒', 'ヒヤリハット'],
  '感染対策': ['感染', '標準予防策', '手指衛生'], 'チームアプローチ': ['チーム', '連携'], '多職種連携': ['多職種', '連携', '職種'],
  '記録': ['記録', '記載'], '虐待防止': ['虐待', '身体拘束'],
  '基本姿勢': ['姿勢', '目線', '座る位置'], '質問技法': ['質問', '閉じられた', '開かれた'], '傾聴技法': ['傾聴', '相づち', '繰り返し'],
  '認知症との会話': ['認知症', '会話', '声かけ'], '失語症': ['失語症', '言語'], '家族面接': ['家族', '面接', '相談'],
  'チーム報告': ['報告', '申し送り', '会議'],
  '生活環境': ['住環境', '室温', '照明', '住宅'], '移動': ['移動', '歩行', '車いす'], '安楽な姿勢': ['安楽', '体位', 'ポジショニング'],
  '体位変換': ['体位変換', '仰臥位', '側臥位'], '移乗': ['移乗', '立ち上が', 'ベッドから'], '食事': ['食事', '摂取', '食べ'],
  '嚥下支援': ['嚥下', '誤嚥', 'とろみ'], '口腔ケア': ['口腔ケア', '口腔', '義歯'], '排泄': ['排泄', 'おむつ', 'トイレ'],
  '清潔保持': ['清拭', '清潔', '洗'], '入浴': ['入浴', '浴槽', '浴室'], '更衣': ['更衣', '着替', '衣服'], '整容': ['整容', '爪', '整髪', 'ひげ'],
  '家事': ['調理', '洗濯', '掃除', '買物'], '終末期の生活': ['終末期', '看取り', '死'],
  '介護過程とは': ['介護過程', '目的'], '情報収集': ['情報', '収集', '観察'], 'アセスメント': ['アセスメント', '課題'],
  '課題の明確化': ['課題', '明確', 'ニーズ'], '目標設定': ['目標', '短期目標', '長期目標'], '計画立案': ['計画', '立案'],
  '実施': ['実施', '実践'], '評価': ['評価', '見直'], '記録と共有': ['記録', '共有', 'カンファレンス'],
  '事例の読み方': ['事例'], '尊厳と自立の事例': ['尊厳', '自立'], '認知症事例': ['認知症'], '障害事例': ['障害'],
  '医療的ケア事例': ['医療的ケア', '吸引', '経管栄養'], '生活支援事例': ['生活支援', '介助'], '家族支援事例': ['家族'],
  '多職種連携事例': ['多職種', '連携'], '制度選択事例': ['制度', 'サービス'], '長文ケース': ['事例'], '模擬試験A': ['事例'],
};

const SUBJ_SECTION = { '人間の尊厳と自立': 1, '人間関係とコミュニケーション': 2, '社会の理解': 3, 'こころとからだのしくみ': 4, '発達と老化の理解': 5, '認知症の理解': 6, '障害の理解': 7, '医療的ケア': 8, '介護の基本': 9, 'コミュニケーション技術': 10, '生活支援技術': 11, '介護過程': 12, '総合問題': 13 };

// SATU kolam berisi seluruh 748 soal (dua soal beranomali dibuang), masing-masing tahu
// mapel resminya. Pencarian TIDAK dikurung ke mapel bab: bab kecil seperti 人間の尊厳と自立
// hanya punya 12 soal resmi untuk 50 slot, sehingga soal akan berulang 4x. Soal tentang
// 尊厳 yang mapel resminya 介護の基本 sama relevannya untuk level itu — mapel tetap
// diutamakan lewat bobot, bukan lewat penyaringan keras.
const semua = [];
for (const year of [2021, 2022, 2023, 2024, 2025, 2026]) {
  const d = JSON.parse(readFileSync(new URL(`../src/content/final/data/${year}.json`, import.meta.url), 'utf8'));
  for (const q of d.questions) {
    // Soal beranomali (kunci ganda / dianulir) dilewati: Quiz level menilai dengan satu
    // correctIndex, jadi soal berkunci majemuk akan menghukum jawaban yang resmi diterima.
    if (q.accepted) continue;
    // Soal bergambar juga dilewati: kartu soal level belum merender figur, jadi soalnya
    // akan tampil tanpa gambar yang justru menjadi inti pertanyaannya.
    if (q.image) continue;
    semua.push({ y: year, no: q.no, sec: SUBJ_SECTION[q.subject] || 13, teks: strip(q.prompt.ja) + ' ' + q.options.map(o => strip(o.text.ja)).join(' ') });
  }
}

const keluar = {}, laporan = [];
for (const s of sections) {
  const dipakai = new Set();
  for (const l of s.levels) {
    const topik = l.titleJa;
    const kunci = SINONIM[topik] || [topik.replace(/セクション復習/, '')].filter(Boolean);
    // Bobot: kecocokan topik 3 per kata kunci (maks 6 supaya satu kata yang muncul
    // berkali-kali tidak menenggelamkan yang lain), mapel bab +2, sudah dipakai di bab
    // ini −100. Level recap tanpa kata kunci otomatis jatuh ke soal mapel bab.
    const skor = semua.map(q => {
      let n = 0;
      for (const k of kunci) if (k && q.teks.includes(k)) n += 3;
      n = Math.min(n, 6);
      if (q.sec === s.id) n += 2;
      return { q, n: n - (dipakai.has(`${q.y}-${q.no}`) ? 100 : 0), tie: hash(`${s.id}-${l.id}-${q.y}-${q.no}`) };
    }).sort((a, b) => b.n - a.n || a.tie - b.tie);
    const pilih = skor.slice(0, 5);
    if (pilih.length < 5) { laporan.push(`s${s.id}l${l.id} (${topik}): kolam cuma ${pilih.length} soal`); continue; }
    for (const p of pilih) dipakai.add(`${p.q.y}-${p.q.no}`);
    keluar[`${s.id}-${l.id}`] = pilih.map(p => [p.q.y, p.q.no]);
    const cocok = pilih.filter(p => p.n >= 3).length;
    laporan.push(`s${s.id}l${l.id} ${topik}: ${cocok}/5 cocok kata kunci`);
  }
}

const total = Object.keys(keluar).length;
const totalCocok = laporan.filter(x => x.includes('/5 cocok')).reduce((a, x) => a + Number(x.match(/(\d)\/5/)?.[1] || 0), 0);
console.log(`level terpetakan: ${total}/${sections.reduce((a, s) => a + s.levels.length, 0)}`);
console.log(`soal yang cocok kata kunci topik: ${totalCocok}/${total * 5}`);
for (const l of laporan.filter(x => x.includes('kolam cuma'))) console.log('  ! ' + l);
if (!DRY) {
  writeFileSync(new URL('../src/content/level-quiz.json', import.meta.url), JSON.stringify(keluar) + '\n');
  console.log('ditulis: src/content/level-quiz.json');
}
