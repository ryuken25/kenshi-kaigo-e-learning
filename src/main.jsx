import React,{useEffect,useMemo,useState,Suspense} from 'react';
import {createRoot} from 'react-dom/client';
import {BrowserRouter,Routes,Route,Link,useNavigate,useParams,useLocation,Navigate,Outlet} from 'react-router-dom';
import {Heart,Lock,ChevronRight,BookOpen,Flame,Star,Check,X,Volume2,Info,Home as HomeIcon,ArrowLeft,RotateCcw,Shuffle,Users,Trophy,Medal} from 'lucide-react';
import {sections,getSection,getLevel,glossary,allQuestions,randomQuestion,hashSeed} from './data.js';
import {Icon} from './Icons.jsx';
import Furigana,{CompareTerm,stripRuby} from './Furigana.jsx';
import s1l1Content from './content/s1l1.json';
import s1l1Ja from './content/s1l1-ja.json';
import glossaryData from './content/glossary.index.json';
import {Avatar,ToastProvider,useLangMode,CHARACTERS,useCharExpr,applyChar,applyDark,readDark,themeSkinOf,useDarkMode,useAchToast} from './lib/social.jsx';
import {AuthProvider, useAuth} from './context/AuthContext.jsx';
import {ProgressProvider, useProgress} from './context/ProgressContext.jsx';
import {dailyQuote} from './data/quotes.js';
import {useTTS,toKana} from './lib/tts.js';
import {kanaToRomaji} from './lib/kana.js';
import './styles.css';import './translation.css';import './routing.css';import './auth.css';import './themes.css';import './social.css';
// Route-level code-splitting: FinalTest, Glossary, Social, Login di-lazy supaya chunk
// utama (data.js + furigana.generated.js ~1MB source) tidak memuat halaman yang jarang
// dibuka di load pertama. Wrapper komponen (bukan .then m=>({default:m.X})) supaya
// validate:jsx tetap melihat deklarasi <FinalHome/> dkk di file ini.
const Login=React.lazy(()=>import('./Login.jsx'));
const FinalHome=React.lazy(()=>import('./FinalTest.jsx').then(m=>({default:m.FinalHome})));
const FinalYear=React.lazy(()=>import('./FinalTest.jsx').then(m=>({default:m.FinalYear})));
const FinalQuiz=React.lazy(()=>import('./FinalTest.jsx').then(m=>({default:m.FinalQuiz})));
const FinalResult=React.lazy(()=>import('./FinalTest.jsx').then(m=>({default:m.FinalResult})));
const UnlimitedFinal=React.lazy(()=>import('./FinalTest.jsx').then(m=>({default:m.UnlimitedFinal})));
const GlossaryPage=React.lazy(()=>import('./GlossaryPage.jsx').then(m=>({default:m.GlossaryPage})));
const GlossaryDetail=React.lazy(()=>import('./GlossaryPage.jsx').then(m=>({default:m.GlossaryDetail})));
const FriendsPage=React.lazy(()=>import('./Social.jsx').then(m=>({default:m.FriendsPage})));
const LeaderboardPage=React.lazy(()=>import('./Social.jsx').then(m=>({default:m.LeaderboardPage})));
const AchievementsPage=React.lazy(()=>import('./Social.jsx').then(m=>({default:m.AchievementsPage})));
const OnboardingWizard=React.lazy(()=>import('./Social.jsx').then(m=>({default:m.OnboardingWizard})));
const ProfileEditor=React.lazy(()=>import('./Social.jsx').then(m=>({default:m.ProfileEditor})));

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

/* Semua teks Jepang WAJIB lewat <Furigana> (src/Furigana.jsx) — satu-satunya jalur render
   ruby di app ini. Jangan render <ruby>/<rt> mentah lagi di file ini: bug furigana berulang
   tiga kali justru karena dulu ada beberapa jalur render yang berbeda. */
function LangText({ja,id,mode,as='p',className='',variant}){
  return <Furigana field={{ja,id}} mode={mode} as={as} className={className} variant={variant}/>;
}

/* Maskot = karakter orisinal aktif (doc 49). Ekspresi ikut variant; SVG kecil
   (<3KB) jadi tidak perlu varian WebP/fallback lagi. */
const MASCOT_EXPR = {home:'idle',level:'idle',materi:'idle',recap:'happy',perfect:'clap',good:'happy',welcome:'idle',profile:'idle',login:'idle',practice:'idle'};
function CharArt({variant='home',size='md',className='',style}){
  const src = useCharExpr(MASCOT_EXPR[variant]||'idle');
  return <div className={`mascotImg size-${size} ${className}`} style={style} aria-label="Maskot Kenshi">
    <img src={src} alt="Maskot Kenshi" loading="lazy"/>
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

function ScrollToTop(){
  const location=useLocation();
  useEffect(()=>{window.scrollTo(0,0)},[location.pathname,location.search]);
  return null;
}

function NavIcon({kind}){
  const paths={learn:<><path d="M3 10.5 12 4l9 6.5"/><path d="M5.5 9.5V20h13V9.5"/><path d="M9 20v-6h6v6"/></>,exam:<><path d="M6 3h12v18H6z"/><path d="M9 7h6M9 11h6M9 15h3"/><path d="m16 18 1.5 1.5L21 16"/></>,terms:<><path d="M5 4h10a4 4 0 0 1 4 4v12H9a4 4 0 0 1-4-4z"/><path d="M9 4v16"/><path d="M12 9h4M12 12h4"/></>,friends:<><circle cx="9" cy="8" r="3"/><path d="M3.5 19c.7-2.8 2.9-4.5 5.5-4.5s4.8 1.7 5.5 4.5"/><circle cx="17" cy="9" r="2.4"/><path d="M15.6 14.6c2.6.2 4.3 1.7 4.9 4.4"/></>,rank:<><path d="M8 21h8"/><path d="M12 17v4"/><path d="M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M7 6H4a2 2 0 0 0 2 4h1"/><path d="M17 6h3a2 2 0 0 1-2 4h-1"/></>,profile:<><circle cx="12" cy="8" r="3"/><path d="M5 20c.8-3.2 3.1-5 7-5s6.2 1.8 7 5"/></>};
  return <svg className="navSvg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[kind]}</svg>;
}

const NIGHT_STARS=[[6,8,1.4,.5],[12,22,1,.35],[17,5,1.8,.6],[21,34,1.1,.3],[26,12,1.3,.45],[31,27,1,.3],[34,6,1.6,.55],[39,18,1.2,.4],[43,31,1,.28],[47,9,1.5,.5],[52,24,1.1,.35],[56,4,1.7,.6],[59,16,1.2,.4],[63,29,1,.3],[66,8,1.4,.5],[70,20,1.1,.35],[74,33,1.3,.4],[77,6,1.6,.55],[81,26,1,.3],[85,14,1.4,.45],[88,30,1.1,.32],[91,5,1.5,.5],[94,21,1.2,.38],[97,11,1,.3]];
const NIGHT_PETALS=[[22,14,13,18],[33,30,10,-24],[58,11,12,40],[72,26,14,-12],[83,9,10,28],[46,22,11,-38]];
/* Dekorasi mode gelap. SELALU ada di DOM dan disembunyikan CSS saat terang —
   kalau dilepas-pasang, toggle mode memicu remount seluruh subtree beranda. */
function NightSky(){
  return <div className="nightSky" aria-hidden="true">
    {NIGHT_STARS.map(([x,y,r,o],i)=><i key={i} className="nightStar" style={{left:x+'%',top:y+'%',['--r']:r+'px',opacity:o}}/>)}
    {NIGHT_PETALS.map(([x,y,sz,rot],i)=><i key={i} className="nightPetal" style={{left:x+'%',top:y+'%',width:sz,height:sz,transform:'rotate('+rot+'deg)'}}/>)}
    <i className="nightMoon"/><i className="nightPagoda"/>
  </div>;
}

function Shell({children}){
  const loc=useLocation();
  const {isAuthenticated, loading, streakCurrent, totalXp} = useProgress();
  const {status} = useAuth();
  const brandSrc=useCharExpr('idle');
  const cheerSrc=useCharExpr('happy');
  const [dark,setDark]=useDarkMode();
  const navItems = [
    {to:'/belajar', kind:'learn', label:'Belajar', match:p=>p==='/belajar'},
    {to:'/final', kind:'exam', label:'Ujian', match:p=>p.startsWith('/final')},
    {to:'/glossary', kind:'terms', label:'Istilah', match:p=>p.startsWith('/glossary')},
    {to:'/friends', kind:'friends', label:'Teman', cls:'navFriends', match:p=>p.startsWith('/friends')},
    {to:'/leaderboard', kind:'rank', label:'Peringkat', cls:'navRank', match:p=>p.startsWith('/leaderboard')},
    {to:'/profile', kind:'profile', label:'Profil', match:p=>p==='/profile'||p==='/login'},
  ];
  /* appHome: beranda desktop mengikuti kanvas DeskMomo yang TIDAK punya header —
     mereknya dibawa sidebar. Halaman lain tetap berheader (kanvas DesktopMateri). */
  return <div className={loc.pathname==='/belajar'?"app appHome":"app"}>
    <ScrollToTop/>
    <header>
      <Link to="/belajar" className="brand"><div className="kitty"><img src={brandSrc} alt="Kenshi Kaigo E-Learning"/></div><div><b>kenshi kaigo e-learning</b><small>belajar kaigo</small></div></Link>
      <div className="topStats">
        <span><Flame size={16} fill="#ff718f"/> {loading && status==='authenticated' ? '…' : streakCurrent}<span className="statLabel">hari</span></span>
        <span className="xpStat"><Heart size={16} fill="#ff718f"/> {loading && status==='authenticated' ? '…' : totalXp}<span className="statLabel">XP</span></span>
      </div>
    </header>
    {children}
    <nav>
      <Link to="/belajar" className="sideBrand"><span className="sideBrandArt"><img src={brandSrc} alt=""/></span><span><b className="sideBrandName">kenshi</b><small className="sideBrandSub">kaigo e-learning</small></span></Link>
      {navItems.map(n=><Link key={n.label} className={`tap ${n.cls||''} ${n.match(loc.pathname)?'active':''}`} to={n.to}><span className="navEmoji"><NavIcon kind={n.kind}/></span><span>{n.label}</span></Link>)}
      <span className="sideSpacer"/>
      <div className="sideCheer"><span className="sideCheerArt"><img src={cheerSrc} alt=""/></span><small className="sideCheerText">Sedikit setiap hari,<br/>hasil luar biasa!</small></div>
      <div className="sideDark"><button type="button" className={dark?"darkRow tap on":"darkRow tap"} onClick={()=>setDark(!dark)} aria-pressed={dark}><span className="darkRowIcon">{dark?"☀︎":"☾︎"}</span><span className="darkRowLabel">Mode gelap</span><span className="darkSwitch" aria-hidden="true"><i/></span></button></div>
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
      // gate 80% sama seperti server (api/_sections.mjs meetsSectionGate): integer math, bukan persen bulat
      const prev = i>0 ? sections[i-1] : null;
      map[s.id] = { official: i===0 || prev.levels.filter(l=>done[`${prev.id}-${l.id}`]).length*5 >= prev.levels.length*4, completedLevels, levels:null };
    });
    return map;
  },[isAuthenticated, serverProgress, guestProgress]);
}

function Home(){
  const {completedCount, streakCurrent, loading} = useProgress();
  const {user} = useAuth();
  const unlockMap = useSectionUnlockMap();
  const heroSrc = useCharExpr('idle');
  const napSrc = useCharExpr('sleepy');
  const totalLevels = sections.reduce((a,s)=>a+s.levelCount,0);
  // Kutipan harian deterministik (tanggal+user), bukan Math.random(): satu user
  // melihat kutipan yang sama seharian penuh.
  const today=new Date().toISOString().slice(0,10);
  const quote=dailyQuote(today+':'+(user?.id||'guest'));
  const donePct = totalLevels ? Math.round((completedCount/totalLevels)*100) : 0;
  const doneSections = sections.filter(x=>(unlockMap[x.id]?.completedLevels||0)>=x.levelCount).length;
  const streak = streakCurrent ?? 0;
  if(loading) return <main><KawaiiLoader label="Menyiapkan materi…"/></main>;
  return <main>
    <NightSky/>
    <div className="homeTop"><span className="streakPill"><Flame size={16} fill="currentColor"/> {streak} hari berturut-turut</span></div>
    <section className="welcome"><div>
      <p className="eyebrow">OHAYŌ, KENSHI</p>
      <h1 className="quoteJa" lang={quote.note?'ja':undefined}>{quote.text}</h1>
      {quote.note&&<p className="quoteNote">{quote.note}</p>}
      <p className="muted">13 bab · {totalLevels} level · dikerjakan sedikit demi sedikit.</p>
    </div><span className="homeHeroArt"><img src={heroSrc} alt=""/></span></section>
    <div className="homeCards">
      <div className="homeCard">
        <span className="homeCardArt"><Icon name="catatan" size={30} fill="var(--pink-deep)" tint="var(--card)"/></span>
        <div className="homeCardBody"><b>Hari ini</b><p>Satu kartu sekali duduk sudah cukup.</p>
          {/* sectionRow dipakai ulang di sini: bar + persen sebaris, sama seperti kartu bab. */}
          <div className="sectionRow"><div className="homeBar"><i style={{width:donePct+'%'}}/></div><b className="homeBarPct">{donePct}%</b></div>
        </div>
        <span className="homeCardBadge"><Star size={18} fill="currentColor"/><b>{completedCount} selesai</b></span>
      </div>
      <Link className="homeCard tap" to="/final">
        <span className="homeCardArt"><Icon name="stetoskop" size={30} fill="var(--pink-deep)" tint="var(--card)"/></span>
        <div className="homeCardBody"><b>Ujian Akhir</b><p>Soal asli 2021–2026 · 125 butir tiap tahun</p></div>
        <span className="homeCardGo"><ChevronRight size={18}/></span>
      </Link>
    </div>
    <div className="sectionHead">
      <div><h2>Urutan belajar <Icon name="kilau" size={19} fill="var(--gold)" tint="var(--gold-deep)"/></h2><p>Mulai dari martabat, berakhir di studi kasus</p></div>
      <Link className="roadmapBtn tap" to="/glossary"><BookOpen size={17}/> Lihat roadmap</Link>
    </div>
    <div className="sectionGrid">{sections.map((x)=><SectionCard key={x.id} section={x} official={unlockMap[x.id]?.official ?? (x.id===1)} completedLevels={unlockMap[x.id]?.completedLevels||0}/>)}</div>
    <section className="progressSummary">
      <h3 className="summaryHead">Ringkasan progres <Icon name="kilau" size={16} fill="var(--gold)" tint="var(--gold-deep)"/></h3>
      <div className="statRow">
        <div className="statTile"><span className="statTileArt" style={{['--accent']:sections[0].accent}}><Icon name="catatan" size={26} fill="var(--accent)" tint="transparent"/></span><div><p className="statTileNum">{doneSections}<span className="statTileOf">/ 13</span></p><small className="statTileLabel">Bab selesai</small></div></div>
        <div className="statTile"><span className="statTileArt" style={{['--accent']:sections[1].accent}}><Icon name="gelembung" size={26} fill="var(--accent)" tint="transparent"/></span><div><p className="statTileNum">{completedCount}<span className="statTileOf">/ {totalLevels}</span></p><small className="statTileLabel">Level selesai</small></div></div>
        <div className="statTile"><span className="statTileArt" style={{['--accent']:'var(--gold-deep)'}}><Icon name="pita" size={26} fill="var(--accent)" tint="transparent"/></span><div><p className="statTileNum">{donePct}<span className="statTileOf">%</span></p><small className="statTileLabel">Kurikulum tercakup</small></div></div>
        <div className="statTile"><span className="statTileArt" style={{['--accent']:sections[3].accent}}><Icon name="jantung" size={26} fill="var(--accent)" tint="transparent"/></span><div><p className="statTileNum">{streak}</p><small className="statTileLabel">Hari berturut-turut</small></div></div>
      </div>
      <span className="summaryArt"><img src={napSrc} alt=""/></span>
    </section>
  </main>;
}
function SectionCard({section,official,completedLevels}){
  const pct = section.levelCount ? Math.round((completedLevels/section.levelCount)*100) : 0;
  return <Link to={'/section/'+section.id} className={'sectionCard tap '+(official?'':'preview-only')} style={{['--accent']:section.accent}}>
    {!official && <span className="previewPill"><Lock size={10}/> preview</span>}
    <span className="sectionIcon"><Icon name={section.iconName} size={54} fill="var(--accent)" tint="var(--card)"/></span>
    <div className="sectionCopy">
      <small className="sectionBadge">BAB {String(section.id).padStart(2,'0')}</small>
      <b lang="ja">{section.titleJa}</b>
      <span>{section.titleId}</span>
      <em className="sectionDesc">{section.descriptionId}</em>
      <div className="sectionRow"><div className="miniProgress"><i style={{width:pct+'%'}}/></div><b className="sectionPct">{pct}%</b></div>
    </div>
    <span className="sectionGo"><ChevronRight size={17}/></span>
  </Link>;
}

const ZIGZAG_OFFSETS = [0, 54, 84, 54, 0, -54, -84, -54];

function SectionOverview(){
  const {sectionId}=useParams();const s=getSection(sectionId);
  const {isAuthenticated, guestProgress} = useProgress();
  const unlockMap = useSectionUnlockMap();
  if(!s)return <Navigate to="/belajar"/>;
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

  return <main className="page skillPage"><Link to="/belajar" className="back"><ArrowLeft size={16}/> Urutan belajar</Link>
    <div className="sectionHero"><span>{s.icon}</span><div><small>BAB {s.id}</small><h1>{s.titleJa}</h1><p>{s.titleId}</p></div></div>
    <p className="muted">{s.descriptionId||s.description}</p>
    {!sectionOfficial && <div className="previewBanner"><Lock size={16}/><span>Section ini belum resmi terbuka — kamu tetap bisa preview materi & coba quiz, tapi progress tidak dihitung completed sampai section sebelumnya selesai.</span></div>}
    <div className="skillPath">
      {levelStates.map(({l,i,levelUnlocked,completed,previewOnly})=>{
        const isMilestone = Boolean(l.isReview);
        const isCurrent = i===currentIdx && !previewOnly;
        const offset = ZIGZAG_OFFSETS[i % ZIGZAG_OFFSETS.length];
        return <div className="skillNodeRow" key={l.id}>
          {i>0 && i%4===0 && <CharArt variant="materi" size="sm" className="pathMascot" style={{['--nodeOffset']:`${offset}px`}}/>}
          <div className="skillNodeWrap" style={{marginLeft:offset}}>
            <Link to={`/section/${s.id}/level/${l.id}`}
              className={`skillNode tap ${isMilestone?'milestone':''} ${completed?'completed':''} ${previewOnly?'locked':''} ${isCurrent?'current':''}`}>
              {completed ? <Check size={isMilestone?26:20}/> : previewOnly ? <Lock size={isMilestone?22:16}/> : isMilestone ? <Star size={24} fill="currentColor"/> : l.id}
              {isCurrent && <span className="currentPing"/>}
            </Link>
            <span className="skillNodeLabel">{isMilestone ? '🎀 Ulasan' : l.titleId}</span>
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
  if(!s||!l)return <Navigate to="/belajar"/>;
  const sectionInfo = unlockMap[s.id];
  const lv = sectionInfo?.levels?.find(x=>x.levelId===l.id);
  const levelUnlocked = isAuthenticated ? (lv?.levelUnlocked ?? (l.id===1)) : true;
  return <main className="page"><Link to={`/section/${s.id}`} className="back"><ArrowLeft size={16}/> {s.titleJa}</Link>
    <div className="levelHero"><CharArt variant="level" size="md"/><div><small>LEVEL {l.id}</small><h1>{l.titleJa}</h1><p>{l.titleId}</p></div></div>
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
  /* meaning & when di kartu compare ada di DUA bahasa: id dari s1l1.json, ja dari overlay.
     Kalau ditimpa flat, salah satu bahasa hilang & mode ID ikut jadi Jepang. */
  const pair=(id,jp)=>({ja:jp||id||'',id:id||jp||''});
  const out={...card};
  for(const key of ['body','heading','scenario','prompt','reveal','note']) out[key]=merge(card[key],ja[key]);
  if(card.type==='compare'&&ja.rows)out.rows=card.rows.map((r,i)=>({...r,...ja.rows[i],term:{...r.term,...ja.rows[i]?.term},meaning:pair(r.meaning,ja.rows[i]?.meaning),when:pair(r.when,ja.rows[i]?.when)}));
  if(card.type==='checkpoint'&&ja.question)out.question={...card.question,...ja.question,explanation:merge(card.question.explanation,ja.question.explanation)};
  if(card.type==='recap'&&ja.points)out.points=card.points.map((p,i)=>merge(p,ja.points[i]));
  return out;
}

function cardGlossaryTerms(card,terms){
  const text=JSON.stringify(card);
  return terms.filter(t=>text.includes(t.kanji)).slice(0,8);
}

/* Bacaan hanya boleh dipasang manual kalau base-nya kanji murni — RUBY_RE cuma match base
   kanji, jadi istilah campur katakana (口腔ケア) atau alfabet (QOL) akan bocor "[かな]" ke
   layar. Yang campuran diserahkan ke map furigana biar cuma bagian kanjinya yang beranotasi. */
const PURE_KANJI=/^[一-鿿々〆ヶ]+$/;
const termField=(t)=>PURE_KANJI.test(t.kanji)?{ja:`${t.kanji}[${t.reading}]`,id:t.kanji}:{ja:t.kanji,id:t.kanji};

function Materi(){
  const {sectionId,levelId}=useParams();const s=getSection(sectionId),l=getLevel(sectionId,levelId);const nav=useNavigate();
  const [termSheet,setTermSheet]=useState(null);
  // useMemo: Set baru tiap render bikin prop tak-stabil menembus memo(Furigana).
  const glossaryKanji=useMemo(()=>new Set(glossaryData.terms.map(t=>t.kanji)),[]);
  const openTerm=(kanji)=>{const term=glossaryData.terms.find(t=>t.kanji===kanji);if(term)setTermSheet(term)};
  const rich = Number(sectionId)===1 && Number(levelId)===1 ? s1l1Content : null;
  const cards = rich?.materi ? rich.materi.map(mergeJapaneseCard) : l?.materi || [];
  const storeKey=`kk_materi_pos_${sectionId}_${levelId}`;
  const [i,setI]=useState(()=>{try{const n=Number(sessionStorage.getItem(storeKey));return Number.isInteger(n)&&n>=0&&n<cards.length?n:0}catch{return 0}});
  // Mode bahasa di-persist (useLangMode) & TIDAK di-reset tiap ganti kartu —
  // bug lama: pilihan ID user balik ke kanji setiap geser kartu.
  const [mode,setMode]=useLangMode();
  useEffect(()=>{try{sessionStorage.setItem(storeKey,String(i))}catch{}},[i,storeKey]);
  useEffect(()=>{const onKey=e=>{if(e.key==='ArrowRight'||e.key==='Enter'){e.preventDefault();i<cards.length-1?setI(i+1):nav(`/section/${s.id}/level/${l.id}/quiz`)}if(e.key==='ArrowLeft'){e.preventDefault();setI(v=>Math.max(0,v-1))}if(e.key==='Escape')nav(`/section/${s.id}/level/${l.id}`)};window.addEventListener('keydown',onKey);return()=>window.removeEventListener('keydown',onKey)},[i,cards.length,nav,s?.id,l?.id]);
  if(!s||!l||!cards.length)return <Navigate to="/belajar"/>;
  const card=cards[i];
  return <main className="page materiPage richMateriPage">
    <div className="materiTop"><Link to={`/section/${s.id}/level/${l.id}`} className="back">× Tutup</Link><div className="materiDots" aria-label={`Kartu ${i+1} dari ${cards.length}`}>{cards.map((c,n)=><button type="button" key={c.id||n} className={`${n===i?'active':''} ${n<i?'done':''}`} disabled={n>i} aria-label={`Kartu ${n+1}`} onClick={()=>setI(n)}/>)}</div><LangSwitch mode={mode} setMode={setMode}/></div>
    <article className={`richMateriCard rich-${card.type||'lesson'}`} key={card.id||i}><RichCardBody card={card} mode={mode} glossary={glossaryKanji} onTerm={openTerm}/></article>
    {termSheet&&<div className="termSheetBackdrop" role="presentation" onClick={()=>setTermSheet(null)}><section className="termSheet" role="dialog" aria-modal="true" aria-label={`Istilah ${termSheet.kanji}`} onClick={e=>e.stopPropagation()}><button className="termSheetClose" onClick={()=>setTermSheet(null)} aria-label="Tutup">×</button>{mode==='kanji'?<small>{termSheet.reading} · {kanaToRomaji(termSheet.reading)}</small>:<small>{kanaToRomaji(termSheet.reading)}</small>}<Furigana field={termField(termSheet)} mode={mode} as="h2" variant="xl"/><p className="termSheetShort">{termSheet.id.short}</p><p>{termSheet.id.long}</p><Link className="termSheetMore" to={`/glossary/${termSheet.slug}`}>Buka halaman lengkapnya →</Link></section></div>}
    {(()=>{const terms=cardGlossaryTerms(card,glossaryData.terms);return terms.length>0&&<section className="materiTerms"><h3>🔎 Istilah di kartu ini</h3><div className="materiTermChips">{terms.map(t=><button type="button" key={t.slug} onClick={()=>setTermSheet(t)} className="materiTermChip"><b>{t.kanji}</b><small>{kanaToRomaji(t.reading)}</small></button>)}</div></section>})()}
    <div className="richMateriNav">{i>0&&<button type="button" className="secondary tap" onClick={()=>setI(v=>v-1)}>Kembali</button>}<button type="button" className="primary tap" onClick={()=>i<cards.length-1?setI(i+1):nav(`/section/${s.id}/level/${l.id}/quiz`)}>{i<cards.length-1?'Lanjut':'Mulai quiz'} <ChevronRight/></button></div>
    <button type="button" className="materiSkip" onClick={()=>nav(`/section/${s.id}/level/${l.id}/quiz`)}>Lewati ke quiz</button>
  </main>;
}

function JapaneseTerm({term,mode,className='',onTerm}){
  // Set di-memoize per term: new Set() tiap render bikin prop tak-stabil menembus memo(Furigana).
  const g=useMemo(()=>new Set([term.kanji]),[term.kanji]);
  return <Furigana field={termField(term)} mode={mode} as="span" variant="xl" className={`japaneseTerm ${className}`} glossary={g} onTerm={onTerm}/>;
}

/* Body kartu materi. Dulu wrapper F dideklarasikan DI DALAM render lalu dipakai sebagai
   elemen JSX — identitas komponen baru tiap render, React unmount/remount seluruh subtree
   ruby tiap parent re-render (swipe kartu, toggle mode). Sekarang panggil Furigana langsung. */
function RichCardBody({card,mode,glossary,onTerm}){
  const heading=card.heading||((card.titleJa||card.titleId)?{ja:card.titleJa||'',id:card.titleId||''}:null);
  const body=card.body||((card.bodyJa||card.bodyId)?{ja:card.bodyJa||'',id:card.bodyId||''}:null);
  if(card.type==='hook') return <><CharArt variant="materi" size="sm"/><Furigana field={body} mode={mode} className="richBody" glossary={glossary} onTerm={onTerm}/></>;
  if(card.type==='term'){const t=card.term;const rom=t.romaji||(t.reading?kanaToRomaji(t.reading):'');return <div className="richTerm"><JapaneseTerm term={t} mode={mode} onTerm={onTerm}/><div className="termRoman">{rom}{t.meaning?` / ${t.meaning}`:''}</div><div className="termExample">{t.example&&mode==='id'&&<><p lang="ja" className="termExampleJa">{stripRuby(t.example.ja||'')}</p><p>{t.example.id}</p></>}{t.example&&mode!=='id'&&<Furigana field={t.example} mode={mode} glossary={glossary} onTerm={onTerm}/>}</div></div>}
  if(card.type==='explain') return <><Furigana field={heading} mode={mode} as="h2" glossary={glossary} onTerm={onTerm}/><Furigana field={body} mode={mode} className="richBody" glossary={glossary} onTerm={onTerm}/></>;
  if(card.type==='compare') return <><Furigana field={card.heading||heading} mode={mode} as="h2" glossary={glossary} onTerm={onTerm}/><div className="compareGrid">{card.rows.map(r=><div className="compareRow" key={r.term.kanji}><CompareTerm term={r.term} mode={mode} className="compareTerm" glossary={glossary} onTerm={onTerm}/><Furigana field={r.meaning} mode={mode} glossary={glossary} onTerm={onTerm}/><Furigana field={r.when} mode={mode} glossary={glossary} onTerm={onTerm}/></div>)}</div>{(card.note||heading)&&<Furigana field={card.note||heading} mode={mode} className="richNote" glossary={glossary} onTerm={onTerm}/>}</>;
  if(card.type==='checkpoint') return <><span className="richTag">Cek cepat · tidak dinilai</span><Furigana field={card.question?.prompt} mode={mode} className="richQuestion" glossary={glossary} onTerm={onTerm}/><div className="checkpointOpts">{card.question.options.map(o=><div key={o.key} className="checkpointOption"><Furigana field={o.text} mode={mode} glossary={glossary} onTerm={onTerm}/></div>)}</div><p className="richNote">Jawabannya akan dibahas setelah kamu lanjut membaca materi.</p></>;
  if(card.type==='case') return <><span className="richTag">Kasus lapangan</span><Furigana field={heading} mode={mode} as="h2" glossary={glossary} onTerm={onTerm}/><Furigana field={card.scenario} mode={mode} className="richBody" glossary={glossary} onTerm={onTerm}/><Furigana field={card.prompt} mode={mode} className="richPrompt" glossary={glossary} onTerm={onTerm}/><Furigana field={card.reveal} mode={mode} className="richReveal" glossary={glossary} onTerm={onTerm}/></>;
  if(card.type==='exam-tip') return <><span className="richTag">Sudut pandang ujian</span><Furigana field={heading} mode={mode} as="h2" glossary={glossary} onTerm={onTerm}/><Furigana field={body} mode={mode} className="richBody" glossary={glossary} onTerm={onTerm}/></>;
  if(card.type==='recap') return <><Furigana field={heading} mode={mode} as="h2" glossary={glossary} onTerm={onTerm}/><ul className="richRecap">{card.points.map((p,n)=><li key={n}><Furigana field={p} mode={mode} glossary={glossary} onTerm={onTerm}/></li>)}</ul></>;
  // Kartu istilah terkait — 60 istilah glossary yang dulu tak pernah muncul di konten
  // (audit 2026-08). Term tampil apa adanya (kanji/katakana), artinya selalu Indonesia.
  if(card.type==='terms') return <><Furigana field={heading} mode={mode} as="h2" glossary={glossary} onTerm={onTerm}/><div className="richTermList">{card.terms.map(t=><div key={t.t} className="richTermItem"><b>{t.t}</b><span>{t.id}</span></div>)}</div></>;
  return <><Furigana field={heading} mode={mode} as="h2" glossary={glossary} onTerm={onTerm}/><Furigana field={body} mode={mode} className="richBody" glossary={glossary} onTerm={onTerm}/></>;
}

/* ---------- shared quiz pieces (dipakai Quiz level & Practice) ---------- */

function QuestionFlipCard({q,mode='kanji',setMode}){
  const [localMode,setLocalMode]=useLangMode();
  const activeMode = setMode ? mode : localMode;
  const changeMode = setMode || setLocalMode;
  return <div className="qCard" key={q.id}>
    <div className="qCardHead">
      {/* v8: label sourceYear/difficulty itu internal (official-style/syllabus-based/easy
          tidak bermakna buat user) — dulu bocor ke UI. Dicabut, bukan diterjemahkan. */}
      <LangSwitch mode={activeMode} setMode={changeMode}/>
    </div>
    <LangText as="h1" ja={q.questionJa} id={q.questionId} mode={activeMode}/>
  </div>;
}

function ChoiceCard({choice,choiceId,index,selected,correctIndex,onAnswer,mode,setMode}){
  const [localMode,setLocalMode]=useLangMode();
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
  const [mode,setMode]=useLangMode();
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
  const [submitErr,setSubmitErr]=useState(null);
  const [popup,setPopup]=useState(null);
  const [quizMode,setQuizMode]=useLangMode();
  const nav=useNavigate();
  const {available,speaking,play}=useTTS();
  const {submitAttempt} = useProgress();
  const [startedAt] = useState(()=>Date.now());
  // attemptId wajib UUID valid — server menolak format lain (validasi idempotency).
  const [attemptId] = useState(()=>crypto.randomUUID?crypto.randomUUID():([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g,c=>(c^crypto.getRandomValues(new Uint8Array(1))[0]&15>>c/4).toString(16)));
  if(!s||!l)return <Navigate to="/belajar"/>;
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
    setSubmitErr(null);
    const correctCount = correctFirstTry.size;
    const scorePercent = Math.round((correctCount/totalCount)*100);
    const durationMs = Date.now()-startedAt;
    const result = await submitAttempt({sectionId:s.id, levelId:l.id, correctCount, totalCount, score:scorePercent, durationMs, attemptId});
    setSaving(false);
    // Gagal submit (401 sesi habis / network / 4xx) JANGAN lanjut ke Result: dulu tetap
    // nav dengan XP fallback palsu sementara attempt cuma nyangkut di pending localStorage
    // tanpa feedback = success screen bohong + data hilang diam-diam. attemptId stabil
    // (useState) jadi retry aman idempoten di server.
    if(!result?.ok){ setSubmitErr(result?.error==='not_signed_in'?'Sesi kamu habis — masuk lagi dulu biar nilainya tersimpan.':'Gagal menyimpan nilai — cek koneksi lalu coba lagi.'); return; }
    const xpDelta = result?.data?.xpDelta ?? (correctCount*10+30);
    const isPreview = Boolean(result?.data?.isPreview);
    nav(`/section/${s.id}/level/${l.id}/result`,{state:{score:correctCount,total:totalCount,xpDelta,isPreview,newAchievements:result?.data?.newAchievements||[],newCharacters:result?.data?.newCharacters||[]}});
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
    {available&&<button className="listen tap" type="button" onClick={()=>play(toKana(q.questionJa))}><Volume2 size={17}/> {speaking?'止める · Berhenti':'聞く · Dengarkan soal'}</button>}
    <div className="choices">{q.choices.map((c,i)=><ChoiceCard key={`${q.id}-${i}-${phase}-${qi}`} choice={c} choiceId={q.choiceIds?.[i]||''} index={i} selected={selected} correctIndex={q.correctIndex} onAnswer={answer} mode={quizMode} setMode={setQuizMode}/>)}</div>
    {selected!==null && <ExplanationBox q={q}/>}
    <div className="quizFooter">{submitErr&&<div className="submitError" role="alert">{submitErr}</div>}<button className="primary big tap" disabled={selected===null||saving} onClick={next}>{nextLabel} <ChevronRight/></button></div>
  </main>;
}

/* ---------- Practice / Latihan — unlimited random dari semua section ---------- */

function Practice(){
  const [q,setQ]=useState(()=>randomQuestion());
  const [selected,setSelected]=useState(null);
  const [answered,setAnswered]=useState(0);
  const [correct,setCorrect]=useState(0);
  const [popup,setPopup]=useState(null);
  const [quizMode,setQuizMode]=useLangMode();
  const {available,speaking,play}=useTTS();
  const answer=(i)=>{
    if(selected!==null) return;
    setSelected(i);
    setAnswered(a=>a+1);
    const isCorrect = i===q.correctIndex;
    setPopup(isCorrect);
    if(isCorrect) setCorrect(c=>c+1);
  };
  const nextQuestion=()=>{ setQ(randomQuestion(q.id)); setSelected(null); };
  return <main className="page quizPage">
    {popup!==null && <AnswerPopup correct={popup} onClose={()=>setPopup(null)}/>}
    <div className="practiceHero">
      <CharArt variant="practice" size="sm"/>
      <span className="quizModeBadge"><Shuffle size={12}/> Practice · unlimited</span>
      <p className="muted">Soal acak dari semua section — {answered} dijawab, {correct} benar. XP tidak resmi & tidak memengaruhi unlock.</p>
    </div>
    <div className="quizTop"><span>{q.sectionTitleId} · {q.levelTitleId}</span></div>
    <QuestionFlipCard q={q} mode={quizMode} setMode={setQuizMode} key={`pq-${q.id}`}/>
    {available&&<button className="listen tap" type="button" onClick={()=>play(toKana(q.questionJa))}><Volume2 size={17}/> {speaking?'止める · Berhenti':'聞く · Dengarkan soal'}</button>}
    <div className="choices">{q.choices.map((c,i)=><ChoiceCard key={`${q.id}-${i}`} choice={c} choiceId={q.choiceIds?.[i]||''} index={i} selected={selected} correctIndex={q.correctIndex} onAnswer={answer} mode={quizMode} setMode={setQuizMode}/>)}</div>
    {selected!==null && <ExplanationBox q={q}/>}
    <div className="quizFooter"><button className="primary big tap" type="button" disabled={selected===null} onClick={nextQuestion}>Soal berikutnya <ChevronRight/></button></div>
  </main>;
}

function Result(){
  const {sectionId,levelId}=useParams();const {state}=useLocation();const s=getSection(sectionId),l=getLevel(sectionId,levelId);
  const toast=useAchToast();
  // Unlock karakter + achievement dari submit ini — tampil toast di Result.
  useEffect(()=>{toast([...(state?.newCharacters||[]).map(id=>({_kind:'char',id})),...(state?.newAchievements||[])])},[]);
  // Guard wajib: baris flowButtons di bawah deref s.levelCount & s.id tanpa optional chaining,
  // jadi /section/99/level/99/result (atau param non-numerik) bikin TypeError -> layar putih.
  // Lima komponen ber-param lain sudah pakai pola yang sama; Result ketinggalan.
  if(!s||!l)return <Navigate to="/belajar"/>;
  // state null (refresh / hard-nav) dulu render "LEVEL COMPLETE 0/5" + XP palsu.
  if(state===null)return <Navigate to={`/section/${s.id}/level/${levelId}`} replace/>;
  const xp = state?.xpDelta ?? ((state?.score||0)*10+30);
  const isPerfect = state?.score===state?.total;
  const isPreview = Boolean(state?.isPreview);
  return <main className="page result">
    {isPerfect && !isPreview && <Confetti/>}
    <CharArt variant={isPerfect?'perfect':'good'} size="lg"/>
    <p className="eyebrow">{isPreview?'PREVIEW ATTEMPT':'LEVEL COMPLETE ✨'}</p>
    <h1>{state?.score||0} / {state?.total||5}</h1>
    <p className="muted">{isPreview?'Latihan preview — belum resmi completed sampai prasyarat sebelumnya selesai.':(isPerfect?'完璧！Perfect!':'Bagus, terus latihan sedikit lagi.')}</p>
    <div className="resultStats"><b>+{xp} XP</b><span>Materi: {l?.titleId}</span></div>
    <div className="flowButtons"><Link className="primary big tap" to={Number(levelId)<s.levelCount?`/section/${s.id}/level/${Number(levelId)+1}`:`/section/${s.id}/recap`}>Level berikutnya <ChevronRight/></Link><Link className="secondary big tap" to={`/section/${s.id}/level/${levelId}/quiz`}><RotateCcw/> Ulangi</Link></div>
  </main>;
}

function Recap(){const {sectionId}=useParams(),s=getSection(sectionId);if(!s)return <Navigate to="/belajar"/>;return <main className="page result"><div className="sectionHero"><span>{s.icon}</span><div><small>RECAP</small><h1>{s.titleJa}</h1><p>Section review · {s.titleId}</p></div></div><CharArt variant="recap" size="md"/><h2>Siap diuji?</h2><p className="muted">Soal campuran dari semua level di section ini.</p><Link className="primary big tap" to={`/section/${s.id}/level/1/quiz`}>Mulai recap <Star/></Link></main>;}

function Glossary(){return <GlossaryPage/>;}

function Profile(){
  const {user, isAuthenticated, logout} = useAuth();
  const {totalXp, streakCurrent, completedCount, loading} = useProgress();
  const nav = useNavigate();
  // User baru (belum menyelesaikan onboarding) diarahkan ke wizard, sekali saja.
  // Guard-nya cek gender+handle, bukan hanya onboarded_step, supaya user lama yang
  // memang sudah lengkap tidak pernah diseret ke wizard.
  if(isAuthenticated && user && user.onboardedStep!=='done' && (!user.gender || !user.handle)) return <Navigate to="/onboarding" replace/>;
  const doLogout = async ()=>{ await logout(); nav('/'); };
  if(loading) return <main className="page profile"><KawaiiLoader label="Memuat profil…"/></main>;
  return <main className="page profile">
    <div className="profileCard">
      {isAuthenticated ? <Avatar characterId={user?.characterId} frame={user?.avatarFrame} size={84}/> : <CharArt variant="profile" size="md"/>}
      <h1>{isAuthenticated ? `Halo, ${user?.displayName || user?.name || user?.email}` : "Kenshi's care journey"}</h1>
      {isAuthenticated && user?.handle && <span className="handleChip">@{user.handle}</span>}
      <p className="muted">{isAuthenticated ? 'Progress kamu tersimpan otomatis di akun.' : 'Login biar progress kamu tersimpan permanen.'}</p>
      <div className="stats">
        <div><b>{totalXp}</b><small>total XP</small></div>
        <div><b>{streakCurrent}</b><small>day streak</small></div>
        <div><b>{completedCount}</b><small>levels</small></div>
      </div>
    </div>
    <div className="socialLinks">
      <Link className="tap" to="/friends"><Users size={21}/> Teman</Link>
      <Link className="tap" to="/leaderboard"><Trophy size={21}/> Peringkat</Link>
      <Link className="tap" to="/achievements"><Medal size={21}/> Achievement</Link>
    </div>
    {isAuthenticated ? <>
      <ProfileEditor/>
      <div className="tip" style={{marginTop:16}}><Star fill="#ffb73b"/> <span><b>Pelan saja</b><br/>Tidak harus sempurna. Yang penting jalan terus.</span></div>
      <button className="secondary big tap" style={{marginTop:16}} onClick={doLogout}>Logout</button>
    </> : <>
      <div className="tip"><Star fill="#ffb73b"/> <span><b>Pelan saja</b><br/>Tidak harus sempurna. Yang penting jalan terus.</span></div>
      <Link className="primary big tap" style={{marginTop:16}} to="/login">Login dengan email</Link>
    </>}
  </main>;
}

/* Terapkan karakter + tema pilihan user ke root (doc 49: karakter menentukan
   skin). Keluar/di-logout → atribut dicabut (momo default). */
function ThemeApply(){
  const {user} = useAuth();
  // Mode gelap dipasang lebih dulu & tidak bergantung sesi: tamu di /login pun
  // dapat mode yang sama, dan tidak ada kedipan terang saat profil selesai dimuat.
  useEffect(()=>{applyDark(readDark())},[]);
  useEffect(()=>{
    // themeSkinOf memetakan nilai DB lama (kitty/sakura/matcha/yozora) ke tiga
    // palet yang ada sekarang, jadi baris lama tidak perlu dimigrasi.
    const skin = themeSkinOf(user?.theme);
    if(skin==='momo') document.documentElement.removeAttribute('data-theme');
    else document.documentElement.setAttribute('data-theme',skin);
    applyChar(user?.characterId||'momo');
  },[user?.theme,user?.characterId]);
  return null;
}

/* v8 (doc 50): gerbang sesi. Semua route belajar dibungkus sini; kalau belum login
   lempar ke /login?next=<tujuan> supaya magic-link balikin user ke halaman yang sama. */
function RequireAuth(){
  const {status}=useAuth();
  const loc=useLocation();
  if(status==='loading')return <main><KawaiiLoader label="Memeriksa sesi…"/></main>;
  if(status!=='authenticated')return <Navigate to={`/login?next=${encodeURIComponent(loc.pathname+loc.search)}`} replace/>;
  return <Outlet/>;
}

/* Landing — halaman terbuka satu-satunya selain /login. Karena mode tamu dihapus,
   ini pintu masuk; harus jelas dalam 5 detik apa isinya dan kenapa perlu email. */
function Landing(){
  const {status}=useAuth();
  if(status==='authenticated')return <Navigate to="/belajar" replace/>;
  return <main className="page landingPage"><div className="landingCard">
    <CharArt variant="home" size="md"/>
    <p className="eyebrow">KENSHI KAIGO E-LEARNING</p>
    <h1>Belajar 介護福祉士<br/>dengan bahasa Indonesia</h1>
    <ul className="landingPoints">
      <li>13 bab · 152 level</li>
      <li>Soal ujian asli 2021–2026</li>
      <li>Furigana, romaji, terjemahan</li>
      <li>Gratis</li>
    </ul>
    <Link className="primary big tap" to="/login">Masuk dengan email</Link>
    <p className="landingNote">Tanpa password — kami kirim tautan sekali pakai ke email kamu.</p>
  </div></main>;
}

function AppShell(){
  return <BrowserRouter><ThemeApply/><Shell><Suspense fallback={<main className="page"><KawaiiLoader/></main>}><Routes>
    <Route path="/" element={<Landing/>}/>
    <Route path="/login" element={<Login/>}/>
    {/* v8 (doc 50): WAJIB LOGIN. Semua route belajar butuh sesi; tamu diarahkan ke
        /login?next=<tujuan> dan magic-link mengembalikan mereka ke tujuan itu. */}
    <Route element={<RequireAuth/>}>
      <Route path="/belajar" element={<Home/>}/>
      <Route path="/onboarding" element={<OnboardingWizard/>}/>
      <Route path="/friends" element={<FriendsPage/>}/>
      <Route path="/leaderboard" element={<LeaderboardPage/>}/>
      <Route path="/achievements" element={<AchievementsPage/>}/>
      <Route path="/profile" element={<Profile/>}/>
      <Route path="/glossary" element={<Glossary/>}/>
      <Route path="/glossary/:slug" element={<GlossaryDetail/>}/>
      <Route path="/final" element={<FinalHome/>}/>
      <Route path="/final/unlimited" element={<UnlimitedFinal/>}/>
      <Route path="/final/:year" element={<FinalYear/>}/>
      <Route path="/final/:year/part/:part" element={<FinalQuiz/>}/>
      <Route path="/final/:year/part/:part/result" element={<FinalResult/>}/>
      <Route path="/practice" element={<Practice/>}/>
      <Route path="/section/:sectionId" element={<SectionOverview/>}/>
      <Route path="/section/:sectionId/recap" element={<Recap/>}/>
      <Route path="/section/:sectionId/level/:levelId" element={<LevelHub/>}/>
      <Route path="/section/:sectionId/level/:levelId/materi" element={<Materi/>}/>
      <Route path="/section/:sectionId/level/:levelId/quiz" element={<Quiz/>}/>
      <Route path="/section/:sectionId/level/:levelId/result" element={<Result/>}/>
    </Route>
    <Route path="*" element={<Navigate to="/"/>}/>
  </Routes></Suspense></Shell></BrowserRouter>;
}

function App(){
  return <ToastProvider><AuthProvider><ProgressProvider><AppShell/></ProgressProvider></AuthProvider></ToastProvider>;
}

createRoot(document.getElementById('root')).render(<App/>);
