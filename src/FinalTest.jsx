import React,{useState,useEffect} from 'react';
import {Link,useNavigate,useParams} from 'react-router-dom';
import {ChevronRight} from 'lucide-react';
import finalData from './content/final/index.js';
import Furigana from './Furigana.jsx';
import {useLangMode,useAchToast} from './lib/social.jsx';

const parts=[1,2,3,4,5],years=[2026,2025,2024,2023,2022,2021],key='kk_final_progress';
const readProgress=()=>{try{return JSON.parse(localStorage.getItem(key)||'{}')}catch{return {}}};
const saveProgress=x=>{try{localStorage.setItem(key,JSON.stringify(x))}catch{}};
/* UUID attemptId: pola sama Quiz di main.jsx — crypto.randomUUID + fallback
   getRandomValues supaya versi lama tetap menghasilkan UUID valid (server 400 kalau bukan). */
const uuid=()=>crypto.randomUUID?crypto.randomUUID():([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g,c=>(c^crypto.getRandomValues(new Uint8Array(1))[0]&15>>c/4).toString(16));
/* Progress ujian sekarang SERVER-FIRST (api/final.mjs). localStorage jadi dua hal:
   (1) fallback offline — entri ditandai saved:false dan direplay FinalResult /
   submit berikutnya lewat /api/final/local-merge (upsert idempoten, tanpa XP retroaktif);
   (2) sumber merge data lama era-guest, dikirim sekali (flag kk_final_merged).
   `cache` meniru bentuk lama {year:{part:{best,answered,answers,mode,saved}}}
   supaya komponen layar tidak perlu tahu dari mana datanya datang. */
/* Cache punya UMUR dan penggabung request. Sebelumnya ensureProgress() SELALU
   memanggil /api/final: cache-nya cuma dipakai loadPart, sementara FinalHome dan
   FinalYear memanggilnya di tiap mount. Jadi /final -> /final/2026 -> balik = tiga
   GET untuk data yang sama, dan tiap GET itu tiga query DB berurutan.
   FRESH_MS 60 detik: progress ujian cuma berubah kalau USER INI submit, dan jalur
   submit sudah menulis langsung ke cache, jadi data basi bukan risiko nyata di
   sini — yang dijaga cuma kalau tab lain ikut mengubahnya.
   inflight menggabungkan pemanggil bersamaan jadi satu request: tanpa itu dua
   komponen yang mount berbarengan (atau StrictMode) menembak dua kali. */
let cache={},cacheAt=0,inflight=null;
const FRESH_MS=60000;
function ensureProgress(force){
  if(!force&&cacheAt&&Date.now()-cacheAt<FRESH_MS)return Promise.resolve();
  if(inflight)return inflight;
  inflight=fetchProgress().finally(()=>{inflight=null});
  return inflight;
}
async function fetchProgress(){try{const r=await fetch('/api/final',{credentials:'same-origin'});if(!r.ok)return;const d=await r.json();cache={};for(const [y,ps] of Object.entries(d.progress||{}))cache[Number(y)]=Object.fromEntries(Object.entries(ps).map(([n,e])=>[Number(n),{...e,saved:true}]));const loc=readProgress();for(const [y,ps] of Object.entries(loc)){cache[Number(y)]=cache[Number(y)]||{};for(const [n,e] of Object.entries(ps)){const s=cache[Number(y)][Number(n)];if(!s||!s.saved)cache[Number(y)][Number(n)]={...e,saved:false};}}cacheAt=Date.now();mergeLocalToServer();}catch{cache=readProgress();for(const y of Object.keys(cache))for(const n of Object.keys(cache[y]))cache[y][n]={...cache[y][n],saved:false}}}
const getProgress=()=>cache;
async function loadPart(y,n){if(!Object.keys(cache).length)await ensureProgress();const s=cache[y]?.[n];if(s)return s;const loc=readProgress()[y]?.[n];return loc?{...loc,saved:false}:{}}
/* Kirim semua entri lokal yang belum diakui server. Fire-and-forget; upsert server
   tidak menaikkan attempts saat konflik, jadi aman dipanggil berulang-ulang. */
function mergeLocalToServer(){const loc=readProgress(),entries=[];for(const [y,ps] of Object.entries(loc))for(const [n,e] of Object.entries(ps))entries.push({year:Number(y),part:Number(n),best:Number(e.best)||0,answered:Number(e.answered)||0,answers:e.answers||{},mode:e.mode});if(!entries.length)return;fetch('/api/final/local-merge',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({entries})}).catch(()=>{});}
function savePart(y,n,e){const all=readProgress();all[y]={...(all[y]||{}),[n]:{best:Math.max(all[y]?.[n]?.best||0,e.best||0),answered:e.answered||0,answers:e.answers||{},mode:e.mode}};saveProgress(all);cache[y]={...(cache[y]||{}),[n]:{...all[y][n],saved:false}};mergeLocalToServer();}
/* Semua teks Jepang lewat <Furigana>. Catatan: `mode` di FinalQuiz itu practice/exam,
   bukan bahasa — makanya bahasa dipegang state `lang` yang terpisah. */
function LangPicker({lang,setLang}){return <div className="finalModeSwitch">{['kanji','furigana','id'].map(m=><button key={m} className={lang===m?'active':''} onClick={()=>setLang(m)}>{m==='kanji'?'漢字':m==='furigana'?'ふり':'ID'}</button>)}</div>}
function YearCard({year,p}){const d=finalData[year];return <Link className="finalYearCard" to={`/final/${year}`}><b>{year}</b><strong>{d.exam}</strong><span>{parts.filter(n=>p[n]).length}/5 bagian</span><small>125 soal</small></Link>}
/* Achievement unlimited-100: hitungan jawaban persist di localStorage, dilaporkan
   ke server (whitelist CLIENT_REPORTABLE) tepat saat menyentuh 100. */
const UNLIM_KEY='kk_unlimited_count';
const readUnlim=()=>{try{return Number(localStorage.getItem(UNLIM_KEY))||0}catch{return 0}};
export function UnlimitedFinal(){const [q,setQ]=useState(1),[selected,setSelected]=useState(null),[lang,setLang]=useLangMode(),[count,setCount]=useState(readUnlim);const toast=useAchToast();const item=finalData[2026].questions[q-1];
const choose=k=>{if(selected!==null)return;setSelected(k);const c=count+1;setCount(c);try{localStorage.setItem(UNLIM_KEY,String(c))}catch{}if(c===100)fetch('/api/achievements',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({ids:['unlimited-100']})}).then(r=>r.json()).then(d=>toast(d.newAchievements)).catch(()=>{});};
return <main className="page finalPage unlimitedFinal"><Link to="/final" className="back">← Ujian Akhir</Link><div className="unlimitedHero"><p className="eyebrow">UNLIMITED PRACTICE</p><h1>Latihan tanpa batas</h1><p className="muted">Soal terus berputar. Tidak memengaruhi skor resmi, XP, atau progress ujian.</p><span className="quizModeBadge">{count>=100?'Maraton 100 selesai ➤✦':`${count}/100 soal — maraton`}</span></div><LangPicker lang={lang} setLang={setLang}/><section className="finalQuestion"><small>Soal latihan #{q}</small><Furigana field={item.prompt} mode={lang} as="h2"/><div className="finalOptions">{item.options.map(o=><button className={selected===o.key?'selected':''} key={o.key} onClick={()=>choose(o.key)}><b>{o.key}</b><Furigana field={o.text} mode={lang} variant="opt"/></button>)}</div>{selected&&<div className="finalFeedback">{selected===item.answer?'Benar ✦':'Coba lagi ya'}<br/>{item.explanation.id}</div>}</section><button className="primary big" onClick={()=>{setQ(q%125+1);setSelected(null)}}>Soal berikutnya <ChevronRight/></button></main>}
export function FinalHome(){const [prog,setProg]=useState(getProgress);useEffect(()=>{ensureProgress().then(()=>{setProg({...getProgress()});if(!localStorage.getItem('kk_final_merged')){mergeLocalToServer();try{localStorage.setItem('kk_final_merged','1')}catch{}}});},[]);return <main className="page finalPage"><Link to="/belajar" className="back">← Belajar</Link><div className="finalHero"><p className="eyebrow">SIMULASI UJIAN</p><h1>Ujian Akhir</h1><p className="muted">Pilih tahun ujian. Semua bagian terbuka sejak awal.</p></div><Link className="unlimitedBanner" to="/final/unlimited"><b>✿ Latihan tanpa batas</b><span>Jawab soal random seperti mode Latihan sebelumnya →</span></Link><div className="finalYearGrid">{years.map(y=><YearCard key={y} year={y} p={prog[y]||{}}/>)}</div></main>}
export function FinalYear(){const {year}=useParams(),y=Number(year),d=finalData[y];const [p,setP]=useState(()=>getProgress()[y]||{});useEffect(()=>{ensureProgress().then(()=>setP({...(getProgress()[y]||{})}));},[y]);if(!d)return <main className="page"><h1>Tahun tidak ditemukan</h1><Link to="/final">Kembali</Link></main>;return <main className="page finalPage"><Link to="/final" className="back">← Semua tahun</Link><h1>{y} · {d.exam}</h1><p className="muted">{Object.values(p).reduce((a,x)=>a+(x.best||0),0)}/125 terbaik</p><div className="finalParts">{parts.map(part=>{const from=(part-1)*25+1,to=part*25,x=p[part];return <Link key={part} to={`/final/${y}/part/${part}`} className="finalPart"><b>Bagian {part}</b><span>soal {from}–{to}</span><small>{x?`${x.best}/25`:'Belum dikerjakan'}</small></Link>})}</div></main>}
// `ok` wajib: slice() nerima indeks negatif & non-integer, jadi tanpa cek ini /final/2021/part/-1
// nyajikan soal 76-100 dengan label "Bagian -1", dan part/1.5 nyajikan soal 13-37 (nyeberang dua
// bagian). Number.isInteger sekaligus nolak NaN, jadi param non-numerik ikut ketangkep.
export function FinalQuiz(){const {year,part}=useParams(),y=Number(year),n=Number(part),d=finalData[y],ok=Number.isInteger(n)&&n>=1&&n<=parts.length,qs=ok?(d?.questions?.slice((n-1)*25,n*25)||[]):[],nav=useNavigate();const [mode,setMode]=useState(()=>localStorage.getItem('kk_final_mode')||'practice'),[lang,setLang]=useLangMode(),[answers,setAnswers]=useState({}),[qi,setQi]=useState(0),[attemptId,setAttemptId]=useState(uuid),[submitErr,setSubmitErr]=useState(null);const q=qs[qi];if(!d||!qs.length)return <main className="page"><h1>Soal belum tersedia</h1></main>;const choose=k=>setAnswers(a=>({...a,[q.no]:k}));const patchPrefMode=m=>fetch('/api/final',{method:'PATCH',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({mode:m})}).catch(()=>{});
/* Submit server-first: jawaban dikirim mentah, skor dihitung ulang di server dari
   bank soal deterministik. Gagal jaringan → simpan lokal (saved:false) lalu tetap
   lanjut ke Result; entri itu direplay otomatis saat Result terbuka lagi online.
   Gagal 400 (selain UUID usang) → banner error TANPA pindah halaman, retry idempoten
   dengan attemptId yang sama. */
const submit=async()=>{setSubmitErr(null);const answered=Object.keys(answers).length;try{const r=await fetch('/api/final',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({year:y,part:n,mode,answers,attemptId})});if(r.status===400){const b=await r.json().catch(()=>({}));if(b.message==='attemptId must be a UUID'){setAttemptId(uuid());return}setSubmitErr(b.message||'Submit ditolak server.');return}if(!r.ok){setSubmitErr('Gagal menyimpan progress. Coba lagi.');return}const b=await r.json();const all=readProgress();all[y]={...(all[y]||{}),[n]:{best:b.best,answered,answers,mode}};saveProgress(all);cache[y]={...(cache[y]||{}),[n]:{best:b.best,answered,answers,mode,saved:true,review:b.review}};nav(`/final/${year}/part/${part}/result`)}catch{savePart(y,n,{best:qs.reduce((a,x)=>a+(answers[x.no]===x.answer?1:0),0),answered,answers,mode});nav(`/final/${year}/part/${part}/result`)}};
return <main className="page finalQuiz"><div className="finalQuizTop"><Link to={`/final/${year}`}>× Tutup</Link><span>問題 {q.no} · {qi+1}/25</span><select value={mode} onChange={e=>{setMode(e.target.value);localStorage.setItem('kk_final_mode',e.target.value);patchPrefMode(e.target.value)}}><option value="practice">Mode Latihan</option><option value="exam">Mode Ujian</option></select></div><LangPicker lang={lang} setLang={setLang}/><div className="finalQuestion"><Furigana field={q.prompt} mode={lang} as="h2"/><div className="finalOptions">{q.options.map(o=><button className={answers[q.no]===o.key?'selected':''} key={o.key} onClick={()=>choose(o.key)}><b>{o.key}</b><Furigana field={o.text} mode={lang} variant="opt"/></button>)}</div>{mode==='practice'&&answers[q.no]&&<div className="finalFeedback">{answers[q.no]===q.answer?'Benar':'Cek lagi'} — {q.explanation.id}</div>}</div>{submitErr&&<div className="submitError">{submitErr}</div>}<div className="finalQuizNav"><button disabled={qi===0} onClick={()=>setQi(qi-1)}>Sebelumnya</button>{qi<24?<button onClick={()=>setQi(qi+1)}>Berikutnya</button>:<button onClick={submit}>Kirim bagian</button>}</div></main>}
/* Review per soal. Sumber utama: field `review` dari /api/final (server yang
   merekonstruksi kuncinya). Fallback lokal dipakai HANYA saat entri belum diakui
   server (jalur offline) — kunci ujian memang ikut terbundel di klien karena
   soalnya deterministik, jadi menyembunyikan jawaban benar di sini adalah pilihan
   BELAJAR, bukan pengamanan: tujuannya user mengerjakan ulang, bukan menyontek
   dari layar hasil. */
function localReview(y,n,answers){const qs=finalData[y]?.questions?.slice((n-1)*25,n*25)||[];return qs.map(q=>{const c=answers?.[q.no]??answers?.[String(q.no)]??null;return {no:q.no,chosen:c||null,correct:c===q.answer};});}

function ReviewList({review}){
  const benar=review.filter(r=>r.correct).length,kosong=review.filter(r=>!r.chosen).length,salah=review.length-benar-kosong;
  return <section className="finalReview">
    <div className="finalReviewHead"><b>Review jawaban · nomor soal</b><span>{benar} benar · {salah} salah · {kosong} kosong</span></div>
    <ul className="finalReviewLegend"><li className="ok">Benar</li><li className="bad">Salah</li><li className="skip">Kosong</li></ul>
    <ol className="finalReviewGrid">{review.map(r=><li key={r.no} className={'finalReviewItem '+(r.correct?'ok':r.chosen?'bad':'skip')}>
      <b>{r.no}</b><span>{r.chosen?'Pilihanmu '+r.chosen:'Tidak dijawab'}</span>
    </li>)}</ol>
    <p className="finalReviewNote">Kunci soal yang belum tepat sengaja tidak ditampilkan. Kerjakan ulang bagian ini — di Mode Latihan penjelasannya muncul begitu kamu menjawab.</p>
  </section>;
}

export function FinalResult(){const {year,part}=useParams(),y=Number(year),n=Number(part);const [p,setP]=useState(null);useEffect(()=>{if(!finalData[y]||!Number.isInteger(n)||n<1||n>parts.length)return;loadPart(y,n).then(e=>{if(e&&!e.saved&&e.answers){savePart(y,n,{best:e.best||0,answered:e.answered||0,answers:e.answers,mode:e.mode});e={...e,saved:true}}setP(e||{});});},[y,n]);if(!finalData[y]||!Number.isInteger(n)||n<1||n>parts.length)return <main className="page"><h1>Hasil tidak ditemukan</h1><Link to="/final">Kembali</Link></main>;
  const review=p?.review?.length?p.review:(p&&p.answers?localReview(y,n,p.answers):null);
  return <main className="page finalPage"><p className="eyebrow">HASIL BAGIAN {n}</p>{p===null?<p className="muted">Memuat hasil…</p>:<><h1>{p?.best||0} / 25</h1><p className="muted">Jawaban tersimpan di akunmu.</p></>}
    {review&&<ReviewList review={review}/>}
    <div className="finalResultNav"><Link className="secondary big tap" to={`/final/${y}/part/${n}`}>Kerjakan ulang</Link><Link className="primary big tap" to={`/final/${y}`}>Kembali ke tahun {y}</Link></div>
  </main>}
