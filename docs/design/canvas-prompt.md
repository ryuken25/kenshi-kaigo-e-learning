# Prompt untuk Claude Design — canvas full-routes Kenshi Kaigo E-Learning

Copy semua yang ada di bawah garis ini, tempel ke Claude Design (atau jalankan
`/design` di repo ini dan tempel sebagai instruksi).

---

Buatkan **satu design canvas** berisi seluruh layar aplikasi **Kenshi Kaigo E-Learning** —
mobile-first, semua route dalam satu kanvas pan/zoom, ditata sebagai flow yang bisa dibaca
dari kiri ke kanan per baris. Kanvas ini dipakai sebagai sumber aset produksi (export PNG),
jadi setiap artboard harus rapi, konsisten, dan tidak ada elemen placeholder "lorem ipsum".

## 0. Sumber — buka ini dulu sebelum mendesain

- **Repo (publik):** <https://github.com/ryuken25/kenshi-kaigo-e-learning> — branch `main`
- **Situs produksi:** <https://kaigo.wyna.dev>
- **Path lokal:** `D:\CodePaid\kenshi-kaigo-e-learning`

**Peringatan soal situs live:** aplikasi ini ada di belakang gerbang login (magic-link, tanpa
password). Yang bisa dilihat tanpa akun cuma `/` dan `/login` — semua route lain otomatis
dialihkan ke `/login?next=…`. Jadi untuk 20 route sisanya, **baca kodenya, jangan andalkan
situsnya.** Kode adalah sumber kebenaran untuk layout dan copy.

Prefix raw: `https://raw.githubusercontent.com/ryuken25/kenshi-kaigo-e-learning/main/`

| Yang dicari | Berkas |
| --- | --- |
| Token warna, radius, bayangan, font | `src/styles.css` — blok `:root` di 33 baris pertama |
| 4 tema + token tombol per karakter + bingkai avatar | `src/themes.css` |
| Landing, Home, section, level, materi, quiz, result, recap, practice, profile, shell/nav | `src/main.jsx` |
| Onboarding, editor profil, teman, peringkat, achievement | `src/Social.jsx` |
| Seluruh alur ujian akhir | `src/FinalTest.jsx` |
| Glossary (indeks + detail istilah) | `src/GlossaryPage.jsx` |
| Halaman login + copy perk-nya | `src/Login.jsx` |
| Layout ruby/furigana | `src/Furigana.jsx` + selector `.fg-*` di `src/routing.css` |
| Definisi karakter: nama, spesies, sifat, warna teks tombol | `src/lib/social.jsx` — konstanta `CHARACTERS` |
| Palet bulu/telinga/aksen tiap karakter | `scripts/gen-characters.mjs` — konstanta `FUR` |
| 13 bab: judul Jepang, judul Indonesia, ikon, daftar topik level | `src/data.js` — array `plans`, baris 7–21 |
| 133 istilah glossary (kanji, bacaan, romaji, arti) | `src/content/glossary.json` |
| Contoh konten materi berkualitas penuh (benchmark kepadatan) | `src/content/s1l1.json` + `src/content/s1l1-ja.json` |
| Enam berkas CSS lengkap | `src/styles.css`, `routing.css`, `translation.css`, `auth.css`, `themes.css`, `social.css` |
| Spesifikasi sistem karakter | `docs/v8/49-CHARACTER-SYSTEM.md` |
| Rencana perombakan UI | `docs/v8/52-UI-OVERHAUL.md` |
| Temuan audit bug UI (kontras, grid, kinsoku) | `docs/v8/48-BUG-AUDIT.md` |
| Aturan tiga mode bahasa | `docs/v8/51-LANGUAGE-MODES.md` |
| Alasan gerbang login | `docs/v8/50-AUTH-GATE.md` |
| Catatan arsitektur menyeluruh | `CLAUDE.md`, `README.md` |

**Aset karakter yang sudah ada — bisa langsung diambil, publik:**

```
https://kaigo.wyna.dev/assets/characters/<id>/<ekspresi>.svg
  <id>       = momo | kurumi | sora | kinako | nagi | beni
  <ekspresi> = idle | happy | sad | sleepy | surprised | clap

contoh   https://kaigo.wyna.dev/assets/characters/momo/idle.svg
manifest https://kaigo.wyna.dev/assets/characters/characters.manifest.json
```

36 SVG itu hasil generate script (deterministik, < 3 KB per berkas). Pakai sebagai acuan
bentuk dan warna — **tapi memang itu yang mau diganti.** Kanvas ini dibuat justru untuk
menghasilkan versi yang digambar benar, bukan versi yang disusun dari primitif SVG.

## 1. Produk

Aplikasi belajar untuk **ujian nasional 介護福祉士 (Certified Care Worker) Jepang**, ditujukan
ke pekerja/calon pekerja perawat lansia asal Indonesia yang belajar di Jepang. Teks sumber
Bahasa Jepang, penjelasan Bahasa Indonesia. 13 bab, 152 level, plus simulasi ujian 6 tahun
(2021–2026) × 125 soal.

Nada visual: **lembut, kawaii, ramah, tenang** — bukan gamifikasi agresif. Pengguna belajar
sambil kerja shift, sering capek. Tulisan besar, kontras aman, satu aksi utama per layar.
Slogan internal produk: *"Pelan saja. Tidak harus sempurna. Yang penting jalan terus."*

Wajib: **jangan pakai IP pihak ketiga** (Hello Kitty/Sanrio dsb). Maskot adalah 6 karakter
orisinal milik produk ini, spesifikasinya di bagian 4.

## 2. Format kanvas

- Artboard utama: **402 × 874 px** (iPhone 17) — ini device utama. Semua layar dibuat di ukuran ini.
- Tambahkan **satu baris varian 768 px** (tablet) hanya untuk 3 layar: Home, Section Overview, Quiz.
- Jarak antar artboard 80 px, antar baris (lane) 200 px.
- Tiap lane diberi judul besar di kiri (teks di kanvas, bukan di dalam artboard).
- Tiap artboard diberi label: `route` + nama state, contoh `/section/:id/level/:id/quiz — jawaban salah`.
- Tarik garis konektor tipis antar artboard yang berurutan dalam satu flow.
- Semua layar **tidak boleh scroll horizontal**. Konten lebar (tabel/chip strip) pakai scroller
  horizontal sendiri yang jelas terlihat terpotong di tepi.
- Target sentuh minimum **44 × 44 px** untuk semua tombol, chip, node, dan item nav.

## 3. Design token (pakai persis, jangan ganti)

**Font**
- Latin heading: `Fredoka` (400/500/600/700)
- Latin body/UI: `DM Sans` (400/500/600/700)
- Jepang: `Hiragino Kaku Gothic ProN` → `Noto Sans JP` → `Yu Gothic` (tampilkan sebagai Noto Sans JP)

**Palet default (tema `kitty`)**
```
--ink            #5b3f52   teks utama
--muted          #7a5f6c   teks sekunder
--pink           #ff7bab   aksen utama
--pink-deep      #ff5c9a   aksen tekan
--pink-pale      #ffe3ef   fill lembut
--pink-paler     #fff2f8   fill paling lembut
--lavender       #efe3ff
--gold           #ffcd6e   bintang / milestone
--gold-deep      #ffb84d
--mint           #c9f7e6   status benar
--soft           #fff7fb   kartu
--line           #f6def0   garis
--kk-furi        #8a6e7c   warna teks furigana (rt)
--btn-bg         #ff6f9c   latar tombol primer
--btn-text       #3a2a33   teks tombol primer (kontras >= 4.5:1, WAJIB)
--btn-shadow     #c22a5e   bayang bawah tombol (tombol bergaya "chunky")
```

**Radius & bayangan**
```
--radius-lg 26px   kartu besar, hero
--radius-md 20px   kartu, tombol besar
--radius-sm 14px   chip, badge
--shadow-pink     0 10px 30px -8px rgba(255,110,160,.35)
--shadow-pink-lg  0 18px 45px -10px rgba(255,110,160,.4)
```

**Latar body (gradient tiga lapis, dipakai di semua layar)**
```
radial-gradient(circle at 10% 0%,  #ffe9f4 0%, transparent 45%),
radial-gradient(circle at 90% 10%, #eee3ff 0%, transparent 40%),
linear-gradient(180deg, #fff8fc, #fffdfa 60%)
```

**Empat tema** (dibuat sebagai satu lane khusus, lihat bagian 6 lane G)

| Tema | ink | pink | pink-pale | soft | latar |
|---|---|---|---|---|---|
| `kitty` (default) | #5b3f52 | #ff7bab | #ffe3ef | #fff7fb | pink → ungu pucat |
| `sora` (langit) | #2e4a5c | #6db9e8 | #d9edfb | #f7fbff | biru → mint pucat |
| `matcha` (teh) | #44543c | #8fc48a | #e2f2dc | #fafdf6 | hijau → krem |
| `yozora` (malam) | #46396b | #a98fe0 | #e8defc | #faf8ff | ungu → pink pucat |

Catatan: `yozora` **tetap light mode** (pastel ungu), bukan dark mode — keputusan kontras.

## 4. Enam karakter orisinal

Maskot berganti sesuai pilihan user, dan warna tombol ikut karakternya. Gambar ulang sebagai
karakter orisinal bergaya flat SVG: proporsi kepala : badan = **1 : 1,2** (bukan chibi kepala
doang), garis luar lembut, dan **semua punya mulut**.

| id | Nama | Spesies | Bulu utama | Aksen | Warna tombol | Sifat |
|---|---|---|---|---|---|---|
| `momo` | Momo | Kucing putih | #FFFFFF / #FFF0F5 | #ff9fbf | #ff6f9c | Hangat & telaten |
| `kurumi` | Kurumi | Kelinci malam | #8B87A3 / #B9B4CC | #5F42A8 | #5f42a8 | Jenaka & penuh akal |
| `sora` | Sora | Anjing awan | #FFFFFF / #EAF5FE | #6db9e8 | #1f5f9e | Tenang & penyabar |
| `kinako` | Kinako | Anjing kue | #F2CD8A / #FBEDD3 | #8a5a2b | #d99a16 | Santai & ramah |
| `nagi` | Nagi | Pinguin laut | #7FC8B9 / #F2FBF8 | #136B58 | #136b58 | Cermat & teliti |
| `beni` | Beni | Rubah senja | #D96A3F / #FFE8DA | #95300F | #95300f | Penuh semangat |

Enam ekspresi per karakter: `idle`, `happy`, `sad`, `sleepy`, `surprised`, `clap`.

**Nagi dan Beni berstatus "Segera hadir"** — di layar pemilihan karakter mereka tampil abu-abu
dengan label teks, **tanpa ikon gembok** (keputusan desain: jangan pasang gembok yang tidak
pernah bisa dibuka).

## 5. Aturan komponen yang mengikat

**Bottom nav** — 6 item, ikon + label, selalu tampil di layar utama (bukan di quiz/materi):
`Belajar · Ujian · Istilah · Teman · Peringkat · Profil`. Item aktif diberi pill `--pink-pale`.

**Language switch** — tombol tiga segmen kecil di pojok kanan atas tiap kartu teks:
`漢字 | ふり | ID`. Segmen aktif solid `--pink`, sisanya outline. Ini bukan tombol "translate",
melainkan pengubah cara teks itu sendiri ditampilkan.

**Furigana / ruby** — saat mode `ふり`, bacaan kana tampil **di atas** kanji, ukuran ±55% dari
base, warna `--kk-furi`, rata tengah terhadap base. Bacaan **tidak boleh** menyentuh atau
menimpa baris di atasnya. Penting: tinggi baris di mode `漢字` dan mode `ふり` harus **identik**
— di mode 漢字 ruang bacaan tetap ada, hanya tidak terlihat. Gambarkan kedua mode berdampingan
di lembar design system supaya perbedaannya terverifikasi.
Contoh token untuk dipakai di mockup: 尊厳 (そんげん), 介護 (かいご), 傾聴 (けいちょう),
統合失調症 (とうごうしっちょうしょう) — token terakhir sengaja panjang, dipakai sebagai uji layout.

**Tombol primer** — chunky, radius 20px, latar `--btn-bg`, teks `--btn-text`, bayang solid 4px
warna `--btn-shadow` di bawahnya (bukan blur), turun 2px saat ditekan.

**Pill preview** — badge kecil `🔒 preview` di sudut kartu section/level yang belum resmi
terbuka. Kartunya **tidak** diburamkan dan **tidak** dikunci — semua tetap bisa dibuka; pill
ini hanya menandai bahwa progresnya belum dihitung resmi. Ini prinsip inti produk:
**tidak ada yang pernah benar-benar terkunci.**

**Skill path** — daftar level digambar sebagai jalur node zig-zag vertikal (offset horizontal
berulang: 0, +54, +84, +54, 0, −54, −84, −54 px). Empat status node: `selesai` (centang, fill
mint), `sekarang` (fill pink + ring berdenyut), `belum` (outline), `preview` (outline abu +
gembok kecil). Node milestone (level ulasan) lebih besar dan berisi bintang emas. Maskot kecil
muncul di sisi jalur tiap 4 node.

**Bingkai avatar** (hadiah achievement, ring gradient di sekeliling avatar bulat):
`bronze` #cd9b6a→#8a5a2b · `silver` #eef0f6→#9aa0b5 · `gold` #ffe08a→#e0a93e ·
`sakura` #ffc2dd→#ff7bab · `rainbow` conic pink→emas→hijau→biru→ungu.

## 6. Daftar artboard (semua route)

### Lane A — Design system & asset sheet
1. **Palet & tipografi** — semua token warna sebagai swatch berlabel hex, skala teks Fredoka +
   DM Sans + Noto Sans JP, contoh ruby mode 漢字 vs ふり berdampingan.
2. **Komponen** — tombol (primer/sekunder/disabled/loading), kartu, chip istilah, input,
   language switch, pill preview, banner preview, banner retry, toast achievement, loader.
3. **Asset sheet** — lembar ekspor: 6 karakter × 6 ekspresi (36 SVG), 5 bingkai avatar, 4 status
   node skill path, badge XP, ikon api streak, bintang milestone, ikon bottom nav (6), ilustrasi
   empty state (🔒 belum login, 🐾 memuat, 🔎 tidak ditemukan).

### Lane B — Masuk & onboarding
4. `/` **Landing** — satu-satunya halaman publik selain login. Maskot besar, eyebrow
   "KENSHI KAIGO E-LEARNING", judul "Belajar 介護福祉士 dengan bahasa Indonesia", daftar 4 poin:
   "13 bab · 152 level", "Soal ujian asli 2021–2026", "Furigana, romaji, terjemahan", "Gratis".
   CTA "Masuk dengan email". Catatan kecil: "Tanpa password — kami kirim tautan sekali pakai ke email kamu."
5. `/login` **Form** — judul "Masuk dulu, yuk", sub "Kami kirim tautan ajaib ke emailmu. Tanpa
   password, 20 detik selesai." Field email + tombol "Kirim magic link". Empat baris perk:
   streak & XP permanen, teman & papan peringkat mingguan, 35 achievement + bingkai avatar,
   4 tema tampilan.
6. `/login` **Terkirim** — kartu sukses: "Link sudah dikirim ✨ / Cek inbox you@example.com.
   Link berlaku 20 menit dan sekali pakai. Klik dari perangkat ini ya."
7. `/onboarding` **Langkah 1 — gender** — "Kenalan dulu yuk 👋", 4 pilihan kartu.
8. `/onboarding` **Langkah 2 — karakter** — grid 6 karakter; momo + 1 pasangan aktif, kinako
   terkunci sampai 15 level, nagi & beni abu "Segera hadir".
9. `/onboarding` **Langkah 3 — handle** — "Buat handle-mu 🏷️", input `@handle`, aturan:
   huruf kecil/angka/underscore, 4–14 karakter, unik, hanya bisa diganti tiap 7 hari.

### Lane C — Alur belajar
10. `/belajar` **Home** — kutipan Jepang harian besar di atas (deterministik per tanggal + user),
    maskot di kanan, "13 bab · 152 level · dikerjakan sedikit demi sedikit.", kartu "Hari ini"
    + progress bar + badge "N selesai", banner "Ujian Akhir · Soal asli 2021–2026 · 125 butir
    tiap tahun", judul "Urutan belajar / Mulai dari martabat, berakhir di studi kasus", lalu
    grid 13 kartu bab. Kartu bab: ikon emoji, "BAB 01", judul Jepang, judul Indonesia,
    deskripsi, mini progress bar, "3/10 level selesai".
11. `/section/:id` **Section overview** — hero (emoji + BAB 3 + 社会の理解 + "Asuransi kaigo dan
    aturan yang mengikat"), lalu skill path zig-zag 15 node dengan campuran status.
12. `/section/:id` **varian preview** — sama, plus banner: "Section ini belum resmi terbuka —
    kamu tetap bisa preview materi & coba quiz, tapi progress tidak dihitung completed sampai
    section sebelumnya selesai."
13. `/section/:id/level/:id` **Level hub** — hero maskot + "LEVEL 4" + judul Jepang/Indonesia,
    kotak tujuan "今日の目標" + kalimat Indonesia, dua tombol: "📖 Baca materi dulu" (primer) dan
    "⭐ Langsung quiz" (sekunder), footer "5 kartu materi · 5 soal".
14. `/…/materi` **Kartu tipe `term`** — istilah besar dengan furigana, romaji + arti Indonesia,
    contoh kalimat. Header: "× Tutup", deretan titik progres kartu, language switch.
15. `/…/materi` **Kartu tipe `compare`** — tabel banding 2–3 istilah (istilah / artinya / kapan dipakai).
16. `/…/materi` **Kartu tipe `case`** — tag "Kasus lapangan", skenario, pertanyaan, jawaban terungkap.
17. `/…/materi` **Term sheet** — bottom sheet istilah: bacaan + romaji, istilah besar berfurigana,
    definisi pendek, definisi panjang, tautan "Buka halaman lengkapnya →". Latar gelap transparan.
18. `/…/materi` **Chip istilah** — bagian bawah kartu: "🔎 Istilah di kartu ini" + baris chip
    (kanji besar + romaji kecil) yang bisa di-scroll horizontal.
19. `/…/quiz` **Belum dijawab** — top bar "‹ Exit" + "2 / 5", progress bar, kartu soal Jepang,
    tombol "聞く · Dengarkan soal", 5 kartu pilihan.
20. `/…/quiz` **Jawaban benar** — pilihan benar fill mint + centang, popup melayang "Yeayy! ✨"
    dengan 🎉, kotak penjelasan "Kenapa jawaban ini benar?".
21. `/…/quiz` **Jawaban salah** — pilihan salah merah + ✕, pilihan benar tetap ditandai mint,
    popup "Zannen... 😣", kotak penjelasan terbuka.
22. `/…/quiz` **Ronde retry** — banner "Yuk ulangi soal yang belum tepat! / Ronde retry #1 ·
    2 soal tersisa" + deretan titik ronde. Label tombol jadi "Ulangi soal yang salah ↻".
23. `/…/result` **Sempurna** — konfeti, maskot ekspresi `clap`, eyebrow "LEVEL COMPLETE ✨",
    skor besar "5 / 5", "完璧！Perfect!", "+25 XP", tombol "Level berikutnya" + "↻ Ulangi".
24. `/…/result` **Preview** — tanpa konfeti, eyebrow "PREVIEW ATTEMPT", "+3 XP", teks "Latihan
    preview — belum resmi completed sampai prasyarat sebelumnya selesai."
25. `/…/result` **Toast unlock** — varian dengan toast melayang: karakter baru terbuka + achievement baru.
26. `/section/:id/recap` **Recap** — hero "RECAP" + judul bab, maskot, "Siap diuji? / Soal
    campuran dari semua level di section ini.", tombol "Mulai recap ⭐".
27. `/practice` **Latihan** — badge "🔀 Practice · unlimited", "Soal acak dari semua section —
    12 dijawab, 9 benar. XP tidak resmi & tidak memengaruhi unlock.", kartu soal + pilihan.

### Lane D — Ujian akhir
28. `/final` **Pilih tahun** — eyebrow "SIMULASI UJIAN", judul "Ujian Akhir", "Pilih tahun ujian.
    Semua bagian terbuka sejak awal.", banner "🌸 Latihan tanpa batas", grid 6 kartu tahun
    (2026…2021) berisi tahun, nama ujian, "3/5 bagian", "125 soal".
29. `/final/:year` **Detail tahun** — "2026 · 第38回", "87/125 terbaik", 5 kartu bagian
    ("Bagian 1 / soal 1–25 / 21/25" atau "Belum dikerjakan").
30. `/final/:year/part/:n` **Mode latihan** — top bar "× Tutup", "問題 12 · 12/25", dropdown mode,
    language switch, soal + 5 opsi berlabel 1–5, kotak umpan balik langsung muncul setelah memilih.
31. `/final/:year/part/:n` **Mode ujian** — sama tapi tanpa umpan balik, navigasi
    "Sebelumnya / Berikutnya", soal terakhir jadi "Kirim bagian".
32. `/final/:year/part/:n` **Error submit** — banner merah "Gagal menyimpan progress. Coba lagi."
    tanpa pindah halaman.
33. `/final/:year/part/:n/result` — "HASIL BAGIAN 3", skor besar "21 / 25", "Jawaban tersimpan
    di akunmu.", tombol kembali ke tahun.
34. `/final/unlimited` — "UNLIMITED PRACTICE / Latihan tanpa batas", "Soal terus berputar. Tidak
    memengaruhi skor resmi, XP, atau progress ujian.", badge "42/100 soal — maraton".

### Lane E — Sosial
35. `/profile` — avatar berbingkai + "Halo, Rina", chip "@rina_kaigo", tiga statistik
    (total XP / day streak / levels), tiga tautan besar (Teman / Peringkat / Achievement),
    editor profil (nama tampilan, karakter, tema, privasi), kotak tip "Pelan saja", tombol Logout.
36. `/friends` **Daftar teman** — tab Teman / Masuk / Keluar, kartu teman: avatar + nama +
    @handle + XP minggu ini + tombol aksi.
37. `/friends` **Cari handle** — input pencarian + hasil satu kartu dengan tombol "Tambah teman",
    plus state "Tidak ditemukan".
38. `/leaderboard` — judul "Papan Peringkat · XP minggu ini", tab "Teman" / "Global Top 100",
    daftar peringkat: nomor, avatar berbingkai, nama, @handle, XP, penanda delta ▲▼.
    Baris "kamu" ditonjolkan dan tetap menempel di bawah kalau di luar top 100.
39. `/achievements` — judul "Achievement · 12/35", avatar berbingkai besar + "12 terbuka ·
    bingkai: 🥈 Silver", lalu grup per kategori berisi grid badge (terbuka berwarna,
    belum terbuka abu + siluet).

### Lane F — Referensi & state sistem
40. `/glossary` — pencarian (menerima kanji/kana/romaji/Indonesia), strip chip filter yang
    bisa di-scroll horizontal, daftar 133 istilah: kanji + bacaan + romaji + arti singkat.
41. `/glossary/:slug` — halaman istilah: kanji besar berfurigana, romaji, arti singkat,
    penjelasan panjang, istilah terkait.
42. **State sistem** — 1 artboard berisi 4 potongan: loader maskot ("Menyiapkan materi…"),
    empty state belum login ("🔒 Login dulu untuk memakai fitur teman."), empty state memuat
    ("🐾 Memuat…"), dan banner error submit.

### Lane G — Tema
43–46. Layar `/belajar` yang sama diulang **4×**, satu per tema (`kitty`, `sora`, `matcha`,
`yozora`), untuk membuktikan seluruh palet bertukar konsisten tanpa ada warna yang tertinggal.

### Lane H — Tablet
47–49. `/belajar`, `/section/:id`, `/…/quiz` pada lebar **768 px**. Grid bab jadi 2 kolom dengan
tinggi kartu seragam; skill path tetap satu kolom di tengah dengan maskot di sisi kosong.

## 7. Yang harus dihindari

- Jangan menggambar Hello Kitty atau karakter Sanrio mana pun, termasuk sebagai "inspirasi bentuk".
- Jangan memakai gembok pada apa pun yang tidak punya jalur terbuka (nagi/beni).
- Jangan memburamkan atau menonaktifkan kartu section/level yang berstatus preview — semua bisa dibuka.
- Jangan menempatkan bacaan furigana di samping atau di bawah kanji; selalu di atas.
- Jangan memakai teks putih di atas `--pink`/`--btn-bg` (kontras gagal). Teks tombol memakai `--btn-text`.
- Jangan menampilkan label internal seperti `sourceYear`, `difficulty`, `official-style`,
  atau `syllabus-based` di kartu soal — itu pernah bocor ke UI dan sudah dicabut.
- Jangan memakai dark mode. Keempat tema light, termasuk `yozora`.
- Jangan menambahkan bottom nav di layar materi, quiz, dan ujian — layar itu sengaja fokus penuh.

## 8. Hasil yang diharapkan

Satu kanvas, ±49 artboard, tertata dalam 8 lane berlabel, konektor antar langkah dalam satu
flow, dan lembar aset di Lane A yang setiap elemennya bisa diekspor terpisah sebagai PNG.
Beri nama tiap layer sesuai nama komponennya di kode (`sectionCard`, `skillNode`, `qCard`,
`choiceCard`, `termSheet`, `finalYearCard`, `lbTabs`, `avatarWrap`) supaya pemetaan
desain → kode tidak perlu ditebak.
