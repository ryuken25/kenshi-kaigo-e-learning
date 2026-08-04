import React,{useEffect,useMemo,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {BrowserRouter,Routes,Route,Link,useNavigate,useParams,useLocation,Navigate} from 'react-router-dom';
import {Heart,Lock,ChevronRight,BookOpen,Flame,UserRound,Star,Check,X,Volume2,Info,Menu,Home as HomeIcon,Languages,ArrowLeft,SkipForward,RotateCcw,Shuffle,Sparkles} from 'lucide-react';
import {sections,getSection,getLevel,glossary,allQuestions,randomQuestion} from './data.js';
import Login from './Login.jsx';
import {AuthProvider, useAuth} from './context/AuthContext.jsx';
import {ProgressProvider, useProgress, readGuestProgress} from './context/ProgressContext.jsx';
import './styles.css';import './translation.css';import './routing.css';import './auth.css';

const ASSET = p=>`/assets/hellokitty/${p}`;
const MASCOT_MAP = {
  home:ASSET('hk-illustration-1.png'),
  level:ASSET('hk-desktop-art.png'),
  materi:ASSET('hk-sticker-flower.png'),
  recap:ASSET('hk-birthday-camera.png'),
  perfect:ASSET('hk-balloons.png'),
  good:ASSET('hk-sticker-flower.png'),
  welcome:ASSET('hk-cute-emoji.png'),
  profile:ASSET('hk-illustration-1.png'),
  login:ASSET('hk-cute-emoji.png'),
  practice:ASSET('hk-cute-emoji.png'),
};

function Mascot({variant='home',size='md',className=''}){
  const src = MASCOT_MAP[variant]||MASCOT_MAP.home;
  return <div className={`mascotImg size-${size} ${className}`} aria-label="Hello Kitty mascot">
    <img src={src} alt="Hello Kitty" loading="lazy"/>
    <span className="sparkle s1">✨</span>
    <span className="sparkle s2">🎀</span>
  </div>;
}

function Confetti(){
  const pieces = useMemo(()=>Array.from({length:26},(_,i)=>({id:i,left:Math.random()*100,delay:(Math.random()*0.7).toFixed(2),emoji:['🎀','✨','💗','⭐','🌸','🩷'][i%6]})),[]);
  return <div className="confettiLayer" aria-hidden="true">{pieces.map(p=><i key={p.id} style={{left:`${p.left}%`,animationDelay:`${p.delay}s`}}>{p.emoji}</i>)}</div>;
}

function KawaiiLoader({label='Memuat…'}){
  return <div className="kawaiiLoader"><span className="loaderBow">🎀</span><p>{label}</p></div>;
}

function Shell({children}){
  const loc=useLocation();
  const {isAuthenticated, loading, streakCurrent, totalXp} = useProgress();
  const {status} = useAuth();
  return <div className="app">
    <header>
      <Link to="/" className="brand"><div className="kitty"><img src={ASSET('hk-face-icon.png')} alt="Kaigo Kitty"/></div><div><b>kaigo kitty</b><small>learn with care</small></div></Link>
      <div className="topStats">
        <span><Flame size={16} fill="#ff718f"/> {loading && status==='authenticated' ? '…' : streakCurrent}</span>
        <span><Heart size={16} fill="#ff718f"/> {loading && status==='authenticated' ? '…' : totalXp} XP</span>
        <Link to={isAuthenticated?'/profile':'/login'}><UserRound size={19}/></Link>
      </div>
    </header>
    {children}
    <nav>
      <Link className={loc.pathname==='/'?'active':''} to="/"><HomeIcon/><span>Home</span></Link>
      <Link className={loc.pathname==='/practice'?'active':''} to="/practice"><Shuffle/><span>Latihan</span></Link>
      <Link className={loc.pathname.startsWith('/glossary')?'active':''} to="/glossary"><Languages/><span>Glossary</span></Link>
      <Link className={loc.pathname==='/profile'?'active':''} to="/profile"><UserRound/><span>Profile</span></Link>
    </nav>
  </div>;
}

function useSectionUnlockMap(){
  const {isAuthenticated, serverProgress, guestProgress} = useProgress();
  return useMemo(()=>{
    if(isAuthenticated && serverProgress){
      const map = {};
      for(const s of serverProgress.sections){
        map[s.sectionId] = { official: s.sectionUnlockedOfficially, completedLevels: s.completedLevels, levels: s.levels };
      }
      return map;
    }
    // guest fallback from localStorage — section/level tetap selalu bisa dibuka, cuma status "official" beda.
    const done = guestProgress.done || {};
    const map = {};
    sections.forEach((s,i)=>{
      const completedLevels = s.levels.filter(l=>done[`${s.id}-${l.id}`]).length;
      const prevSectionSomeDone = i===0 || (sections[i-1] && sections[i-1].levels.some(l=>done[`${sections[i-1].id}-${l.id}`]));
      map[s.id] = { official: i===0 || completedLevels>0 || prevSectionSomeDone, completedLevels, levels:null };
    });
    return map;
  },[isAuthenticated, serverProgress, guestProgress]);
}

function Home(){
  const {isAuthenticated, guestProgress, totalXp, completedCount, loading} = useProgress();
  const unlockMap = useSectionUnlockMap();
  const totalLevels = sections.reduce((a,s)=>a+s.levelCount,0);
  if(loading) return <main><KawaiiLoader label="Menyiapkan learning path…"/></main>;
  return <main><section className="welcome"><div><p className="eyebrow">OHAYŌ, KENSHI 🌷</p><h1>Belajar merawat<br/><em>dengan hati.</em></h1><p className="muted">13 section · {totalLevels} level · pelan-pelan sampai mahir.</p></div><Mascot variant="home" size="md"/></section>
    <div className="daily"><div><b>Daily care</b><p>Setiap kartu kecil membuatmu lebih dekat.</p><div className="progress"><i style={{width:`${Math.min(100,(completedCount/totalLevels)*100)}%`}}/></div></div><span className="badge">{completedCount} done</span></div>
    {!isAuthenticated && <div className="objective" style={{marginBottom:12}}><Info/><div><b>Progress kamu belum tersimpan permanen</b><p>Login pakai email biar XP & streak-nya kesimpen selamanya. <Link to="/login">Login sekarang</Link></p></div></div>}
    <div className="sectionHead"><div><h2>Learning path</h2><p>Dari fondasi sampai case study ✨</p></div><button className="round"><Menu size={19}/></button></div>
    <div className="sectionGrid">{sections.map((s)=><SectionCard key={s.id} section={s} official={unlockMap[s.id]?.official ?? (s.id===1)} completedLevels={unlockMap[s.id]?.completedLevels||0}/>)}</div>
  </main>;
}

function SectionCard({section,official,completedLevels}){
  return <Link to={`/section/${section.id}`} className={`sectionCard tap ${!official?'preview-only':''}`}>
    {!official && <span className="previewPill"><Lock size={10}/> preview</span>}
    <div className="sectionIcon">{section.icon}</div>
    <div className="sectionCopy"><small>SECTION {String(section.id).padStart(2,'0')}</small><b>{section.titleJa}</b><span>{section.titleId}</span><div className="miniProgress"><i style={{width:`${completedLevels/section.levelCount*100}%`}}/></div><em>{completedLevels}/{section.levelCount} levels</em></div>
    <ChevronRight/>
  </Link>;
}

function SectionOverview(){
  const {sectionId}=useParams();const s=getSection(sectionId);
  const {isAuthenticated, guestProgress} = useProgress();
  const unlockMap = useSectionUnlockMap();
  if(!s)return <Navigate to="/"/>;
  const sectionInfo = unlockMap[s.id];
  const serverLevels = sectionInfo?.levels;
  const sectionOfficial = sectionInfo?.official ?? (s.id===1);
  const done = guestProgress.done || {};
  return <main className="page"><Link to="/" className="back"><ArrowLeft size={16}/> Learning path</Link>
    <div className="sectionHero"><span>{s.icon}</span><div><small>SECTION {s.id}</small><h1>{s.titleJa}</h1><p>{s.titleId}</p></div></div>
    <p className="muted">{s.description}</p>
    {!sectionOfficial && <div className="previewBanner"><Lock size={16}/><span>Section ini belum resmi terbuka — kamu tetap bisa preview materi & coba quiz, tapi progress tidak dihitung completed sampai section sebelumnya selesai.</span></div>}
    <div className="recapLink"><Link to={`/section/${s.id}/recap`}><Star fill="#ffb73b"/> Section recap <span>{s.levelCount} level review</span><ChevronRight/></Link></div>
    <div className="levelList">{s.levels.map((l,i)=>{
      let levelUnlocked, completed;
      if(isAuthenticated && serverLevels){
        const lv = serverLevels.find(x=>x.levelId===l.id);
        levelUnlocked = lv?.levelUnlocked ?? (l.id===1);
        completed = lv?.status==='completed';
      } else {
        const prevDone = i===0 || Boolean(done[`${s.id}-${i}`]);
        levelUnlocked = sectionOfficial && prevDone;
        completed = Boolean(done[`${s.id}-${l.id}`]);
      }
      const previewOnly = !levelUnlocked && !completed;
      return <Link key={l.id} className={`levelRow tap ${previewOnly?'preview-only':''} ${completed?'completed':''}`} to={`/section/${s.id}/level/${l.id}`}>
        {previewOnly && <span className="lockBadge"><Lock size={13}/></span>}
        <div className="levelNum">{completed?<Check/>:l.id}</div>
        <div><small>LEVEL {l.id}</small><b>{l.titleJa}</b><span>{l.titleId}</span></div>
        <ChevronRight/>
      </Link>;
    })}</div>
  </main>;
}

function LevelHub(){
  const {sectionId,levelId}=useParams();const s=getSection(sectionId),l=getLevel(sectionId,levelId);
  const unlockMap = useSectionUnlockMap();
  const {isAuthenticated} = useProgress();
  if(!s||!l)return <Navigate to="/"/>;
  const sectionInfo = unlockMap[s.id];
  const lv = sectionInfo?.levels?.find(x=>x.levelId===l.id);
  const levelUnlocked = isAuthenticated ? (lv?.levelUnlocked ?? (l.id===1)) : true;
  return <main className="page"><Link to={`/section/${s.id}`} className="back"><ArrowLeft size={16}/> {s.titleJa}</Link>
    <div className="levelHero"><Mascot variant="level" size="md"/><div><small>LEVEL {l.id}</small><h1>{l.titleJa}</h1><p>{l.titleId}</p></div></div>
    {!levelUnlocked && <div className="previewBanner"><Lock size={16}/><span>Level ini belum resmi terbuka. Kamu tetap bisa coba — tapi XP-nya kecil & belum dihitung completed resmi.</span></div>}
    <div className="objective"><Info/><div><b>今日の目標</b><p>{l.objectiveId}</p></div></div>
    <div className="flowButtons"><Link className="primary big tap" to={`/section/${s.id}/level/${l.id}/materi`}><BookOpen/> Baca materi dulu <ChevronRight/></Link><Link className="secondary big tap" to={`/section/${s.id}/level/${l.id}/quiz`}><Star/> Langsung quiz <ChevronRight/></Link></div>
    <div className="preview"><b>{l.materi.length} kartu materi · {l.questions.length} soal</b><p>Materi bisa di-next atau langsung di-skip kapan saja.</p></div>
  </main>;
}

function Materi(){
  const {sectionId,levelId}=useParams();const s=getSection(sectionId),l=getLevel(sectionId,levelId);const [i,setI]=useState(0);const nav=useNavigate();const card=l?.materi[i];
  if(!s||!l)return <Navigate to="/"/>;
  return <main className="page materiPage"><div className="quizTop"><Link to={`/section/${s.id}/level/${l.id}`} className="back">× Tutup</Link><span>MATERI {i+1}/{l.materi.length}</span></div><div className="quizProgress"><i style={{width:`${(i+1)/l.materi.length*100}%`}}/></div><div className="materiCard"><Mascot variant="materi" size="sm"/><small>MINI LESSON</small><h1>{card.titleJa}</h1><h2>{card.titleId}</h2><p className="japanese">{card.bodyJa}</p><div className="translation">{card.bodyId}</div>{card.terms.length>0&&<div className="terms">{card.terms.map(t=><Link key={t} to={`/glossary?term=${encodeURIComponent(t)}`}>#{t}</Link>)}</div>}</div><div className="materiActions"><button className="secondary tap" onClick={()=>nav(`/section/${s.id}/level/${l.id}/quiz`)}><SkipForward/> Skip to quiz</button><button className="primary tap" onClick={()=>i<l.materi.length-1?setI(i+1):nav(`/section/${s.id}/level/${l.id}/quiz`)}>{i<l.materi.length-1?'Next card':'Mulai quiz'} <ChevronRight/></button></div></main>;
}

/* ---------- shared quiz pieces (dipakai Quiz level & Practice) ---------- */

function QuestionFlipCard({q}){
  const [flipped,setFlipped]=useState(false);
  return <div className={`flipCard tap ${flipped?'flipped':''}`} onClick={()=>setFlipped(f=>!f)} key={q.id}>
    <div className="flipCardInner">
      <div className="flipFace front">
        <p className="source">{q.sourceYear} · {q.difficulty}</p>
        <h1>{q.questionJa}</h1>
        <span className="flipHint"><Languages size={12}/> Tap buat translate</span>
      </div>
      <div className="flipFace back">
        <small>INDONESIA</small>
        <p>{q.questionId}</p>
      </div>
    </div>
  </div>;
}

function ChoiceCard({choice,choiceId,index,selected,correctIndex,onAnswer}){
  const [flipped,setFlipped]=useState(false);
  const answered = selected!==null;
  const isCorrect = answered && index===correctIndex;
  const isWrong = answered && index===selected && index!==correctIndex;
  return <div className={`choiceFlip ${flipped?'flipped':''} ${answered?'answered':''} ${isCorrect?'isCorrect':''} ${isWrong?'isWrong':''}`}>
    <div className="choiceFlipInner">
      <div className="choiceFace front tap" onClick={()=>onAnswer(index)}>
        <div className="choiceRow">
          <span>{choice}</span>
          {!answered && <button className="choiceMini" onClick={e=>{e.stopPropagation();setFlipped(true);}} aria-label="Lihat terjemahan"><Languages size={13}/></button>}
          {isCorrect && <Check className="checkIcon" size={18}/>}
          {isWrong && <X className="xIcon" size={18}/>}
        </div>
      </div>
      <div className="choiceFace back tap" onClick={()=>setFlipped(false)}>
        <div className="choiceRow"><span>{choiceId}</span><button className="choiceMini" onClick={e=>{e.stopPropagation();setFlipped(false);}} aria-label="Kembali"><Languages size={13}/></button></div>
      </div>
    </div>
  </div>;
}

function ExplanationBox({q}){
  const [lang,setLang]=useState('both');
  return <div className="explainBox">
    <div className="explainHead"><Info size={16}/> Kenapa jawaban ini benar?</div>
    <div className="explainLangToggle">
      <button className={lang==='both'?'active':''} onClick={()=>setLang('both')}>両方 Keduanya</button>
      <button className={lang==='ja'?'active':''} onClick={()=>setLang('ja')}>日本語</button>
      <button className={lang==='id'?'active':''} onClick={()=>setLang('id')}>Indonesia</button>
    </div>
    {(lang==='both'||lang==='ja') && <p className="ja">{q.explanationJa}</p>}
    {(lang==='both'||lang==='id') && <p>{q.explanationId}</p>}
  </div>;
}

/* ---------- Quiz (level mode, dengan retry round + preview handling) ---------- */

function Quiz(){
  const {sectionId,levelId}=useParams();const s=getSection(sectionId),l=getLevel(sectionId,levelId);
  const [phase,setPhase]=useState('main');
  const [roundQuestions,setRoundQuestions]=useState(()=>l?.questions||[]);
  const [qi,setQi]=useState(0);
  const [selected,setSelected]=useState(null);
  const [correctFirstTry,setCorrectFirstTry]=useState(()=>new Set());
  const [wrongThisRound,setWrongThisRound]=useState([]);
  const [retryRound,setRetryRound]=useState(0);
  const [saving,setSaving]=useState(false);
  const nav=useNavigate();
  const {submitAttempt} = useProgress();
  const [startedAt] = useState(()=>Date.now());
  const [attemptId] = useState(()=>crypto.randomUUID ? crypto.randomUUID() : `a-${Date.now()}-${Math.random().toString(16).slice(2)}`);
  if(!s||!l)return <Navigate to="/"/>;
  const totalCount = l.questions.length;
  const q = roundQuestions[qi];
  if(!q) return <KawaiiLoader/>;

  const answer=(i)=>{
    if(selected!==null) return;
    setSelected(i);
    const isCorrect = i===q.correctIndex;
    if(phase==='main' && isCorrect) setCorrectFirstTry(prev=>new Set(prev).add(q.id));
    if(!isCorrect) setWrongThisRound(prev=>[...prev, q]);
  };

  const doSubmit = async ()=>{
    setSaving(true);
    const correctCount = correctFirstTry.size;
    const scorePercent = Math.round((correctCount/totalCount)*100);
    const durationMs = Date.now()-startedAt;
    const result = await submitAttempt({sectionId:s.id, levelId:l.id, correctCount, totalCount, score:scorePercent, durationMs, attemptId});
    setSaving(false);
    const xpDelta = result?.data?.xpDelta ?? (correctCount*10+30);
    const isPreview = Boolean(result?.data?.isPreview);
    nav(`/section/${s.id}/level/${l.id}/result`,{state:{score:correctCount,total:totalCount,xpDelta,isPreview}});
  };

  const isLastInRound = qi===roundQuestions.length-1;
  const next=()=>{
    if(!isLastInRound){ setQi(x=>x+1); setSelected(null); return; }
    if(wrongThisRound.length>0){
      setRoundQuestions(wrongThisRound);
      setWrongThisRound([]);
      setQi(0);
      setSelected(null);
      setPhase('retry');
      setRetryRound(r=>r+1);
    } else {
      doSubmit();
    }
  };

  const nextLabel = saving ? 'Menyimpan…' : !isLastInRound ? 'Lanjut' : (wrongThisRound.length>0 ? 'Ulangi soal yang salah ↻' : 'Selesai');

  return <main className="page quizPage">
    <div className="quizTop"><Link to={`/section/${s.id}/level/${l.id}`} className="back">‹ Exit</Link><span>{phase==='retry'?'RETRY · ':''}{qi+1} / {roundQuestions.length}</span></div>
    <div className="quizProgress"><i style={{width:`${(qi+1)/roundQuestions.length*100}%`}}/></div>
    {phase==='retry' && <div className="retryBanner"><RotateCcw/><div><b>Yuk ulangi soal yang belum tepat!</b><span>Ronde retry #{retryRound} · {roundQuestions.length} soal tersisa</span></div><div className="retryDots">{roundQuestions.map((rq,idx)=><i key={rq.id+idx} className={idx<qi?'done':''}/>)}</div></div>}
    <QuestionFlipCard q={q} key={`qc-${q.id}-${phase}-${qi}`}/>
    <button className="listen tap"><Volume2 size={17}/> 用語を聞く · Dengarkan istilah</button>
    <div className="choices">{q.choices.map((c,i)=><ChoiceCard key={`${q.id}-${i}-${phase}-${qi}`} choice={c} choiceId={q.choiceIds?.[i]||''} index={i} selected={selected} correctIndex={q.correctIndex} onAnswer={answer}/>)}</div>
    {selected!==null && <ExplanationBox q={q}/>}
    <div className="quizFooter"><button className="primary big tap" disabled={selected===null||saving} onClick={next}>{nextLabel} <ChevronRight/></button></div>
  </main>;
}

/* ---------- Practice / Latihan — unlimited random dari semua section ---------- */

function Practice(){
  const [q,setQ]=useState(()=>randomQuestion());
  const [selected,setSelected]=useState(null);
  const [answered,setAnswered]=useState(0);
  const [correct,setCorrect]=useState(0);
  const answer=(i)=>{
    if(selected!==null) return;
    setSelected(i);
    setAnswered(a=>a+1);
    if(i===q.correctIndex) setCorrect(c=>c+1);
  };
  const nextQuestion=()=>{ setQ(randomQuestion(q.id)); setSelected(null); };
  return <main className="page quizPage">
    <div className="practiceHero">
      <Mascot variant="practice" size="sm"/>
      <span className="quizModeBadge"><Shuffle size={12}/> Practice · unlimited</span>
      <p className="muted">Soal acak dari semua section — {answered} dijawab, {correct} benar. XP tidak resmi & tidak memengaruhi unlock.</p>
    </div>
    <div className="quizTop"><span>{q.sectionTitleId} · {q.levelTitleId}</span></div>
    <QuestionFlipCard q={q} key={`pq-${q.id}`}/>
    <div className="choices">{q.choices.map((c,i)=><ChoiceCard key={`${q.id}-${i}`} choice={c} choiceId={q.choiceIds?.[i]||''} index={i} selected={selected} correctIndex={q.correctIndex} onAnswer={answer}/>)}</div>
    {selected!==null && <ExplanationBox q={q}/>}
    <div className="quizFooter"><button className="primary big tap" disabled={selected===null} onClick={nextQuestion}>Soal berikutnya <ChevronRight/></button></div>
  </main>;
}

function Result(){
  const {sectionId,levelId}=useParams();const {state}=useLocation();const s=getSection(sectionId),l=getLevel(sectionId,levelId);
  const xp = state?.xpDelta ?? ((state?.score||0)*10+30);
  const isPerfect = state?.score===state?.total;
  const isPreview = Boolean(state?.isPreview);
  return <main className="page result">
    {isPerfect && !isPreview && <Confetti/>}
    <Mascot variant={isPerfect?'perfect':'good'} size="lg"/>
    <p className="eyebrow">{isPreview?'PREVIEW ATTEMPT':'LEVEL COMPLETE ✨'}</p>
    <h1>{state?.score||0} / {state?.total||5}</h1>
    <p className="muted">{isPreview?'Latihan preview — belum resmi completed sampai prasyarat sebelumnya selesai.':(isPerfect?'完璧！Perfect!':'Bagus, terus latihan sedikit lagi.')}</p>
    <div className="resultStats"><b>+{xp} XP</b><span>Materi: {l?.titleId}</span></div>
    <div className="flowButtons"><Link className="primary big tap" to={Number(levelId)<s.levelCount?`/section/${s.id}/level/${Number(levelId)+1}`:`/section/${s.id}/recap`}>Level berikutnya <ChevronRight/></Link><Link className="secondary big tap" to={`/section/${s.id}/level/${levelId}/quiz`}><RotateCcw/> Ulangi</Link></div>
  </main>;
}

function Recap(){const {sectionId}=useParams(),s=getSection(sectionId);if(!s)return <Navigate to="/"/>;return <main className="page result"><div className="sectionHero"><span>{s.icon}</span><div><small>RECAP</small><h1>{s.titleJa}</h1><p>Section review · {s.titleId}</p></div></div><Mascot variant="recap" size="md"/><h2>Ready for a little challenge?</h2><p className="muted">Uji pemahamanmu dengan soal campuran dari semua level.</p><Link className="primary big tap" to={`/section/${s.id}/level/1/quiz`}>Mulai recap <Star/></Link></main>;}

function Glossary(){const [term,setTerm]=useState(new URLSearchParams(useLocation().search).get('term')||'');const list=useMemo(()=>glossary.filter(x=>(x.ja+x.reading+x.id).toLowerCase().includes(term.toLowerCase())),[term]);return <main className="page"><h1 className="pageTitle">Glossary <span>用語カード</span></h1><input className="search" value={term} onChange={e=>setTerm(e.target.value)} placeholder="Cari 尊厳 / dignity..."/>{list.map(x=><a className="glossaryRow" key={x.ja} href="https://ryuken25.github.io/kenshi-kanji-n4/" target="_blank" rel="noreferrer"><div><b>{x.ja}</b><small>{x.reading}</small></div><span>{x.id}</span><ChevronRight/></a>)}</main>;}

function Profile(){
  const {user, isAuthenticated, logout} = useAuth();
  const {serverProgress, guestProgress, totalXp, streakCurrent, completedCount, loading} = useProgress();
  const nav = useNavigate();
  const doLogout = async ()=>{ await logout(); nav('/'); };
  if(loading) return <main className="page profile"><KawaiiLoader label="Memuat profil…"/></main>;
  return <main className="page profile">
    <div className="profileCard">
      <Mascot variant="profile" size="md"/>
      <h1>{isAuthenticated ? `Halo, ${user?.name || user?.email}` : "Kenshi's care journey"}</h1>
      <p className="muted">{isAuthenticated ? 'Progress kamu tersimpan otomatis di akun.' : 'Login biar progress kamu tersimpan permanen.'}</p>
      <div className="stats">
        <div><b>{totalXp}</b><small>total XP</small></div>
        <div><b>{streakCurrent}</b><small>day streak</small></div>
        <div><b>{completedCount}</b><small>levels</small></div>
      </div>
    </div>
    <div className="tip"><Star fill="#ffb73b"/> <span><b>Little reminder</b><br/>Kamu tidak harus sempurna. Konsisten itu cukup.</span></div>
    {isAuthenticated ? (
      <button className="secondary big tap" style={{marginTop:16}} onClick={doLogout}>Logout</button>
    ) : (
      <Link className="primary big tap" style={{marginTop:16}} to="/login">Login dengan email</Link>
    )}
  </main>;
}

function AppShell(){
  return <BrowserRouter><Shell><Routes>
    <Route path="/" element={<Home/>}/>
    <Route path="/login" element={<Login/>}/>
    <Route path="/profile" element={<Profile/>}/>
    <Route path="/glossary" element={<Glossary/>}/>
    <Route path="/practice" element={<Practice/>}/>
    <Route path="/section/:sectionId" element={<SectionOverview/>}/>
    <Route path="/section/:sectionId/recap" element={<Recap/>}/>
    <Route path="/section/:sectionId/level/:levelId" element={<LevelHub/>}/>
    <Route path="/section/:sectionId/level/:levelId/materi" element={<Materi/>}/>
    <Route path="/section/:sectionId/level/:levelId/quiz" element={<Quiz/>}/>
    <Route path="/section/:sectionId/level/:levelId/result" element={<Result/>}/>
    <Route path="*" element={<Navigate to="/"/>}/>
  </Routes></Shell></BrowserRouter>;
}

function App(){
  return <AuthProvider><ProgressProvider><AppShell/></ProgressProvider></AuthProvider>;
}

createRoot(document.getElementById('root')).render(<App/>);
