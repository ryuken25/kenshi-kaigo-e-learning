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

/* ===== v8 (doc 49): sistem karakter orisinal — aset di public/assets/characters/.
   6 karakter × 6 ekspresi digenerate scripts/gen-characters.mjs (deterministik).
   Tema tombol ikut karakter via <html data-char>; SANRIO TIDAK DIPAKAI di produk
   publik (IP pihak ketiga). HARUS sinkron dengan api/_characters.mjs & migrasi 008. ===== */
export const CHARACTER_IDS=['momo','kurumi','sora','kinako','nagi','beni'];
export const CHARACTERS={
  momo:   {name:'Momo',   species:'Kucing putih',  emoji:'🎀', desc:'Hangat & telaten',        btnText:'#3a2a33'},
  kurumi: {name:'Kurumi', species:'Kelinci malam', emoji:'🌙', desc:'Jenaka & penuh akal',     btnText:'#ffffff'},
  sora:   {name:'Sora',   species:'Anjing awan',   emoji:'☁️', desc:'Tenang & penyabar',       btnText:'#ffffff'},
  kinako: {name:'Kinako', species:'Anjing kue',    emoji:'🍮', desc:'Santai & ramah',          btnText:'#3a3122'},
  nagi:   {name:'Nagi',   species:'Pinguin laut',  emoji:'📋', desc:'Cermat & teliti',         btnText:'#ffffff'},
  beni:   {name:'Beni',   species:'Rubah senja',   emoji:'🦊', desc:'Penuh semangat',          btnText:'#ffffff'},
};
// Pasangan awal onboarding (doc 49): perempuan → Momo+Kurumi, laki-laki →
// Momo+Sora, lainnya → ketiganya, tidak isi → Momo saja.
export const GENDER_PAIRS={female:['momo','kurumi'],male:['momo','sora'],other:['momo','kurumi','sora'],prefer_not:['momo']};
// Pasangan gender SEBELANG — terbuka saat total 5 level completed (api/progress.mjs).
export const CHAR_COMPLEMENTS={momo:['kurumi','sora'],kurumi:['sora','momo'],sora:['kurumi','momo'],kinako:['momo','kurumi','sora'],nagi:['momo','kurumi','sora'],beni:['momo','kurumi','sora']};
export const CHAR_EXPRS=['idle','happy','sad','sleepy','surprised','clap'];
// Nagi & Beni "menyusul" (doc 49): tampil abu tanpa gembok, tidak ada jalur unlock.
export const COMING_SOON=['nagi','beni'];
export const charPath=(id,expr='idle')=>`/assets/characters/${CHARACTER_IDS.includes(id)?id:'momo'}/${CHAR_EXPRS.includes(expr)?expr:'idle'}.svg`;

/* Pasang data-char + variabel tombol karakter di <html>. Dipanggil ThemeApply
   (main.jsx) dari user.characterId DAN on-the-fly oleh useCharExpr (pilih
   karakter di onboarding langsung ganti skin). */
export function applyChar(c){
  if(typeof document==='undefined')return;
  const id=CHARACTER_IDS.includes(c)?c:'momo';
  const r=document.documentElement;
  r.setAttribute('data-char',id);
  r.style.setProperty('--btn-bg',getComputedStyle(r).getPropertyValue('--char-btn'));
  r.style.setProperty('--btn-text',CHARACTERS[id].btnText);
  r.style.setProperty('--btn-shadow',getComputedStyle(r).getPropertyValue('--char-btn-shadow'));
}

/* Ekspresi karakter aktif yang reaktif terhadap data-char: pasang/bersihkan
   MutationObserver di ThemeApply. Default 'idle' — komponen bisa minta ekspresi
   lain (Mascot variant→ekspresi, Result perfect→clap, toast unlock→happy). */
export function useCharExpr(expr='idle'){
  const [c,setC]=useState('momo');
  useEffect(()=>{
    const r=document.documentElement;
    const read=()=>setC(CHARACTER_IDS.includes(r.getAttribute('data-char'))?r.getAttribute('data-char'):'momo');
    read();
    const mo=new MutationObserver(read);
    mo.observe(r,{attributes:true,attributeFilter:['data-char']});
    return ()=>mo.disconnect();
  },[]);
  return charPath(c,expr);
}

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
        ? <div className="achToast charToast" key={a._k}><img className="achToastChar" src={charPath(a.id,'happy')} alt=""/><div className="achToastCopy"><small>KARAKTER BARU TERBUKA 🌸</small><b>{CHARACTERS[a.id]?.name||a.id} sekarang bisa dipakai!</b><p>{CHARACTERS[a.id]?.desc||''}</p></div></div>
        : <div className="achToast" key={a._k}><span className="achToastIcon">{a.icon}</span><div className="achToastCopy"><small>ACHIEVEMENT TERBUKA ✨</small><b>{a.nameId}</b><p>{a.descId}</p></div></div>)}
    </div>
  </ToastCtx.Provider>;
}

export const useAchToast = ()=>useContext(ToastCtx);

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
