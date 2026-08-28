import { neon } from '@neondatabase/serverless';

// ─── Pemilihan driver berdasarkan HOST di connection string ────────────────────
// Neon bicara protokol HTTP miliknya sendiri lewat @neondatabase/serverless.
// Supabase (Supavisor) itu Postgres biasa dan TIDAK bisa dilayani driver itu.
// Yang menentukan HOST-nya, bukan flag terpisah, supaya cutover Neon -> Supabase
// cukup mengganti nilai DATABASE_URL di env — tanpa deploy kode yang berisiko.
// Selama host masih *.neon.tech, perilaku produksi hari ini persis tidak berubah.
const hostOf = (url) => { try { return new URL(url).hostname; } catch { return ''; } };
export const isNeonUrl = (url) => { const h = hostOf(url); return h ? h.includes('neon.tech') : /neon\.tech/.test(String(url)); };

// libpq punya parameter yang murni sisi-klien dan BUKAN GUC server. postgres.js
// melempar sisa query string ke startup packet, dan Postgres menolak koneksinya
// dengan FATAL "unrecognized configuration parameter". Neon menempelkan
// channel_binding=require di URL-nya, Supabase kadang pgbouncer=true — dua-duanya
// mematikan koneksi kalau diteruskan mentah. TLS tetap wajib lewat ssl:'require'.
const CLIENT_ONLY_PARAMS = ['channel_binding', 'sslmode', 'sslrootcert', 'sslcert', 'sslkey', 'gssencmode', 'pgbouncer'];
const cleanUrl = (url) => { try { const u = new URL(url); for(const k of CLIENT_ONLY_PARAMS) u.searchParams.delete(k); return u.toString(); } catch { return url; } };

// Satu instance postgres.js per URL, disimpan di module scope: Vercel function
// yang warm memanggil db() tiap request, dan bikin pool baru tiap kali = bocor
// koneksi ke pooler. neon() sendiri stateless jadi tidak perlu di-cache.
const pools = new Map();
function pgPool(url){
  let p = pools.get(url);
  if(!p){
    // import dinamis: jalur Neon tidak ikut memuat postgres.js sama sekali.
    p = import('postgres').then(m => m.default(cleanUrl(url), {
      // Supavisor transaction mode (port 6543) memultipleks satu koneksi backend
      // ke banyak klien per-transaksi. Prepared statement itu state per-sesi, jadi
      // named prepare WAJIB mati — kalau tidak: "prepared statement ... already exists".
      prepare: false,
      ssl: 'require',    // Supabase dan Neon dua-duanya menolak koneksi tanpa TLS
      max: 3,            // serverless: 1 request per instance, sisanya cuma buffer Promise.all
      idle_timeout: 20,  // lepas koneksi nganggur biar kuota pooler tidak habis
      connect_timeout: 15,
      // neon mengubah undefined jadi NULL; postgres.js default-nya MELEMPAR
      // UNDEFINED_VALUE. Body request yang kehilangan satu field akan jadi 500
      // sesudah cutover kalau beda ini dibiarkan.
      transform: { undefined: null },
      // Seluruh call site menyetor jsonb sebagai string hasil JSON.stringify()
      // (api/progress.mjs, api/final.mjs, api/final/local-merge.mjs). postgres.js
      // membaca OID hasil ParameterDescription lalu MENG-JSON.stringify LAGI, jadi
      // yang tersimpan `"{\"a\":1}"` (skalar string) alih-alih objek — cache
      // idempotensi jadi sampah tanpa error apa pun. Serializer ini meloloskan
      // string apa adanya, objek tetap di-stringify: sama persis dengan neon.
      types: {
        json: { to: 114, from: [114, 3802], serialize: x => typeof x === 'string' ? x : JSON.stringify(x), parse: x => JSON.parse(x) },
        // JEBAKAN PARITAS KELIMA — yang ini SUDAH MERUSAK DATA (2026-08-28).
        // Kolom `date` (OID 1082) default-nya diurai jadi objek Date, dan dua driver
        // memilih TENGAH MALAM yang berbeda: neon pakai zona lokal proses, postgres.js
        // pakai UTC. Di server (TZ=UTC) keduanya sepakat, jadi bugnya tidur — tapi
        // skrip yang jalan di laptop non-UTC tidak.
        // Yang terjadi: backup-db.mjs dibaca lewat neon di mesin UTC+8, jadi tanggal
        // 2026-08-11 jadi Date "2026-08-10T16:00:00.000Z"; JSON.stringify menyimpan
        // string itu; restore-db.mjs meneruskannya ke kolom `date`; date_in Postgres
        // memotong jamnya dan MENGABAIKAN zona -> tersimpan 2026-08-10. Mundur sehari,
        // tanpa satu pun galat. Akibatnya applyStreak membaca runtun sebagai putus dan
        // me-reset ke 1, XP mingguan salah hari, dan week_start berhenti jatuh di Senin.
        // Dikembalikan sebagai STRING 'YYYY-MM-DD' apa adanya: tidak ada zona waktu yang
        // terlibat sama sekali, jadi tidak ada yang bisa bergeser. Semua pembacanya sudah
        // aman terhadap ini — applyStreak membungkusnya dengan new Date(), dan klien
        // menormalkan lewat String(r.date).slice(0,10).
        date: { to: 1082, from: [1082], serialize: x => x, parse: x => x },
      },
    }));
    pools.set(url, p);
  }
  return p;
}

// Hasil query harus ARRAY biasa di kedua jalur: neon (fullResults:false) sudah
// mengembalikan array baris, postgres.js mengembalikan Result (subclass Array
// dengan .count/.command). Array.from() menyamakannya jadi array polos.
const toArray = (r) => Array.isArray(r) ? Array.from(r) : (r && Array.isArray(r.rows) ? Array.from(r.rows) : []);

// JEBAKAN PARITAS KEEMPAT — yang ini SUDAH MERUSAK PRODUKSI (2026-08-28).
// Fragmen SQL yang DISARANGKAN sebagai nilai parameter, polanya:
//     VALUES (..., <boolean> ? sql`now()` : null, ...)
// jalan di neon — drivernya mengenali query bersarang dan menyusunnya jadi potongan
// SQL — tapi MELEMPAR di jalur ini. Penyusunan fragmen postgres.js hanya bekerja
// kalau yang disarangkan berasal dari instance sql POSTGRES.JS ASLI; `tag` di bawah
// cuma fungsi biasa yang mengembalikan Promise, jadi sql`now()` malah dieksekusi
// sebagai query tersendiri ("syntax error at or near now") dan query induknya
// menerima Promise sebagai parameter timestamp ("Invalid time value").
// Akibat nyatanya: SETIAP penyelesaian level resmi (score >= 60) gagal 500.
// Perbaikannya ada di call site — tulis CASE WHEN <boolean> THEN now() ELSE NULL END
// di dalam teks query, yang cuma mengirim satu boolean biasa dan identik di dua driver.
// Penjaga di bawah mengubah kegagalan membingungkan itu jadi galat yang menyebut
// sebabnya; scripts/validate-api-sql.mjs menangkapnya lebih awal, saat gate.
const guardVals = (vals) => {
  for (const v of vals) {
    if (v && typeof v.then === 'function')
      throw new Error('DB: parameter berupa Promise/thenable. Fragmen sql`...` yang disarangkan tidak didukung di jalur postgres.js — pakai CASE WHEN <boolean> THEN ... ELSE NULL END di dalam query.');
  }
};

// Permukaan pemanggilan dibuat identik dengan neon(): tagged template + .query().
// Jadi tidak ada satu pun call site lain yang perlu disunting.
function pgSql(url){
  const tag = (strings, ...vals) => { guardVals(vals); return pgPool(url).then(s => s(strings, ...vals)).then(toArray); };
  // postgres.js tidak punya .query(text, params); padanannya .unsafe().
  tag.query = (text, params) => { guardVals(params || []); return pgPool(url).then(s => s.unsafe(text, params || [])).then(toArray); };
  tag.end = () => { const p = pools.get(url); if(!p) return Promise.resolve(); pools.delete(url); return p.then(s => s.end()); };
  return tag;
}

// Escape hatch: DB_DRIVER=postgres|neon menimpa deteksi host. Gunanya dua —
// (1) menguji cabang postgres.js lawan Neon, yang juga menerima protokol Postgres
// biasa lewat DATABASE_URL_UNPOOLED, jadi cabang non-Neon sudah teruji sebelum
// Supabase ada; (2) tuas rollback cepat saat cutover. Kosong = deteksi host.
const forcedDriver = () => String(process.env.DB_DRIVER || '').trim().toLowerCase();

export function dbFrom(url){
  if(!url) throw new Error('DATABASE_URL is not configured');
  const f = forcedDriver();
  return (f === 'neon' || (f !== 'postgres' && isNeonUrl(url))) ? neon(url) : pgSql(url);
}
export function db(){
  return dbFrom(process.env.DATABASE_URL);
}

// Untuk skrip CLI (bukan handler): sama seperti dbFrom() tapi .end() dijamin ada.
// Jalur Neon HTTP stateless — tidak ada yang perlu ditutup, jadi no-op. Jalur
// postgres.js WAJIB ditutup atau proses node menggantung: socket-nya masih hidup.
export function scriptDb(url = process.env.DATABASE_URL){
  const sql = dbFrom(url);
  if(typeof sql.end !== 'function') sql.end = async () => {};
  return sql;
}

// Schema is managed via scripts/001_init.sql applied directly to the database.
// No runtime ensureSchema() — serverless functions must not DDL on every request.
