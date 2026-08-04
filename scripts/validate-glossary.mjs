import fs from 'node:fs';
const doc=JSON.parse(fs.readFileSync('src/content/glossary.json','utf8'));
const terms=doc.terms||doc;const errors=[];const slugs=new Set();const kanji=new Set();
for(const t of terms){
 if(!/^[a-z0-9-]+$/.test(t.slug)||slugs.has(t.slug))errors.push(`slug invalid/duplicate: ${t.slug}`);slugs.add(t.slug);
 if(kanji.has(t.kanji))errors.push(`kanji duplicate: ${t.kanji}`);kanji.add(t.kanji);
 if(!t.kanji||!t.reading||!t.romaji||!t.id?.short)errors.push(`required field missing: ${t.slug}`);
 if(!/^[\u3041-\u3096ー]+$/.test(t.reading))errors.push(`reading invalid: ${t.slug}=${t.reading}`);
 if((t.related||[]).some(r=>!slugs.has(r)&&!terms.some(x=>x.slug===r)))errors.push(`related missing: ${t.slug}`);
}
if(errors.length){console.error(errors.join('\n'));process.exit(1)}
console.log(`Glossary valid: ${terms.length} entries, ${slugs.size} unique slugs, 0 errors`);
