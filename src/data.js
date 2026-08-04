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
 {q:'次の記述のうち、最も適切なものを1つ選びなさい。', choices:['利用者の意思と生活歴を尊重して支援する','介護者の都合を常に優先する','安全のために本人の選択をすべて制限する','効率だけを基準に支援方法を決める','本人に説明せずに支援を開始する'], answer:0, explanation:'利用者主体・尊厳の保持・自己決定の尊重は、介護福祉職の基本的な考え方です.', explanationId:'Jawaban benar adalah opsi yang menghormati kehendak dan riwayat hidup pengguna, karena prinsip dasar pekerjaan kaigo fukushi adalah "person-centered care": menjaga martabat (尊厳) dan penentuan diri (自己決定) pengguna, bukan mengutamakan kenyamanan caregiver atau membatasi pilihan pengguna secara sepihak demi keamanan.'},
 {q:'介護福祉職の対応として、最も適切なものを1つ選びなさい。', choices:['できる部分は本人が行えるように支援する','すべてを介助して失敗を防ぐ','家族の希望だけで決める','問題が起きるまで観察しない','他職種への報告を省略する'], answer:0, explanation:'自立支援は、本人の能力・意思・安全を考えながら、できることを本人が行えるように支援することです.', explanationId:'Jawaban benar adalah mendukung agar bagian yang bisa dilakukan sendiri tetap dilakukan oleh pengguna, karena ini inti dari konsep jiritsu shien (自立支援/dukungan kemandirian): caregiver membantu seminimal mungkin agar kemampuan pengguna tidak hilang, bukan mengambil alih semua tugas ("over-care") yang justru menurunkan kemandirian.'},
 {q:'観察した変化をチームで共有する方法として、最も適切なものを1つ選びなさい。', choices:['事実を具体的に記録し、必要な相手に報告する','自分の推測だけを記録する','記録せず口頭だけで済ませる','家族にだけ伝える','都合の悪い変化は省略する'], answer:0, explanation:'記録・報告では、観察した事実と対応を具体的に残し、チームで共有します.', explanationId:'Jawaban benar adalah mencatat fakta secara konkret dan melaporkannya ke pihak yang perlu tahu, karena prinsip kiroku/houkoku (記録・報告/pencatatan & pelaporan) mengharuskan fakta objektif yang diamati (bukan dugaan pribadi) didokumentasikan dan dibagikan ke tim, sehingga perawatan tetap konsisten dan bisa dipertanggungjawabkan.'}
];

function makeGeneratedJapaneseCard({sectionId,levelId,topic,cardIndex,type='explain'}){
  const term=topic.replace(/^[^\u3040-\u30ff\u4e00-\u9fff]*/, '')||'介護';
  const hooks=[
    `${term}について考えてみましょう。利用者の生活と気持ちを中心に支援することが大切です。`,
    `介護の現場では、決められた方法をそのまま行うだけでは十分ではありません。本人の状態と希望を確認します。`,
    `この場面で最も大切なのは、利用者を一人の生活者として尊重することです。`
  ];
  const bodies=[
    `${term}は、介護福祉士国家試験で重要な学習テーマです。支援を始める前に、利用者の意思、生活歴、身体状態、環境を確認します。\n\n安全や効率だけで判断せず、本人ができることを奪わないようにします。必要な部分だけを支援し、できる部分は本人が行えるように待つことが自立支援につながります。\n\n観察した事実は記録し、必要な相手に報告します。推測と事実を分け、チームで情報を共有しながら支援を見直しましょう。`,
    `${term}を理解するときは、利用者の尊厳と自己決定を出発点にします。本人の希望を確認せず、職員や家族の都合だけで方法を決めてはいけません。\n\n本人が拒否した場合も、単なる問題行動と決めつけず、痛み、不安、疲労、環境、時間帯などの理由を観察します。理由を考え、方法や環境を調整することが大切です。`,
    `試験では、最も個別的で、本人の意思と能力を尊重する選択肢を選びます。施設の効率だけを優先する選択肢や、説明なしに支援を始める選択肢には注意してください。`
  ];
  if(type==='hook')return {id:`generated-s${sectionId}l${levelId}m${cardIndex}`,type,body:{ja:hooks[cardIndex%hooks.length],id:`${topic}について、利用者の生活と気持ちを中心に学びます。`}};
  if(type==='recap')return {id:`generated-s${sectionId}l${levelId}m${cardIndex}`,type,heading:{ja:`${term}のまとめ`,id:`Ringkasan ${topic}`},points:bodies.map((x,i)=>({ja:x.split('\n')[0],id:`Poin penting ${i+1} tentang ${topic}.`}))};
  return {id:`generated-s${sectionId}l${levelId}m${cardIndex}`,type:'explain',heading:{ja:`${term}を学ぶ`,id:`Belajar ${topic}`},body:{ja:bodies[cardIndex%bodies.length],id:`${topic} adalah materi penting. Hubungkan teori dengan martabat, keamanan, pilihan, dan kehidupan pengguna.`}};
}

function makeLevel(sectionId, plan, levelId, topic){
 const isReview=topic==='セクション復習'; const base=qTemplates[(levelId+sectionId)%qTemplates.length];
 const question={id:`s${sectionId}-l${levelId}-q01`,difficulty:levelId>Math.ceil(plan[2]*.7)?'hard':levelId>Math.ceil(plan[2]*.35)?'medium':'easy',questionJa:`${topic}について、${base.q}`,questionId:`Topik ${topic}: manakah pernyataan yang paling tepat?`,choices:base.choices,choiceIds:['Mendukung sesuai kehendak dan riwayat hidup pengguna','Memprioritaskan kenyamanan caregiver','Membatasi semua pilihan pengguna demi keamanan','Menentukan hanya berdasarkan efisiensi','Memulai tanpa penjelasan'],correctIndex:base.answer,explanationJa:base.explanation,explanationId:base.explanationId,sourceYear:sectionId<=3?'official-style':'syllabus-based'};
 const extra=[1,2,3,4].map((n)=>({...question,id:`s${sectionId}-l${levelId}-q0${n+1}`,questionJa:n%2?`${topic}に関する次の記述のうち、正しいものを1つ選びなさい。`:`${topic}の学習で大切な視点はどれか。`,questionId:`Dalam materi ${topic}, pilihan manakah yang paling tepat?`}));
 return {id:levelId,titleJa:`${topic}`,titleId:topic==='セクション復習'?'Section recap':topic,objective:`${topic}の基本を理解し、事例に応用する`,objectiveId:`Memahami ${topic} dan menerapkannya pada kasus.`,isReview,materi:[makeGeneratedJapaneseCard({sectionId,levelId,topic,cardIndex:0,type:'hook'}),makeGeneratedJapaneseCard({sectionId,levelId,topic,cardIndex:1,type:'explain'}),makeGeneratedJapaneseCard({sectionId,levelId,topic,cardIndex:2,type:'explain'}),makeGeneratedJapaneseCard({sectionId,levelId,topic,cardIndex:3,type:'explain'}),makeGeneratedJapaneseCard({sectionId,levelId,topic,cardIndex:4,type:'recap'})],questions:[question,...extra]};
}

export const sections=plans.map(([titleJa,titleId,count,icon,topics],i)=>({id:i+1,titleJa,titleId,icon,levelCount:count,description:`${titleJa}を基礎から事例まで段階的に学びます。`,levels:topics.map((topic,j)=>makeLevel(i+1,[titleJa,titleId,count,icon,topics],j+1,topic))}));
export const getSection=(id)=>sections.find(s=>String(s.id)===String(id));
export const getLevel=(sid,lid)=>getSection(sid)?.levels.find(l=>String(l.id)===String(lid));

// Semua soal dari semua section/level digabung — dipakai untuk mode Practice/Latihan unlimited.
export const allQuestions = sections.flatMap(s=>s.levels.flatMap(l=>l.questions.map(q=>({...q, sectionId:s.id, levelId:l.id, sectionTitleId:s.titleId, levelTitleId:l.titleId}))));
export const randomQuestion = (excludeId)=>{
  if(allQuestions.length<=1) return allQuestions[0];
  let q; do { q = allQuestions[Math.floor(Math.random()*allQuestions.length)]; } while(q.id===excludeId);
  return q;
};
