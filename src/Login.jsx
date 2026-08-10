import React,{useState} from 'react';
import {Link} from 'react-router-dom';
import {ChevronRight,Check,Heart,Trophy,Users,Sparkles} from 'lucide-react';
import {useAuth} from './context/AuthContext.jsx';
import {useCharExpr} from './lib/social.jsx';
function Mascot(){const src=useCharExpr('idle');return <div className="mascotImg size-md"><img src={src} alt="Maskot Kenshi"/></div>}
/* Login revamp (v7): tetap magic-link tanpa password, tapi jelaskan apa yang didapat
   setelah login — streak permanen, teman, papan peringkat, achievement, tema.
   Redirect ke /onboarding ditangani halaman /profile (Profile cek onboarded_step). */
export default function Login(){
  const {refresh} = useAuth();
  const [email,setEmail]=useState(''),[state,setState]=useState('idle');
  // v8: RequireAuth melempar ke /login?next=<tujuan> — next ikut masuk magic link
  // dan server 302 ke sana setelah verify, jadi user mendarat di halaman asalnya.
  const next=new URLSearchParams(window.location.search).get('next')||'';
  const submit=async e=>{e.preventDefault();setState('sending');try{const r=await fetch('/api/auth/magic-link',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,next})});const d=await r.json();if(!r.ok)throw Error(d.message||d.error);setState('sent')}catch(e){setState(e.message||'error')}};
  return <main className="page authPage"><Mascot/><h1>Masuk dulu, yuk</h1><p className="muted">Kami kirim tautan ajaib ke emailmu. Tanpa password, 20 detik selesai.</p>
    {state==='sent'?<div className="objective"><Check/><div><b>Link sudah dikirim ✨</b><p>Cek inbox {email}. Link berlaku 20 menit dan sekali pakai. Klik dari perangkat ini ya.</p></div></div>
      :<form className="authForm" onSubmit={submit}><label>Email kamu<input required type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com"/></label><button className="primary big tap" disabled={state==='sending'}>{state==='sending'?'Mengirim…':'Kirim magic link'} <ChevronRight/></button>{state!=='idle'&&state!=='sending'&&<small className="authError">{state}</small>}</form>}
    <div className="loginPerks">
      <span><Heart/> Streak & XP tersimpan permanen di akunmu</span>
      <span><Users/> Teman & papan peringkat mingguan</span>
      <span><Trophy/> 35 achievement + bingkai avatar eksklusif</span>
      <span><Sparkles/> 4 tema tampilan: Kitty, Sora, Matcha, Yozora</span>
    </div>
    <p className="authNote" style={{marginTop:14}}>Tautannya berlaku 20 menit dan sekali pakai.</p><Link className="back" to="/">‹ Kembali</Link></main>}
