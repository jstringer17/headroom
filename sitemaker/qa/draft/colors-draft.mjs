// DRAFT: prints the colors the visitor SEES (button, accent word, page background) for each swatch in each look. Colors must differ per swatch in Editorial and Cinematic, not only in the page code.
import { chromium } from '/opt/node-tools/node_modules/playwright/index.mjs';
import fs from 'fs';
const b = await chromium.launch();
const p = await b.newPage({viewport:{width:1500,height:950}});
await p.goto('file:///home/user/agency/sitemaker/maker.html'); await p.waitForTimeout(1500);
await p.fill('#company','Ridgeline Roofing'); await p.selectOption('#trade','roofing'); await p.waitForTimeout(800);
fs.mkdirSync('col',{recursive:true});
for (const look of ['editorial','cinematic','classic']) {
  await p.selectOption('#look',look); await p.waitForTimeout(800);
  const outs={};
  for (const th of ['navy','forest','steel','sky']) {
    await p.click(`label[for="theme-${th}"]`); await p.waitForTimeout(900);
    const h=await p.evaluate(()=>document.getElementById('frame').srcdoc);
    outs[th]=h.replace(/data:image\/[a-z]+;base64,[A-Za-z0-9+\/=]+/g,'IMG');
    // computed colors seen by the user: button + headline accent + page bg
    const fr = p.frames().find(f=>f!==p.mainFrame());
    const cols = await fr.evaluate(()=>{const g=(s)=>{const e=document.querySelector(s);return e?getComputedStyle(e).backgroundColor+' / '+getComputedStyle(e).color:'n/a'};return {body:getComputedStyle(document.body).backgroundColor,btn:g('.btn, .ed-btn, a.btn-accent, .cine-btn'),h1:g('h1'),em:(()=>{const e=document.querySelector('h1 em, h1 i, h1 .acc');return e?getComputedStyle(e).color:'n/a'})()}});
    console.log(look.padEnd(9),th.padEnd(7),JSON.stringify(cols));
  }
  // what differs between navy and forest
  const a=outs.navy.split(/(?<=[;}{])/), c=outs.forest.split(/(?<=[;}{])/);
  const diff=a.filter((x,i)=>x!==c[i]).slice(0,4).map(s=>s.slice(0,120));
  console.log('  first diffs navy vs forest:',JSON.stringify(diff));
}
await b.close();
