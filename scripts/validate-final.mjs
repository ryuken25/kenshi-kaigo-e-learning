import finalData from '../src/content/final/index.js';
const years=[2021,2022,2023,2024,2025,2026];const errors=[];
for(const y of years){const d=finalData[y];if(!d||d.totalQuestions!==125||d.questions.length!==125)errors.push(`${y}: expected 125 questions`);if(d?.questions.some((q,i)=>q.no!==i+1||q.options?.length!==5||!['1','2','3','4','5'].includes(q.answer)))errors.push(`${y}: invalid sequence/options/answer`);if(d?.parts?.length!==5||d.parts.some((p,i)=>p.part!==i+1||p.from!==i*25+1||p.to!==(i+1)*25))errors.push(`${y}: invalid parts`);}
if(errors.length){console.error(errors.join('\n'));process.exit(1)}
console.log(`Final content valid: ${years.length} years, ${years.length*125} questions, 5 parts/year, 0 errors`);
