import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { buildIndex, searchGlossary, topTerms, highlight, getBySlug } from './lib/glossarySearch.js';
import glossaryData from './content/glossary.index.json';
import Furigana from './Furigana.jsx';
import {useLangMode} from './lib/social.jsx';

const PAGE=24, STATE_KEY='kk_glossary_state';
buildIndex(glossaryData.terms);
const saveGlossaryState=(q,section,loaded)=>{try{sessionStorage.setItem(STATE_KEY,JSON.stringify({q,section,loaded,scrollY:window.scrollY}))}catch{}};
/* Toggle bahasa lokal — sengaja tidak impor LangSwitch dari main.jsx (main.jsx impor file ini).
   Pakai .finalModeSwitch: satu-satunya pill switch yang sudah block-level (width:max-content). */
const LANGS=[['kanji','漢字'],['furigana','ふり'],['id','ID']];
function LangToggle({lang,setLang}){return <div className="finalModeSwitch" role="group" aria-label="Ganti bahasa">{LANGS.map(([k,label])=><button key={k} type="button" className={lang===k?'active':''} onClick={()=>setLang(k)}>{label}</button>)}</div>}
/* Bacaan hanya bisa jadi ruby kalau base-nya kanji murni; istilah campur katakana
   (口腔ケア dll) diserahkan ke map furigana biar bracket-nya tidak bocor ke layar. */
const KANJI_ONLY=/^[一-鿿々〆ヶ]+$/;
const termField=t=>KANJI_ONLY.test(t.kanji)?{ja:`${t.kanji}[${t.reading}]`,id:t.kanji}:{ja:t.kanji,id:t.kanji};

export function GlossaryPage(){
 const [params,setParams]=useSearchParams(),q=params.get('q')||'',section=params.get('section')?Number(params.get('section')):null;
 const [input,setInput]=useState(q),[loaded,setLoaded]=useState(PAGE),[lang,setLang]=useLangMode();const newItemRef=useRef(null),restored=useRef(false);
 useEffect(()=>{setInput(q)},[q]);
 useEffect(()=>{const t=setTimeout(()=>{if(input===q)return;const n=new URLSearchParams(params);input?n.set('q',input):n.delete('q');setParams(n,{replace:true});setLoaded(PAGE)},150);return()=>clearTimeout(t)},[input,q,params,setParams]);
 const {results,total}=useMemo(()=>searchGlossary(q,{limit:loaded,section}),[q,loaded,section]),top=useMemo(()=>topTerms(10),[]);
 useEffect(()=>{if(restored.current)return;restored.current=true;try{const s=JSON.parse(sessionStorage.getItem(STATE_KEY)||'null');if(s&&s.q===q&&s.section===section){setLoaded(s.loaded);requestAnimationFrame(()=>window.scrollTo(0,s.scrollY))}}catch{}},[q,section]);
 const changeSection=s=>{const n=new URLSearchParams(params);s?n.set('section',s):n.delete('section');setParams(n,{replace:true});setLoaded(PAGE)};
 const loadMore=()=>{setLoaded(n=>n+PAGE);requestAnimationFrame(()=>newItemRef.current?.focus())};const remaining=total-results.length;
 return <main className="page glossaryPage"><div className="glossaryHero"><div><p className="eyebrow">用語カード · KENSHI KAIGO</p><h1 className="pageTitle">Daftar Istilah</h1><p className="muted">{glossaryData.terms.length} istilah untuk belajar kaigo</p></div><span className="glossaryHeroEmoji">▤</span></div>
  <div className="glossarySearchWrap"><label className="sr-only" htmlFor="gsearch">Cari istilah</label><input id="gsearch" className="search glossarySearch" type="search" value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==='Escape'&&setInput('')} placeholder="Cari kanji, kana, romaji, Indonesia..." inputMode="search" autoComplete="off" autoCorrect="off" spellCheck={false}/>{input&&<button type="button" className="glossaryClear" onClick={()=>setInput('')} aria-label="Bersihkan pencarian">×</button>}</div>
  <p className="glossaryHint">Coba: 尊厳 · そんげん · songen · martabat · dignity</p><p className="sr-only" aria-live="polite">{total} istilah ditemukan</p>
  {!q&&<section className="glossaryTop"><h2>Paling sering keluar</h2><p className="muted">Dihitung dari kemunculan di soal dan materi.</p><div className="glossaryChips">{top.map((t,i)=><Link key={t.slug} to={`/glossary/${t.slug}`} onClick={()=>saveGlossaryState(q,section,loaded)} className="glossaryChip"><b>{i+1}</b><Furigana field={termField(t)} mode={lang} as="strong"/><small>{t.occurrences}×</small></Link>)}</div></section>}
  <div className="glossaryFilters"><button className={!section?'active':''} onClick={()=>changeSection(null)}>Semua</button>{Array.from({length:13},(_,i)=>i+1).map(s=><button key={s} className={section===s?'active':''} onClick={()=>changeSection(String(s))}>S{s}</button>)}</div><LangToggle lang={lang} setLang={setLang}/><p className="muted glossaryCount">{total} dari {glossaryData.terms.length} istilah</p>
  {total===0?<div className="glossaryEmpty"><p>Tidak ada istilah yang cocok dengan “{q}”.</p><button className="secondary" onClick={()=>setInput('')}>Lihat semua istilah</button></div>:<div className="glossaryGrid">{results.map((t,i)=><Link key={t.slug} to={`/glossary/${t.slug}`} className="glossaryCard" onClick={()=>saveGlossaryState(q,section,loaded)} ref={i===loaded-PAGE?newItemRef:null}>{(lang==='kanji'||q)&&<small>{t.reading}</small>}{q?<b>{highlight(t.kanji,q).map((p,j)=>p.hit?<mark key={j}>{p.t}</mark>:<span key={j}>{p.t}</span>)}</b>:<Furigana field={termField(t)} mode={lang} as="b"/>}<span>{t.romaji}</span><p>{t.id.short}</p>{t.occurrences>0&&<em>{t.occurrences}×</em>}</Link>)}</div>}
  {remaining>0?<button className="primary big glossaryMore" onClick={loadMore}>Muat lebih banyak ({remaining})</button>:total>PAGE&&<p className="glossaryDone">Semua istilah sudah ditampilkan ✿</p>}
 </main>;
}

export function GlossaryDetail(){
 const {slug}=useParams();const term=getBySlug(slug);const [lang,setLang]=useLangMode('furigana');
 // "Cek istilah lain": bagian jelajah yang SELALU ada di halaman detail. Field `related` di
 // glossary.json kosong untuk 114/114 istilah, jadi bagian "Istilah terkait" tidak pernah tampil sama
 // sekali dan halaman ini jadi jalan buntu. Di sini tetangganya dihitung dari data yang MEMANG
 // ada: istilah lain yang berbagi section, dilengkapi sampai 6 dengan istilah terdekat menurut
 // urutan glossary supaya tidak pernah kosong.
 const tetangga=useMemo(()=>{
   if(!term)return [];
   const lain=glossaryData.terms.filter(t=>t.slug!==term.slug);
   const sekelas=lain.filter(t=>(t.sections||[]).some(s=>(term.sections||[]).includes(s)));
   const sisa=lain.filter(t=>!sekelas.includes(t));
   return [...sekelas,...sisa].slice(0,6);
 },[term]);
 useEffect(()=>{if(term){document.title=`${term.kanji} (${term.romaji}) — Istilah Kenshi Kaigo`};return()=>{document.title='Kenshi Kaigo E-Learning'}},[term]);
 if(!term)return <main className="page glossaryEmpty"><h1>Istilah tidak ditemukan</h1><Link className="primary" to="/glossary">Kembali ke glossary</Link></main>;
 return <main className="page glossaryDetail"><Link to="/glossary" className="back">← Daftar istilah</Link><section className="detailHero">{lang==='kanji'&&<small>{term.reading}</small>}<Furigana field={termField(term)} mode={lang} as="h1"/><p>{term.romaji}</p><strong>{term.id.short}</strong><LangToggle lang={lang} setLang={setLang}/></section><section className="detailSection"><h2>Penjelasan</h2><p>{term.id.long}</p><small className="detailSourceNote">Penjelasan belajar Kenshi Kaigo · verifikasi prosedur tetap ikuti instruksi fasilitas dan tenaga berwenang.</small></section>{term.kanjiBreakdown?.length>0&&<section className="detailSection"><h2>Bedah kanji</h2>{term.kanjiBreakdown.map((k,i)=><div className="kanjiBreakdown" key={i}><b>{k.char}</b><span>{k.on} / {k.kun}</span><small>{k.meaning}</small></div>)}</section>}{term.examples?.length>0&&<section className="detailSection"><h2>Contoh</h2>{term.examples.map((e,i)=><div className="exampleBox" key={i}><Furigana field={{ja:e.ja,id:e.id}} mode={lang} as="b"/>{lang!=='id'&&<p>{e.id}</p>}</div>)}</section>}<section className="detailSection"><h2>Section</h2><div className="detailTags">{term.sections.map(s=><Link key={s} to={`/section/${s}`}>Section {s}</Link>)}</div></section>{term.related?.length>0&&<section className="detailSection"><h2>Istilah terkait</h2><div className="detailTags">{term.related.map(r=><Link key={r} to={`/glossary/${r}`}>{getBySlug(r)?.kanji||r}</Link>)}</div></section>}{term.external&&<a className="externalGlossary" href={term.external} target="_blank" rel="noreferrer">Lihat di Kenshi Kanji N4 →</a>}<section className="detailSection glossaryExplore"><h2>Cek istilah lain</h2><div className="exploreGrid">{tetangga.map(t=><Link key={t.slug} to={`/glossary/${t.slug}`} className="exploreCard"><small>{t.reading}</small><b>{t.kanji}</b><span>{t.id.short}</span></Link>)}</div><Link className="exploreAll" to="/glossary">Lihat semua {glossaryData.terms.length} istilah →</Link></section></main>;
}
