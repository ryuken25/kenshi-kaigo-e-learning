import finalData from '../src/content/final/index.js';
const years=[2021,2022,2023,2024,2025,2026];const errors=[];
const KEYS=['1','2','3','4','5'];
for(const y of years){const d=finalData[y];if(!d||d.totalQuestions!==125||d.questions.length!==125)errors.push(`${y}: expected 125 questions`);if(d?.questions.some((q,i)=>q.no!==i+1||q.options?.length!==5||!KEYS.includes(q.answer)))errors.push(`${y}: invalid sequence/options/answer`);
// `accepted` opsional (kunci ganda / soal dianulir 全員に得点): wajib array key sah,
// >=2 entri unik, dan memuat `answer` — selain bentuk itu berarti data korup.
if(d?.questions.some(q=>q.accepted!==undefined&&(!Array.isArray(q.accepted)||q.accepted.length<2||new Set(q.accepted).size!==q.accepted.length||q.accepted.some(k=>!KEYS.includes(k))||!q.accepted.includes(q.answer))))errors.push(`${y}: invalid accepted[]`);
if(d?.parts?.length!==5||d.parts.some((p,i)=>p.part!==i+1||p.from!==i*25+1||p.to!==(i+1)*25))errors.push(`${y}: invalid parts`);}
if(errors.length){console.error(errors.join('\n'));process.exit(1)}
console.log(`Final content valid: ${years.length} years, ${years.length*125} questions, 5 parts/year, 0 errors`);
