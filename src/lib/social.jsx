import React,{createContext,useContext,useEffect,useState} from 'react';

/* ===== Mode bahasa global (kanji / furigana / id) — PERSIST ke localStorage.
   Bug lama: semua useState('kanji') reset ke kanji tiap ganti kartu/soal/navigasi,
   jadi pilihan "ID" user hilang terus ("mode bahasa belum di-set"). Sekarang satu
   hook dipakai semua surface: materi, quiz, practice, ujian akhir, glossary. ===== */
export const LANG_MODE_KEY = 'kk_lang_mode';
export const LANG_MODES = ['kanji','furigana','id'];
export function useLangMode(initial='kanji'){
  const [mode,setMode]=useState(()=>{try{const v=localStorage.getItem(LANG_MODE_KEY);return LANG_MODES.includes(v)?v:initial}catch{return initial}});
  const pick=m=>{setMode(m);try{localStorage.setItem(LANG_MODE_KEY,m)}catch{}};
  return [mode,pick];
}

/* ===== v9: tiga karakter ilustrasi — aset PNG di public/assets/characters/<skin>/.
   SANRIO TIDAK DIPAKAI di produk publik (IP pihak ketiga); ketiganya orisinal.

   PENTING — KENAPA TIDAK ADA MIGRASI DB.
   Yang berubah cuma NAMA TAMPILAN dan ASETNYA, bukan id-nya. Id di kolom
   app_users.character_id tetap 'momo' / 'sora' / 'kurumi' — nilai yang sudah
   diizinkan CHECK constraint migrasi 008 dan sudah divalidasi api/_characters.mjs.
   Jadi tidak ada baris yang perlu ditulis ulang, tidak ada constraint yang perlu
   diubah, dan rollback cukup dengan revert kode.

     id DB    skin/aset   nama baru
     momo  ->  momo       Momo   (kucing putih)
     sora  ->  yuki       Yuki   (anjing awan)
     kurumi -> luna       Luna   (kelinci malam)
     kinako/nagi/beni -> dipetakan ke skin terdekat; tidak lagi ditawarkan di picker
       tapi akun lama yang terlanjur memilikinya tetap render dengan benar.

   HARUS sinkron dengan api/_characters.mjs & migrasi 008 untuk daftar ID-nya. ===== */
export const CHARACTER_IDS=['momo','kurumi','sora','kinako','nagi','beni'];
// Yang ditawarkan di onboarding & editor profil. Tiga id ini semuanya sudah sah di DB.
export const PICKABLE_CHARS=['momo','sora','kurumi'];
// id DB -> skin aset. Akun lama dengan kinako/nagi/beni tetap dapat gambar yang benar.
export const CHAR_SKIN={momo:'momo',sora:'yuki',kurumi:'luna',kinako:'momo',nagi:'yuki',beni:'luna'};
// Nama skin yang sah. DIBUTUHKAN terpisah dari CHARACTER_IDS: <html data-char> diisi
// SKIN oleh applyChar, bukan id DB, jadi apa pun yang membaca atribut itu harus
// mengukurnya terhadap daftar ini. 'momo' kebetulan ada di dua daftar sekaligus —
// itulah kenapa tema merah muda tampak benar sementara Yuki & Luna diam-diam jatuh
// ke Momo di SETIAP gambar karakter.
export const CHAR_SKINS=['momo','yuki','luna'];
// Idempoten: menerima id DB ('sora') maupun skin ('yuki'). Tanpa ini charPath('yuki')
// jatuh ke 'momo' karena 'yuki' bukan kunci CHAR_SKIN.
export const skinOf=(id)=>CHAR_SKIN[id]||(CHAR_SKINS.includes(id)?id:'momo');
export const CHARACTERS={
  momo:   {name:'Momo',   species:'Kucing putih',  desc:'Hangat & telaten',    btnText:'#3a2a33'},
  sora:   {name:'Yuki',   species:'Anjing awan',   desc:'Tenang & penyabar',   btnText:'#ffffff'},
  kurumi: {name:'Luna',   species:'Kelinci malam', desc:'Jenaka & penuh akal', btnText:'#ffffff'},
  kinako: {name:'Momo',   species:'Kucing putih',  desc:'Hangat & telaten',    btnText:'#3a2a33'},
  nagi:   {name:'Yuki',   species:'Anjing awan',   desc:'Tenang & penyabar',   btnText:'#ffffff'},
  beni:   {name:'Luna',   species:'Kelinci malam', desc:'Jenaka & penuh akal', btnText:'#ffffff'},
};
// Pasangan awal onboarding (doc 49): perempuan → Momo+Kurumi, laki-laki →
// Momo+Sora, lainnya → ketiganya, tidak isi → Momo saja.
export const GENDER_PAIRS={female:['momo','kurumi'],male:['momo','sora'],other:['momo','kurumi','sora'],prefer_not:['momo']};
// Pasangan gender SEBELANG — terbuka saat total 5 level completed (api/progress.mjs).
export const CHAR_COMPLEMENTS={momo:['kurumi','sora'],kurumi:['sora','momo'],sora:['kurumi','momo'],kinako:['momo','kurumi','sora'],nagi:['momo','kurumi','sora'],beni:['momo','kurumi','sora']};
export const CHAR_EXPRS=['idle','happy','sad','sleepy','surprised','clap'];
// Nagi & Beni "menyusul" (doc 49): tampil abu tanpa gembok, tidak ada jalur unlock.
export const COMING_SOON=['nagi','beni'];
// PNG, bukan SVG lagi: ilustrasi berbayang lembut tidak bisa diwakili path vektor.
export const charPath=(id,expr='idle')=>`/assets/characters/${skinOf(id)}/${CHAR_EXPRS.includes(expr)?expr:'idle'}.png`;

/* Pasang data-char + variabel tombol karakter di <html>. Dipanggil ThemeApply
   (main.jsx) dari user.characterId DAN on-the-fly oleh useCharExpr (pilih
   karakter di onboarding langsung ganti skin). */
export function applyChar(c){
  if(typeof document==='undefined')return;
  const id=CHARACTER_IDS.includes(c)?c:'momo';
  const r=document.documentElement;
  // data-char memakai SKIN, bukan id DB: themes.css cuma punya selektor
  // [data-char=momo|yuki|luna]. id 'sora' -> skin 'yuki', 'kurumi' -> 'luna'.
  r.setAttribute('data-char',skinOf(id));
  // --btn-text ikut dibaca dari CSS (bukan konstanta JS) karena nilainya beda
  // antara mode terang & gelap; membaca dari CSS bikin toggle mode langsung benar.
  const cs=getComputedStyle(r);
  r.style.setProperty('--btn-bg',cs.getPropertyValue('--char-btn'));
  r.style.setProperty('--btn-text',cs.getPropertyValue('--char-btn-text')||CHARACTERS[id].btnText);
  r.style.setProperty('--btn-shadow',cs.getPropertyValue('--char-btn-shadow'));
}

/* ===== Mode gelap — atribut data-mode di <html>, disimpan lokal per perangkat.
   Sengaja TIDAK disimpan ke akun: preferensi terang/gelap itu milik perangkat
   (ponsel di kamar gelap, laptop di kantor terang), bukan milik orang. Menyimpan
   ke DB berarti butuh migrasi kolom + endpoint baru untuk hasil yang lebih buruk. */
export const DARK_KEY='kk_dark_mode';
export const readDark=()=>{try{return localStorage.getItem(DARK_KEY)==='1'}catch{return false}};
export function applyDark(on){
  if(typeof document==='undefined')return;
  const r=document.documentElement;
  if(on)r.setAttribute('data-mode','dark');else r.removeAttribute('data-mode');
  try{localStorage.setItem(DARK_KEY,on?'1':'0')}catch{}
  // Token tombol ikut berubah per mode, jadi salin ulang setelah atribut berganti.
  applyChar(r.getAttribute('data-char')==='yuki'?'sora':r.getAttribute('data-char')==='luna'?'kurumi':'momo');
}
export function useDarkMode(){
  const [on,setOn]=useState(readDark);
  useEffect(()=>{applyDark(on)},[on]);
  return [on,setOn];
}

/* Ekspresi karakter aktif yang reaktif terhadap data-char: pasang/bersihkan
   MutationObserver di ThemeApply. Default 'idle' — komponen bisa minta ekspresi
   lain (Mascot variant→ekspresi, Result perfect→clap, toast unlock→happy). */
export function useCharExpr(expr='idle'){
  const [c,setC]=useState('momo');
  useEffect(()=>{
    const r=document.documentElement;
    // data-char berisi SKIN (momo/yuki/luna), bukan id DB. Dulu di sini diukur
    // terhadap CHARACTER_IDS, jadi 'yuki' & 'luna' selalu gagal dan setiap maskot
    // di seluruh app menampilkan Momo untuk tema biru & ungu.
    const read=()=>{const v=r.getAttribute('data-char');setC(CHAR_SKINS.includes(v)||CHARACTER_IDS.includes(v)?v:'momo')};
    read();
    const mo=new MutationObserver(read);
    mo.observe(r,{attributes:true,attributeFilter:['data-char']});
    return ()=>mo.disconnect();
  },[]);
  return charPath(c,expr);
}

/* ===== Konstanta sosial — HARUS sinkron dengan api/profile.mjs & migrasi 006/007.
   Kalau nambah tema/avatar di sini, tambah juga di DB constraint + AVATAR_KEYS server. ===== */

/* Tema mengikuti pola yang sama: key DB tidak diubah (semuanya sudah sah di CHECK
   migrasi 007), cuma nama & paletnya. matcha/yozora tidak ditawarkan lagi tapi akun
   lama yang memakainya tetap dapat palet yang benar lewat THEME_SKIN. */
export const THEMES = [
  {key:'kitty',  name:'Momo', ja:'もも',   desc:'Merah muda — hangat & ceria'},
  {key:'sora',   name:'Yuki', ja:'ゆき',   desc:'Biru langit — tenang & sejuk'},
  {key:'yozora', name:'Luna', ja:'るな',   desc:'Ungu malam — teduh untuk belajar'},
];
export const THEME_SKIN={kitty:'momo',sakura:'momo',sora:'yuki',matcha:'luna',yozora:'luna'};
export const themeSkinOf=(k)=>THEME_SKIN[k]||'momo';

// Saran tema per gender (spec user: cowo → biru/sora, cewe → pink).
// Cuma SARAN — user bebas pilih tema lain di step berikutnya.
export const GENDERS = [
  {value:'female',      label:'Cewek',        emoji:'✿', theme:'kitty'},
  {value:'male',        label:'Cowok',        emoji:'☁', theme:'sora'},
  // theme:'yozora', bukan 'matcha'. THEMES cuma menawarkan kitty/sora/yozora, jadi
  // user yang memilih "Lainnya" dulu mendapat nilai yang TIDAK ADA di pemilih tema
  // sidebar — tidak satu pun titik terlihat terpilih olehnya. 'matcha' tetap sah di
  // DB (CHECK 007 mengizinkannya) dan THEME_SKIN tetap memetakannya ke palet luna,
  // jadi akun lama yang terlanjur memakainya tidak terganggu sama sekali.
  {value:'other',       label:'Lainnya',      emoji:'❃', theme:'yozora'},
  {value:'prefer_not',  label:'Rahasia dong', emoji:'◌', theme:'kitty'},
];

/* Avatar = karakter aktif (doc 49: karakter menentukan tampilan). Key lama
   avatar_key di DB dibiarkan untuk profil lama; Avatar yang menerima
   characterId merender SVG idle karakter itu dan mengabaikan avatarKey. */
export function Avatar({characterId,frame='none',size=44,className=''}){
  return <span className={`avatarWrap frame-${frame} ${className}`} style={{width:size,height:size}} aria-hidden="true">
    <img src={charPath(characterId)} alt=""/>
  </span>;
}

/* ===== Toast achievement + unlock karakter — dipakai semua halaman pemicu unlock ===== */

const ToastCtx = createContext(()=>{});
let toastSeq = 0;

export function ToastProvider({children}){
  const [items,setItems] = useState([]);
  const push = (list)=>{
    if(!Array.isArray(list) || !list.length) return;
    const stamped = list.map(a=>({...a,_k:++toastSeq}));
    setItems(prev=>[...prev,...stamped]);
    setTimeout(()=>setItems(prev=>prev.filter(p=>!stamped.includes(p))),4600);
  };
  return <ToastCtx.Provider value={push}>
    {children}
    <div className="achToastLayer" aria-live="polite">
      {items.map(a=>a._kind==='char'
        ? <div className="achToast charToast" key={a._k}><img className="achToastChar" src={charPath(a.id,'happy')} alt=""/><div className="achToastCopy"><small>KARAKTER BARU TERBUKA ✿</small><b>{CHARACTERS[a.id]?.name||a.id} sekarang bisa dipakai!</b><p>{CHARACTERS[a.id]?.desc||''}</p></div></div>
        : <div className="achToast" key={a._k}><span className="achToastIcon">{a.icon}</span><div className="achToastCopy"><small>ACHIEVEMENT TERBUKA ✦</small><b>{a.nameId}</b><p>{a.descId}</p></div></div>)}
    </div>
  </ToastCtx.Provider>;
}

export const useAchToast = ()=>useContext(ToastCtx);

export const CATEGORY_META = {
  learning: {label:'Belajar',   emoji:'▤'},
  exam:     {label:'Ujian',     emoji:'✎'},
  social:   {label:'Sosial',    emoji:'✉'},
  glossary: {label:'Glosarium', emoji:'▤'},
  meta:     {label:'XP',        emoji:'✦'},
};

// Tingkatan bingkai avatar (hadiah achievement). min = jumlah achievement.
export const FRAME_META = {
  none:    {label:'Polos',   emoji:'',   min:0},
  bronze:  {label:'Perunggu',emoji:'③', min:5},
  silver:  {label:'Perak',   emoji:'②', min:12},
  gold:    {label:'Emas',    emoji:'①', min:20},
  sakura:  {label:'Sakura',  emoji:'✿', min:30},
  rainbow: {label:'Pelangi', emoji:'❃', min:35},
};

export const HANDLE_RE = /^[a-z0-9_]{4,14}$/;

/* ===== helper API ===== */

export async function patchProfile(fields){
  const r = await fetch('/api/profile',{method:'PATCH',headers:{'Content-Type':'application/json'},credentials:'same-origin',body:JSON.stringify(fields)});
  const d = await r.json().catch(()=>({}));
  return {ok:r.ok, status:r.status, data:d};
}

export async function friendsAction(action,handle){
  const r = await fetch('/api/friends',{method:'POST',headers:{'Content-Type':'application/json'},credentials:'same-origin',body:JSON.stringify({action,handle})});
  const d = await r.json().catch(()=>({}));
  return {ok:r.ok, status:r.status, data:d};
}
