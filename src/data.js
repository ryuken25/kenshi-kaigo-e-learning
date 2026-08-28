import {TOPIC,REVIEW,SECTION_ID_DESC,BODY_ID,HOOK_ID,POINT_ID,TIP_HEADING} from './content/translations.js';

export const glossary = [
  ['尊厳','そんげん','Martabat manusia'],['自立支援','じりつしえん','Dukungan kemandirian'],['自己決定','じこけってい','Penentuan diri'],['QOL','Quality of Life','Kualitas hidup'],['アドボカシー','advocacy','Advokasi hak pengguna'],['傾聴','けいちょう','Mendengar aktif'],['共感','きょうかん','Empati'],['介護保険','かいごほけん','Asuransi perawatan'],['地域包括ケアシステム','ちいきほうかつケアシステム','Sistem care berbasis komunitas'],['認知症','にんちしょう','Demensia'],['BPSD','behavioral and psychological symptoms','Gejala perilaku dan psikologis demensia'],['誤嚥','ごえん','Aspirasi/tersedak masuk saluran napas'],['褥瘡','じょくそう','Luka tekan'],['喀痰吸引','かくたんきゅういん','Suction dahak'],['介護過程','かいごかてい','Proses介護']
].map(([ja,reading,id])=>({ja,reading,id}));

const plans = [
 ['人間の尊厳と自立','Kenapa martabat jadi dasar tiap tindakan',10,'✿',['尊厳と人権','自己決定','QOL','ノーマライゼーション','権利擁護','アドボカシー','自立支援','生活者主体','倫理的ジレンマ','セクション復習']],
 ['人間関係とコミュニケーション','Membangun kepercayaan lewat cara bicara',10,'✉',['人間関係の基本','傾聴','受容と共感','非言語コミュニケーション','信頼関係','家族との関係','チームコミュニケーション','記録と報告','難しい場面','セクション復習']],
 ['社会の理解','Asuransi kaigo dan aturan yang mengikat',15,'⌂',['社会保障の全体像','日本国憲法と福祉','介護保険制度','要介護認定','居宅サービス','施設サービス','地域包括ケア','障害者総合支援法','生活保護','成年後見制度','虐待防止と権利','高齢者施策','地域福祉','制度比較','セクション復習']],
 ['こころとからだのしくみ','Cara kerja tubuh dan pikiran lansia',13,'♥',['こころのしくみ','身体の構造','加齢と身体','バイタルサイン','感染予防','栄養と水分','睡眠','排泄のしくみ','呼吸と循環','消化と嚥下','褥瘡予防','急変の観察','セクション復習']],
 ['発達と老化の理解','Apa yang berubah seiring bertambah usia',10,'❀',['発達の原則','青年期と成人期','老化の変化','高齢者の心理','フレイル','サルコペニア','認知機能の加齢','死と喪失','生活機能','セクション復習']],
 ['認知症の理解','Mengenali gejala, mendampingi tanpa melukai',12,'◉',['認知症の定義','中核症状','BPSD','アルツハイマー型','レビー小体型','血管性認知症','前頭側頭型','本人中心のケア','環境調整','家族支援','意思決定支援','セクション復習']],
 ['障害の理解','Ragam disabilitas dan dukungan yang pas',12,'◑',['障害の理念','身体障害','知的障害','精神障害','発達障害','高次脳機能障害','視覚障害','聴覚障害','重症心身障害','合理的配慮','家族支援','セクション復習']],
 ['医療的ケア','Isap lendir dan makan lewat selang',9,'✚',['医療的ケアの倫理','感染予防','バイタル観察','喀痰吸引の準備','口腔内吸引','鼻腔内吸引','経管栄養','異常時の対応','セクション復習']],
 ['介護の基本','Etika, keselamatan, dan kerja tim',12,'◆',['介護福祉士の役割','専門職倫理','ICF','安全とリスク','事故予防','感染対策','チームアプローチ','多職種連携','記録','虐待防止','家族支援','セクション復習']],
 ['コミュニケーション技術','Cara bicara untuk situasi yang sulit',10,'○',['基本姿勢','質問技法','傾聴技法','認知症との会話','失語症','聴覚障害','視覚障害','家族面接','チーム報告','セクション復習']],
 ['生活支援技術','Memindahkan, memandikan, menyuapi',17,'□',['生活環境','移動','安楽な姿勢','体位変換','移乗','食事','嚥下支援','口腔ケア','排泄','清潔保持','入浴','更衣','整容','睡眠','家事','終末期の生活','セクション復習']],
 ['介護過程','Dari mengamati sampai menyusun rencana',10,'✎',['介護過程とは','情報収集','アセスメント','課題の明確化','目標設定','計画立案','実施','評価','記録と共有','セクション復習']],
 ['総合問題','Kasus yang menggabungkan semuanya',12,'✿',['事例の読み方','尊厳と自立の事例','認知症事例','障害事例','医療的ケア事例','生活支援事例','家族支援事例','多職種連携事例','制度選択事例','長文ケース','模擬試験A','セクション復習']]
];

// PRNG deterministik (FNV-1a hash + mulberry32). Konten dibangun ulang tiap import —
// di server, di client, dan tiap build — jadi urutan pilihan TIDAK BOLEH pakai Math.random().
const hashSeed=(s)=>{let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0};
export {hashSeed}; // dipakai kutipan harian (data/quotes.js) — satu sumber determinisme
const rngFrom=(k)=>{let a=hashSeed(k);return ()=>{a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return ((t^t>>>14)>>>0)/4294967296}};
// Fisher-Yates dengan seed dari key stabil. Pilihan JA+ID diacak sebagai pasangan supaya tidak pernah geser.
const shuffleSeeded=(arr,k)=>{const r=rngFrom(k),a=arr.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(r()*(i+1)),t=a[i];a[i]=a[j];a[j]=t}return a};

// Bank template soal. Jawaban benar SELALU opsi yang berpusat pada利用者 (意思・尊厳・自立支援);
// pengecoh = paternalistik / demi kemudahan fasilitas. `answer` = index BENAR SEBELUM diacak.
// opts: [[teks JA, teks ID], ...] — dipasangkan biar terjemahan ikut berpindah saat diacak.
const qTemplates = [
 {q:'次の記述のうち、最も適切なものを1つ選びなさい。',qId:'manakah pernyataan yang paling tepat?',answer:0,opts:[['利用者の意思と生活歴を尊重して支援する','Mendukung dengan menghormati kehendak dan riwayat hidup pengguna'],['介護者の都合を常に優先して支援する','Selalu mengutamakan kenyamanan caregiver'],['安全のために本人の選択をすべて制限する','Membatasi seluruh pilihan pengguna demi keamanan'],['効率だけを基準に支援方法を決める','Menentukan metode bantuan hanya berdasarkan efisiensi'],['本人に説明せずに支援を開始する','Memulai bantuan tanpa menjelaskan kepada pengguna']],explanationJa:'利用者主体・尊厳の保持・自己決定の尊重は、介護福祉職の最も基本的な考え方です。安全や効率は大切ですが、本人の意思を置き換える理由にはなりません。',explanationId:'Jawaban benar adalah opsi yang menghormati kehendak dan riwayat hidup pengguna, karena prinsip dasar pekerjaan kaigo fukushi adalah person-centered care: menjaga martabat (尊厳) dan penentuan diri (自己決定). Keamanan dan efisiensi itu penting, tetapi bukan alasan untuk menggantikan kehendak pengguna.'},
 {q:'介護福祉職の対応として、最も適切なものを1つ選びなさい。',qId:'bagaimana respons petugas kaigo yang paling tepat?',answer:0,opts:[['本人ができる部分は見守り、必要な部分だけを介助する','Mengawasi bagian yang bisa dilakukan sendiri dan membantu hanya bagian yang perlu'],['時間がかかるので最初からすべてを介助する','Membantu semuanya sejak awal karena kalau ditunggu lama'],['失敗を防ぐために本人には何もさせない','Tidak membiarkan pengguna melakukan apa pun agar tidak gagal'],['家族の希望だけを聞いて方法を決める','Menentukan metode hanya dari permintaan keluarga'],['危険がありそうな動作はすべてやめさせる','Menghentikan semua gerakan yang terlihat berisiko']],explanationJa:'自立支援では、本人の能力と意思を確かめ、できることを続けられるように必要な部分だけを支援します。すべてを代わりに行う過介護は、残っている力を早く失わせます。',explanationId:'Jawaban benar adalah mengawasi bagian yang bisa dilakukan sendiri dan membantu hanya bagian yang perlu, karena inti jiritsu shien (自立支援) adalah menjaga kemampuan pengguna tetap terpakai. Mengambil alih semuanya (over-care) justru mempercepat hilangnya fungsi yang masih ada.'},
 {q:'観察した変化をチームで共有する方法として、最も適切なものを1つ選びなさい。',qId:'bagaimana cara membagikan perubahan yang teramati ke tim?',answer:0,opts:[['観察した事実を具体的に記録し、必要な職種に報告する','Mencatat fakta yang teramati secara konkret dan melaporkannya ke profesi yang perlu tahu'],['自分の推測を事実として記録する','Mencatat dugaan pribadi sebagai fakta'],['記録は残さず口頭の申し送りだけで済ませる','Cukup serah-terima lisan tanpa meninggalkan catatan'],['家族にだけ伝えて職員には伝えない','Hanya memberi tahu keluarga, tidak memberi tahu staf'],['都合の悪い変化は記録から省く','Menghilangkan perubahan yang tidak menguntungkan dari catatan']],explanationJa:'記録・報告では、事実と推測を分けて具体的に残し、必要な職種と速やかに共有します。省略や口頭のみの伝達は、ケアの継続性と安全を損ないます。',explanationId:'Jawaban benar adalah mencatat fakta secara konkret lalu melaporkannya ke pihak yang perlu tahu, karena prinsip kiroku/houkoku (記録) memisahkan fakta objektif dari dugaan dan membagikannya ke tim. Penghilangan data atau hanya lisan merusak kesinambungan dan keselamatan perawatan.'},
 {q:'利用者が支援を拒否した場面での対応として、最も適切なものを1つ選びなさい。',qId:'apa respons paling tepat saat pengguna menolak bantuan?',answer:0,opts:[['拒否の背景にある痛みや不安を確かめ、方法や時間を調整する','Memastikan nyeri atau kecemasan di balik penolakan, lalu menyesuaikan cara dan waktunya'],['決められた時間なので説得して続ける','Tetap melanjutkan sambil membujuk karena sudah masuk jadwal'],['問題行動として記録し、以後は声をかけない','Mencatatnya sebagai perilaku bermasalah dan berhenti menyapa'],['本人が納得する前に手早く介助を終わらせる','Menyelesaikan bantuan cepat-cepat sebelum pengguna setuju'],['家族に連絡して本人を叱ってもらう','Menghubungi keluarga agar pengguna dimarahi']],explanationJa:'拒否は一つの意思表示です。単なる問題行動と決めつけず、痛み・不安・疲労・環境・時間帯などの理由を観察し、方法や時間を調整します。',explanationId:'Jawaban benar adalah menelusuri alasan di balik penolakan lalu menyesuaikan cara dan waktu, karena penolakan adalah bentuk penyampaian kehendak — bukan sekadar "perilaku bermasalah". Yang perlu diperiksa: nyeri, kecemasan, kelelahan, lingkungan, dan jam pelaksanaan.'},
 {q:'支援を始める前の対応として、最も適切なものを1つ選びなさい。',qId:'apa yang paling tepat dilakukan sebelum memulai bantuan?',answer:0,opts:[['本人に分かる言葉で目的と手順を説明し、同意を得てから始める','Menjelaskan tujuan dan langkah dengan bahasa yang dipahami pengguna, lalu memulai setelah ada persetujuan'],['認知症があるので説明は省略する','Melewatkan penjelasan karena pengguna punya demensia'],['説明は家族にだけ行い、本人には伝えない','Menjelaskan hanya kepada keluarga, tidak kepada pengguna'],['手が空いたときに黙って始める','Memulai tanpa berkata apa pun begitu ada waktu luang'],['書面を渡すだけで理解を確認しない','Cukup menyerahkan lembar tertulis tanpa memastikan pemahaman']],explanationJa:'どのような支援でも、本人に分かる方法で説明し、同意を得ることが尊厳と自己決定の尊重につながります。認知症があっても説明を省略してよい理由にはなりません。',explanationId:'Jawaban benar adalah menjelaskan dengan bahasa yang dipahami lalu meminta persetujuan, karena informed consent adalah wujud konkret penghormatan martabat dan penentuan diri. Adanya demensia bukan alasan untuk melewatkan penjelasan — caranya yang disesuaikan, bukan dihapus.'},
 {q:'利用者のプライバシーと尊厳への配慮として、最も適切なものを1つ選びなさい。',qId:'bagaimana bentuk kepedulian pada privasi dan martabat pengguna?',answer:0,opts:[['排泄や入浴の介助では、カーテンやタオルで露出を最小限にする','Saat membantu eliminasi atau mandi, meminimalkan bagian terbuka dengan gorden atau handuk'],['忙しいときは居室の扉を開けたまま介助する','Membantu dengan pintu kamar tetap terbuka saat sedang sibuk'],['他の利用者の前で排泄の失敗について話す','Membicarakan kegagalan eliminasi di depan pengguna lain'],['知った個人情報を休憩室で話題にする','Menjadikan informasi pribadi yang diketahui sebagai bahan obrolan di ruang istirahat'],['呼びかけは子ども扱いの愛称で統一する','Menyeragamkan sapaan dengan nama panggilan seperti kepada anak kecil']],explanationJa:'プライバシーの保護と丁寧な言葉かけは、身体的な安全と同じく尊厳の保持に直結します。忙しさは配慮を省く理由になりません。',explanationId:'Jawaban benar adalah meminimalkan keterbukaan tubuh saat membantu eliminasi atau mandi, karena perlindungan privasi dan sapaan yang santun sama pentingnya dengan keselamatan fisik dalam menjaga martabat (尊厳). Kesibukan bukan alasan untuk melewatkannya.'},
 {q:'多職種連携における介護福祉職の役割として、最も適切なものを1つ選びなさい。',qId:'apa peran petugas kaigo dalam kolaborasi antarprofesi?',answer:0,opts:[['生活場面で気づいた変化を、具体的な事実として他職種に伝える','Menyampaikan perubahan yang disadari di situasi sehari-hari sebagai fakta konkret ke profesi lain'],['医療の判断なので気づいたことは伝えない','Tidak menyampaikan temuan karena itu wilayah penilaian medis'],['看護師の指示だけを待ち、自分では観察しない','Hanya menunggu instruksi perawat dan tidak mengamati sendiri'],['会議では意見を出さずに聞くだけにする','Di rapat hanya mendengarkan tanpa menyampaikan pendapat'],['他職種の記録は読まずに介助を進める','Melanjutkan bantuan tanpa membaca catatan profesi lain']],explanationJa:'介護福祉職は生活場面を最も長く観察する立場にあり、その情報を具体的に共有することがチームケアの出発点になります。判断は他職種でも、観察と報告は介護の役割です。',explanationId:'Jawaban benar adalah menyampaikan perubahan sehari-hari sebagai fakta konkret, karena petugas kaigo adalah pihak yang paling lama mengamati kehidupan pengguna sehingga informasinya menjadi titik awal team care. Penilaian klinis boleh milik profesi lain, tetapi observasi dan pelaporan tetap tugas kaigo.'},
 {q:'事故を防ぐための対応として、最も適切なものを1つ選びなさい。',qId:'apa tindakan paling tepat untuk mencegah kecelakaan?',answer:0,opts:[['危険の要因を環境の側から見直し、本人の活動を制限しすぎない','Meninjau faktor bahaya dari sisi lingkungan tanpa membatasi aktivitas pengguna secara berlebihan'],['転倒の恐れがあるので歩行はやめてもらう','Meminta pengguna berhenti berjalan karena berisiko jatuh'],['事故が起きてから対策を考える','Baru memikirkan tindakan pencegahan setelah kecelakaan terjadi'],['ヒヤリハットは報告せず個人で気をつける','Tidak melaporkan near-miss dan cukup berhati-hati sendiri'],['安全のためにベッド周囲を柵で囲む','Mengelilingi tempat tidur dengan pembatas demi keamanan']],explanationJa:'リスク管理は活動を止めることではなく、環境や手順を調整して安全と自立を両立させることです。ヒヤリハットの共有が再発防止につながります。',explanationId:'Jawaban benar adalah meninjau bahaya dari sisi lingkungan tanpa membatasi aktivitas berlebihan, karena manajemen risiko bertujuan menyeimbangkan keselamatan dan kemandirian — bukan menghentikan aktivitas. Berbagi laporan near-miss itulah yang mencegah kejadian terulang.'},
 {q:'家族への対応として、最も適切なものを1つ選びなさい。',qId:'apa bentuk pendampingan keluarga yang paling tepat?',answer:0,opts:[['家族の負担や思いを聴き、本人の意思と家族の希望の両方を確認する','Mendengarkan beban dan perasaan keluarga, lalu memastikan kehendak pengguna maupun harapan keluarga'],['家族の希望を本人の意思より優先する','Mengutamakan harapan keluarga di atas kehendak pengguna'],['介護は専門職の仕事なので家族には関わらせない','Tidak melibatkan keluarga karena kaigo adalah pekerjaan tenaga profesional'],['家族の不安には触れず、事務的な連絡だけを行う','Tidak menyentuh kecemasan keluarga dan hanya memberi kabar administratif'],['本人の前で家族の対応を批判する','Mengkritik cara keluarga di depan pengguna']],explanationJa:'家族は支援の対象でもあり協働者でもあります。家族の思いを受けとめながら、本人の意思を中心に調整することが求められます。',explanationId:'Jawaban benar adalah mendengarkan beban keluarga sambil memastikan kehendak pengguna, karena keluarga sekaligus menjadi sasaran dukungan dan mitra kerja. Perasaan keluarga diterima, tetapi titik pusat pengambilan keputusan tetap kehendak pengguna.'},
 {q:'介護過程の進め方として、最も適切なものを1つ選びなさい。',qId:'bagaimana alur proses kaigo yang paling tepat?',answer:0,opts:[['情報を収集して課題を明確にし、本人と目標を共有して計画する','Mengumpulkan informasi, memperjelas masalah, lalu menyusun rencana dengan tujuan yang disepakati bersama pengguna'],['経験に基づいて計画を立て、本人には伝えない','Menyusun rencana berdasarkan pengalaman dan tidak memberitahukannya ke pengguna'],['一度立てた計画は評価せずに続ける','Menjalankan rencana terus tanpa pernah dievaluasi'],['課題は職員の負担が少ない順に決める','Menentukan prioritas masalah dari yang paling ringan bagi staf'],['アセスメントを省いて計画から始める','Melewati asesmen dan langsung menyusun rencana']],explanationJa:'介護過程はアセスメント→課題の明確化→目標と計画→実施→評価という循環で進み、目標を本人と共有することが前提になります。',explanationId:'Jawaban benar adalah mengumpulkan informasi, memperjelas masalah, lalu merencanakan bersama pengguna, karena kaigo katei (介護過程) adalah siklus asesmen → perumusan masalah → tujuan & rencana → pelaksanaan → evaluasi. Tujuan yang tidak disepakati bersama pengguna membuat seluruh siklus kehilangan dasarnya.'},
 {q:'利用者の権利を守る対応として、最も適切なものを1つ選びなさい。',qId:'apa tindakan paling tepat untuk melindungi hak pengguna?',answer:0,opts:[['身体拘束は原則行わず、代わりの方法をチームで検討する','Pada prinsipnya tidak melakukan pengekangan fisik dan mencari metode alternatif bersama tim'],['危険なので本人の同意なく車いすにベルトを付ける','Memasang sabuk di kursi roda tanpa persetujuan pengguna karena berbahaya'],['虐待が疑われても確証がなければ報告しない','Tidak melaporkan dugaan penganiayaan selama belum ada bukti pasti'],['判断力が低下した人の希望は聞かなくてよい','Menganggap harapan orang dengan penurunan daya nilai tidak perlu didengar'],['苦情は事業所の中だけで処理し記録に残さない','Menangani keluhan hanya di dalam lembaga tanpa mencatatnya']],explanationJa:'身体拘束は原則禁止で、緊急やむを得ない場合は三要件の確認と記録が必要です。虐待が疑われる段階でも通報の対象になります。',explanationId:'Jawaban benar adalah tidak melakukan pengekangan fisik dan mencari alternatif bersama tim, karena shintai kousoku (身体拘束) pada prinsipnya dilarang; pengecualian darurat menuntut tiga syarat dan pencatatan. Dugaan penganiayaan pun sudah wajib dilaporkan, tidak perlu menunggu bukti pasti.'},
 {q:'学習の視点として正しいものを1つ選びなさい。',qId:'manakah sudut pandang belajar yang benar?',answer:0,opts:[['制度や技術を、利用者の生活と意思に結びつけて理解する','Memahami sistem dan teknik dengan menghubungkannya ke kehidupan dan kehendak pengguna'],['用語をそのまま暗記し、事例には当てはめない','Menghafal istilah apa adanya tanpa menerapkannya ke kasus'],['手順だけを覚え、目的は考えない','Menghafal hanya urutan langkah tanpa memikirkan tujuannya'],['試験に出る部分だけを読み、生活場面は考えない','Membaca hanya bagian yang keluar di ujian tanpa memikirkan situasi nyata'],['自分の経験だけを基準にして判断する','Menilai hanya berdasarkan pengalaman pribadi']],explanationJa:'知識は事例に結びつけて初めて使えます。用語の暗記だけでなく、利用者の生活と意思に照らして考える習慣が国家試験でも実践でも求められます。',explanationId:'Jawaban benar adalah menghubungkan sistem dan teknik ke kehidupan serta kehendak pengguna, karena pengetahuan baru berguna ketika dikaitkan dengan kasus nyata. Hafalan istilah dan urutan langkah tanpa memahami tujuannya tidak terpakai, baik di ujian nasional maupun di lapangan.'}
];

/* 60 istilah glossary yang tadinya tidak muncul di konten manapun (audit 2026-08:
   build-glossary-index.mjs menghitung occurrences=0 untuk semuanya). Ditanam LITERAL
   di sini — bukan di-import dari glossary.json — karena indexer memindai teks sumber
   data.js apa adanya. Tiap level menampilkan 3 istilah + artinya (id.short asli dari
   glossary.json) lewat kartu "Istilah terkait". */
const GLOSSARY_EMBED=[
 {t:'ADL',id:'aktivitas dasar sehari-hari'},{t:'IADL',id:'aktivitas instrumental sehari-hari'},
 {t:'アルツハイマー型認知症',id:'demensia Alzheimer'},{t:'バイステックの7原則',id:'7 prinsip Biestek'},
 {t:'ボディメカニクス',id:'mekanika tubuh'},{t:'燃え尽き症候群',id:'sindrom kelelahan kerja'},
 {t:'介護支援専門員',id:'care manager'},{t:'地域包括支援センター',id:'pusat dukungan komunitas'},
 {t:'脱水',id:'dehidrasi'},{t:'エンパワメント',id:'pemberdayaan'},
 {t:'介護施設',id:'fasilitas kaigo'},{t:'福祉用具',id:'alat bantu kesejahteraan'},
 {t:'服薬',id:'minum obat'},{t:'排便',id:'buang air besar'},
 {t:'排泄介助',id:'bantuan buang air'},{t:'排尿',id:'buang air kecil'},
 {t:'廃用症候群',id:'sindrom disuse'},{t:'白内障',id:'katarak'},
 {t:'開かれた質問',id:'pertanyaan terbuka'},{t:'標準予防策',id:'kewaspadaan standar'},
 {t:'胃ろう',id:'gastrostomi (PEG)'},{t:'若年性認知症',id:'demensia usia muda'},
 {t:'自己覚知',id:'kesadaran diri perawat'},{t:'介護計画',id:'rencana perawatan'},
 {t:'介護職',id:'petugas kaigo'},{t:'回想法',id:'terapi reminisensi'},
 {t:'経鼻経管栄養',id:'selang nutrisi lewat hidung'},{t:'見当識障害',id:'disorientasi'},
 {t:'血圧',id:'tekanan darah'},{t:'個人の尊重',id:'penghormatan individu'},
 {t:'骨粗鬆症',id:'osteoporosis'},{t:'恒常性',id:'homeostasis'},
 {t:'高齢者虐待',id:'kekerasan terhadap lansia'},{t:'客観的情報',id:'informasi objektif'},
 {t:'急変時対応',id:'penanganan kondisi mendadak'},{t:'レビー小体型認知症',id:'demensia Lewy body'},
 {t:'マズローの欲求階層',id:'hierarki kebutuhan Maslow'},{t:'モニタリング',id:'pemantauan'},
 {t:'内部障害',id:'disabilitas organ dalam'},{t:'難聴',id:'gangguan pendengaran'},
 {t:'発熱',id:'demam'},{t:'入浴介助',id:'bantuan mandi'},
 {t:'ピアサポート',id:'dukungan sesama'},{t:'パーソン・センタード・ケア',id:'perawatan berpusat pada orang'},
 {t:'プライバシー保護',id:'perlindungan privasi'},{t:'パルスオキシメーター',id:'oksimeter denyut'},
 {t:'ラポール',id:'hubungan saling percaya'},{t:'リスクマネジメント',id:'manajemen risiko'},
 {t:'老年期',id:'masa lanjut usia'},{t:'清拭',id:'seka badan'},
 {t:'せん妄',id:'delirium'},{t:'食事介助',id:'bantuan makan'},
 {t:'障害受容',id:'penerimaan disabilitas'},{t:'主観的情報',id:'informasi subjektif'},
 {t:'体温',id:'suhu tubuh'},{t:'低栄養',id:'malnutrisi'},
 {t:'統合失調症',id:'skizofrenia'},{t:'バリデーション',id:'terapi validasi'},
 {t:'残存機能',id:'fungsi yang masih tersisa'},{t:'前頭側頭型認知症',id:'demensia frontotemporal'}
];
/* 3 istilah berurutan, dipilih deterministik dari seed level — 152 level × 3 istilah
   membuat semua 60 entri tayang berulang kali tanpa pernah berubah antar render. */
function levelTerms(sectionId,levelId){const s=hashSeed(`terms-s${sectionId}-l${levelId}`)%GLOSSARY_EMBED.length;return [0,1,2].map(i=>GLOSSARY_EMBED[(s+i)%GLOSSARY_EMBED.length])}

function makeGeneratedJapaneseCard({sectionId,levelId,topic,titleId,cardIndex,type='explain'}){
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
  if(type==='hook')return {id:`generated-s${sectionId}l${levelId}m${cardIndex}`,type,body:{ja:hooks[cardIndex%hooks.length],id:HOOK_ID[cardIndex%HOOK_ID.length](titleId)}};
  if(type==='tip')return {id:`generated-s${sectionId}l${levelId}m${cardIndex}`,type,heading:TIP_HEADING,body:{ja:bodies[2],id:BODY_ID[2](titleId)}};
  if(type==='recap')return {id:`generated-s${sectionId}l${levelId}m${cardIndex}`,type,heading:{ja:`${term}のまとめ`,id:`Ringkasan ${titleId}`},points:bodies.map((x,i)=>({ja:x.split('\n')[0],id:POINT_ID[i](titleId)}))};
  // Kartu explain kedua (cardIndex 2) dapat heading berbeda supaya dua explain di satu level
  // tidak berbagi skeleton heading yang sama.
  return {id:`generated-s${sectionId}l${levelId}m${cardIndex}`,type:'explain',heading:cardIndex===2?{ja:`${term}の理解を深める`,id:`Mendalami ${titleId}`}:{ja:`${term}を学ぶ`,id:`Belajar ${titleId}`},body:{ja:bodies[cardIndex%bodies.length],id:BODY_ID[cardIndex%BODY_ID.length](titleId)}};
}

// Pilihan diacak dengan seed stabil, lalu correctIndex dicari ulang dari REFERENSI opsi benar —
// jadi jawaban menyebar ke posisi 0-4 tanpa pernah lepas dari opsi yang secara isi memang benar.
function makeQuestion({sectionId,levelId,topic,topicId,qIndex,tpl,difficulty}){
 const opts=shuffleSeeded(tpl.opts,`s${sectionId}-l${levelId}-q${qIndex}`);
 return {id:`s${sectionId}-l${levelId}-q0${qIndex+1}`,difficulty,questionJa:`${topic}について、${tpl.q}`,questionId:`Topik ${topicId}: ${tpl.qId}`,choices:opts.map(o=>o[0]),choiceIds:opts.map(o=>o[1]),correctIndex:opts.indexOf(tpl.opts[tpl.answer]),explanationJa:tpl.explanationJa,explanationId:tpl.explanationId,sourceYear:sectionId<=3?'official-style':'syllabus-based'};
}

function makeLevel(sectionId, plan, levelId, topic){
 const isReview=topic==='セクション復習';
 // Judul Indonesia: dari tabel TOPIC, atau REVIEW + judul section untuk level recap.
 // Override per-section ('<sid>:<topic>') menang atas entri dasar — topik yang sah muncul
 // di dua section dapat judul & teks ID berbeda.
 const titleId=isReview?`${REVIEW[plan[0]].t} — ${plan[1]}`:(TOPIC[`${sectionId}:${topic}`]||TOPIC[topic]).t;
 const difficulty=levelId>Math.ceil(plan[2]*.7)?'hard':levelId>Math.ceil(plan[2]*.35)?'medium':'easy';
 // 5 soal per level = 5 template BERBEDA (stride 5 coprime dengan 12 → tidak ada yang terulang).
 const start=hashSeed(`s${sectionId}-l${levelId}`)%qTemplates.length;
 const questions=[0,1,2,3,4].map(i=>makeQuestion({sectionId,levelId,topic,topicId:titleId,qIndex:i,tpl:qTemplates[(start+i*5)%qTemplates.length],difficulty}));
 return {id:levelId,titleJa:`${topic}`,titleId,objective:`${topic}の基本を理解し、事例に応用する`,objectiveId:`Memahami ${titleId} dan menerapkannya pada kasus.`,isReview,materi:[makeGeneratedJapaneseCard({sectionId,levelId,topic,titleId,cardIndex:0,type:'hook'}),makeGeneratedJapaneseCard({sectionId,levelId,topic,titleId,cardIndex:1,type:'explain'}),makeGeneratedJapaneseCard({sectionId,levelId,topic,titleId,cardIndex:2,type:'explain'}),makeGeneratedJapaneseCard({sectionId,levelId,topic,titleId,cardIndex:3,type:isReview?'tip':'explain'}),makeGeneratedJapaneseCard({sectionId,levelId,topic,titleId,cardIndex:4,type:'recap'}),{id:`generated-s${sectionId}l${levelId}m5`,type:'terms',heading:{ja:'関連用語',id:'Istilah terkait'},terms:levelTerms(sectionId,levelId)}],questions};
}


/* Warna & ikon per bab (v9, mengikuti kanvas desain).
   13 bab yang semuanya sewarna bikin grid jadi dinding datar, dan warna itulah
   yang dipakai orang untuk mengingat "bab yang biru". Warna DIPUTAR dari enam
   rona supaya bab bertetangga tidak pernah kembar; nilainya sengaja bukan token
   tema — tema menguasai latar, kartu, dan teks, warna bab menguasai kartunya.
   Ikon menggantikan emoji: emoji dirender font sistem sehingga bentuknya beda di
   Android/iOS/Windows dan warnanya tidak bisa ikut tema. Nama ikon harus ada di
   SECTION_ICON_NAMES pada src/Icons.jsx. */
// Aksen bab TIDAK lagi hex mati: 13 nilai ini custom property yang dihitung dari
// rona tema aktif (--sec-h di themes.css, --sec-N di styles.css). Dipasang ke
// --accent lewat inline style di main.jsx, jadi ikon, bilah progres, dan cincin
// kartu bab semuanya ikut berganti saat user memilih Yuki atau Luna.
export const SECTION_ACCENT=Array.from({length:13},(_,i)=>`var(--sec-${i+1})`);
export const SECTION_ICON=['sakura','surat','rumah','jantung','tulip','otak','beruang','stetoskop','stroberi','gelembung','bak','catatan','pita'];

export const sections=plans.map(([titleJa,titleId,count,icon,topics],i)=>({id:i+1,titleJa,titleId,icon,iconName:SECTION_ICON[i],accent:SECTION_ACCENT[i],levelCount:count,description:`${titleJa}を基礎から事例まで段階的に学びます。`,descriptionId:SECTION_ID_DESC[i],levels:topics.map((topic,j)=>makeLevel(i+1,[titleJa,titleId,count,icon,topics],j+1,topic))}));
export const getSection=(id)=>sections.find(s=>String(s.id)===String(id));
export const getLevel=(sid,lid)=>getSection(sid)?.levels.find(l=>String(l.id)===String(lid));

// Semua soal dari semua section/level digabung — dipakai untuk mode Practice/Latihan unlimited.
export const allQuestions = sections.flatMap(s=>s.levels.flatMap(l=>l.questions.map(q=>({...q, sectionId:s.id, levelId:l.id, sectionTitleId:s.titleId, levelTitleId:l.titleId}))));
export const randomQuestion = (excludeId)=>{
  if(allQuestions.length<=1) return allQuestions[0];
  let q; do { q = allQuestions[Math.floor(Math.random()*allQuestions.length)]; } while(q.id===excludeId);
  return q;
};
