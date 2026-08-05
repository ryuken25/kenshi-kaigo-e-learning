import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { buildIndex, searchGlossary, topTerms, highlight, getBySlug } from './lib/glossarySearch.js';
import glossaryData from './content/glossary.index.json';

const PAGE=24, STATE_KEY='kk_glossary_state';
buildIndex(glossaryData.terms);
const saveGlossaryState=(q,section,loaded)=>{try{sessionStorage.setItem(STATE_KEY,JSON.stringify({q,section,loaded,scrollY:window.scrollY}))}catch{}};

export function GlossaryPage(){
 const [params,setParams]=useSearchParams(),q=params.get('q')||'',section=params.get('section')?Number(params.get('section')):null;
 const [input,setInput]=useState(q),[loaded,setLoaded]=useState(PAGE);const newItemRef=useRef(null),restored=useRef(false);
 useEffect(()=>{setInput(q)},[q]);
 useEffect(()=>{const t=setTimeout(()=>{if(input===q)return;const n=new URLSearchParams(params);input?n.set('q',input):n.delete('q');setParams(n,{replace:true});setLoaded(PAGE)},150);return()=>clearTimeout(t)},[input,q,params,setParams]);
 const {results,total}=useMemo(()=>searchGlossary(q,{limit:loaded,section}),[q,loaded,section]),top=useMemo(()=>topTerms(10),[]);
 useEffect(()=>{if(restored.current)return;restored.current=true;try{const s=JSON.parse(sessionStorage.getItem(STATE_KEY)||'null');if(s&&s.q===q&&s.section===section){setLoaded(s.loaded);requestAnimationFrame(()=>window.scrollTo(0,s.scrollY))}}catch{}},[q,section]);
 const changeSection=s=>{const n=new URLSearchParams(params);s?n.set('section',s):n.delete('section');setParams(n,{replace:true});setLoaded(PAGE)};
 const loadMore=()=>{setLoaded(n=>n+PAGE);requestAnimationFrame(()=>newItemRef.current?.focus())};const remaining=total-results.length;
 return <main className="page glossaryPage"><div className="glossaryHero"><div><p className="eyebrow">用語カード · KAIGO KITTY</p><h1 className="pageTitle">Daftar Istilah</h1><p className="muted">{glossaryData.terms.length} istilah untuk belajar kaigo</p></div><span className="glossaryHeroEmoji">📖</span></div>
  <div className="glossarySearchWrap"><label className="sr-only" htmlFor="gsearch">Cari istilah</label><input id="gsearch" className="search glossarySearch" type="search" value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==='Escape'&&setInput('')} placeholder="Cari kanji, kana, romaji, Indonesia..." inputMode="search" autoComplete="off" autoCorrect="off" spellCheck={false}/>{input&&<button type="button" className="glossaryClear" onClick={()=>setInput('')} aria-label="Bersihkan pencarian">×</button>}</div>
  <p className="glossaryHint">Coba: 尊厳 · そんげん · songen · martabat · dignity</p><p className="sr-only" aria-live="polite">{total} istilah ditemukan</p>
  {!q&&<section className="glossaryTop"><h2>Paling sering keluar</h2><p className="muted">Dihitung dari kemunculan di soal dan materi.</p><div className="glossaryChips">{top.map((t,i)=><Link key={t.slug} to={`/glossary/${t.slug}`} onClick={()=>saveGlossaryState(q,section,loaded)} className="glossaryChip"><b>{i+1}</b><strong>{t.kanji}</strong><small>{t.occurrences}×</small></Link>)}</div></section>}
  <div className="glossaryFilters"><button className={!section?'active':''} onClick={()=>changeSection(null)}>Semua</button>{Array.from({length:13},(_,i)=>i+1).map(s=><button key={s} className={section===s?'active':''} onClick={()=>changeSection(String(s))}>S{s}</button>)}</div><p className="muted glossaryCount">{total} dari {glossaryData.terms.length} istilah</p>
  {total===0?<div className="glossaryEmpty"><p>Tidak ada istilah yang cocok dengan “{q}”.</p><button className="secondary" onClick={()=>setInput('')}>Lihat semua istilah</button></div>:<div className="glossaryGrid">{results.map((t,i)=><Link key={t.slug} to={`/glossary/${t.slug}`} className="glossaryCard" onClick={()=>saveGlossaryState(q,section,loaded)} ref={i===loaded-PAGE?newItemRef:null}><small>{t.reading}</small><b>{highlight(t.kanji,q).map((p,j)=>p.hit?<mark key={j}>{p.t}</mark>:<span key={j}>{p.t}</span>)}</b><span>{t.romaji}</span><p>{t.id.short}</p>{t.occurrences>0&&<em>{t.occurrences}×</em>}</Link>)}</div>}
  {remaining>0?<button className="primary big glossaryMore" onClick={loadMore}>Muat lebih banyak ({remaining})</button>:total>PAGE&&<p className="glossaryDone">Semua istilah sudah ditampilkan 🌸</p>}
 </main>;
}

export function GlossaryDetail(){
 const {slug}=useParams();const term=getBySlug(slug);
 useEffect(()=>{if(term){document.title=`${term.kanji} (${term.romaji}) — Istilah Kaigo Kitty`};return()=>{document.title='Kaigo Kitty'}},[term]);
 if(!term)return <main className="page glossaryEmpty"><h1>Istilah tidak ditemukan</h1><Link className="primary" to="/glossary">Kembali ke glossary</Link></main>;
 return <main className="page glossaryDetail"><Link to="/glossary" className="back">← Daftar istilah</Link><section className="detailHero"><small>{term.reading}</small><h1>{term.kanji}</h1><p>{term.romaji}</p><strong>{term.id.short}</strong></section><section className="detailSection"><h2>Penjelasan</h2><p>{term.id.long}</p><small className="detailSourceNote">Penjelasan belajar Kaigo Kitty · verifikasi prosedur tetap ikuti instruksi fasilitas dan tenaga berwenang.</small></section>{term.kanjiBreakdown?.length>0&&<section className="detailSection"><h2>Bedah kanji</h2>{term.kanjiBreakdown.map((k,i)=><div className="kanjiBreakdown" key={i}><b>{k.char}</b><span>{k.on} / {k.kun}</span><small>{k.meaning}</small></div>)}</section>}{term.examples?.length>0&&<section className="detailSection"><h2>Contoh</h2>{term.examples.map((e,i)=><div className="exampleBox" key={i}><b>{e.ja}</b><p>{e.id}</p></div>)}</section>}<section className="detailSection"><h2>Section</h2><div className="detailTags">{term.sections.map(s=><Link key={s} to={`/section/${s}`}>Section {s}</Link>)}</div></section>{term.related?.length>0&&<section className="detailSection"><h2>Istilah terkait</h2><div className="detailTags">{term.related.map(r=><Link key={r} to={`/glossary/${r}`}>{getBySlug(r)?.kanji||r}</Link>)}</div></section>}{term.external&&<a className="externalGlossary" href={term.external} target="_blank" rel="noreferrer">Lihat di Kenshi Kanji N4 →</a>}</main>;
}
