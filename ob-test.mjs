import {chromium} from 'playwright';
const TOKEN=process.argv[2],OUT='C:/Users/lenov/AppData/Local/Temp/claude/D--CodePaid-kenshi-kaigo-e-learning/416d8fa1-9fa4-406a-8868-30df33c64476/scratchpad/shots';
const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:1280,height:900}});const p=await ctx.newPage();
const errs=[],net=[];
p.on('console',m=>{if(m.type()==='error')errs.push(m.text().slice(0,150))});
p.on('response',async r=>{if(r.url().includes('/api/')&&r.status()>=400)net.push(`${r.status()} ${r.url().split('/api/')[1]} ${(await r.text().catch(()=>'')).slice(0,120)}`)});
await p.goto(`https://kaigo.wyna.dev/api/auth/verify?token=${TOKEN}`,{waitUntil:'networkidle'});
console.log('URL:',p.url());
await p.waitForTimeout(1500);
await p.screenshot({path:`${OUT}/onb1.png`});
console.log('teks:',(await p.locator('main').innerText().catch(()=>'-')).slice(0,300).replace(/\n/g,' | '));
// klik gender pertama
const g=p.locator('.obChoice');console.log('pilihan gender:',await g.count());
if(await g.count()){await g.nth(1).click();await p.waitForTimeout(800);await p.screenshot({path:`${OUT}/onb2.png`});
  const c=p.locator('.obChar');console.log('pilihan karakter:',await c.count());
  if(await c.count()>1){await c.nth(1).click();await p.waitForTimeout(500)}
  const lanjut=p.locator('button:has-text("Lanjut")');console.log('tombol Lanjut:',await lanjut.count());
  if(await lanjut.count()){await lanjut.first().click();await p.waitForTimeout(2500);
    await p.screenshot({path:`${OUT}/onb3.png`});
    console.log('setelah lanjut URL:',p.url());
    console.log('teks:',(await p.locator('main').innerText().catch(()=>'-')).slice(0,250).replace(/\n/g,' | '));
    const inp=p.locator('input');if(await inp.count()){await inp.first().fill('ujicoba1');await p.waitForTimeout(300);
      const simpan=p.locator('button:has-text("Simpan")');if(await simpan.count()){await simpan.first().click();await p.waitForTimeout(2500);
        console.log('setelah handle URL:',p.url());console.log('teks:',(await p.locator('main').innerText().catch(()=>'-')).slice(0,200).replace(/\n/g,' | '));
        await p.screenshot({path:`${OUT}/onb4.png`})}}}}
console.log('API errors:',net.length?net:'0');
console.log('console errors:',errs.length?errs.slice(0,4):'0');
await b.close();
