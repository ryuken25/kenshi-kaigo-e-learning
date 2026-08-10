# 43 — AUDIT PROGRES

Berdasarkan log orchestrator + dumping halaman `/section/*/level/*/materi` yang lu kirim.

## Yang sudah mendarat ✅

| Item | Bukti |
|---|---|
| Infra terverifikasi | GitHub `ryuken25`, Vercel project `kaigo-kitty`, Neon `ap-southeast-1` |
| Domain kustom | `kaigo.wyna.dev` → 200, CNAME ke Vercel |
| Migrasi 006 | `handle`, `theme`, `gender`, `onboarded_step` ada di `app_users` |
| Migrasi 007 | 16/16 statement OK, leaderboard + achievement + frame + cooldown handle |
| Tema `cinnamoroll` → `sora` | Diganti di migrasi, alasan IP Sanrio dicatat di komentar SQL |
| **Furigana** | Dari dumping: `事例[じれい]`, `読[よ]み方[かた]`, `介護福祉士[かいごふくしし]` — **benar** |
| Mode 漢字 / ふり | Dua-duanya berfungsi |
| Kartu istilah | 報告 / 自立 / 自立支援 / 介護福祉士 / 記録 / 利用者 tampil dengan bacaan + arti |
| Navigasi | Belajar · Ujian · Istilah · Teman · Peringkat · Profil |

Furigana yang tiga kali gagal itu **sekarang beres**. Itu kemajuan nyata.

---

## Yang masih rusak ❌

### 1. Terjemahan Indonesia adalah kalimat cetakan ⭐

Ini temuan terbesar. Dari dumping lu, mode ID menampilkan:

```
Belajar 事例の読み方
事例の読み方 adalah materi penting. Hubungkan teori dengan martabat,
keamanan, pilihan, dan kehidupan pengguna.
```

Sementara mode 漢字 menampilkan isi yang sesungguhnya:

```
事例の読み方は、介護福祉士国家試験で重要な学習テーマです。支援を始める前に、
利用者の意思、生活歴、身体状態、環境を確認します。

安全や効率だけで判断せず、本人ができることを奪わないようにします。必要な部分
だけを支援し、できる部分は本人が行えるように待つことが自立支援につながります。

観察した事実は記録し、必要な相手に報告します。推測と事実を分け、チームで情報
を共有しながら支援を見直しましょう。
```

Tiga paragraf isi nyata → satu kalimat cetakan. Yang berbahasa Indonesia
**tidak mendapat materinya sama sekali**, cuma kalimat sopan yang tidak mengajarkan apa pun.

Detail dan perbaikannya: `44-TRANSLATION-QUALITY.md`.

### 2. Ini lubang di validator gue sendiri

`audit-content-coverage.mjs` dari pack v6 melaporkan konten ini **lolos**,
karena dia cuma memeriksa apakah field `id` kosong. Field-nya terisi —
isinya saja yang bukan terjemahan.

Itu kesalahan spec gue, bukan kesalahan eksekusi agent lu. Auditor baru
(`scripts/audit-translation-quality.mjs`) menutupnya, dan sudah gue tes:
dari 6 kartu uji, 4 template + 1 kepotong tertangkap, 1 terjemahan benar lolos bersih.

### 3. Kanji bocor ke mode ID

Judul di mode ID masih `Belajar 事例の読み方`. Mode ID seharusnya tidak
menampilkan kanji sama sekali, kecuali istilah dalam kurung seperti
"martabat (尊厳)".

### 4. Navigasi 6 item, spec-nya 4

Sekarang: Belajar · Ujian · Istilah · Teman · Peringkat · Profil.

Di HP 360px, 6 label tidak muat tanpa terpotong. Saran:
- Bottom nav tetap **4**: Belajar · Ujian · Istilah · Profil
- Teman dan Peringkat masuk ke halaman Profil sebagai dua kartu besar
- Di desktop, sidebar kiri boleh 6 — ruangnya cukup

### 5. Header duplikat

Dumping menunjukkan `Kaigo Kitty / kaigo kitty / belajar kaigo / 0`.
Judul tertulis tiga kali dengan gaya berbeda, plus angka `0` tanpa label.
Periksa apakah ada `<title>`, logo teks, dan tagline yang tumpang tindih.

---

## Catatan teknis dari log agent

Dua hal yang layak diperhatikan:

**Migrasi 007 tidak atomic.** Komentar di file-nya sudah jujur soal ini:
driver HTTP Neon auto-commit tiap statement, jadi `BEGIN/COMMIT` dibuang
dan kalau gagal di tengah, sebagian sudah masuk. Verifikasi hasilnya lewat
`pg_get_constraintdef` / `information_schema`, jangan percaya "OK" dari script.

Untuk migrasi berikutnya, pakai koneksi `DATABASE_URL_UNPOOLED` dengan
driver TCP biasa supaya transaksinya benar-benar jalan.

**`requireUser()` belum mengembalikan kolom 006.** Ini akan bikin `handle`,
`theme`, dan `gender` tidak terbaca di frontend walau datanya ada di DB.
Perlu di-extend sebelum UI profil dikerjakan.
