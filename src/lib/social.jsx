import React,{createContext,useContext,useEffect,useMemo,useState} from 'react';

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

/* ===== Tema — applier murni data-theme + data-char (dipanggil ProfileEditor biar instan).
   Komponen ThemeApply reaktif ada di main.jsx (butuh AuthProvider). ===== */
export function applyTheme(t){
  if(typeof document==='undefined')return;
  if(t&&t!=='kitty')document.documentElement.setAttribute('data-theme',t);
  else document.documentElement.removeAttribute('data-theme');
  document.documentElement.setAttribute('data-char',(CHAR_FOR_THEME[t]??CHAR_FOR_THEME.kitty));
}

/* v8 (doc 49): pemetaan tema lama → karakter orisinal. Tema lama tetap jalan di DB
   (kolom theme), cuma diganti skin-nya ke palet karakter. momo = default pink. */
export const CHAR_FOR_THEME={kitty:'momo',sora:'sora',matcha:'kinako',yozora:'kurumi'};

/* ===== Konstanta sosial — HARUS sinkron dengan api/profile.mjs & migrasi 006/007.
   Kalau nambah tema/avatar di sini, tambah juga di DB constraint + AVATAR_KEYS server. ===== */

export const THEMES = [
  {key:'kitty',  name:'Kitty',  ja:'キティ', emoji:'🎀', desc:'Pink klasik — hangat & ceria'},
  {key:'sora',   name:'Sora',   ja:'そら',   emoji:'☁️', desc:'Langit biru — tenang & sejuk'},
  {key:'matcha', name:'Matcha', ja:'抹茶',   emoji:'🍵', desc:'Hijau lembut — fokus & adem'},
  {key:'yozora', name:'Yozora', ja:'夜空',   emoji:'🌙', desc:'Ungu malam — tenang untuk belajar'},
];

// Saran tema per gender (spec user: cowo → biru/sora, cewe → pink).
// Cuma SARAN — user bebas pilih tema lain di step berikutnya.
export const GENDERS = [
  {value:'female',      label:'Cewek',        emoji:'🌸', theme:'kitty'},
  {value:'male',        label:'Cowok',        emoji:'⛅', theme:'sora'},
  {value:'other',       label:'Lainnya',      emoji:'🌈', theme:'matcha'},
  {value:'prefer_not',  label:'Rahasia dong', emoji:'🤫', theme:'kitty'},
];

// Key = nilai avatar_key di DB; file = yang BENAR-BENAR ada di public/assets/hellokitty/.
export const AVATARS = {
  'kitty-1':             {file:'hk-face-icon.png',        label:'Klasik'},
  'hk-cute-emoji':       {file:'hk-cute-emoji.png',       label:'Ceria'},
  'hk-balloons':         {file:'hk-balloons.png',         label:'Balon'},
  'hk-birthday-camera':  {file:'hk-birthday-camera.png',  label:'Kamera'},
  'hk-desktop-art':      {file:'hk-desktop-art.png',      label:'Belajar'},
  'hk-face-icon':        {file:'hk-face-icon.png',        label:'Wajah'},
  'hk-illustration-1':   {file:'hk-illustration-1.png',   label:'Ilustrasi'},
  'hk-pink-bow':         {file:'hk-pink-bow.png',         label:'Pita Pink'},
  'hk-sticker-flower':   {file:'hk-sticker-flower.png',   label:'Bunga'},
};

// Urutan = urutan seed achievements di scripts/007_social_features.sql.
export const CATEGORY_META = {
  learning: {label:'Belajar',   emoji:'📚'},
  exam:     {label:'Ujian',     emoji:'📝'},
  social:   {label:'Sosial',    emoji:'💌'},
  glossary: {label:'Glosarium', emoji:'📖'},
  meta:     {label:'XP',        emoji:'✨'},
};

// Tingkatan bingkai avatar (hadiah achievement). min = jumlah achievement.
export const FRAME_META = {
  none:    {label:'Polos',   emoji:'',   min:0},
  bronze:  {label:'Perunggu',emoji:'🥉', min:5},
  silver:  {label:'Perak',   emoji:'🥈', min:12},
  gold:    {label:'Emas',    emoji:'🥇', min:20},
  sakura:  {label:'Sakura',  emoji:'🌸', min:30},
  rainbow: {label:'Pelangi', emoji:'🌈', min:35},
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

/* ===== Avatar dengan bingkai achievement ===== */

export function Avatar({avatarKey,frame='none',size=44,className=''}){
  const a = AVATARS[avatarKey] || AVATARS['kitty-1'];
  return <span className={`avatarWrap frame-${frame} ${className}`} style={{width:size,height:size}} aria-hidden="true">
    <img src={`/assets/hellokitty/${a.file}`} alt=""/>
  </span>;
}

/* ===== Toast achievement baru — dipakai semua halaman yang memicu unlock ===== */

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
      {items.map(a=><div className="achToast" key={a._k}><span className="achToastIcon">{a.icon}</span><div className="achToastCopy"><small>ACHIEVEMENT TERBUKA ✨</small><b>{a.nameId}</b><p>{a.descId}</p></div></div>)}
    </div>
  </ToastCtx.Provider>;
}

export const useAchToast = ()=>useContext(ToastCtx);
