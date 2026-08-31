import React,{useState,useEffect} from 'react';
import {Link,useNavigate,useParams} from 'react-router-dom';
import {ChevronRight} from 'lucide-react';
import finalData,{isCorrectAnswer} from './content/final/index.js';
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
   FinalYear memanggilnya di tiap mount. Jadi /ujian -> /ujian/2026 -> balik = tiga
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
function YearCard({year,p}){const d=finalData[year],selesai=parts.filter(n=>p[n]).length,benar=Object.values(p).reduce((a,x)=>a+(x.best||0),0);return <Link className="finalYearCard" to={`/ujian/${year}`}><b>{year}</b><strong>{d.exam}</strong><span>{selesai}/5 bagian</span><small>{selesai?`${benar}/125 benar`:'125 soal'}</small></Link>}
/* Achievement unlimited-100: hitungan jawaban persist di localStorage, dilaporkan
   ke server (whitelist CLIENT_REPORTABLE) tepat saat menyentuh 100. */
const UNLIM_KEY='kk_unlimited_count';
const readUnlim=()=>{try{return Number(localStorage.getItem(UNLIM_KEY))||0}catch{return 0}};
/* Kolam latihan = SELURUH 750 soal enam sesi, bukan cuma 2026 seperti dulu. Urutannya
   diacak sekali per kunjungan (Math.random di useState boleh: ini murni tampilan, tidak
   pernah dinilai server) supaya dua sesi latihan tidak mengulang urutan yang sama. */
const POOL=Object.values(finalData).flatMap(d=>d.questions.map(q=>({...q,year:d.year,exam:d.exam})));
export function UnlimitedFinal(){const [urutan]=useState(()=>{const a=POOL.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a});const [q,setQ]=useState(1),[selected,setSelected]=useState(null),[lang,setLang]=useLangMode(),[count,setCount]=useState(readUnlim);const toast=useAchToast();const item=urutan[(q-1)%urutan.length];
const choose=k=>{if(selected!==null)return;setSelected(k);const c=count+1;setCount(c);try{localStorage.setItem(UNLIM_KEY,String(c))}catch{}if(c===100)fetch('/api/achievements',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({ids:['unlimited-100']})}).then(r=>r.json()).then(d=>toast(d.newAchievements)).catch(()=>{});};
return <main className="page finalPage unlimitedFinal"><Link to="/ujian" className="back">← Ujian Akhir</Link><div className="unlimitedHero"><p className="eyebrow">UNLIMITED PRACTICE</p><h1>Latihan tanpa batas</h1><p className="muted">Soal terus berputar. Tidak memengaruhi skor resmi, XP, atau progress ujian.</p><span className="quizModeBadge">{count>=100?'Maraton 100 selesai ➤✦':`${count}/100 soal — maraton`}</span></div><LangPicker lang={lang} setLang={setLang}/><section className="finalQuestion"><small>Soal latihan #{q} · {item.exam} 問題{item.no} · {item.subject}</small><Furigana field={item.prompt} mode={lang} as="h2"/>{item.image&&<img className="finalQFigure" src={`/assets/final/${item.image}`} alt="図"/>}<div className="finalOptions">{item.options.map(o=><button className={selected===o.key?'selected':''} key={o.key} onClick={()=>choose(o.key)}><b>{o.key}</b><Furigana field={o.text} mode={lang} variant="opt"/></button>)}</div>{selected&&<div className="finalFeedback">{isCorrectAnswer(item,selected)?'Benar ✦':'Coba lagi ya'}<br/>{item.explanation.id}</div>}</section><button className="primary big" onClick={()=>{setQ(q+1);setSelected(null)}}>Soal berikutnya <ChevronRight/></button></main>}
/* Dua pintu masuk yang setara di beranda ujian: LATIHAN BEBAS (acak, tanpa skor) dan
   ujian per tahun. Dulu latihan cuma pita tipis di atas grid tahun dan nyaris tak
   terbaca sebagai tombol — sekarang keduanya kartu aksi, latihan yang berwarna aksen
   karena itulah yang dipakai sehari-hari; ujian per tahun menyusul di bawahnya. */
export function FinalHome(){const [prog,setProg]=useState(getProgress);useEffect(()=>{ensureProgress().then(()=>{setProg({...getProgress()});if(!localStorage.getItem('kk_final_merged')){mergeLocalToServer();try{localStorage.setItem('kk_final_merged','1')}catch{}}});},[]);
  const bagianSelesai=years.reduce((a,y)=>a+parts.filter(n=>prog[y]?.[n]).length,0);
  return <main className="page finalPage"><Link to="/belajar" className="back">← Belajar</Link>
    <div className="finalHero"><p className="eyebrow">SIMULASI UJIAN</p><h1>Ujian Akhir</h1><p className="muted">Soal asli ujian nasional 介護福祉士 tahun 2021–2026, lengkap 125 butir tiap tahun.</p></div>
    <div className="examActions">
      <Link className="examAction examActionMain tap" to="/ujian/latihan"><span className="examActionIcon">✿</span><span className="examActionBody"><b>Latihan bebas</b><small>Soal acak, langsung ada penjelasan. Tidak memengaruhi skor.</small></span><ChevronRight size={20}/></Link>
      <a className="examAction tap" href="#tahun"><span className="examActionIcon">✓</span><span className="examActionBody"><b>Kerjakan per tahun</b><small>{bagianSelesai?`${bagianSelesai}/30 bagian sudah dikerjakan`:'125 soal dibagi 5 bagian, progres tersimpan'}</small></span><ChevronRight size={20}/></a>
    </div>
    <h2 className="examYearHead" id="tahun">Pilih tahun ujian</h2>
    <div className="finalYearGrid">{years.map(y=><YearCard key={y} year={y} p={prog[y]||{}}/>)}</div></main>}
/* Mode dipilih DI SINI, sebelum mengerjakan — bukan lagi lewat <select> kecil di dalam
   quiz yang baru ketahuan setelah soal pertama tampil. Pilihannya disimpan lokal
   (kk_final_mode) DAN dikirim ke server (pref_final_mode) supaya ikut di perangkat lain. */
export function FinalYear(){const {year}=useParams(),y=Number(year),d=finalData[y];const [p,setP]=useState(()=>getProgress()[y]||{});const [mode,setMode]=useState(()=>{try{return localStorage.getItem('kk_final_mode')||'practice'}catch{return 'practice'}});useEffect(()=>{ensureProgress().then(()=>setP({...(getProgress()[y]||{})}));},[y]);
  const pilihMode=m=>{setMode(m);try{localStorage.setItem('kk_final_mode',m)}catch{};fetch('/api/final',{method:'PATCH',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({mode:m})}).catch(()=>{})};
  if(!d)return <main className="page"><h1>Tahun tidak ditemukan</h1><Link to="/ujian">Kembali</Link></main>;
  const benar=Object.values(p).reduce((a,x)=>a+(x.best||0),0);
  return <main className="page finalPage"><Link to="/ujian" className="back">← Semua tahun</Link><h1>{y} · {d.exam}</h1><p className="muted">{benar}/125 terbaik · ujian {new Date(d.examDate).toLocaleDateString('id-ID',{day:'numeric',month:'long',year:'numeric'})}</p>
    <div className="examModePick">
      <p className="examModeLabel">Mode pengerjaan</p>
      <div className="examModeRow">
        <button type="button" className={mode==='practice'?'examModeBtn on tap':'examModeBtn tap'} aria-pressed={mode==='practice'} onClick={()=>pilihMode('practice')}><b>Mode Latihan</b><small>Penjelasan muncul tiap kali menjawab</small></button>
        <button type="button" className={mode==='exam'?'examModeBtn on tap':'examModeBtn tap'} aria-pressed={mode==='exam'} onClick={()=>pilihMode('exam')}><b>Mode Ujian</b><small>Tanpa petunjuk sampai bagian dikirim</small></button>
      </div>
    </div>
    <div className="finalParts">{parts.map(part=>{const from=(part-1)*25+1,to=part*25,x=p[part];return <Link key={part} to={`/ujian/${y}/bagian/${part}`} className="finalPart"><b>Bagian {part}</b><span>soal {from}–{to}</span><small>{x?`${x.best}/25`:'Belum dikerjakan'}</small></Link>})}</div>
    <p className="examModeHint">{mode==='practice'?'Mode Latihan aktif — begitu kamu memilih jawaban, benar/salah dan penjelasannya langsung muncul di bawah soal. Cocok untuk belajar sambil memahami alasannya.':'Mode Ujian aktif — tidak ada petunjuk benar atau salah sampai seluruh bagian kamu kirim, persis seperti ujian sungguhan. Ganti ke Mode Latihan kalau ingin penjelasan langsung.'}</p>
  </main>}
// `ok` wajib: slice() nerima indeks negatif & non-integer, jadi tanpa cek ini /ujian/2021/bagian/-1
// nyajikan soal 76-100 dengan label "Bagian -1", dan part/1.5 nyajikan soal 13-37 (nyeberang dua
// bagian). Number.isInteger sekaligus nolak NaN, jadi param non-numerik ikut ketangkep.
export function FinalQuiz(){const {year,part}=useParams(),y=Number(year),n=Number(part),d=finalData[y],ok=Number.isInteger(n)&&n>=1&&n<=parts.length,qs=ok?(d?.questions?.slice((n-1)*25,n*25)||[]):[],nav=useNavigate();const mode=(()=>{try{return localStorage.getItem('kk_final_mode')||'practice'}catch{return 'practice'}})(),[lang,setLang]=useLangMode(),[answers,setAnswers]=useState({}),[qi,setQi]=useState(0),[attemptId,setAttemptId]=useState(uuid),[submitErr,setSubmitErr]=useState(null);const q=qs[qi];if(!d||!qs.length)return <main className="page"><h1>Soal belum tersedia</h1></main>;const choose=k=>setAnswers(a=>({...a,[q.no]:k}));
/* Submit server-first: jawaban dikirim mentah, skor dihitung ulang di server dari
   bank soal deterministik. Gagal jaringan → simpan lokal (saved:false) lalu tetap
   lanjut ke Result; entri itu direplay otomatis saat Result terbuka lagi online.
   Gagal 400 (selain UUID usang) → banner error TANPA pindah halaman, retry idempoten
   dengan attemptId yang sama. */
const submit=async()=>{setSubmitErr(null);const answered=Object.keys(answers).length;try{const r=await fetch('/api/final',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({year:y,part:n,mode,answers,attemptId})});if(r.status===400){const b=await r.json().catch(()=>({}));if(b.message==='attemptId must be a UUID'){setAttemptId(uuid());return}setSubmitErr(b.message||'Submit ditolak server.');return}if(!r.ok){setSubmitErr('Gagal menyimpan progress. Coba lagi.');return}const b=await r.json();const all=readProgress();all[y]={...(all[y]||{}),[n]:{best:b.best,answered,answers,mode}};saveProgress(all);cache[y]={...(cache[y]||{}),[n]:{best:b.best,answered,answers,mode,saved:true,review:b.review}};nav(`/ujian/${year}/bagian/${part}/hasil`)}catch{savePart(y,n,{best:qs.reduce((a,x)=>a+(answers[x.no]!==undefined&&isCorrectAnswer(x,answers[x.no])?1:0),0),answered,answers,mode});nav(`/ujian/${year}/bagian/${part}/hasil`)}};
return <main className="page finalQuiz"><div className="finalQuizTop"><Link to={`/ujian/${year}`}>× Tutup</Link><span>問題 {q.no} · {qi+1}/25</span><span className={mode==='practice'?'quizModeTag quizModeTagPractice':'quizModeTag'}>{mode==='practice'?'Latihan':'Ujian'}</span></div><LangPicker lang={lang} setLang={setLang}/><div className="finalQuestion"><Furigana field={q.prompt} mode={lang} as="h2"/>{q.image&&<img className="finalQFigure" src={`/assets/final/${q.image}`} alt="図"/>}<div className="finalOptions">{q.options.map(o=><button className={answers[q.no]===o.key?'selected':''} key={o.key} onClick={()=>choose(o.key)}><b>{o.key}</b><Furigana field={o.text} mode={lang} variant="opt"/></button>)}</div>{mode==='practice'&&answers[q.no]&&<div className="finalFeedback">{isCorrectAnswer(q,answers[q.no])?'Benar':'Cek lagi'} — {q.explanation.id}</div>}</div>{submitErr&&<div className="submitError">{submitErr}</div>}<div className="finalQuizNav"><button disabled={qi===0} onClick={()=>setQi(qi-1)}>Sebelumnya</button>{qi<24?<button onClick={()=>setQi(qi+1)}>Berikutnya</button>:<button onClick={submit}>Kirim bagian</button>}</div></main>}
/* Review per soal. Sumber utama: field `review` dari /api/final (server yang
   merekonstruksi kuncinya). Fallback lokal dipakai HANYA saat entri belum diakui
   server (jalur offline) — kunci ujian memang ikut terbundel di klien karena
   soalnya deterministik, jadi menyembunyikan jawaban benar di sini adalah pilihan
   BELAJAR, bukan pengamanan: tujuannya user mengerjakan ulang, bukan menyontek
   dari layar hasil. */
function localReview(y,n,answers){const qs=finalData[y]?.questions?.slice((n-1)*25,n*25)||[];return qs.map(q=>{const c=answers?.[q.no]??answers?.[String(q.no)]??null;return {no:q.no,chosen:c||null,correct:!!c&&isCorrectAnswer(q,c)};});}

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

export function FinalResult(){const {year,part}=useParams(),y=Number(year),n=Number(part);const [p,setP]=useState(null);useEffect(()=>{if(!finalData[y]||!Number.isInteger(n)||n<1||n>parts.length)return;loadPart(y,n).then(e=>{if(e&&!e.saved&&e.answers){savePart(y,n,{best:e.best||0,answered:e.answered||0,answers:e.answers,mode:e.mode});e={...e,saved:true}}setP(e||{});});},[y,n]);if(!finalData[y]||!Number.isInteger(n)||n<1||n>parts.length)return <main className="page"><h1>Hasil tidak ditemukan</h1><Link to="/ujian">Kembali</Link></main>;
  const review=p?.review?.length?p.review:(p&&p.answers?localReview(y,n,p.answers):null);
  return <main className="page finalPage"><p className="eyebrow">HASIL BAGIAN {n}</p>{p===null?<p className="muted">Memuat hasil…</p>:<><h1>{p?.best||0} / 25</h1><p className="muted">Jawaban tersimpan di akunmu.</p></>}
    {review&&<ReviewList review={review}/>}
    <div className="finalResultNav"><Link className="secondary big tap" to={`/ujian/${y}/bagian/${n}`}>Kerjakan ulang</Link><Link className="primary big tap" to={`/ujian/${y}`}>Kembali ke tahun {y}</Link></div>
  </main>}
