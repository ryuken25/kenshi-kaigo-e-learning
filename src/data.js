export const glossary = [
  ['尊厳','そんげん','Martabat manusia'],['自立支援','じりつしえん','Dukungan kemandirian'],['自己決定','じこけってい','Penentuan diri'],['QOL','Quality of Life','Kualitas hidup'],['アドボカシー','advocacy','Advokasi hak pengguna'],['傾聴','けいちょう','Mendengar aktif'],['共感','きょうかん','Empati'],['介護保険','かいごほけん','Asuransi perawatan'],['地域包括ケアシステム','ちいきほうかつケアシステム','Sistem care berbasis komunitas'],['認知症','にんちしょう','Demensia'],['BPSD','behavioral and psychological symptoms','Gejala perilaku dan psikologis demensia'],['誤嚥','ごえん','Aspirasi/tersedak masuk saluran napas'],['褥瘡','じょくそう','Luka tekan'],['喀痰吸引','かくたんきゅういん','Suction dahak'],['介護過程','かいごかてい','Proses介護']
].map(([ja,reading,id])=>({ja,reading,id}));

const plans = [
 ['人間の尊厳と自立','Fondasi Manusia & Martabat',10,'🌸',['尊厳と人権','自己決定','QOL','ノーマライゼーション','権利擁護','アドボカシー','自立支援','生活者主体','倫理的ジレンマ','セクション復習']],
 ['人間関係とコミュニケーション','Hubungan Manusia & Komunikasi',10,'💌',['人間関係の基本','傾聴','受容と共感','非言語コミュニケーション','信頼関係','家族との関係','チームコミュニケーション','記録と報告','難しい場面','セクション復習']],
 ['社会の理解','Pemahaman Masyarakat & Sistem',15,'🏡',['社会保障の全体像','日本国憲法と福祉','介護保険制度','要介護認定','居宅サービス','施設サービス','地域包括ケア','障害者総合支援法','生活保護','成年後見制度','虐待防止と権利','高齢者施策','地域福祉','制度比較','セクション復習']],
 ['こころとからだのしくみ','Mekanisme Tubuh & Jiwa',13,'🫀',['こころのしくみ','身体の構造','加齢と身体','バイタルサイン','感染予防','栄養と水分','睡眠','排泄のしくみ','呼吸と循環','消化と嚥下','褥瘡予防','急変の観察','セクション復習']],
 ['発達と老化の理解','Perkembangan & Penuaan',10,'🌷',['発達の原則','青年期と成人期','老化の変化','高齢者の心理','フレイル','サルコペニア','認知機能の加齢','死と喪失','生活機能','セクション復習']],
 ['認知症の理解','Pemahaman Demensia',12,'🧠',['認知症の定義','中核症状','BPSD','アルツハイマー型','レビー小体型','血管性認知症','前頭側頭型','本人中心のケア','環境調整','家族支援','意思決定支援','セクション復習']],
 ['障害の理解','Pemahaman Disabilitas',12,'🧸',['障害の理念','身体障害','知的障害','精神障害','発達障害','高次脳機能障害','視覚障害','聴覚障害','重症心身障害','合理的配慮','家族支援','セクション復習']],
 ['医療的ケア','Perawatan Medis',9,'🩺',['医療的ケアの倫理','感染予防','バイタル観察','喀痰吸引の準備','口腔内吸引','鼻腔内吸引','経管栄養','異常時の対応','セクション復習']],
 ['介護の基本','Dasar-dasar Kaigo',12,'🍓',['介護福祉士の役割','専門職倫理','ICF','安全とリスク','事故予防','感染対策','チームアプローチ','多職種連携','記録','虐待防止','家族支援','セクション復習']],
 ['コミュニケーション技術','Teknik Komunikasi',10,'🫧',['基本姿勢','質問技法','傾聴技法','認知症との会話','失語症','聴覚障害','視覚障害','家族面接','チーム報告','セクション復習']],
 ['生活支援技術','Teknik Dukungan Kehidupan',17,'🛁',['生活環境','移動','安楽な姿勢','体位変換','移乗','食事','嚥下支援','口腔ケア','排泄','清潔保持','入浴','更衣','整容','睡眠','家事','終末期の生活','セクション復習']],
 ['介護過程','Proses Kaigo',10,'📝',['介護過程とは','情報収集','アセスメント','課題の明確化','目標設定','計画立案','実施','評価','記録と共有','セクション復習']],
 ['総合問題','Soal Komprehensif & Case Study',12,'🎀',['事例の読み方','尊厳と自立の事例','認知症事例','障害事例','医療的ケア事例','生活支援事例','家族支援事例','多職種連携事例','制度選択事例','長文ケース','模擬試験A','セクション復習']]
];

const qTemplates = [
 {q:'次の記述のうち、最も適切なものを1つ選びなさい。', choices:['利用者の意思と生活歴を尊重して支援する','介護者の都合を常に優先する','安全のために本人の選択をすべて制限する','効率だけを基準に支援方法を決める','本人に説明せずに支援を開始する'], answer:0, explanation:'利用者主体・尊厳の保持・自己決定の尊重は、介護福祉職の基本的な考え方です.'},
 {q:'介護福祉職の対応として、最も適切なものを1つ選びなさい。', choices:['できる部分は本人が行えるように支援する','すべてを介助して失敗を防ぐ','家族の希望だけで決める','問題が起きるまで観察しない','他職種への報告を省略する'], answer:0, explanation:'自立支援は、本人の能力・意思・安全を考えながら、できることを本人が行えるように支援することです.'},
 {q:'観察した変化をチームで共有する方法として、最も適切なものを1つ選びなさい。', choices:['事実を具体的に記録し、必要な相手に報告する','自分の推測だけを記録する','記録せず口頭だけで済ませる','家族にだけ伝える','都合の悪い変化は省略する'], answer:0, explanation:'記録・報告では、観察した事実と対応を具体的に残し、チームで共有します.'}
];

function makeLevel(sectionId, plan, levelId, topic){
 const isReview=topic==='セクション復習'; const base=qTemplates[(levelId+sectionId)%qTemplates.length];
 const question={id:`s${sectionId}-l${levelId}-q01`,difficulty:levelId>Math.ceil(plan[2]*.7)?'hard':levelId>Math.ceil(plan[2]*.35)?'medium':'easy',questionJa:`${topic}について、${base.q}`,questionId:`Topik ${topic}: manakah pernyataan yang paling tepat?`,choices:base.choices,choiceIds:['Mendukung sesuai kehendak dan riwayat hidup pengguna','Memprioritaskan kenyamanan caregiver','Membatasi semua pilihan pengguna demi keamanan','Menentukan hanya berdasarkan efisiensi','Memulai tanpa penjelasan'],correctIndex:base.answer,explanationJa:base.explanation,explanationId:base.explanation,sourceYear:sectionId<=3?'official-style':'syllabus-based'};
 const extra=[1,2,3,4].map((n)=>({...question,id:`s${sectionId}-l${levelId}-q0${n+1}`,questionJa:n%2?`${topic}に関する次の記述のうち、正しいものを1つ選びなさい。`:`${topic}の学習で大切な視点はどれか。`,questionId:`Dalam materi ${topic}, pilihan manakah yang paling tepat?`}));
 return {id:levelId,titleJa:`${topic}`,titleId:topic==='セクション復習'?'Section recap':topic,objective:`${topic}の基本を理解し、事例に応用する`,objectiveId:`Memahami ${topic} dan menerapkannya pada kasus.`,isReview,materi:[{titleJa:`${topic}を学ぶ`,titleId:`Belajar ${topic}`,bodyJa:`${topic}は介護福祉士国家試験で重要な学習テーマです。利用者の尊厳、安全、意思決定、生活を中心に考えます。`,bodyId:`${topic} adalah tema penting. Selalu hubungkan teori dengan martabat, keamanan, pilihan, dan kehidupan pengguna.`,terms:glossary.slice((sectionId+levelId)%glossary.length,(sectionId+levelId)%glossary.length+2).map(x=>x.ja)}, {titleJa:'試験の視点',titleId:'Sudut pandang ujian',bodyJa:'問題文の事実を確認し、最も個別的で尊厳を守る支援を選びます。',bodyId:'Baca fakta kasus, lalu pilih dukungan yang paling individual dan menjaga martabat.',terms:[]}],questions:[question,...extra]};
}

export const sections=plans.map(([titleJa,titleId,count,icon,topics],i)=>({id:i+1,titleJa,titleId,icon,levelCount:count,description:`${titleJa}を基礎から事例まで段階的に学びます。`,levels:topics.map((topic,j)=>makeLevel(i+1,[titleJa,titleId,count,icon,topics],j+1,topic))}));
export const getSection=(id)=>sections.find(s=>String(s.id)===String(id));
export const getLevel=(sid,lid)=>getSection(sid)?.levels.find(l=>String(l.id)===String(lid));
