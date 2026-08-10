// Kutipan harian beranda — menggantikan teks statis "Belajar merawat dengan hati".
// Isi pack v8 (data/quotes.json). Dipilih deterministik per tanggal+user lewat
// hashSeed (data.js) — DILARANG pakai Math.random() di codebase ini.
export const quotes=[
 {id:'q01',text:'Yang penting bukan seberapa cepat, tapi seberapa sering.'},
 {id:'q02',text:'Lima menit hari ini lebih berharga daripada dua jam minggu depan.'},
 {id:'q03',text:'急がば回れ',note:'Kalau buru-buru, ambil jalan memutar. — pepatah Jepang'},
 {id:'q04',text:'継続は力なり',note:'Ketekunan itu sendiri adalah kekuatan. — pepatah Jepang'},
 {id:'q05',text:'石の上にも三年',note:'Duduki batu tiga tahun, batu pun jadi hangat. — pepatah Jepang'},
 {id:'q06',text:'Menolak bukan berarti melawan. Kadang itu satu-satunya cara dia bicara.'},
 {id:'q07',text:'Merawat itu bukan mengambil alih, tapi menunggu di tempat yang tepat.'},
 {id:'q08',text:'Kesalahan yang kamu tinjau ulang lebih berharga daripada jawaban yang kebetulan benar.'},
 {id:'q09',text:'七転び八起き',note:'Jatuh tujuh kali, bangkit delapan kali. — pepatah Jepang'},
 {id:'q10',text:'Yang kamu catat hari ini menyelamatkan seseorang besok.'},
 {id:'q11',text:'Kanji yang sulit hari ini akan jadi kanji biasa bulan depan.'},
 {id:'q12',text:'初心忘るべからず',note:'Jangan lupakan niat awalmu. — Zeami'},
 {id:'q13',text:'Kamu tidak harus paham semuanya sekarang. Cukup satu level lebih jauh dari kemarin.'},
 {id:'q14',text:'Martabat itu tidak diberikan. Tugas kita cuma tidak merampasnya.'},
 {id:'q15',text:'Bertanya itu tanda kamu peduli, bukan tanda kamu tidak mampu.'},
 {id:'q16',text:'塵も積もれば山となる',note:'Debu pun kalau menumpuk jadi gunung. — pepatah Jepang'},
 {id:'q17',text:'Hari yang berat tetap dihitung. Buka aplikasi, satu soal saja, itu sudah cukup.'},
 {id:'q18',text:'Orang yang kamu rawat pernah merawat orang lain juga.'},
 {id:'q19',text:'Bahasa Jepangmu tidak harus sempurna. Harus cukup untuk dimengerti.'},
 {id:'q20',text:'千里の道も一歩から',note:'Perjalanan seribu ri dimulai dari satu langkah. — Laozi'},
];
export const dailyQuote=(seedKey)=>quotes[hashSeedFn(seedKey)%quotes.length];
const hashSeedFn=(s)=>{let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0};
