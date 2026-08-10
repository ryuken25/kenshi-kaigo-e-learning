# 50 — WAJIB LOGIN

Mode tamu dihapus. Tidak ada akses tanpa akun.

## Yang berubah

| Sebelum | Sesudah |
|---|---|
| Tamu bisa belajar, progres di localStorage | Semua route belajar butuh sesi |
| Banner "Login biar progres kesimpen" | Tidak perlu — semua sudah login |
| Merge progres tamu → akun | Dihapus, tidak ada lagi progres tamu |
| Fallback localStorage di quiz | Dihapus; antrian offline tetap ada |

Ini menyederhanakan banyak hal: satu jalur data, tidak ada dua sumber
kebenaran, tidak ada logika merge yang bisa gagal.

## Route

| Path | Akses |
|---|---|
| `/login`, `/auth/*` | Terbuka |
| `/` (landing) | Terbuka — halaman perkenalan + tombol masuk |
| Semua route lain | **Wajib sesi** |

`RequireAuth` membungkus seluruh pohon route selain di atas:

```jsx
{ path: '/', element: <Landing /> },
{ path: '/auth', children: [...] },
{ element: <RequireAuth />, children: [
    { path: 'belajar', element: <Home /> },
    { path: 'section/:sectionId', ... },
    { path: 'final/*', ... },
    { path: 'glossary/*', ... },
    { path: 'profile/*', ... },
]},
```

`RequireAuth` menyimpan tujuan asal:
```jsx
if (status === 'loading') return <SplashSkeleton />;
if (status !== 'authenticated')
  return <Navigate to={`/login?next=${encodeURIComponent(pathname + search)}`} replace />;
return <Outlet />;
```

Setelah magic link berhasil, arahkan ke `next` — bukan selalu ke beranda.
Orang yang mengklik tautan level tertentu harus mendarat di level itu.

## Landing page `/`

Karena tidak bisa mencoba dulu, halaman ini harus meyakinkan dalam 5 detik:

```
┌─────────────────────────────────────┐
│         [Momo melambai]             │
│                                     │
│    Belajar 介護福祉士 dengan         │
│    bahasa Indonesia                 │
│                                     │
│  ✓ 13 bab, 152 level                │
│  ✓ Soal ujian asli 2021–2026        │
│  ✓ Furigana, romaji, terjemahan     │
│  ✓ Gratis                           │
│                                     │
│    [   Masuk dengan email   ]       │
│    Tanpa password. Kami kirim       │
│    tautan sekali pakai.             │
└─────────────────────────────────────┘
```

Tanpa mode tamu, halaman ini adalah satu-satunya pintu — jadi harus jelas
apa isinya dan kenapa perlu email.

## Yang harus dibersihkan

```bash
grep -rn "guest\|isGuest\|kk_guest_progress\|guestStore\|progress/merge" src/ api/
```

Semua harus hilang. Termasuk:
- `POST /api/progress/merge` dan tabel `progress_merges`
- `guestStore.js`
- Cabang `if (status === 'guest')` di seluruh komponen
- Banner ajakan login di dalam aplikasi

Yang **tetap ada**: antrian offline (`kk_pending_v1`). Itu untuk user login
yang sedang kehilangan sinyal, bukan untuk tamu.

## Konsekuensi yang perlu disadari

Wajib login menaikkan hambatan masuk. Sebagian orang akan berhenti di
halaman login dan tidak pernah kembali. Sebagai gantinya:

- Buat magic link **secepat mungkin** — email harus sampai < 10 detik
- Sesi 30 hari dengan perpanjangan otomatis, supaya jarang diminta login ulang
- Deteksi salah ketik domain (`gmial.com` → "Maksudnya gmail.com?")
- Tombol "Buka Gmail" langsung

Kalau nanti ternyata banyak yang berhenti di login, pertimbangkan kembali
mode coba-coba terbatas — misalnya Section 1 Level 1 saja tanpa akun.
Tapi kerjakan yang sekarang dulu; jangan bikin dua jalur sekaligus.
