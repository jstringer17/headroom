import { chromium } from 'playwright';
const out='sitemaker/qa/out-fencing-real/';
import fs from 'fs'; fs.mkdirSync(out,{recursive:true});
const IM='org/art/pictures/fencing/fencing-';
const b = await chromium.launch();
const p = await b.newPage({viewport:{width:1500,height:950}});
p.on('pageerror',e=>console.log('pageerror',e.message.slice(0,120)));
await p.goto('file://'+process.cwd()+'/sitemaker/maker.html'); await p.waitForTimeout(1500);
await p.fill('#company','Cedar & Post Fencing'); await p.selectOption('#trade','fencing'); await p.fill('#city','Tulsa, OK'); await p.fill('#phone','9185550142'); await p.waitForTimeout(1200);
const map={stakes:'stakes.webp',posts:'posts.webp',rails:'rails.webp',done:'done.webp'};
const ids = await p.$$eval('#cine-slots .slot',els=>els.map(e=>e.dataset.slot)); console.log('slots',ids.join(','));
for (const [slot,file] of Object.entries(map)) {
  const inp = p.locator(`#cine-slots .slot[data-slot="${slot}"] input[type=file]`);
  if (await inp.count()) { await inp.setInputFiles(IM+file); await p.waitForTimeout(1200); console.log('uploaded',slot); } else console.log('no input for',slot);
}
await p.waitForTimeout(1500);
for (const look of ['editorial','cinematic']) {
  await p.selectOption('#look',look); await p.waitForTimeout(1500);
  const html = await p.evaluate(()=>document.getElementById('frame').srcdoc);
  fs.writeFileSync(out+look+'.html',html);
  console.log(look,'bytes',html.length);
  const q = await b.newPage({viewport:{width:1280,height:800}});
  await q.setContent(html,{waitUntil:'load'}); await q.waitForTimeout(2000);
  const H = await q.evaluate(()=>document.documentElement.scrollHeight);
  const ys = look==='editorial' ? [0,1500,2900] : [0,1200,2400,3600];
  let i=0; for (const y of ys) { await q.evaluate(v=>window.scrollTo(0,v),y); await q.waitForTimeout(1400); await q.screenshot({path:out+`${look}-${i++}.jpg`,type:'jpeg',quality:62}); }
  console.log(look,'height',H); await q.close();
}
await b.close();
