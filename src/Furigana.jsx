// Furigana.jsx — SATU-SATUNYA komponen yang boleh merender ruby di seluruh app.
// Kalau ada `<ruby>` mentah di file lain, itu bug — ganti dengan komponen ini.
//
// Markup: <ruby class="fg-ruby"><span class="fg-rb">尊厳</span><rt class="fg-rt">そんげん</rt></ruby>
// Layout flex column-reverse (lihat routing.css), bukan mesin ruby bawaan browser,
// jadi bacaan tidak bisa tumpang tindih & hasilnya sama di Safari maupun Chrome.
import React,{memo,useMemo} from 'react';
import {furigana} from './furigana.generated.js';

const RUBY_RE=/([一-鿿々〆ヶ]+)\[([ぁ-ゟァ-ーー]+)\]/g;
const KANJI_RE=/[一-鿿々〆ヶ]/;

export function parseRuby(src){
  if(!src)return [];
  const out=[];let last=0,m;RUBY_RE.lastIndex=0;
  while((m=RUBY_RE.exec(src))!==null){
    if(m.index>last)out.push({t:'text',v:src.slice(last,m.index)});
    out.push({t:'ruby',base:m[1],rt:m[2]});
    last=m.index+m[0].length;
  }
  if(last<src.length)out.push({t:'text',v:src.slice(last)});
  return out;
}

export const stripRuby=(s)=>(s||'').replace(RUBY_RE,'$1');
export const toKana=(s)=>(s||'').replace(RUBY_RE,'$2');
export const hasRuby=(s)=>{RUBY_RE.lastIndex=0;return RUBY_RE.test(s||'')};

/* Ambil anotasi bracket dari map hasil kuroshiro. Dipakai di mode 'kanji' JUGA, bukan
   cuma 'furigana': elemen <ruby> harus tetap ada di mode 漢字 supaya CSS bisa nyembunyiin
   bacaannya pakai visibility:hidden TANPA mengubah tinggi baris. Kalau di mode 漢字 kita
   balikin teks polos (tanpa ruby), tinggi barisnya beda dan layout LOMPAT tiap kali user
   toggle 漢字 ⇄ ふり — dan lompatnya cuma di konten generated, nggak di s1l1.json yang
   sudah beranotasi tangan, jadi jadi inkonsisten antar level. */
function annotate(text,mode){
  if(mode==='id'||!text||!KANJI_RE.test(text)||hasRuby(text))return text;
  return furigana(text);
}

export function pickLang(field,mode){
  if(field==null)return {text:'',lang:'id',fallback:false};
  if(typeof field==='string'){
    // string tunggal = teks Jepang beranotasi/mentah. Di mode ID tidak ada terjemahan
    // terpisah, jadi tampilkan kanji-nya saja (tanpa bracket) supaya tidak bocor "[かな]".
    if(mode==='id')return {text:stripRuby(field),lang:KANJI_RE.test(field)?'ja':'id',fallback:false};
    return {text:field,lang:'ja',fallback:false};
  }
  const ja=field.ja,id=field.id;
  if(mode==='id'){
    if(id)return {text:id,lang:'id',fallback:false};
    return {text:stripRuby(ja||''),lang:'ja',fallback:true};
  }
  if(ja)return {text:ja,lang:'ja',fallback:false};
  return {text:id||'',lang:'id',fallback:true};
}

/**
 * @param field    {ja?,id?} atau string
 * @param mode     'kanji' | 'furigana' | 'id'
 * @param variant  'default' | 'opt' | 'tight' | 'lg' | 'xl'
 * @param glossary Set/array kanji yang bisa diketuk
 * @param onTerm   (kanji) => void
 */
function Furigana({field,mode='kanji',className='',as:Tag='span',variant='default',glossary,onTerm}){
  const picked=pickLang(field,mode);
  const lang=picked.lang,fallback=picked.fallback;
  const text=useMemo(()=>lang==='ja'?annotate(picked.text,mode):picked.text,[picked.text,lang,mode]);
  const tokens=useMemo(()=>lang==='ja'?parseRuby(text):null,[text,lang]);
  const variantClass=variant==='opt'?'fg--opt':variant==='tight'?'fg--tight':variant==='lg'?'fg--lg':variant==='xl'?'fg--xl':'';

  if(lang==='id')return <Tag lang="id" className={`fg fg--id ${variantClass} ${className}`} data-mode={mode}>{renderParagraphs(text)}{fallback&&<span className="fg__note"> (terjemahan belum tersedia)</span>}</Tag>;

  const isTerm=(k)=>!!glossary&&(glossary.has?glossary.has(k):glossary.includes(k))&&typeof onTerm==='function';
  return <Tag lang="ja" className={`fg ${variantClass} ${className}`} data-mode={mode}>{tokens.map((tok,i)=>{
    if(tok.t!=='ruby')return <span key={i}>{tok.v}</span>;
    const clickable=isTerm(tok.base);
    return <ruby key={i} className={`fg-ruby${clickable?' is-term':''}`}
      onClick={clickable?(e)=>{e.stopPropagation();onTerm(tok.base)}:undefined}
      role={clickable?'button':undefined} tabIndex={clickable?0:undefined}
      onKeyDown={clickable?(e)=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();onTerm(tok.base)}}:undefined}>
      <span className="fg-rb">{tok.base}</span><rt className="fg-rt">{tok.rt}</rt>
    </ruby>;
  })}</Tag>;
}

function renderParagraphs(text){
  const parts=String(text).split(/\n{2,}/);
  if(parts.length===1)return text;
  return parts.map((p,i)=><span key={i} className="fg__p">{p}</span>);
}

export default memo(Furigana);

/* Kartu compare — kanji & bacaan HARUS lewat jalur render yang sama, jangan
   ditumpuk sebagai dua elemen teks terpisah (itu bug lama: mode 漢字 & ふり identik). */
export function CompareTerm({term,mode,className='',glossary,onTerm}){
  const field={ja:`${term.kanji}[${term.reading}]`,id:term.meaningId??term.kanji};
  return <span className={`compare-term ${className}`}>
    <Furigana field={field} mode={mode} variant="lg" glossary={glossary} onTerm={onTerm}/>
    {mode!=='id'&&term.romaji&&<span className="compare-term__romaji">{term.romaji}</span>}
  </span>;
}
