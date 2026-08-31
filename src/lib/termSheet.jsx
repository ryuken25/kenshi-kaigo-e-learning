// termSheet.jsx — lembar istilah yang muncul saat kanji di teks Jepang disentuh.
//
// Dipakai di TIGA layar: kartu materi, kuis level, dan kuis ujian. Sebelumnya lembar
// ini hidup sebagai JSX inline di dalam Materi (main.jsx), jadi kanji di layar kuis
// tidak bisa dibuka sama sekali — padahal justru di soal itulah istilah asing paling
// sering ditemui. Dipisah ke sini supaya FinalTest.jsx (chunk lain) bisa memakainya
// tanpa menyeret main.jsx.
//
// glossary.index.json memang sudah ikut bundle utama (Materi mengimpornya), jadi
// memakai ulang di sini tidak menambah muatan apa pun.
import React,{useMemo,useState} from 'react';
import {Link} from 'react-router-dom';
import glossaryData from '../content/glossary.index.json' with { type: 'json' };
import Furigana from '../Furigana.jsx';
import {kanaToRomaji} from './kana.js';

const PURE_KANJI=/^[一-鿿々〆ヶ]+$/;
// Judul lembar: kanji murni dianotasi supaya bacaannya ikut tampil; istilah bercampur
// katakana/angka (ADL, BPSD) dibiarkan apa adanya — RUBY_RE menuntut base kanji penuh.
export const termField=(t)=>PURE_KANJI.test(t.kanji)?{ja:`${t.kanji}[${t.reading}]`,id:t.kanji}:{ja:t.kanji,id:t.kanji};

const TERMS=glossaryData.terms;
const BY_KANJI=new Map(TERMS.map(t=>[t.kanji,t]));
/** Set kanji yang punya entri glossary — diserahkan ke prop `glossary` milik Furigana. */
export const GLOSSARY_KANJI=new Set(BY_KANJI.keys());
export const findTerm=(kanji)=>BY_KANJI.get(kanji)||null;

/** Satu hook untuk seluruh pemakaian: state + handler + elemen lembarnya. */
export function useTermSheet(mode='kanji'){
  const [term,setTerm]=useState(null);
  const openTerm=useMemo(()=>(kanji)=>{const t=findTerm(kanji);if(t)setTerm(t)},[]);
  const sheet=term?<TermSheet term={term} mode={mode} onClose={()=>setTerm(null)}/>:null;
  return {glossary:GLOSSARY_KANJI,openTerm,sheet};
}

export function TermSheet({term,mode='kanji',onClose}){
  return <div className="termSheetBackdrop" role="presentation" onClick={onClose}>
    <section className="termSheet" role="dialog" aria-modal="true" aria-label={`Istilah ${term.kanji}`} onClick={e=>e.stopPropagation()}>
      <button className="termSheetClose" onClick={onClose} aria-label="Tutup">×</button>
      {mode==='kanji'?<small>{term.reading} · {kanaToRomaji(term.reading)}</small>:<small>{kanaToRomaji(term.reading)}</small>}
      <Furigana field={termField(term)} mode={mode} as="h2" variant="xl"/>
      <p className="termSheetShort">{term.id.short}</p>
      <p>{term.id.long}</p>
      <Link className="termSheetMore" to={`/glossary/${term.slug}`}>Buka halaman lengkapnya →</Link>
    </section>
  </div>;
}
