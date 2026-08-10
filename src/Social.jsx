import React,{useEffect,useState} from 'react';
import {Navigate} from 'react-router-dom';
import {ChevronRight,Search,UserPlus,Check,X,Users,Trophy,Medal,Sparkles} from 'lucide-react';
import {useAuth} from './context/AuthContext.jsx';
import {THEMES,GENDERS,CHARACTERS,CHARACTER_IDS,GENDER_PAIRS,COMING_SOON,charPath,applyChar,CATEGORY_META,FRAME_META,HANDLE_RE,patchProfile,friendsAction,Avatar,useAchToast} from './lib/social.jsx';

/* ============================================================================
   KOMPONEN SOSIAL — onboarding, teman, papan peringkat, achievement, editor profil.
   Semua data dari API baru (api/profile.mjs, friends.mjs, leaderboard.mjs,
   achievements.mjs). Tamu (belum login) diarahkan ke /login.
   ========================================================================== */

const themeDotClass = (key)=>`themeDot${key.charAt(0).toUpperCase()}${key.slice(1)}`;
const REL_LABEL = {self:'Kamu',friend:'Teman',incoming:'Minta berteman',outgoing:'Menunggu',blocked:'Diblokir',none:'Belum berteman'};

/* ---------- Onboarding: gender+karakter → handle (doc 49: karakter menentukan tema) ---------- */
export function OnboardingWizard({onDone}){
  const {user,refresh,isAuthenticated} = useAuth();
  const toast = useAchToast();
  const step = user?.onboardedStep === 'handle' ? 'handle' : 'gender';
  const [gender,setGender] = useState(user?.gender || null);
  const [charId,setCharId] = useState(user?.characterId || 'momo');
  const [handle,setHandle] = useState(user?.handle || '');
  const [saving,setSaving] = useState(false);
  const [error,setError] = useState('');
  // Guard SETELAH semua hook — hook order harus konsisten antar render.
  if(!isAuthenticated) return <Navigate to="/login" replace/>;

  // Pilih gender → tampilkan pasangan awal gender itu; karakter default ikut.
  const pickGender = (g)=>{
    setGender(g.value);
    if(!GENDER_PAIRS[g.value]?.includes(charId)) setCharId(g.value==='male'?'sora':'momo');
  };
  const pickChar = (id)=>{
    setCharId(id);
    applyChar(id); // skin ganti instan bahkan sebelum disimpan
  };

  const submitIdentity = async ()=>{
    if(!gender) return setError('Pilih salah satu dulu ya.');
    setSaving(true); setError('');
    const r = await patchProfile({gender,characterId:charId,onboardedStep:'handle'});
    setSaving(false);
    if(!r.ok) return setError(r.data?.message || 'Gagal menyimpan — coba lagi.');
    toast(r.data.newAchievements);
    await refresh();
  };

  const submitHandle = async ()=>{
    const h = handle.trim().toLowerCase();
    if(!HANDLE_RE.test(h)) return setError('Handle: 4-14 karakter, huruf kecil, angka, atau underscore.');
    setSaving(true); setError('');
    const r = await patchProfile({handle:h,onboardedStep:'done'});
    setSaving(false);
    if(!r.ok){
      if(r.data?.error==='handle_taken') return setError('Handle sudah dipakai orang lain.');
      if(r.data?.error==='handle_reserved') return setError('Handle ini dicadangkan sistem.');
      if(r.data?.error==='handle_cooldown') return setError('Handle baru bisa diganti 7 hari lagi.');
      return setError(r.data?.message || 'Gagal menyimpan.');
    }
    toast(r.data.newAchievements);
    await refresh();
    onDone?.();
  };

  const skipHandle = async ()=>{
    setSaving(true);
    const r = await patchProfile({onboardedStep:'done'});
    setSaving(false);
    if(r.ok) await refresh();
    onDone?.();
  };

  if(step==='handle') return <main className="page onboarding">
    <p className="obStep">Langkah 2 dari 2</p>
    <h1>Buat handle-mu 🏷️</h1>
    <p className="muted">ID unik ini dipakai teman untuk mencari & menambah kamu. Huruf kecil saja, 4-14 karakter. Bisa diganti tiap 7 hari.</p>
    <form className="handleForm" onSubmit={e=>{e.preventDefault();submitHandle();}}>
      <label>Handle<input value={handle} onChange={e=>setHandle(e.target.value.toLowerCase())} placeholder="cth: kenshi_satu" maxLength={14} autoFocus/></label>
      {error && <small className="obError">{error}</small>}
      <button className="primary big tap" disabled={saving}>{saving?'Menyimpan…':'Simpan & mulai'} <ChevronRight/></button>
    </form>
    <button className="obSkip" onClick={skipHandle} disabled={saving}>Lewati dulu — atur nanti di profil</button>
  </main>;

  return <main className="page onboarding">
    <p className="obStep">Langkah 1 dari 2</p>
    <h1>Kenalan dulu yuk 👋</h1>
    <p className="muted">Pilih teman belajarmu — karakter menentukan warna tema aplikasimu.</p>
    <div className="obChoices">
      {GENDERS.map(g=><button key={g.value} type="button" className={`obChoice tap ${gender===g.value?'on':''}`} onClick={()=>pickGender(g)}><span>{g.emoji}</span>{g.label}</button>)}
    </div>
    {gender && <>
      <p className="obHint">Pilih karaktermu:</p>
      <div className="obCharGrid">
        {(GENDER_PAIRS[gender]||['momo']).map(id=><button key={id} type="button" className={`obChar tap ${charId===id?'on':''}`} onClick={()=>pickChar(id)}>
          <img src={charPath(id,'idle')} alt={CHARACTERS[id].name}/>
          <b>{CHARACTERS[id].name}</b>
          <small>{CHARACTERS[id].species} · {CHARACTERS[id].desc}</small>
        </button>)}
      </div>
      <div className="obPreview"><Avatar characterId={charId} size={72}/></div>
    </>}
    {error && <small className="obError">{error}</small>}
    <div className="flowButtons" style={{padding:'0 0 10px'}}><button className="primary big tap" onClick={submitIdentity} disabled={saving||!gender}>{saving?'Menyimpan…':'Lanjut'} <ChevronRight/></button></div>
  </main>;
}

/* ---------- Editor profil (dipakai halaman Profile saat login) ---------- */
export function ProfileEditor(){
  const {refresh} = useAuth();
  const toast = useAchToast();
  const [data,setData] = useState(null);
  const [displayName,setDisplayName] = useState('');
  const [handle,setHandle] = useState('');
  const [busy,setBusy] = useState(false);
  const [msg,setMsg] = useState('');

  const load = async ()=>{
    try{
      const r = await fetch('/api/profile',{credentials:'same-origin'});
      if(!r.ok) return;
      const d = await r.json();
      setData(d);
      setDisplayName(d.profile.displayName || '');
      setHandle(d.profile.handle || '');
    }catch{}
  };
  useEffect(()=>{load()},[]);
  if(!data) return null;
  const p = data.profile;

  const save = async (fields,label)=>{
    setBusy(true); setMsg('');
    const r = await patchProfile(fields);
    setBusy(false);
    if(!r.ok){
      const map = {handle_taken:'Handle sudah dipakai orang lain.',handle_reserved:'Handle ini dicadangkan sistem.',handle_cooldown:`Handle baru bisa diganti lagi setelah ${new Date(r.data.retryAt).toLocaleDateString('id-ID')}.`};
      return setMsg(map[r.data?.error] || r.data?.message || 'Gagal menyimpan.');
    }
    toast(r.data.newAchievements);
    setData(d=>({...d,profile:r.data.profile,handleCooldownEndsAt:r.data.handleCooldownEndsAt}));
    if(fields.theme || fields.avatarKey || fields.handle || fields.characterId) await refresh(); // tema/karakter langsung kepakai app
    setMsg(`${label} tersimpan ✓`);
  };

  const cooldownActive = p.handle && data.handleCooldownEndsAt && Date.now() < new Date(data.handleCooldownEndsAt).getTime();

  return <div className="profileEdit">
    <div className="editRow">
      <input value={displayName} onChange={e=>setDisplayName(e.target.value)} placeholder="Nama tampilan" maxLength={24} aria-label="Nama tampilan"/>
      <button className="secondary tap" disabled={busy || !displayName.trim() || displayName.trim()===p.displayName} onClick={()=>save({displayName:displayName.trim()},'Nama')}>Simpan</button>
    </div>
    <div className="editRow">
      <input value={handle} onChange={e=>setHandle(e.target.value.toLowerCase())} placeholder="handle_kamu" maxLength={14} aria-label="Handle"/>
      <button className="secondary tap" disabled={busy || cooldownActive || !handle.trim() || handle.trim()===(p.handle||'')} onClick={()=>save({handle:handle.trim()},'Handle')}>{cooldownActive?'Terkunci':'Simpan'}</button>
    </div>
    {cooldownActive && <p className="cooldownNote">Handle bisa diganti lagi setelah {new Date(data.handleCooldownEndsAt).toLocaleDateString('id-ID',{day:'numeric',month:'long',year:'numeric'})} (aturan 7 hari).</p>}
    <div><p className="muted" style={{margin:'4px 0 8px'}}>Karakter <small style={{fontWeight:400}}>· tema warna mengikuti karakter, ganti kapan saja</small></p>
      <div className="charGrid">{CHARACTER_IDS.map(id=>{const unlocked=(p.charactersUnlocked||[]).includes(id),soon=COMING_SOON.includes(id);
        return <button key={id} type="button" disabled={!unlocked} className={`charTile tap ${p.characterId===id?'on':''} ${!unlocked?'locked':''}`} onClick={()=>unlocked&&p.characterId!==id&&save({characterId:id},'Karakter')}>
          <img src={charPath(id,'idle')} alt={CHARACTERS[id].name}/>
          <b>{CHARACTERS[id].name}</b>
          <small>{unlocked?CHARACTERS[id].species:soon?'Segera hadir':'Belum terbuka'}</small>
        </button>;})}
      </div>
    </div>
    <div><p className="muted" style={{margin:'4px 0 8px'}}>Visibilitas di papan peringkat global</p>
      <div className="visibilityToggle">
        <button className={p.visibility==='public'?'on':''} onClick={()=>p.visibility!=='public'&&save({visibility:'public'},'Visibilitas')}>🌐 Publik</button>
        <button className={p.visibility==='private'?'on':''} onClick={()=>p.visibility!=='private'&&save({visibility:'private'},'Visibilitas')}>🔒 Privat</button>
      </div>
    </div>
    {msg && <p className="cooldownNote" style={{color:msg.includes('✓')?'#4c8a4a':'#df5879',fontWeight:600}}>{msg}</p>}
  </div>;
}

/* ---------- Halaman teman ---------- */
export function FriendsPage(){
  const {status} = useAuth();
  const toast = useAchToast();
  const [data,setData] = useState(null);
  const [tab,setTab] = useState('friends');
  const [q,setQ] = useState('');
  const [result,setResult] = useState(undefined); // undefined=belum cari, null=tak ditemukan
  const [busy,setBusy] = useState(false);

  const load = async ()=>{
    try{
      const r = await fetch('/api/friends',{credentials:'same-origin'});
      if(r.ok) setData(await r.json());
    }catch{}
  };
  useEffect(()=>{load()},[]);
  if(status!=='authenticated') return <main className="page"><div className="emptyState"><span>🔒</span>Login dulu untuk memakai fitur teman.<br/><a className="primary tap" style={{display:'inline-flex',marginTop:12}} href="/login">Masuk</a></div></main>;

  const act = async (action,handle,after)=>{
    setBusy(true);
    const r = await friendsAction(action,handle);
    setBusy(false);
    if(r.ok){
      toast(r.data.newAchievements);
      await load();
      if(after==='clearSearch') setResult(undefined);
      else if(after==='refreshSearch') search(handle);
    } else setResult(prev=>prev ? {...prev,_err:r.data?.message||'Gagal.'} : prev);
  };

  const search = async (val)=>{
    const h = String(val ?? q).trim().toLowerCase();
    if(!h) return;
    try{
      const r = await fetch(`/api/friends?q=${encodeURIComponent(h)}`,{credentials:'same-origin'});
      const d = await r.json();
      setResult(d.result); // null kalau tidak ditemukan
    }catch{}
  };

  if(!data) return <main className="page"><div className="emptyState"><span>🐾</span>Memuat…</div></main>;

  const list = tab==='friends' ? data.friends : tab==='incoming' ? data.incoming : data.outgoing;

  return <main className="page">
    <h1 className="pageTitle">Teman <span>· {data.friends.length} berteman</span></h1>
    <div className="friendSearchRow">
      <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Cari handle teman… cth: kenshi_satu" onKeyDown={e=>e.key==='Enter'&&search()}/>
      <button className="secondary tap" onClick={()=>search()} aria-label="Cari"><Search size={16}/></button>
    </div>
    {result !== undefined && (result===null
      ? <div className="resultCard"><div className="friendInfo"><b>Tidak ditemukan</b><small>Pastikan handle-nya benar (huruf kecil semua).</small></div></div>
      : <div className="resultCard">
          <Avatar characterId={result.characterId} frame={result.avatarFrame} size={44}/>
          <div className="friendInfo"><b>{result.displayName}</b><small>@{result.handle} · {result.totalXp} XP</small></div>
          <span className={`relPill ${result.relationship}`}>{REL_LABEL[result.relationship]}</span>
          <div className="friendActions">
            {result.relationship==='none' && <button className="tap" onClick={()=>act('request',result.handle,'refreshSearch')} disabled={busy}><UserPlus size={13}/> Tambah</button>}
            {result.relationship==='incoming' && <button className="tap" onClick={()=>act('accept',result.handle,'refreshSearch')} disabled={busy}><Check size={13}/> Terima</button>}
            {result.relationship==='outgoing' && <button className="tap ghost" onClick={()=>act('cancel',result.handle,'refreshSearch')} disabled={busy}>Batalkan</button>}
            {result.relationship==='friend' && <button className="tap ghost" onClick={()=>act('remove',result.handle,'refreshSearch')} disabled={busy}>Hapus</button>}
            {result.relationship==='blocked' && <button className="tap ghost" onClick={()=>act('unblock',result.handle,'refreshSearch')} disabled={busy}>Buka blokir</button>}
          </div>
          {result._err && <small className="obError" style={{width:'100%'}}>{result._err}</small>}
        </div>)}
    <div className="friendsTabs">
      <button className={tab==='friends'?'on':''} onClick={()=>setTab('friends')}>Teman ({data.friends.length})</button>
      <button className={tab==='incoming'?'on':''} onClick={()=>setTab('incoming')}>Masuk {data.incoming.length>0&&<em>{data.incoming.length}</em>}</button>
      <button className={tab==='outgoing'?'on':''} onClick={()=>setTab('outgoing')}>Keluar ({data.outgoing.length})</button>
    </div>
    {list.length===0
      ? <div className="emptyState"><span>{tab==='friends'?'🌸':'💌'}</span>{tab==='friends'?'Belum ada teman. Cari seseorang lewat handle di kotak atas!':tab==='incoming'?'Belum ada permintaan masuk.':'Belum ada permintaan keluar.'}</div>
      : list.map(u=><div className="friendRow" key={u.handle}>
          <Avatar characterId={u.characterId} frame={u.avatarFrame} size={44}/>
          <div className="friendInfo"><b>{u.displayName}</b><small>@{u.handle} · {u.totalXp} XP · streak {u.streak}</small></div>
          <div className="friendActions">
            {tab==='incoming' && <><button className="tap" onClick={()=>act('accept',u.handle)} disabled={busy}><Check size={13}/> Terima</button><button className="tap ghost" onClick={()=>act('decline',u.handle)} disabled={busy}><X size={13}/></button></>}
            {tab==='outgoing' && <button className="tap ghost" onClick={()=>act('cancel',u.handle)} disabled={busy}>Batalkan</button>}
            {tab==='friends' && <><button className="tap ghost danger" onClick={()=>act('remove',u.handle)} disabled={busy}>Hapus</button><button className="tap ghost" onClick={()=>act('block',u.handle)} disabled={busy}>Blokir</button></>}
          </div>
        </div>)}
  </main>;
}

/* ---------- Papan peringkat mingguan ---------- */
export function LeaderboardPage(){
  const {status,user} = useAuth();
  const toast = useAchToast();
  const [tab,setTab] = useState('friends');
  const [data,setData] = useState(null);

  useEffect(()=>{
    let live = true;
    (async ()=>{
      try{
        const r = await fetch(`/api/leaderboard?scope=${tab}`,{credentials:'same-origin'});
        if(!r.ok) return;
        const d = await r.json();
        if(live){ setData(d); if(tab==='global') toast(d.newAchievements); }
      }catch{}
    })();
    return ()=>{live=false};
  },[tab]);

  if(status!=='authenticated') return <main className="page"><div className="emptyState"><span>🔒</span>Login dulu untuk melihat papan peringkat.<br/><a className="primary tap" style={{display:'inline-flex',marginTop:12}} href="/login">Masuk</a></div></main>;

  return <main className="page">
    <h1 className="pageTitle">Papan Peringkat <span>· XP minggu ini</span></h1>
    <div className="lbTabs">
      <button className={tab==='friends'?'on':''} onClick={()=>{setTab('friends');setData(null)}}><Users size={13} style={{display:'inline',verticalAlign:'-2px'}}/> Teman</button>
      <button className={tab==='global'?'on':''} onClick={()=>{setTab('global');setData(null)}}><Trophy size={13} style={{display:'inline',verticalAlign:'-2px'}}/> Global Top 100</button>
    </div>
    <div className="lbMeta"><span>{tab==='friends'?'Lingkaran temanmu + kamu':'Hanya profil publik · top 100'}</span><span>Reset tiap Senin 00.00 (Jepang) 🕛</span></div>
    {!data ? <div className="emptyState"><span>🐾</span>Memuat papan…</div> : <>
      {data.rows.length===0
        ? <div className="emptyState"><span>{tab==='friends'?'🌸':'🏆'}</span>{tab==='friends'?'Belum ada yang tampil. Tambah teman dulu!':'Belum ada XP mingguan dari profil publik.'}</div>
        : data.rows.map(r=><div className={`lbRow ${r.isMe?'isMe':''} ${r.rank===1?'top1':''}`} key={r.handle}>
            <span className="lbRank">{r.rank===1?'👑':r.rank}</span>
            <Avatar characterId={r.characterId} frame={r.avatarFrame} size={40}/>
            <div className="lbInfo"><b>{r.displayName}{r.isMe?' (kamu)':''}</b><small>@{r.handle} · streak {r.streak}</small></div>
            <span className="lbXp">{r.weeklyXp} XP</span>
          </div>)}
      {tab==='global' && data.me && <div className="lbMe">
        <Avatar characterId={user?.characterId} frame={user?.avatarFrame} size={40}/>
        <div><b>Posisimu: #{data.me.rank}{data.me.delta!==null && data.me.delta!==0 && <span className={`lbDelta ${data.me.delta>0?'up':'down'}`}> {data.me.delta>0?'▲':'▼'}{Math.abs(data.me.delta)}</span>}</b>
        <small>{data.me.weeklyXp} XP minggu ini{!data.me.inTop?' · di luar top 100, terus kejar!':''}{data.me.handle===null?'':' · @'+data.me.handle}</small></div>
        <Medal size={18} style={{color:'var(--gold-deep)',marginLeft:'auto'}}/>
      </div>}
      {tab==='global' && data.me===null && <p className="cooldownNote">Set handle & pilih visibilitas "Publik" di profil untuk ikut papan global.</p>}
    </>}
  </main>;
}

/* ---------- Halaman achievement + bingkai avatar ---------- */
export function AchievementsPage(){
  const {status,user} = useAuth();
  const [data,setData] = useState(null);

  useEffect(()=>{
    (async ()=>{
      try{
        const r = await fetch('/api/achievements',{credentials:'same-origin'});
        if(r.ok) setData(await r.json());
      }catch{}
    })();
  },[]);

  if(status!=='authenticated') return <main className="page"><div className="emptyState"><span>🔒</span>Login dulu untuk mengumpulkan achievement.<br/><a className="primary tap" style={{display:'inline-flex',marginTop:12}} href="/login">Masuk</a></div></main>;
  if(!data) return <main className="page"><div className="emptyState"><span>🐾</span>Memuat…</div></main>;

  const groups = Object.entries(CATEGORY_META).map(([cat,meta])=>({cat,meta,items:data.achievements.filter(a=>a.category===cat)})).filter(g=>g.items.length);

  return <main className="page">
    <h1 className="pageTitle">Achievement <span>· {data.unlockedCount}/{data.achievements.length}</span></h1>
    <div className="achHeader">
      <Avatar characterId={user?.characterId} frame={data.currentFrame} size={76}/>
      <p className="achCount">{data.unlockedCount} terbuka <small>· bingkai: {FRAME_META[data.currentFrame]?.emoji||'—'} {FRAME_META[data.currentFrame]?.label||'Polos'}</small></p>
      <div className="frameLadder">
        {data.frameTiers.map((t,i)=>{
          const on = data.unlockedCount >= t.min;
          const next = !on && data.frameTiers.slice(0,i).every(x=>data.unlockedCount>=x.min);
          return <span key={t.frame} className={on?'on':next?'next':''}>{FRAME_META[t.frame]?.emoji} {t.min} → {FRAME_META[t.frame]?.label}</span>;
        })}
      </div>
      <p className="cooldownNote">Bingkai otomatis terpasang di avatar, papan peringkat & daftar teman.</p>
    </div>
    {groups.map(g=><React.Fragment key={g.cat}>
      <h2 className="achCategory">{g.meta.emoji} {g.meta.label} <small>{g.items.filter(a=>a.unlocked).length}/{g.items.length}</small></h2>
      <div className="achGrid">
        {g.items.map(a=><div className={`achCard ${a.unlocked?'':'locked'}`} key={a.id}>
          <span className="achIcon">{a.icon}</span>
          <span className="achCopy"><b>{a.nameId}</b><p>{a.descId}</p></span>
          <span className="achXp">✨ {a.xpReward} XP</span>
        </div>)}
      </div>
    </React.Fragment>)}
    <p className="cooldownNote" style={{margin:'18px 0 8px'}}><Sparkles size={11} style={{display:'inline',verticalAlign:'-1px'}}/> XP dari achievement akan dibayarkan di update berikutnya — badge-nya sudah aktif sekarang.</p>
  </main>;
}
