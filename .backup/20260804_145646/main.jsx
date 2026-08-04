import React,{useEffect,useMemo,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {BrowserRouter,Routes,Route,Link,useNavigate,useParams,useLocation,Navigate} from 'react-router-dom';
import {Heart,Lock,ChevronRight,BookOpen,Flame,UserRound,Star,Check,Volume2,Info,Menu,Home as HomeIcon,Languages,ArrowLeft,SkipForward,RotateCcw} from 'lucide-react';
import {sections,getSection,getLevel,glossary} from './data.js';
import Login from './Login.jsx';
import {AuthProvider, useAuth} from './context/AuthContext.jsx';
import {ProgressProvider, useProgress, readGuestProgress} from './context/ProgressContext.jsx';
import './styles.css';import './translation.css';import './routing.css';import './auth.css';

function Mascot({mood='idle'}){return <div className={`mascot mascot-${mood}`} aria-label="Kenshi-chan original mascot"><span className="catEar left"/><span className="catEar right"/><span className="catFace">{mood==='happy'?'ฅ^•ﻌ•^ฅ':mood==='sad'?'｡°(°´ᯅ`°)°｡':'ฅ^•ﻌ•^ฅ'}</span><span className="bow">🎀</span></div>}

function Shell({children}){
  const loc=useLocation();
  const {isAuthenticated, loading, streakCurrent, totalXp} = useProgress();
  const {status} = useAuth();
  return <div className="app">
    <header>
      <Link to="/" className="brand"><div className="kitty">🎀</div><div><b>kaigo kitty</b><small>learn with care</small></div></Link>
      <div className="topStats">
        <span><Flame size={18} fill="#ff718f"/> {loading && status==='authenticated' ? '…' : streakCurrent}</span>
        <span><Heart size={18} fill="#ff718f"/> {loading && status==='authenticated' ? '…' : totalXp} XP</span>
        <Link to={isAuthenticated?'/profile':'/login'}><UserRound size={20}/></Link>
      </div>
    </header>
    {children}
    <nav>
      <Link className={loc.pathname==='/'?'active':''} to="/"><HomeIcon/><span>Home</span></Link>
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
        map[s.sectionId] = { unlocked: s.unlocked, completedLevels: s.completedLevels, levels: s.levels };
      }
      return map;
    }
    // guest fallback from localStorage
    const done = guestProgress.done || {};
    const map = {};
    sections.forEach((s,i)=>{
      const completedLevels = s.levels.filter(l=>done[`${s.id}-${l.id}`]).length;
      map[s.id] = { unlocked: i===0 || completedLevels>0 || (sections[i-1] && sections[i-1].levels.some(l=>done[`${sections[i-1].id}-${l.id}`])), completedLevels, levels:null };
    });
    return map;
  },[isAuthenticated, serverProgress, guestProgress]);
}

function Home(){
  const {isAuthenticated, serverProgress, guestProgress, totalXp, completedCount} = useProgress();
  const unlockMap = useSectionUnlockMap();
  const totalLevels = sections.reduce((a,s)=>a+s.levelCount,0);
  return <main><section className="welcome"><div><p className="eyebrow">OHAYŌ, KENSHI 🌷</p><h1>Belajar merawat<br/><em>dengan hati.</em></h1><p className="muted">13 section · {totalLevels} level · pelan-pelan sampai mahir.</p></div><Mascot/></section>
    <div className="daily"><div><b>Daily care</b><p>Setiap kartu kecil membuatmu lebih dekat.</p><div className="progress"><i style={{width:`${Math.min(100,(completedCount/totalLevels)*100)}%`}}/></div></div><span className="badge">{completedCount} done</span></div>
    {!isAuthenticated && <div className="objective" style={{marginBottom:12}}><Info/><div><b>Progress kamu belum tersimpan permanen</b><p>Login pakai email biar XP & streak-nya kesimpen selamanya. <Link to="/login">Login sekarang</Link></p></div></div>}
    <div className="sectionHead"><div><h2>Learning path</h2><p>Dari fondasi sampai case study ✨</p></div><button className="round"><Menu size={19}/></button></div>
    <div className="sectionGrid">{sections.map((s)=><SectionCard key={s.id} section={s} locked={!(unlockMap[s.id]?.unlocked)} completedLevels={unlockMap[s.id]?.completedLevels||0}/>)}</div>
  </main>;
}

function SectionCard({section,locked,completedLevels}){
  return <Link to={locked?'#':`/section/${section.id}`} onClick={e=>locked&&e.preventDefault()} className={`sectionCard ${locked?'locked':''}`}><div className="sectionIcon">{locked?<Lock size={22}/>:section.icon}</div><div className="sectionCopy"><small>SECTION {String(section.id).padStart(2,'0')}</small><b>{section.titleJa}</b><span>{section.titleId}</span><div className="miniProgress"><i style={{width:`${completedLevels/section.levelCount*100}%`}}/></div><em>{completedLevels}/{section.levelCount} levels</em></div><ChevronRight/></Link>;
}

function SectionOverview(){
  const {sectionId}=useParams();const s=getSection(sectionId);
  const {isAuthenticated, guestProgress} = useProgress();
  const unlockMap = useSectionUnlockMap();
  if(!s)return <Navigate to="/"/>;
  const sectionInfo = unlockMap[s.id];
  const serverLevels = sectionInfo?.levels;
  const done = guestProgress.done || {};
  return <main className="page"><Link to="/" className="back"><ArrowLeft size={16}/> Learning path</Link>
    <div className="sectionHero"><span>{s.icon}</span><div><small>SECTION {s.id}</small><h1>{s.titleJa}</h1><p>{s.titleId}</p></div></div>
    <p className="muted">{s.description}</p>
    <div className="recapLink"><Link to={`/section/${s.id}/recap`}><Star fill="#ffb73b"/> Section recap <span>{s.levelCount} level review</span><ChevronRight/></Link></div>
    <div className="levelList">{s.levels.map((l,i)=>{
      let locked, completed;
      if(isAuthenticated && serverLevels){
        const lv = serverLevels.find(x=>x.levelId===l.id);
        locked = !lv?.unlocked;
        completed = lv?.status==='completed';
      } else {
        locked = i>0 && !done[`${s.id}-${i}`];
        completed = Boolean(done[`${s.id}-${l.id}`]);
      }
      return <Link key={l.id} className={`levelRow ${locked?'locked':''}`} to={locked?'#':`/section/${s.id}/level/${l.id}`} onClick={e=>locked&&e.preventDefault()}><div className="levelNum">{locked?<Lock size={16}/>:completed?<Check/>:l.id}</div><div><small>LEVEL {l.id}</small><b>{l.titleJa}</b><span>{l.titleId}</span></div><ChevronRight/></Link>;
    })}</div>
  </main>;
}

function LevelHub(){const {sectionId,levelId}=useParams();const s=getSection(sectionId),l=getLevel(sectionId,levelId);if(!s||!l)return <Navigate to="/"/>;return <main className="page"><Link to={`/section/${s.id}`} className="back"><ArrowLeft size={16}/> {s.titleJa}</Link><div className="levelHero"><Mascot/><div><small>LEVEL {l.id}</small><h1>{l.titleJa}</h1><p>{l.titleId}</p></div></div><div className="objective"><Info/><div><b>今日の目標</b><p>{l.objectiveId}</p></div></div><div className="flowButtons"><Link className="primary big" to={`/section/${s.id}/level/${l.id}/materi`}><BookOpen/> Baca materi dulu <ChevronRight/></Link><Link className="secondary big" to={`/section/${s.id}/level/${l.id}/quiz`}><Star/> Langsung quiz <ChevronRight/></Link></div><div className="preview"><b>{l.materi.length} kartu materi · {l.questions.length} soal</b><p>Materi bisa di-next atau langsung di-skip kapan saja.</p></div></main>}

function Materi(){const {sectionId,levelId}=useParams();const s=getSection(sectionId),l=getLevel(sectionId,levelId);const [i,setI]=useState(0);const nav=useNavigate();const card=l?.materi[i];if(!s||!l)return <Navigate to="/"/>;return <main className="page materiPage"><div className="quizTop"><Link to={`/section/${s.id}/level/${l.id}`} className="back">× Tutup</Link><span>MATERI {i+1}/{l.materi.length}</span></div><div className="quizProgress"><i style={{width:`${(i+1)/l.materi.length*100}%`}}/></div><div className="materiCard"><Mascot mood="happy"/><small>MINI LESSON</small><h1>{card.titleJa}</h1><h2>{card.titleId}</h2><p className="japanese">{card.bodyJa}</p><div className="translation">{card.bodyId}</div>{card.terms.length>0&&<div className="terms">{card.terms.map(t=><Link key={t} to={`/glossary?term=${encodeURIComponent(t)}`}>#{t}</Link>)}</div>}</div><div className="materiActions"><button className="secondary" onClick={()=>nav(`/section/${s.id}/level/${l.id}/quiz`)}><SkipForward/> Skip to quiz</button><button className="primary" onClick={()=>i<l.materi.length-1?setI(i+1):nav(`/section/${s.id}/level/${l.id}/quiz`)}>{i<l.materi.length-1?'Next card':'Mulai quiz'} <ChevronRight/></button></div></main>}

function Quiz(){
  const {sectionId,levelId}=useParams();const s=getSection(sectionId),l=getLevel(sectionId,levelId);
  const [qi,setQi]=useState(0),[selected,setSelected]=useState(null),[showId,setShowId]=useState(false),[score,setScore]=useState(0),[saving,setSaving]=useState(false);
  const nav=useNavigate();
  const {submitAttempt} = useProgress();
  const [startedAt] = useState(()=>Date.now());
  const [attemptId] = useState(()=>crypto.randomUUID ? crypto.randomUUID() : `a-${Date.now()}-${Math.random().toString(16).slice(2)}`);
  if(!s||!l)return <Navigate to="/"/>;
  const q=l.questions[qi%l.questions.length];
  const answer=i=>{if(selected!==null)return;setSelected(i);if(i===q.correctIndex)setScore(x=>x+1)};
  const next=async()=>{
    if(qi<4){setQi(x=>x+1);setSelected(null);setShowId(false)}
    else{
      const finalScore=score+(selected===q.correctIndex?1:0);
      setSaving(true);
      const totalCount=5, correctCount=finalScore;
      const scorePercent=Math.round((correctCount/totalCount)*100);
      const durationMs=Date.now()-startedAt;
      const result = await submitAttempt({sectionId:s.id, levelId:l.id, correctCount, totalCount, score:scorePercent, durationMs, attemptId});
      setSaving(false);
      const xpDelta = result?.data?.xpDelta ?? (finalScore*10+30);
      nav(`/section/${s.id}/level/${l.id}/result`,{state:{score:finalScore,total:5,xpDelta}});
    }
  };
  return <main className="page quizPage"><div className="quizTop"><Link to={`/section/${s.id}/level/${l.id}`} className="back">‹ Exit</Link><span>{qi+1} / 5</span></div><div className="quizProgress"><i style={{width:`${(qi+1)*20}%`}}/></div><div className="questionCard"><p className="source">{q.sourceYear} · {q.difficulty}</p><h1>{q.questionJa}</h1><button className="translateToggle" onClick={()=>setShowId(!showId)}>{showId?'Tutup terjemahan':'Klik untuk terjemahan'} <span>{showId?'−':'+'}</span></button>{showId&&<div className="translation">{q.questionId}</div>}<button className="listen"><Volume2 size={17}/> 用語を聞く · Dengarkan istilah</button></div><div className="choices">{q.choices.map((c,i)=><button key={i} onClick={()=>answer(i)} className={selected!==null?(i===q.correctIndex?'correct':(i===selected?'wrong':'')):''}>{c}</button>)}</div><div className="quizFooter"><button className="primary big" disabled={selected===null||saving} onClick={next}>{saving?'Menyimpan…':(qi<4?'Lanjut':'Selesai')} <ChevronRight/></button></div></main>;
}

function Result(){
  const {sectionId,levelId}=useParams();const {state}=useLocation();const s=getSection(sectionId),l=getLevel(sectionId,levelId);
  const xp = state?.xpDelta ?? ((state?.score||0)*10+30);
  return <main className="page result"><Mascot mood={state?.score===state?.total?'happy':'idle'}/><p className="eyebrow">LEVEL COMPLETE ✨</p><h1>{state?.score||0} / {state?.total||5}</h1><p className="muted">{state?.score===state?.total?'完璧！Perfect!':'Bagus, terus latihan sedikit lagi.'}</p><div className="resultStats"><b>+{xp} XP</b><span>Materi: {l?.titleId}</span></div><div className="flowButtons"><Link className="primary big" to={Number(levelId)<s.levelCount?`/section/${s.id}/level/${Number(levelId)+1}`:`/section/${s.id}/recap`}>Level berikutnya <ChevronRight/></Link><Link className="secondary big" to={`/section/${s.id}/level/${levelId}/quiz`}><RotateCcw/> Ulangi</Link></div></main>;
}

function Recap(){const {sectionId}=useParams(),s=getSection(sectionId);if(!s)return <Navigate to="/"/>;return <main className="page result"><div className="sectionHero"><span>{s.icon}</span><div><small>RECAP</small><h1>{s.titleJa}</h1><p>Section review · {s.titleId}</p></div></div><Mascot mood="happy"/><h2>Ready for a little challenge?</h2><p className="muted">Uji pemahamanmu dengan soal campuran dari semua level.</p><Link className="primary big" to={`/section/${s.id}/level/1/quiz`}>Mulai recap <Star/></Link></main>}

function Glossary(){const [term,setTerm]=useState(new URLSearchParams(useLocation().search).get('term')||'');const list=useMemo(()=>glossary.filter(x=>(x.ja+x.reading+x.id).toLowerCase().includes(term.toLowerCase())),[term]);return <main className="page"><h1 className="pageTitle">Glossary <span>用語カード</span></h1><input className="search" value={term} onChange={e=>setTerm(e.target.value)} placeholder="Cari 尊厳 / dignity..."/>{list.map(x=><a className="glossaryRow" key={x.ja} href="https://ryuken25.github.io/kenshi-kanji-n4/" target="_blank" rel="noreferrer"><div><b>{x.ja}</b><small>{x.reading}</small></div><span>{x.id}</span><ChevronRight/></a>)}</main>}

function Profile(){
  const {user, isAuthenticated, logout} = useAuth();
  const {serverProgress, guestProgress, totalXp, streakCurrent, completedCount, loading} = useProgress();
  const nav = useNavigate();
  const doLogout = async ()=>{ await logout(); nav('/'); };
  if(loading) return <main className="page profile"><p className="muted">Memuat data…</p></main>;
  return <main className="page profile">
    <div className="profileCard">
      <Mascot mood="happy"/>
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
      <button className="secondary big" style={{marginTop:16}} onClick={doLogout}>Logout</button>
    ) : (
      <Link className="primary big" style={{marginTop:16}} to="/login">Login dengan email</Link>
    )}
  </main>;
}

function AppShell(){
  return <BrowserRouter><Shell><Routes>
    <Route path="/" element={<Home/>}/>
    <Route path="/login" element={<Login/>}/>
    <Route path="/profile" element={<Profile/>}/>
    <Route path="/glossary" element={<Glossary/>}/>
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
