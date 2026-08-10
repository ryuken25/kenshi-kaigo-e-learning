// Terjemahan Indonesia untuk konten materi yang dibangun src/data.js — integrasi pack v7.
//
// SEBELUM file ini ada, semua field `id` di kartu materi adalah satu kalimat cetakan
// ("… adalah materi penting. Hubungkan teori dengan …") yang dipakai ulang di 152 level.
// Audit 44-TRANSLATION-QUALITY.md (docs/v7) menyebutnya temuan terbesar v7: yang berbahasa
// Indonesia tidak mendapat materinya sama sekali.
//
// Desain: teks Jepang sumber memang templated-by-design (4 tubuh kalimat + {term} untuk
// 152 level), maka terjemahannya pun berbagi kerangka — TETAPi setiap pemakaian menyisipkan
// judul topik Indonesianya, sehingga (a) tidak ada dua level dengan teks ID identik, dan
// (b) auditor kerangka-kalimat-berulang tidak lagi melihat pengulangan ≥3×.
//
// Aturan mutu (dijaga scripts/audit-translation-quality.mjs):
//   rasio panjang id/ja ≥ 0,9 · jumlah paragraf sama · CJK ≤ 4 karakter per field id ·
//   tanpa frasa cetakan · tanpa kerangka berulang.

// Judul Indonesia per topik belajar — kunci HARUS persis sama dengan string topik di
// plans (src/data.js). 120 entri. Dipakai sebagai titleId level, heading kartu mode ID,
// dan sisipan di terjemahan body/hook/poin soal.
//
// OVERRIDE PER-SECTION: beberapa topik sah muncul di dua section (mis. pencegahan infeksi
// di bab tubuh-pikiran dan di bab tindakan medis). Kunci `'<sectionId>:<topik>'` menimpa
// entri dasar supaya tiap level punya judul — dan teks ID — yang unik.
export const TOPIC = {
  '8:感染予防':{t:'Pencegahan infeksi saat tindakan medis'},
  '11:睡眠':{t:'Dukungan tidur'},
  '6:家族支援':{t:'Dukungan keluarga orang demensia'},
  '7:家族支援':{t:'Dukungan keluarga penyandang disabilitas'},
  '9:家族支援':{t:'Bekerja sama dengan keluarga'},
  '10:視覚障害':{t:'Bicara dengan pengguna tunanetra'},
  '10:聴覚障害':{t:'Bicara dengan pengguna tunarungu'},
  // S1 人間の尊厳と自立
  '尊厳と人権':{t:'Martabat dan hak asasi'},
  '自己決定':{t:'Penentuan diri'},
  'QOL':{t:'Kualitas hidup'},
  'ノーマライゼーション':{t:'Normalisasi'},
  '権利擁護':{t:'Pembelaan hak'},
  'アドボカシー':{t:'Advokasi'},
  '自立支援':{t:'Dukungan kemandirian'},
  '生活者主体':{t:'Pengguna sebagai subjek'},
  '倫理的ジレンマ':{t:'Dilema etika'},
  // S2 人間関係とコミュニケーション
  '人間関係の基本':{t:'Dasar hubungan antarmanusia'},
  '傾聴':{t:'Mendengarkan aktif'},
  '受容と共感':{t:'Penerimaan dan empati'},
  '非言語コミュニケーション':{t:'Komunikasi nonverbal'},
  '信頼関係':{t:'Hubungan saling percaya'},
  '家族との関係':{t:'Hubungan dengan keluarga'},
  'チームコミュニケーション':{t:'Komunikasi tim'},
  '記録と報告':{t:'Pencatatan dan pelaporan'},
  '難しい場面':{t:'Situasi yang sulit'},
  // S3 社会の理解
  '社会保障の全体像':{t:'Gambaran besar jaminan sosial'},
  '日本国憲法と福祉':{t:'Konstitusi Jepang dan kesejahteraan'},
  '介護保険制度':{t:'Sistem asuransi kaigo'},
  '要介護認定':{t:'Penetapan kebutuhan perawatan'},
  '居宅サービス':{t:'Layanan di rumah'},
  '施設サービス':{t:'Layanan di fasilitas'},
  '地域包括ケア':{t:'Perawatan komunitas terpadu'},
  '障害者総合支援法':{t:'Undang-undang dukungan disabilitas'},
  '生活保護':{t:'Bantuan sosial'},
  '成年後見制度':{t:'Perwalian dewasa'},
  '虐待防止と権利':{t:'Pencegahan kekerasan dan hak'},
  '高齢者施策':{t:'Kebijakan untuk lansia'},
  '地域福祉':{t:'Kesejahteraan komunitas'},
  '制度比較':{t:'Membandingkan sistem layanan'},
  // S4 こころとからだのしくみ
  'こころのしくみ':{t:'Mekanisme jiwa'},
  '身体の構造':{t:'Struktur tubuh'},
  '加齢と身体':{t:'Menua dan perubahan tubuh'},
  'バイタルサイン':{t:'Tanda vital'},
  '感染予防':{t:'Pencegahan infeksi'},
  '栄養と水分':{t:'Nutrisi dan cairan'},
  '睡眠':{t:'Tidur'},
  '排泄のしくみ':{t:'Mekanisme ekskresi'},
  '呼吸と循環':{t:'Pernapasan dan peredaran darah'},
  '消化と嚥下':{t:'Pencernaan dan menelan'},
  '褥瘡予防':{t:'Pencegahan luka tekan'},
  '急変の観察':{t:'Observasi kondisi mendadak'},
  // S5 発達と老化の理解
  '発達の原則':{t:'Prinsip perkembangan'},
  '青年期と成人期':{t:'Masa muda dan dewasa'},
  '老化の変化':{t:'Perubahan akibat penuaan'},
  '高齢者の心理':{t:'Psikologi lansia'},
  'フレイル':{t:'Frailty'},
  'サルコペニア':{t:'Sarkopenia'},
  '認知機能の加齢':{t:'Penuaan fungsi kognitif'},
  '死と喪失':{t:'Kematian dan kehilangan'},
  '生活機能':{t:'Fungsi kehidupan'},
  // S6 認知症の理解
  '認知症の定義':{t:'Definisi demensia'},
  '中核症状':{t:'Gejala inti demensia'},
  'BPSD':{t:'Gejala perilaku dan psikologis'},
  'アルツハイマー型':{t:'Tipe Alzheimer'},
  'レビー小体型':{t:'Tipe Lewy body'},
  '血管性認知症':{t:'Demensia vaskular'},
  '前頭側頭型':{t:'Tipe frontotemporal'},
  '本人中心のケア':{t:'Perawatan berpusat pada orang'},
  '環境調整':{t:'Penyesuaian lingkungan'},
  '家族支援':{t:'Dukungan untuk keluarga'},
  '意思決定支援':{t:'Dukungan mengambil keputusan'},
  // S7 障害の理解
  '障害の理念':{t:'Cara memandang disabilitas'},
  '身体障害':{t:'Disabilitas fisik'},
  '知的障害':{t:'Disabilitas intelektual'},
  '精神障害':{t:'Gangguan jiwa'},
  '発達障害':{t:'Gangguan perkembangan'},
  '高次脳機能障害':{t:'Gangguan fungsi luhur otak'},
  '視覚障害':{t:'Gangguan penglihatan'},
  '聴覚障害':{t:'Gangguan pendengaran'},
  '重症心身障害':{t:'Disabilitas ganda berat'},
  '合理的配慮':{t:'Akomodasi yang layak'},
  // S8 医療的ケア
  '医療的ケアの倫理':{t:'Etika perawatan medis'},
  'バイタル観察':{t:'Observasi tanda vital'},
  '喀痰吸引の準備':{t:'Persiapan suction dahak'},
  '口腔内吸引':{t:'Suction rongga mulut'},
  '鼻腔内吸引':{t:'Suction rongga hidung'},
  '経管栄養':{t:'Nutrisi lewat selang'},
  '異常時の対応':{t:'Penanganan saat ada kelainan'},
  // S9 介護の基本
  '介護福祉士の役割':{t:'Peran kaigo fukushishi'},
  '専門職倫理':{t:'Etika tenaga profesional'},
  'ICF':{t:'Kerangka fungsi ICF'},
  '安全とリスク':{t:'Keselamatan dan risiko'},
  '事故予防':{t:'Pencegahan kecelakaan'},
  '感染対策':{t:'Pengendalian infeksi'},
  'チームアプローチ':{t:'Pendekatan tim'},
  '多職種連携':{t:'Kolaborasi antarprofesi'},
  '記録':{t:'Pencatatan'},
  '虐待防止':{t:'Pencegahan kekerasan'},
  // S10 コミュニケーション技術
  '基本姿勢':{t:'Sikap dasar berkomunikasi'},
  '質問技法':{t:'Teknik bertanya'},
  '傾聴技法':{t:'Teknik mendengarkan'},
  '認知症との会話':{t:'Berbicara dengan orang demensia'},
  '失語症':{t:'Afasia'},
  '家族面接':{t:'Pertemuan dengan keluarga'},
  'チーム報告':{t:'Melapor kepada tim'},
  // S11 生活支援技術
  '生活環境':{t:'Lingkungan tempat tinggal'},
  '移動':{t:'Mobilitas'},
  '安楽な姿勢':{t:'Posisi yang nyaman'},
  '体位変換':{t:'Mengubah posisi'},
  '移乗':{t:'Pindah duduk'},
  '食事':{t:'Makan'},
  '嚥下支援':{t:'Dukungan menelan'},
  '口腔ケア':{t:'Perawatan mulut'},
  '排泄':{t:'Ekskresi'},
  '清潔保持':{t:'Menjaga kebersihan diri'},
  '入浴':{t:'Mandi'},
  '更衣':{t:'Berganti pakaian'},
  '整容':{t:'Merapikan penampilan'},
  '家事':{t:'Pekerjaan rumah tangga'},
  '終末期の生活':{t:'Kehidupan akhir hayat'},
  // S12 介護過程
  '介護過程とは':{t:'Apa itu proses kaigo'},
  '情報収集':{t:'Pengumpulan informasi'},
  'アセスメント':{t:'Asesmen'},
  '課題の明確化':{t:'Merumuskan masalah'},
  '目標設定':{t:'Menetapkan tujuan'},
  '計画立案':{t:'Menyusun rencana'},
  '実施':{t:'Pelaksanaan'},
  '評価':{t:'Evaluasi'},
  '記録と共有':{t:'Mencatat dan berbagi'},
  // S13 総合問題
  '事例の読み方':{t:'Membaca studi kasus'},
  '尊厳と自立の事例':{t:'Kasus martabat dan kemandirian'},
  '認知症事例':{t:'Kasus demensia'},
  '障害事例':{t:'Kasus disabilitas'},
  '医療的ケア事例':{t:'Kasus perawatan medis'},
  '生活支援事例':{t:'Kasus dukungan hidup'},
  '家族支援事例':{t:'Kasus dukungan keluarga'},
  '多職種連携事例':{t:'Kasus kolaborasi antarprofesi'},
  '制度選択事例':{t:'Kasus memilih layanan'},
  '長文ケース':{t:'Kasus bacaan panjang'},
  '模擬試験A':{t:'Simulasi ujian A'},
};

// Level terakhir tiap section adalah review (topik セクション復習, 13×). Judulnya dirangkai
// dari judul section-nya — 13 entri, kunci = titleJa section.
export const REVIEW = {
  '人間の尊厳と自立':{t:'Ulasan martabat sebagai fondasi tindakan'},
  '人間関係とコミュニケーション':{t:'Ulasan membangun hubungan saling percaya'},
  '社会の理解':{t:'Ulasan sistem dan aturan yang mengikat'},
  'こころとからだのしくみ':{t:'Ulasan mekanisme tubuh dan pikiran lansia'},
  '発達と老化の理解':{t:'Ulasan perubahan seiring bertambah usia'},
  '認知症の理解':{t:'Ulasan mengenali dan mendampingi demensia'},
  '障害の理解':{t:'Ulasan ragam disabilitas dan dukungannya'},
  '医療的ケア':{t:'Ulasan suction dan nutrisi lewat selang'},
  '介護の基本':{t:'Ulasan etika keselamatan dan kerja tim'},
  'コミュニケーション技術':{t:'Ulasan teknik komunikasi situasi sulit'},
  '生活支援技術':{t:'Ulasan dukungan kehidupan sehari-hari'},
  '介護過程':{t:'Ulasan siklus mengamati sampai evaluasi'},
  '総合問題':{t:'Ulasan kasus campuran'},
};

// Deskripsi section (menggantikan kalimat Jepang lama di kartu & halaman section).
export const SECTION_ID_DESC = [
  'Memahami martabat, hak asasi, dan kemandirian sebagai fondasi setiap tindakan perawatan.',
  'Membangun hubungan saling percaya lewat komunikasi yang menghargai pengguna dan keluarga.',
  'Menyelami sistem jaminan sosial, asuransi kaigo, dan kerangka hukum yang mengikat praktik di Jepang.',
  'Mengenal struktur tubuh, proses menua, serta mekanisme fisik dan mental yang memengaruhi kondisi lansia.',
  'Menelusuri perubahan perkembangan dan penuaan — dari fisik dan kognitif sampai makna kehilangan.',
  'Mengenali jenis dan gejala demensia, lalu mendampingi dengan pendekatan yang menjaga martabat.',
  'Memahami ragam disabilitas dan bentuk dukungan yang menghormati hak serta pilihan tiap orang.',
  'Dasar etika dan keterampilan medis tertentu perawat lansia: suction dahak dan nutrisi lewat selang.',
  'Etika profesi, keselamatan, pencegahan infeksi, dan kolaborasi tim sebagai tulang punggung praktik.',
  'Teknik komunikasi untuk situasi sulit: demensia, afasia, gangguan indera, sampai keluarga.',
  'Teknik dukungan kehidupan sehari-hari — mobilitas, makan, mandi, sampai akhir hayat.',
  'Sistem kerja profesional: mengumpulkan informasi, menilai, merencanakan, melaksanakan, mengevaluasi.',
  'Menggabungkan semua materi lewat studi kasus dan simulasi ujian nasional.',
];

// ---- Terjemahan tubuh kalimat (bodies) di makeGeneratedJapaneseCard ----
// Sumber Jepangnya templated ({term} + prinsip umum kaigo), jadi terjemahannya berbagi
// kerangka dan menyisipkan judul topik Indonesia — isinya tetap terjemahan penuh per paragraf.

export const BODY_ID = [
  // padanan bodies[0] — 3 paragraf
  (t)=>`${t} adalah tema yang diujikan dalam ujian nasional kaigo fukushishi. Sebelum memulai dukungan, pastikan kehendak pengguna, riwayat hidupnya, kondisi tubuh, dan lingkungannya.

Jangan memutuskan hanya berdasar keamanan atau efisiensi, dan jangan merebut hal yang masih bisa dilakukan sendiri. Dukung hanya bagian yang memang perlu, lalu tunggu ia menyelesaikan sisanya — menunggu seperti inilah inti dukungan kemandirian.

Catat fakta yang kamu amati dan laporkan ke pihak yang perlu tahu. Pisahkan dugaan dari fakta, lalu tinjau ulang dukungan sambil berbagi informasi dengan tim.`,
  // padanan bodies[1] — 2 paragraf
  (t)=>`Saat memahami ${t}, berangkatlah dari martabat dan penentuan diri pengguna. Menentukan metode hanya dari kerepotan staf atau keluarga, tanpa memastikan harapan pengguna sendiri, tidak boleh dilakukan.

Kalau pengguna menolak, jangan buru-buru melabelinya sebagai perilaku bermasalah. Amati kemungkinan alasannya — nyeri, cemas, lelah, lingkungan, atau waktu pelaksanaan — lalu sesuaikan cara dan lingkungannya.`,
  // padanan bodies[2] — 1 paragraf (kartu kiat ujian). Menyebut topik supaya unik per level.
  (t)=>`Dalam ujian soal ${t}, pilihlah jawaban yang paling menghargai kehendak dan kemampuan tiap individu. Waspadai pilihan yang hanya mengutamakan efisiensi fasilitas, atau yang memulai bantuan tanpa penjelasan kepada pengguna.`,
];

export const HOOK_ID = [
  // padanan hooks[0]
  (t)=>`Mari pikirkan ${t} bersama. Dukungan yang baik selalu menaruh kehidupan dan perasaan pengguna sebagai pusatnya.`,
  // padanan hooks[1]
  (t)=>`Di lapangan, menjalankan prosedur yang sudah ditentukan begitu saja tidak pernah cukup — sebelum mendalami ${t}, kondisi dan harapan pengguna harus dipastikan lebih dulu.`,
  // padanan hooks[2]
  (t)=>`Yang paling penting dalam ${t} adalah menghormati pengguna sebagai pribadi utuh dengan kehidupannya sendiri.`,
];

// Poin ringkasan = kalimat pertama tiap body. Semua menyisipkan topik supaya unik per level.
export const POINT_ID = [
  (t)=>`${t} adalah tema penting ujian nasional; sebelum mendukung, cek kehendak, riwayat hidup, kondisi, dan lingkungan pengguna.`,
  (t)=>`Pahami ${t} dengan berangkat dari martabat dan penentuan diri pengguna.`,
  (t)=>`Kiat ujian: jawaban benar selalu yang paling menghargai kehendak dan kemampuan pengguna, termasuk dalam kasus ${t}.`,
];

// Heading kartu kiat ujian (type 'tip').
export const TIP_HEADING = { ja: '試験で問われること', id: 'Yang diujikan' };
