// Jaga sinkronisasi jumlah level per section antara content generator (src/data.js `plans`),
// sumber kebenaran sisi server (api/_sections.mjs SECTION_LEVELS), dan CHECK constraint di
// scripts/005_section_level_ranges.sql.
// Duplikasi konstanta tanpa detector inilah asal bug LEVELS_PER_SECTION=17.
import fs from 'node:fs';
import path from 'node:path';
import { sections } from '../src/data.js';
import { SECTION_LEVELS, SECTION_COUNT, levelsInSection, meetsSectionGate, levelsNeededForGate } from '../api/_sections.mjs';
const errors=[];
const actual=sections.map(s=>s.levels.length);
if(sections.length!==SECTION_COUNT)errors.push(`section count mismatch: src/data.js=${sections.length} api/_sections.mjs=${SECTION_COUNT}`);
sections.forEach((s,i)=>{
 if(s.id!==i+1)errors.push(`section id not sequential at index ${i}: got ${s.id}`);
 if(s.levelCount!==s.levels.length)errors.push(`section ${s.id}: levelCount=${s.levelCount} but ${s.levels.length} levels generated (plans topics array mismatch)`);
 if(s.levels.length!==SECTION_LEVELS[i])errors.push(`section ${s.id}: src/data.js has ${s.levels.length} levels, api/_sections.mjs says ${SECTION_LEVELS[i]}`);
 s.levels.forEach((l,j)=>{if(l.id!==j+1)errors.push(`section ${s.id}: level id not sequential at index ${j}: got ${l.id}`)});
});
// Gate 80% harus konsisten: section 100% completed WAJIB lolos gate-nya sendiri, dan
// threshold-1 WAJIB gagal (bukti tidak ada off-by-one di integer math-nya).
for(let s=1;s<=SECTION_COUNT;s++){
 const total=levelsInSection(s);const need=levelsNeededForGate(s);
 if(!meetsSectionGate(total,s))errors.push(`section ${s}: fully completed (${total}/${total}) fails its own 80% gate`);
 if(!meetsSectionGate(need,s))errors.push(`section ${s}: threshold ${need}/${total} should pass gate but fails`);
 if(need>0&&meetsSectionGate(need-1,s))errors.push(`section ${s}: ${need-1}/${total} should fail gate but passes`);
 if(meetsSectionGate(0,s))errors.push(`section ${s}: 0 completed should never pass gate`);
}
if(meetsSectionGate(5,0)||meetsSectionGate(5,SECTION_COUNT+1))errors.push('out-of-range sectionId must never pass gate');
// Kopi keempat dari angka ini ada di CHECK constraint scripts/005_section_level_ranges.sql.
// File itu belum di-apply, tapi tetap divalidasi supaya tidak ikut menyimpang diam-diam.
const sqlPath=path.join(import.meta.dirname,'005_section_level_ranges.sql');
if(fs.existsSync(sqlPath)){
 const sqlText=fs.readFileSync(sqlPath,'utf8');
 const arrays=[...sqlText.matchAll(/ARRAY\[([\d,\s]+)\]/g)].map(m=>m[1].split(',').map(x=>Number(x.trim())));
 if(!arrays.length)errors.push('005_section_level_ranges.sql: tidak ada literal ARRAY[...] — pola berubah?');
 arrays.forEach((arr,i)=>{
  if(arr.length!==SECTION_COUNT||arr.some((v,j)=>v!==SECTION_LEVELS[j]))
   errors.push(`005_section_level_ranges.sql: ARRAY ke-${i+1} [${arr.join(',')}] != SECTION_LEVELS [${SECTION_LEVELS.join(',')}]`);
 });
 // Replikasi splitStatements() dari run-migration.mjs: file dipecah pada titik-koma TANPA
 // memahami komentar, jadi titik-koma di komentar prosa akan terkirim ke server sebagai
 // statement sampah. Daripada menebak lewat regex, jalankan pemecahnya dan pastikan setiap
 // statement yang keluar benar-benar SQL.
 const stripped=sqlText.replace(/^\s*BEGIN;\s*$/gm,'').replace(/^\s*COMMIT;\s*$/gm,'');
 const chunks=[];let cur='',inDollar=false;
 for(let i=0;i<stripped.length;){
  if(stripped.slice(i,i+2)==='$$'){inDollar=!inDollar;cur+='$$';i+=2;continue}
  const ch=stripped[i];
  if(ch===';'&&!inDollar){cur+=ch;if(cur.trim())chunks.push(cur.trim());cur=''}else cur+=ch;
  i++;
 }
 if(cur.trim())chunks.push(cur.trim());
 const live=chunks.map(s=>s.replace(/--.*$/gm,'').trim()).filter(s=>s.length>0);
 for(const stmt of live){
  if(!/^(DO|ALTER|CREATE|DROP|SELECT|INSERT|UPDATE|DELETE|BEGIN|COMMIT|ROLLBACK|SET|GRANT|COMMENT|WITH)\b/i.test(stmt))
   errors.push(`005_section_level_ranges.sql: run-migration.mjs akan mengirim statement sampah ke server: "${stmt.slice(0,70).replace(/\n/g,' ')}" — kemungkinan ada titik-koma di komentar prosa`);
 }
}
if(errors.length){console.error(errors.join('\n'));process.exit(1)}
console.log(`Sections valid: ${SECTION_COUNT} sections, [${actual.join(',')}] levels, ${actual.reduce((a,b)=>a+b,0)} total, gate thresholds [${SECTION_LEVELS.map((_,i)=>levelsNeededForGate(i+1)).join(',')}], src/data.js + api/_sections.mjs + 005_section_level_ranges.sql in sync, 0 errors`);
