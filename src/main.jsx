import React,{useEffect,useMemo,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {BrowserRouter,Routes,Route,Link,useNavigate,useParams,useLocation,Navigate} from 'react-router-dom';
import {Heart,Lock,ChevronRight,BookOpen,Flame,UserRound,Star,Check,X,Volume2,Info,Menu,Home as HomeIcon,Languages,ArrowLeft,SkipForward,RotateCcw,Shuffle,Sparkles} from 'lucide-react';
import {sections,getSection,getLevel,glossary,allQuestions,randomQuestion} from './data.js';
import {furigana} from './furigana.generated.js';
import s1l1Content from './content/s1l1.json';
import s1l1Ja from './content/s1l1-ja.json';
import {GlossaryPage,GlossaryDetail} from './GlossaryPage.jsx';
import Login from './Login.jsx';
import {AuthProvider, useAuth} from './context/AuthContext.jsx';
import {ProgressProvider, useProgress, readGuestProgress} from './context/ProgressContext.jsx';
import './styles.css';import './translation.css';import './routing.css';import './auth.css';

/* ---------- 3-mode language switch: 漢字(kanji) / ふりがな(furigana) / ID (Indonesia) ----------
   Icon-button kecil di pojok kanan atas tiap card (soal, choice, explanation, materi paragraf).
   Bukan tulisan "translate" — cuma 3 tombol mini yang ganti mode tampilan teks itu sendiri. */
const LANG_MODES = [
  {key:'kanji', label:'漢字'},
  {key:'furigana', label:'ふり'},
  {key:'id', label:'ID'},
];

function LangSwitch({mode,setMode,className=''}){
  return <div className={`langSwitch ${className}`} role="group" aria-label="Ganti bahasa">
    {LANG_MODES.map(m=><button key={m.key} type="button" className={mode===m.key?'active':''}
      onClick={e=>{e.stopPropagation();setMode(m.key);}}>{m.label}</button>)}
  </div>;
}

function LangText({ja,id,mode,as='p',className=''}){
  const Tag = as;
  if(mode==='id') return <Tag className={className}>{id}</Tag>;
  if(mode==='furigana') return <Tag className={className} dangerouslySetInnerHTML={{__html:furigana(ja)}}/>;
  return <Tag className={className}>{ja}</Tag>;
}

const RUBY_ANNOTATION = /([\u4E00-\u9FFF\u3005\u3006\u30F6]+)\[([\u3041-\u309F\u30A1-\u30FCー]+)\]/g;
function AnnotatedText({field,mode='kanji',as='p',className=''}){
  const Tag=as;
  if(field==null) return null;
  const raw=typeof field==='string'?field:(field.ja||field.id||'');
  if(mode==='id' && typeof field==='object' && field.id) return <Tag className={className}>{field.id}</Tag>;
  const html=mode==='furigana'
    ? raw.replace(RUBY_ANNOTATION,'<ruby>$1<rt>$2</rt></ruby>')
    : raw.replace(RUBY_ANNOTATION,'$1');
  return <Tag className={`annotatedText ${mode==='furigana'?'showFuri':''} ${className}`} dangerouslySetInnerHTML={{__html:html}}/>;
}

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

function Mascot({variant='home',size='md',className='',style}){
  const src = MASCOT_MAP[variant]||MASCOT_MAP.home;
  return <div className={`mascotImg size-${size} ${className}`} style={style} aria-label="Hello Kitty mascot">
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
  const navItems = [
    {to:'/', icon:'🎀', label:'Home', match:p=>p==='/'},
    {to:'/practice', icon:'🌸', label:'Latihan', match:p=>p==='/practice'},
    {to:'/glossary', icon:'📖', label:'Lesson', match:p=>p.startsWith('/glossary')},
    {to:isAuthenticated?'/profile':'/login', icon:'💗', label:isAuthenticated?'Profile':'Login', match:p=>p==='/profile'||p==='/login'},
  ];
  return <div className="app">
    <header>
      <Link to="/" className="brand"><div className="kitty"><img src={ASSET('hk-face-icon.png')} alt="Kaigo Kitty"/></div><div><b>kaigo kitty</b><small>learn with care</small></div></Link>
      <div className="topStats">
        <span><Flame size={16} fill="#ff718f"/> {loading && status==='authenticated' ? '…' : streakCurrent}</span>
        <span className="xpStat"><Heart size={16} fill="#ff718f"/> {loading && status==='authenticated' ? '…' : totalXp} XP</span>
      </div>
    </header>
    {children}
    <nav>
      {navItems.map(n=><Link key={n.label} className={`tap ${n.match(loc.pathname)?'active':''}`} to={n.to}><span className="navEmoji">{n.icon}</span><span>{n.label}</span></Link>)}
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

const ZIGZAG_OFFSETS = [0, 54, 84, 54, 0, -54, -84, -54];

function SectionOverview(){
  const {sectionId}=useParams();const s=getSection(sectionId);
  const {isAuthenticated, guestProgress} = useProgress();
  const unlockMap = useSectionUnlockMap();
  if(!s)return <Navigate to="/"/>;
  const sectionInfo = unlockMap[s.id];
  const serverLevels = sectionInfo?.levels;
  const sectionOfficial = sectionInfo?.official ?? (s.id===1);
  const done = guestProgress.done || {};

  const levelStates = s.levels.map((l,i)=>{
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
    return {l, i, levelUnlocked, completed, previewOnly: !levelUnlocked && !completed};
  });
  const currentIdx = levelStates.findIndex(x=>!x.completed);

  return <main className="page skillPage"><Link to="/" className="back"><ArrowLeft size={16}/> Learning path</Link>
    <div className="sectionHero"><span>{s.icon}</span><div><small>SECTION {s.id}</small><h1>{s.titleJa}</h1><p>{s.titleId}</p></div></div>
    <p className="muted">{s.description}</p>
    {!sectionOfficial && <div className="previewBanner"><Lock size={16}/><span>Section ini belum resmi terbuka — kamu tetap bisa preview materi & coba quiz, tapi progress tidak dihitung completed sampai section sebelumnya selesai.</span></div>}
    <div className="skillPath">
      {levelStates.map(({l,i,levelUnlocked,completed,previewOnly})=>{
        const isMilestone = Boolean(l.isReview);
        const isCurrent = i===currentIdx && !previewOnly;
        const offset = ZIGZAG_OFFSETS[i % ZIGZAG_OFFSETS.length];
        return <div className="skillNodeRow" key={l.id}>
          {i>0 && i%4===0 && <Mascot variant="materi" size="sm" className="pathMascot" style={{['--nodeOffset']:`${offset}px`}}/>}
          <div className="skillNodeWrap" style={{marginLeft:offset}}>
            <Link to={`/section/${s.id}/level/${l.id}`}
              className={`skillNode tap ${isMilestone?'milestone':''} ${completed?'completed':''} ${previewOnly?'locked':''} ${isCurrent?'current':''}`}>
              {completed ? <Check size={isMilestone?26:20}/> : previewOnly ? <Lock size={isMilestone?22:16}/> : isMilestone ? <Star size={24} fill="#fff"/> : l.id}
              {isCurrent && <span className="currentPing"/>}
            </Link>
            <span className="skillNodeLabel">{isMilestone ? '🎀 Recap' : l.titleJa}</span>
          </div>
        </div>;
      })}
    </div>
    <div className="recapLink"><Link to={`/section/${s.id}/recap`}><Star fill="#ffb73b"/> Section recap <span>{s.levelCount} level review</span><ChevronRight/></Link></div>
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

function mergeJapaneseCard(card){
  const ja=s1l1Ja[card.id];
  if(!ja)return card;
  const merge=(base,override)=>override?{...base,...override}:base;
  const out={...card};
  for(const key of ['body','heading','scenario','prompt','reveal','note']) out[key]=merge(card[key],ja[key]);
  if(card.type==='compare'&&ja.rows)out.rows=card.rows.map((r,i)=>({...r,...ja.rows[i],term:{...r.term,...ja.rows[i]?.term}}));
  if(card.type==='checkpoint'&&ja.question)out.question={...card.question,...ja.question,explanation:merge(card.question.explanation,ja.question.explanation)};
  if(card.type==='recap'&&ja.points)out.points=card.points.map((p,i)=>merge(p,ja.points[i]));
  return out;
}

function Materi(){
  const {sectionId,levelId}=useParams();const s=getSection(sectionId),l=getLevel(sectionId,levelId);const nav=useNavigate();
  const rich = Number(sectionId)===1 && Number(levelId)===1 ? s1l1Content : null;
  const cards = rich?.materi ? rich.materi.map(mergeJapaneseCard) : l?.materi || [];
  const storeKey=`kk_materi_pos_${sectionId}_${levelId}`;
  const [i,setI]=useState(()=>{try{const n=Number(sessionStorage.getItem(storeKey));return Number.isInteger(n)&&n>=0&&n<cards.length?n:0}catch{return 0}});
  const [mode,setMode]=useState('kanji');
  useEffect(()=>{try{sessionStorage.setItem(storeKey,String(i))}catch{}},[i,storeKey]);
  useEffect(()=>{setMode('kanji')},[i]);
  useEffect(()=>{const onKey=e=>{if(e.key==='ArrowRight'||e.key==='Enter'){e.preventDefault();i<cards.length-1?setI(i+1):nav(`/section/${s.id}/level/${l.id}/quiz`)}if(e.key==='ArrowLeft'){e.preventDefault();setI(v=>Math.max(0,v-1))}if(e.key==='Escape')nav(`/section/${s.id}/level/${l.id}`)};window.addEventListener('keydown',onKey);return()=>window.removeEventListener('keydown',onKey)},[i,cards.length,nav,s?.id,l?.id]);
  if(!s||!l||!cards.length)return <Navigate to="/"/>;
  const card=cards[i];
  return <main className="page materiPage richMateriPage">
    <div className="materiTop"><Link to={`/section/${s.id}/level/${l.id}`} className="back">× Tutup</Link><div className="materiDots" aria-label={`Kartu ${i+1} dari ${cards.length}`}>{cards.map((c,n)=><button type="button" key={c.id||n} className={`${n===i?'active':''} ${n<i?'done':''}`} disabled={n>i} aria-label={`Kartu ${n+1}`} onClick={()=>setI(n)}/>)}</div><LangSwitch mode={mode} setMode={setMode}/></div>
    <article className={`richMateriCard rich-${card.type||'lesson'}`} key={card.id||i}><RichCardBody card={card} mode={mode}/></article>
    <div className="richMateriNav">{i>0&&<button type="button" className="secondary tap" onClick={()=>setI(v=>v-1)}>Kembali</button>}<button type="button" className="primary tap" onClick={()=>i<cards.length-1?setI(i+1):nav(`/section/${s.id}/level/${l.id}/quiz`)}>{i<cards.length-1?'Lanjut':'Mulai quiz'} <ChevronRight/></button></div>
    <button type="button" className="materiSkip" onClick={()=>nav(`/section/${s.id}/level/${l.id}/quiz`)}>Lewati ke quiz</button>
  </main>;
}

function RichCardBody({card,mode}){
  const F=({field,as='p',className=''})=><AnnotatedText field={field} mode={mode} as={as} className={className}/>;
  if(card.type==='hook') return <><Mascot variant="materi" size="sm"/><F field={card.body} className="richBody"/></>;
  if(card.type==='term'){const t=card.term;return <div className="richTerm"><div className="termReading">{t.reading}</div><div className="termKanji">{t.kanji}</div><div className="termRoman">{t.romaji} / {t.meaning}</div><div className="termExample">{t.example&&mode==='id'?<p>{t.example.id}</p>:t.example&&<F field={t.example}/>}</div></div>}
  if(card.type==='explain') return <><F field={card.heading} as="h2"/><F field={card.body} className="richBody"/> </>;
  if(card.type==='compare') return <><F field={card.heading} as="h2"/><div className="compareGrid">{card.rows.map(r=><div className="compareRow" key={r.term.kanji}><b>{r.term.reading}<br/><span>{r.term.kanji}</span></b><span>{r.meaning}</span><small>{r.when}</small></div>)}</div>{card.note&&<F field={card.note} className="richNote"/>}</>;
  if(card.type==='checkpoint') return <><span className="richTag">Cek cepat · tidak dinilai</span><F field={card.question?.prompt} className="richQuestion"/><div className="checkpointOpts">{card.question.options.map(o=><div key={o.key} className="checkpointOption"><F field={o.text}/></div>)}</div><p className="richNote">Jawabannya akan dibahas setelah kamu lanjut membaca materi.</p></>;
  if(card.type==='case') return <><span className="richTag">Kasus lapangan</span><F field={card.heading} as="h2"/><F field={card.scenario} className="richBody"/><F field={card.prompt} className="richPrompt"/><F field={card.reveal} className="richReveal"/></>;
  if(card.type==='exam-tip') return <><span className="richTag">Sudut pandang ujian</span><F field={card.heading} as="h2"/><F field={card.body} className="richBody"/></>;
  if(card.type==='recap') return <><F field={card.heading} as="h2"/><ul className="richRecap">{card.points.map((p,n)=><li key={n}>{typeof p==='string'?p:p.id}</li>)}</ul></>;
  return <><F field={card.heading} as="h2"/><F field={card.body} className="richBody"/></>;
}

/* ---------- shared quiz pieces (dipakai Quiz level & Practice) ---------- */

function QuestionFlipCard({q,mode='kanji',setMode}){
  const [localMode,setLocalMode]=useState('kanji');
  const activeMode = setMode ? mode : localMode;
  const changeMode = setMode || setLocalMode;
  return <div className="qCard" key={q.id}>
    <div className="qCardHead">
      <p className="source">{q.sourceYear} · {q.difficulty}</p>
      <LangSwitch mode={activeMode} setMode={changeMode}/>
    </div>
    <LangText as="h1" ja={q.questionJa} id={q.questionId} mode={activeMode}/>
  </div>;
}

function ChoiceCard({choice,choiceId,index,selected,correctIndex,onAnswer,mode,setMode}){
  const [localMode,setLocalMode]=useState('kanji');
  const activeMode = setMode ? mode : localMode;
  const answered = selected!==null;
  const isCorrect = answered && index===correctIndex;
  const isWrong = answered && index===selected && index!==correctIndex;
  return <div className={`choiceCard tap ${answered?'answered':''} ${isCorrect?'isCorrect':''} ${isWrong?'isWrong':''}`} onClick={()=>onAnswer(index)}>
    <div className="choiceRow">
      <LangText as="span" ja={choice} id={choiceId} mode={activeMode} className="choiceText"/>
      {setMode ? null : <LangSwitch mode={activeMode} setMode={setLocalMode} className="mini"/>}
      {isCorrect && <Check className="checkIcon" size={18}/>}
      {isWrong && <X className="xIcon" size={18}/>}
    </div>
  </div>;
}

function ExplanationBox({q}){
  const [mode,setMode]=useState('kanji');
  return <div className="explainBox">
    <div className="explainHead"><Info size={16}/> <span>Kenapa jawaban ini benar?</span><LangSwitch mode={mode} setMode={setMode} className="mini"/></div>
    <LangText as="p" ja={q.explanationJa} id={q.explanationId} mode={mode} className={mode==='kanji'?'ja':''}/>
  </div>;
}

const CORRECT_LINES = ['Yeayy! ✨','Perfect! 🎀','完璧！','Sugoi! 💗','Betul banget! 🌸'];
const WRONG_LINES = ['Zannen... 😣','Hampir! 🩹','Coba lagi ya~','惜しい！','Yuk cek lagi 🎗️'];

function AnswerPopup({correct,onClose}){
  const line = useMemo(()=> correct
    ? CORRECT_LINES[Math.floor(Math.random()*CORRECT_LINES.length)]
    : WRONG_LINES[Math.floor(Math.random()*WRONG_LINES.length)]
  ,[correct]);
  useEffect(()=>{
    const t = setTimeout(onClose, 1150);
    return ()=>clearTimeout(t);
  },[onClose]);
  return <div className={`answerPopup ${correct?'good':'bad'}`} role="status">
    <span className="answerPopupIcon">{correct?'🎉':'😣'}</span>
    <span className="answerPopupText">{line}</span>
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
  const [popup,setPopup]=useState(null);
  const [quizMode,setQuizMode]=useState('kanji');
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
    setPopup(isCorrect);
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
    {popup!==null && <AnswerPopup correct={popup} onClose={()=>setPopup(null)}/>}
    <div className="quizTop"><Link to={`/section/${s.id}/level/${l.id}`} className="back">‹ Exit</Link><span>{phase==='retry'?'RETRY · ':''}{qi+1} / {roundQuestions.length}</span></div>
    <div className="quizProgress"><i style={{width:`${(qi+1)/roundQuestions.length*100}%`}}/></div>
    {phase==='retry' && <div className="retryBanner"><RotateCcw/><div><b>Yuk ulangi soal yang belum tepat!</b><span>Ronde retry #{retryRound} · {roundQuestions.length} soal tersisa</span></div><div className="retryDots">{roundQuestions.map((rq,idx)=><i key={rq.id+idx} className={idx<qi?'done':''}/>)}</div></div>}
    <QuestionFlipCard q={q} mode={quizMode} setMode={setQuizMode} key={`qc-${q.id}-${phase}-${qi}`}/>
    <button className="listen tap" type="button"><Volume2 size={17}/> 用語を聞く · Dengarkan istilah</button>
    <div className="choices">{q.choices.map((c,i)=><ChoiceCard key={`${q.id}-${i}-${phase}-${qi}`} choice={c} choiceId={q.choiceIds?.[i]||''} index={i} selected={selected} correctIndex={q.correctIndex} onAnswer={answer} mode={quizMode} setMode={setQuizMode}/>)}</div>
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
  const [popup,setPopup]=useState(null);
  const [quizMode,setQuizMode]=useState('kanji');
  const answer=(i)=>{
    if(selected!==null) return;
    setSelected(i);
    setAnswered(a=>a+1);
    const isCorrect = i===q.correctIndex;
    setPopup(isCorrect);
    if(isCorrect) setCorrect(c=>c+1);
  };
  const nextQuestion=()=>{ setQ(randomQuestion(q.id)); setSelected(null); setQuizMode('kanji'); };
  return <main className="page quizPage">
    {popup!==null && <AnswerPopup correct={popup} onClose={()=>setPopup(null)}/>}
    <div className="practiceHero">
      <Mascot variant="practice" size="sm"/>
      <span className="quizModeBadge"><Shuffle size={12}/> Practice · unlimited</span>
      <p className="muted">Soal acak dari semua section — {answered} dijawab, {correct} benar. XP tidak resmi & tidak memengaruhi unlock.</p>
    </div>
    <div className="quizTop"><span>{q.sectionTitleId} · {q.levelTitleId}</span></div>
    <QuestionFlipCard q={q} mode={quizMode} setMode={setQuizMode} key={`pq-${q.id}`}/>
    <div className="choices">{q.choices.map((c,i)=><ChoiceCard key={`${q.id}-${i}`} choice={c} choiceId={q.choiceIds?.[i]||''} index={i} selected={selected} correctIndex={q.correctIndex} onAnswer={answer} mode={quizMode} setMode={setQuizMode}/>)}</div>
    {selected!==null && <ExplanationBox q={q}/>}
    <div className="quizFooter"><button className="primary big tap" type="button" disabled={selected===null} onClick={nextQuestion}>Soal berikutnya <ChevronRight/></button></div>
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

function Glossary(){return <GlossaryPage/>;}

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
    <Route path="/glossary/:slug" element={<GlossaryDetail/>}/>
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
