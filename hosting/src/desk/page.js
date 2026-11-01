// The Customer Desk page. Same plain look as public/index.html. Client code uses no backticks or ${} (this is a template string).
export const PAGE = `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Customer Desk</title>
<style>
:root{--bg:#f6f7f9;--panel:#fff;--ink:#14171f;--muted:#667085;--line:#e4e7ec;--brand:#1f5eff;--hot:#d92d20;--hot-soft:#fef3f2;--warm:#b54708;--warm-soft:#fffaeb;--cool:#067647;--cool-soft:#ecfdf3;--gray-soft:#f2f4f7;--radius:10px}
@media(prefers-color-scheme:dark){:root{--bg:#0d1117;--panel:#161b22;--ink:#e6edf3;--muted:#8b949e;--line:#2a313c;--brand:#5b8cff;--hot:#ff7b72;--hot-soft:#3a1b1b;--warm:#e3a008;--warm-soft:#33270b;--cool:#3fb950;--cool-soft:#12301c;--gray-soft:#21262d}}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--ink);font:14px/1.45 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;overflow-x:hidden}
header{display:flex;align-items:center;gap:12px;padding:14px 24px;background:var(--panel);border-bottom:1px solid var(--line)}
header h1{font-size:17px;margin:0;font-weight:700}
main{padding:20px 24px 60px;max-width:1500px;margin:0 auto}
.stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;margin-bottom:16px}
.stat{background:var(--panel);border:1px solid var(--line);border-radius:var(--radius);padding:14px 16px}
.stat b{display:block;font-size:24px;font-weight:700}.stat span{color:var(--muted);font-size:12.5px}
.filters{display:flex;flex-wrap:wrap;gap:8px;align-items:center;background:var(--panel);border:1px solid var(--line);border-radius:var(--radius);padding:12px;margin-bottom:12px}
.filters input,.filters select{border:1px solid var(--line);background:var(--bg);color:var(--ink);border-radius:8px;padding:7px 10px;font:inherit;max-width:100%}
.filters input[type=search]{flex:1;min-width:160px}
.filters label{color:var(--muted);font-size:12.5px;display:flex;align-items:center;gap:6px}
.btn{border:1px solid var(--line);background:var(--panel);color:var(--ink);border-radius:8px;padding:6px 10px;font:inherit;font-size:13px;cursor:pointer}
.btn.danger{color:var(--hot)}
.table-wrap{background:var(--panel);border:1px solid var(--line);border-radius:var(--radius)}
table{width:100%;border-collapse:collapse}
th{text-align:left;font-size:12px;font-weight:600;color:var(--muted);padding:10px 12px;border-bottom:1px solid var(--line);white-space:nowrap;cursor:pointer;user-select:none}
td{padding:10px 12px;border-bottom:1px solid var(--line);vertical-align:top}
.name{font-weight:600}.sub{color:var(--muted);font-size:12.5px}
.badge{display:inline-block;padding:2px 8px;border-radius:99px;font-size:12px;font-weight:500;white-space:nowrap}
.st-live,.rv-ok{background:var(--cool-soft);color:var(--cool)}.st-paused,.rv-stale{background:var(--warm-soft);color:var(--warm)}
.st-off,.rv-none,.bad{background:var(--hot-soft);color:var(--hot)}.st-draft{background:var(--gray-soft);color:var(--muted)}
.up{background:#eef4ff;color:var(--brand)}
.acts{display:flex;flex-wrap:wrap;gap:4px}
a{color:var(--brand);text-decoration:none}
.empty{padding:40px;text-align:center;color:var(--muted)}
#toast{position:fixed;left:50%;bottom:16px;transform:translateX(-50%);background:var(--ink);color:var(--bg);padding:8px 14px;border-radius:8px;display:none;max-width:90vw}
@media(max-width:760px){
 main{padding:12px 16px 40px}header{padding:12px 16px}
 thead{display:none}table,tbody,tr,td{display:block;width:100%}
 tr{padding:10px 12px;border-bottom:1px solid var(--line)}
 td{border:0;padding:3px 0;display:flex;gap:8px;justify-content:space-between;overflow-wrap:anywhere}
 td::before{content:attr(data-l);color:var(--muted);flex:0 0 38%}
 td.first{display:block}td.first::before{content:none}
}
</style></head><body>
<header><h1>Customer Desk</h1><span class="sub" id="asof"></span></header>
<main>
<section class="stats" id="stats"></section>
<section class="filters">
 <input type="search" id="q" placeholder="Search name, trade, domain...">
 <select id="fStatus"><option value="">All statuses</option><option>live</option><option>paused</option><option>off</option><option>draft</option></select>
 <label><input type="checkbox" id="fFail"> Failed payments</label>
 <label><input type="checkbox" id="fUp"> Ready for upsell</label>
</section>
<div class="table-wrap"><table><thead><tr id="head"></tr></thead><tbody id="rows"></tbody></table><div class="empty" id="empty" hidden>No customers match.</div></div>
</main><div id="toast"></div>
<script>
var COLS=[['name','Customer'],['trade','Trade'],['domain','Domain'],['status','Status'],['plan','Plan'],['paidThrough','Paid through'],['mrrCents','MRR'],['leadsMonth','Leads (month / last)'],['reviews','Google reviews'],['lastPublish','Last publish'],['','Actions']];
var data=null,sortKey='name',asc=true;
function h(tag,props,kids){var e=document.createElement(tag);for(var k in (props||{})){if(k==='text')e.textContent=props[k];else if(k==='onclick')e.onclick=props[k];else e.setAttribute(k,props[k]);}(kids||[]).forEach(function(c){if(c)e.appendChild(typeof c==='string'?document.createTextNode(c):c);});return e;}
function money(c){return '$'+(c/100).toFixed(c%100?2:0);}
function day(s){return s?String(s).slice(0,10):'-';}
function toast(t){var e=document.getElementById('toast');e.textContent=t;e.style.display='block';setTimeout(function(){e.style.display='none';},3500);}
function api(path,post){return fetch(path,{method:post?'POST':'GET',headers:{'x-desk':'1'}}).then(function(r){return r.json().then(function(j){if(!r.ok)throw new Error(j.error||r.status);return j;});});}
function copy(path,label){api(path).then(function(j){if(navigator.clipboard)navigator.clipboard.writeText(j.url);toast(label+' copied');}).catch(function(e){toast(e.message);});}
function act(c,what,ask){if(ask&&!confirm(ask))return;api('/api/sites/'+encodeURIComponent(c.id)+'/'+what,true).then(function(){toast('Done');load();}).catch(function(e){toast(e.message);});}
function load(){api('/api/customers').then(function(d){data=d;render();});}
function render(){
 var t=data.totals;document.getElementById('asof').textContent=day(data.now);
 var st=document.getElementById('stats');st.textContent='';
 [['Live sites',t.live],['MRR',money(t.mrrCents)],['Failed payments',t.failedPayments],['Leads this month',t.leadsMonth],['Ready for upsell',t.readyForUpsell]].forEach(function(s){st.appendChild(h('div',{'class':'stat'},[h('b',{text:String(s[1])}),h('span',{text:s[0]})]));});
 var hd=document.getElementById('head');hd.textContent='';
 COLS.forEach(function(c){hd.appendChild(h('th',{text:c[1]+(c[0]===sortKey?(asc?' \\u2191':' \\u2193'):''),onclick:function(){if(!c[0])return;if(sortKey===c[0])asc=!asc;else{sortKey=c[0];asc=true;}render();}}));});
 var q=document.getElementById('q').value.toLowerCase(),fs=document.getElementById('fStatus').value,ff=document.getElementById('fFail').checked,fu=document.getElementById('fUp').checked;
 var list=data.customers.filter(function(c){return (!q||(c.name+' '+c.trade+' '+c.domain).toLowerCase().indexOf(q)>=0)&&(!fs||c.status===fs)&&(!ff||c.failedPayment)&&(!fu||c.readyForUpsell);});
 list.sort(function(a,b){var x=a[sortKey],y=b[sortKey];return (x<y?-1:x>y?1:0)*(asc?1:-1);});
 var tb=document.getElementById('rows');tb.textContent='';
 document.getElementById('empty').hidden=list.length>0;
 list.forEach(function(c){
  var tr=h('tr');
  function td(l,kids,cls){tr.appendChild(h('td',{'data-l':l,'class':cls||''},kids));}
  td('',[h('div',{'class':'name',text:c.name}),h('div',{'class':'sub',text:c.ownerEmail}),c.readyForUpsell?h('span',{'class':'badge up',text:'ready for upsell'}):null],'first');
  td('Trade',[c.trade||'-']);
  td('Domain',[c.domain?h('a',{href:'https://'+c.domain,target:'_blank',rel:'noopener',text:c.domain}):'-']);
  td('Status',[h('span',{'class':'badge st-'+c.status,text:c.status}),c.failedPayment?h('span',{'class':'badge bad',text:'payment failed'}):null]);
  td('Plan',[(c.plan||'-')+(c.addons.length?' + '+c.addons.join(', '):'')]);
  td('Paid through',[day(c.paidThrough)]);
  td('MRR',[c.mrrCents?money(c.mrrCents):'-']);
  td('Leads',[c.leadsMonth+' / '+day(c.lastLead)]);
  td('Reviews',[h('span',{'class':'badge rv-'+c.reviews,text:c.reviews+(c.reviewCount?' ('+c.reviewCount+')':'')})]);
  td('Last publish',[day(c.lastPublish)]);
  var a=h('div',{'class':'acts'});
  a.appendChild(h('button',{'class':'btn',text:'Checkout link',onclick:function(){copy('/api/sites/'+encodeURIComponent(c.id)+'/checkout','Checkout link');}}));
  if(c.hasCustomer)a.appendChild(h('button',{'class':'btn',text:'Portal',onclick:function(){api('/api/sites/'+encodeURIComponent(c.id)+'/portal').then(function(j){window.open(j.url,'_blank','noopener');}).catch(function(e){toast(e.message);});}}));
  if(c.domain)a.appendChild(h('a',{'class':'btn',href:'https://'+c.domain,target:'_blank',rel:'noopener',text:'Open site'}));
  if(c.status==='live')a.appendChild(h('button',{'class':'btn danger',text:'Pause',onclick:function(){act(c,'pause','Pause '+c.name+'? Visitors will see a not-active page.');}}));
  if(c.status==='paused')a.appendChild(h('button',{'class':'btn',text:'Resume',onclick:function(){act(c,'resume','Resume '+c.name+'?');}}));
  if(c.ownerEmail&&c.domain)a.appendChild(h('button',{'class':'btn',text:'Send login link',onclick:function(){act(c,'login-link','Email a login link to '+c.ownerEmail+'?');}}));
  td('',[a],'first');
  tb.appendChild(tr);
 });
}
['q','fStatus','fFail','fUp'].forEach(function(i){document.getElementById(i).addEventListener('input',function(){if(data)render();});});
load();
</script></body></html>`;
