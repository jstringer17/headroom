// DRAFT by chief of staff 2026-10-28: drives the REAL maker.html and tests every control. Fix the playwright import to match sitemaker/qa/lib.mjs, then promote to sitemaker/test-features.mjs and run on every push.
import { chromium } from '/opt/node-tools/node_modules/playwright/index.mjs';
const SRC='file:///home/user/agency/sitemaker/maker.html';
const b = await chromium.launch();
const ctx = await b.newContext({viewport:{width:1500,height:950},permissions:['clipboard-read','clipboard-write'],acceptDownloads:true});
const p = await ctx.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message.slice(0,100)));
await p.goto(SRC); await p.waitForTimeout(1500);
const res=[]; const ok=(n,c,d='')=>{res.push([c?'PASS':'FAIL',n,d]);};
const html=()=>p.evaluate(()=>document.getElementById('frame').srcdoc);
const strip=(h)=>h.replace(/data:image\/[a-z]+;base64,[A-Za-z0-9+\/=]+/g,'IMG');
const settle=()=>p.waitForTimeout(900);
await p.fill('#company','Ridgeline Roofing'); await p.selectOption('#trade','roofing'); await settle();
// COLORS across looks
for (const look of ['editorial','cinematic','classic']) {
  await p.selectOption('#look',look); await settle();
  const seen={}; 
  for (const th of ['navy','forest','steel','sky']) { await p.check('#theme-'+th,{force:true}).catch(async()=>{await p.click(`label[for="theme-${th}"]`)}); await settle(); seen[th]=strip(await html()); }
  const uniq=new Set(Object.values(seen)).size;
  ok(`Colors change the ${look} site (4 swatches -> distinct outputs)`, uniq===4, `distinct=${uniq}`);
}
await p.selectOption('#look','editorial'); await settle();
// Text fields
await p.fill('#city','Tulsa, OK'); await p.fill('#phone','9185550142'); await p.fill('#rating','4.8'); await p.fill('#reviews','112'); await p.fill('#years','12'); await settle();
let h=await html();
ok('Town shows', h.includes('Tulsa'));
ok('Phone shows + tel link', h.includes('(918) 555-0142') && h.includes('tel:+19185550142'));
ok('Stars/reviews show', h.includes('4.8') && h.includes('112'));
ok('Years shows', /12 years/i.test(h));
await p.check('#emergency'); await settle(); h=await html(); ok('24/7 checkbox shows 24/7 text', /24\/7|24 hours/i.test(h));
await p.uncheck('#freeEstimates'); await settle(); h=await html(); ok('Free estimates off changes wording', /Ask for a price|Price first|price/i.test(h) && !/Get a free estimate/.test(h));
await p.check('#freeEstimates');
await p.check('#insured'); await settle(); h=await html(); ok('Licensed and insured shows', /Licensed and insured/i.test(h));
// services
const svc=await p.$$('#services input'); const first=await svc[0].getAttribute('value');
await svc[0].uncheck(); await settle(); h=await html(); ok('Unticking a service removes it', !h.includes('>'+first+'<') || !new RegExp('(^|>)'+first.replace(/[()]/g,'')+'(<)').test(h), first);
await svc[0].check();
// trade change
await p.selectOption('#trade','hvac'); await settle(); h=await html(); ok('Changing trade changes headline', /Heating and air/i.test(h));
await p.selectOption('#trade','roofing'); await settle();
// phone / computer toggle
const w1=await p.evaluate(()=>document.getElementById('frame').getBoundingClientRect().width); await p.click('#view-desk'); await settle(); const w2=await p.evaluate(()=>document.getElementById('frame').getBoundingClientRect().width); ok('Phone/Computer toggle resizes preview', w2>w1+200, `${Math.round(w1)} -> ${Math.round(w2)}`); await p.click('#view-phone');
// lead paste
await p.evaluate(()=>{document.getElementById('lead-box').open=true}); await p.fill('#lead-paste','Apex Fence Co\n(918) 555-0199\n4.6 (88 reviews)\nBroken Arrow, OK'); await p.click('#lead-fill'); await settle();
ok('Lead paste fills the form', (await p.inputValue('#company'))==='Apex Fence Co' && (await p.inputValue('#phone')).includes('555') , `trade=${await p.inputValue('#trade')}`);
// price ranges
await p.fill('#company','Ridgeline Roofing'); await p.selectOption('#trade','fencing'); await settle();
const priceInputs=await p.$$('#cine-prices input[type=number], #cine-prices input[type=text]'); ok('Price range inputs exist for Fencing', priceInputs.length>=2, `count=${priceInputs.length}`);
if (priceInputs.length>=2){ await priceInputs[0].fill('22'); await priceInputs[1].fill('34'); await settle(); h=await html(); ok('Typed price range shows in estimator', /\$22/.test(h) && /\$34/.test(h)); }
// project cards typed
const edInputs=await p.$$('#ed-projects input'); ok('Editorial project-card inputs exist', edInputs.length>0, `count=${edInputs.length}`);
if (edInputs.length){ await edInputs[0].fill('Maple Court Job'); await settle(); h=await html(); ok('Typed project text shows', h.includes('Maple Court Job')); }
// library toggle
const lib=await p.$('input[type=checkbox][id*=lib]'); if(lib){ h=await html(); const withLib=(strip(h).match(/IMG/g)||[]).length; await lib.uncheck(); await settle(); const noLib=(strip(await html()).match(/IMG/g)||[]).length; ok('Library checkbox toggles real pictures', withLib>0 && noLib<withLib, `${withLib} -> ${noLib}`); await lib.check(); await settle(); }
// hero url
await p.fill('#hero-url','https://example.com/pic.jpg'); await settle(); h=await html(); ok('Hero picture link used', h.includes('https://example.com/pic.jpg')); await p.fill('#hero-url','');
// copy / download / prompt
await p.click('#copy'); await p.waitForTimeout(500); const clip=await p.evaluate(()=>navigator.clipboard.readText().catch(()=>'')); ok('Copy code copies the site', clip.startsWith('<!doctype html'), `len=${clip.length}`);
const dl=p.waitForEvent('download',{timeout:5000}).catch(()=>null); await p.click('#download'); const d=await dl; ok('Download site saves an .html file', !!d && /\.html$/.test(d.suggestedFilename()), d?d.suggestedFilename():'no download');
await p.click('#higgs-copy'); await p.waitForTimeout(400); const pr=await p.evaluate(()=>navigator.clipboard.readText().catch(()=>'')); ok('Copy Higgsfield prompt works', pr.length>50 && /No people/.test(pr));
ok('No page errors', errs.length===0, errs.join(' | '));
for (const r of res) console.log(r.join(' | '));
await b.close();
