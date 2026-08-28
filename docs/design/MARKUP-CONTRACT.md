# Kontrak markup — port kanvas ke aplikasi

Satu sumber kebenaran untuk nama class, dipakai bersama oleh JSX (`src/main.jsx`)
dan CSS (`src/styles.css`). Gate `npm run validate:css-classes` menolak class di
JSX yang tidak punya aturan, jadi daftar ini harus dipatuhi persis di dua sisi.

Referensi visual: kanvas `docs/design/canvas/screens-desktop.mjs` (DesktopDashboard)
dan `screens-flow.mjs` (Main).

## Variabel per bab

Tiap kartu bab membawa `style={{'--accent': s.accent}}`. Seluruh warna di dalam
kartu diturunkan dari `--accent`, jadi CSS tidak perlu tahu ada 13 warna.
Alasannya ada di kanvas: 13 bab sewarna bikin grid jadi dinding datar, dan warna
itulah yang dipakai orang untuk mengingat bab mana.

## Sidebar desktop (>=960px), di `Shell`

| class | isi |
| --- | --- |
| `.sideBrand` | baris merek di puncak sidebar: avatar + nama |
| `.sideBrandArt` | kotak 56px berisi gambar karakter |
| `.sideBrandName` | "kenshi", Fredoka 700 26px, warna `--pink-deep` |
| `.sideBrandSub` | "kaigo e-learning", 12px `--muted` |
| `.sideCheer` | kartu semangat di bawah: karakter + dua baris teks |
| `.sideCheerArt` | gambar karakter 46px di kartu itu |
| `.sideCheerText` | teksnya |
| `.sideSpacer` | pendorong flex agar kartu semangat & toggle menempel ke bawah |

Item nav memakai `nav a` yang sudah ada — jangan bikin class baru untuknya.
Sakelar mode gelap memakai `.darkRow`/`.darkRowIcon`/`.darkRowLabel`/`.darkSwitch`
yang sudah ada di `social.css`; tambahkan hanya `.sideDark` sebagai pembungkus
agar bisa disembunyikan di mobile.

## Beranda

| class | isi |
| --- | --- |
| `.homeTop` | baris kanan-atas berisi pill streak |
| `.streakPill` | pill "7 hari berturut-turut", ikon api + teks |
| `.homeHeroArt` | ilustrasi karakter besar di kanan hero |
| `.homeCards` | baris dua kartu (Hari ini + Ujian Akhir); 1 kolom di mobile |
| `.homeCard` | satu kartu di baris itu |
| `.homeCardArt` | kotak ikon 56px di kiri kartu |
| `.homeCardBody` | kolom teks di tengah kartu |
| `.homeCardBadge` | badge emas "9 selesai" |
| `.homeCardGo` | tombol lingkaran chevron di kanan kartu |
| `.homeBar` | progress bar tipis di kartu "Hari ini" |
| `.homeBarPct` | angka persen di sebelah bar |
| `.roadmapBtn` | tombol "Lihat roadmap" di kanan judul "Urutan belajar" |

## Kartu bab (mengganti anatomi `.sectionCard` lama)

Class `.sectionCard`, `.sectionIcon`, `.sectionCopy`, `.miniProgress`,
`.previewPill` sudah ada — pertahankan namanya, ubah aturannya. Yang baru:

| class | isi |
| --- | --- |
| `.sectionBadge` | pill "BAB 01" di atas judul, warna dari `--accent` |
| `.sectionPct` | angka persen di kanan progress bar |
| `.sectionGo` | tombol lingkaran chevron di kanan kartu |
| `.sectionRow` | pembungkus bar + persen agar sebaris |

`.sectionIcon` sekarang berisi SVG (komponen `Icon`), bukan emoji: beri ukuran
kotak dan biarkan SVG mengisi.

## Ringkasan progres

| class | isi |
| --- | --- |
| `.progressSummary` | panel di bawah grid bab |
| `.summaryHead` | judul "Ringkasan progres" |
| `.statRow` | baris 4 statistik; membungkus jadi 2x2 di mobile |
| `.statTile` | satu statistik |
| `.statTileArt` | kotak ikon 52px |
| `.statTileNum` | angka besar Fredoka |
| `.statTileOf` | pembagi kecil "/ 13" |
| `.statTileLabel` | label di bawah angka |
| `.summaryArt` | karakter tidur di sudut kanan panel |

## Langit malam (hanya mode gelap)

| class | isi |
| --- | --- |
| `.nightSky` | lapisan absolut, `pointer-events:none`, hanya tampil saat `[data-mode=dark]` |
| `.nightStar` | titik bintang; posisi lewat inline style `left/top`, ukuran lewat `--r` |
| `.nightPetal` | kelopak sakura |
| `.nightMoon` | bulan sabit |
| `.nightPagoda` | siluet pagoda |

Di mode terang seluruh lapisan `display:none` — bukan dihapus dari DOM, supaya
toggle mode tidak memicu remount.

## Breakpoint & perilaku responsif

Kanvas punya dua versi beranda — `Main` (402px) dan `DesktopDashboard` (1440px).
Satu pohon JSX melayani keduanya, jadi ambang berikut mengikat:

| ambang | yang berubah |
| --- | --- |
| `<960px` | `.homeTop` disembunyikan (header sudah membawa angka runtun yang sama, dan kanvas `Main` memang tidak punya pill itu di badan halaman); seluruh blok sidebar disembunyikan |
| `<360px` | `.statRow` jadi satu kolom — dua kolom di sana menyisakan 23px untuk angka dan pembaginya luber |
| `>=360px` | `.statRow` dua kolom |
| `>=1100px` | `.statRow` empat kolom + `padding-right:170px`, `.summaryArt` muncul; di bawah itu tiap ubin tinggal <75px |
| `>=960px` | anatomi kartu bab versi desktop: padding 20px, kotak ikon 96px, judul 21px, `.sectionGo` jadi absolut di tengah kanan; sidebar menyala |

`.homeCard` **wajib** `flex-wrap:wrap` dengan `.homeCardBody{flex:1 1 150px}`:
badge emas itu `flex:none` + `nowrap`, jadi tanpa itu di 320px kolom teks tinggal
15px dan persennya keluar dari kartu.

`.statTileNum` **wajib** flex + `flex-wrap`, bukan blok: sebagai `<span>` inline,
`.statTileOf` melebar melewati induknya tanpa mau pecah baris.

Urutan file menentukan: aturan `display:none` sidebar dan `@media` yang
menyalakannya punya spesifisitas sama, jadi blok `@media (min-width:960px)`
penyala harus berada **setelah** aturan `display:none` di berkas.

## Aturan yang mengikat

- Target sentuh minimum 44x44px untuk setiap `<a>`/`<button>` — itu yang diukur
  `scripts/qa/check-overflow.mjs`. `.homeCardGo` dan `.sectionGo` adalah `<span>`
  di dalam kartu yang seluruhnya bisa disentuh, jadi ambang itu jatuh ke kartunya,
  bukan ke lingkaran chevron-nya.
- Tidak boleh ada scroll horizontal di 320px.
- Efek cahaya (glow) hanya di `[data-mode=dark]`; di terang pakai `--shadow-pink`.
- Semua warna dari token tema; jangan tulis hex merah muda literal. Pengecualian
  yang disengaja: kuning-amber pill preview (warna status, bukan warna merek).
- `.nightSky` diberi `top:76px` (tinggi header) karena blok penampungnya `.app`,
  satu-satunya leluhur `position:relative`. Tanpa itu bulan sabitnya tertutup header.

## Verifikasi

`scripts/qa/check-overflow.mjs` memuat markup beranda ini apa adanya di tujuh
lebar device. Kalau markup di `src/main.jsx` berubah, **markup di harness itu ikut
diubah** — kalau tidak, aturan "tidak boleh scroll horizontal di 320px" berhenti
diuji tanpa ada yang merah. Harness itu juga membaca `themes.css` dan `social.css`,
jadi token `--card`/`--accent` dan sakelar `.darkRow` terukur dengan nilai asli.

Gate ini sekarang **hijau penuh** di tujuh lebar: nol luber, nol target sentuh
<44px. Dua temuan lama sudah ditutup — merek header memakai `clamp(15px,4.4vw,20px)`
plus ellipsis (dulu `nowrap` 20px mati, luber 31px di 320px), dan titik progres
materi diberi `padding:18px 0` sehingga area ketuknya 44px walau batangnya tetap
terlihat 8px. LEBAR titik progres dikecualikan di gate: sepuluh titik membagi satu
batang, 44px per titik butuh 440px — lebarnya fungsi, bukan kelalaian.

## Warna: satu lapis token, tanpa hex mati

Mode gelap dulu bocor karena warna ditulis literal di CSS. Sekarang seluruh warna
melewati token, dan hanya ada **tiga** tempat yang boleh memuat nilai hex:

1. `src/styles.css` blok `:root` — nilai **terang** semua token.
2. `src/themes.css` — palet merek per tema (momo/yuki/luna) + blok
   `:root[data-mode=dark]` yang berisi nilai **gelap** token semantik.
3. Empat gradasi `.themeDot*` di `social.css` — itu contoh warna tema, harus
   tetap literal supaya swatch merah muda tidak ikut berubah di mode gelap.

Sisanya (`routing.css`, `social.css`, `auth.css`, dan seluruh `styles.css` di luar
`:root`) tidak boleh menulis hex sama sekali. Yang tersisa cuma tiga `color:#fff`
untuk teks di atas isian gradasi pekat.

Token semantik dibagi per **arti**, bukan per warna — hijau benar / merah salah /
amber preview sengaja tidak ikut tema, karena kalau ikut, pill peringatan di tema
Luna jadi ungu dan kehilangan maknanya:

| keluarga | token |
| --- | --- |
| benar | `--ok --ok-line --ok-bg --ok-strong --ok-soft` |
| salah | `--bad --bad-line --bad-bg --bad-ink --bad-soft --bad-strong` |
| preview / terkunci | `--warn-bg --warn-line --warn-ink --warn-pill --warn-lock` |
| kotak penjelasan | `--amber-1 --amber-2 --amber-line --amber-line-2 --amber-ink --amber-head --amber-soft --amber-on --amber-on-ink --amber-link --amber-mark` |
| simpul jalur belajar | `--node-* --node-todo-* --node-ms-* --node-lock-*` |
| lavender / info / netral | `--lav-* --info --info-bg --neutral-bg --neutral-ink` |
| teks tersier | `--faint` |

Nilai terang tiap token diambil persis dari literal yang digantikannya, jadi mode
terang tidak bergeser. Satu pengecualian yang disengaja: sepuluh abu-abu merah
jambu yang nyaris kembar (`#9f8191 #c2a7bb #a78e9d #a58d9b #b596a5 #c48fa3
#b39aa8 #d0bbc5 #a8637f #a08db0`) dilebur jadi satu `--faint`.

## Beranda desktop: tanpa header, lebar penuh

Kanvas `DesktopDashboard` tidak punya header — mereknya dibawa sidebar, dan runtun
harian pindah ke `.homeTop`. Karena itu `Shell` memasang kelas `appHome` di `.app`
saat rutenya `/belajar`, dan `@media (min-width:960px)` menyembunyikan
`.appHome>header`.

**Sejak bilah kanan ada, aturan itu cuma berlaku di pita 960–1099px.** Mulai
1100px `header` disembunyikan di SEMUA rute dan `.railBar` yang membawa runtun,
XP, jumlah level, target harian, serta batang aktivitas tujuh hari — lihat bagian
berikutnya. `.homeTop` ikut dimatikan di sana karena angkanya kembar dengan
`.railStat` pertama.

## Bilah kanan (`.railBar`, >=1100px)

Rujukan tata letaknya rail kanan Duolingo. Di sana rail-nya `position:sticky` di
dalam `flex row-reverse`; di sini `position:fixed` di tepi kanan, persis seperti
sidebar, dan `.app` menyisakan tempatnya lewat `padding-right:340px`. Alasannya
mengikat: `{children}` HARUS tetap anak langsung `.app`, karena belasan aturan di
`routing.css` menyasar `.app>main.page` / `.app>main.skillPage` / dst. Begitu
`main` dibungkus div pemisah untuk bikin flex row, semua aturan itu mati diam-diam
dan tiap rute kehilangan cap lebar bacanya tanpa error apa pun.

Ambangnya 1100px, bukan 960px: sidebar 268 + rail 340 menyisakan <500px untuk isi
di bawah itu. Di 960–1099px rail tidak muncul dan header lama tetap tampil, jadi
tidak ada lebar yang kehilangan runtun & XP sekaligus.

Isi rail: `.railStats` (tiga pil — runtun, XP, level), lalu kartu `.railCard`.
Semua angkanya dari respons `/api/progress` yang SUDAH ditarik `ProgressContext`;
tidak ada fetch baru. `recentActivity` cuma 14 hari terakhir — cukup untuk "hari
ini" dan "sejak Senin", dan tanggalnya dibandingkan sebagai string `YYYY-MM-DD`
zona Asia/Tokyo, BUKAN selisih milidetik (lihat bug runtun-reset-tiap-pagi).
Tujuh batang `.railDay` dibangkitkan sendiri dari Senin, bukan dipetakan langsung
dari `recentActivity` — baris di sana hanya ada untuk hari yang punya aktivitas,
jadi pemetaan langsung menggeser batangnya tiap ada hari bolong. Tiap hari punya
talang `.railDayBar` setinggi penuh supaya hari nol XP terbaca sebagai kosong,
bukan sebagai data hilang.

`main` mengisi **seluruh** sisa layar di kanan sidebar (padding 32px), bukan kolom
1100px. Halaman yang memang butuh kolom baca memasang capnya sendiri
(`.page`, `.skillPage`, `.richMateriPage`).

Di mode gelap desktop, sidebar dan isi jadi dua kartu membulat 30px di atas latar
gelap. Panel isinya digambar lewat `.appHome>main::before` ber-`z-index:-2`,
**bukan** `background` di `main`. Alasannya mengikat: kalau `main` diberi latar
sendiri ia harus jadi stacking context, dan begitu itu terjadi (a) `.nightSky`
yang ber-`z-index:-1` tenggelam di belakang latar itu, dan (b) `.confettiLayer`
serta backdrop `position:fixed` di dalam `main` ikut terkurung sehingga tidak bisa
lagi menutupi header. Dengan `::before` -2 dan `.nightSky` -1, dua-duanya naik ke
stacking context root dan urutannya benar tanpa efek samping.
