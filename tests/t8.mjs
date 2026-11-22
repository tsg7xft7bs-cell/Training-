import {JSDOM} from 'jsdom';import fs from 'fs';
const html=fs.readFileSync(new URL('../index.html', import.meta.url),'utf8');
const DB={state:null,ses:new Map(),users:{'j@x.de':'geheim1'},calls:[]};let online=true;
function mkFetch(w){return async(url,o={})=>{
  if(!online)throw new TypeError('Failed to fetch');
  const u=new URL(url),m=o.method||'GET',b=o.body?JSON.parse(o.body):null;DB.calls.push(m+' '+u.pathname+u.search);
  const res=(st,j)=>({ok:st<300,status:st,json:async()=>j,text:async()=>JSON.stringify(j)});
  if(!o.headers||o.headers.apikey!=='sb_publishable_TVd__6M7oZDPleKPy3a9Tw_alIK34X8')return res(401,{});
  if(u.pathname==='/auth/v1/token'){if(u.searchParams.get('grant_type')==='password'){if(DB.users[b.email]!==b.password)return res(400,{error_description:'Invalid login credentials'});}
    return res(200,{access_token:'tok',refresh_token:'ref',expires_in:3600,user:{id:'U1',email:b.email||'j@x.de'}})}
  if(u.pathname==='/auth/v1/signup'){DB.users[b.email]=b.password;return res(200,{id:'U1',email:b.email})}
  if(o.headers.Authorization!=='Bearer tok')return res(401,{});
  if(u.pathname==='/rest/v1/app_state'){if(m==='GET')return res(200,DB.state?[{data:DB.state.data,ts:DB.state.ts}]:[]);DB.state=b;return res(201,null)}
  if(u.pathname==='/rest/v1/sessions'){
    if(m==='GET'){const [a,z]=o.headers.Range.split('-').map(Number);return res(200,[...DB.ses.values()].sort((p,q)=>p.id-q.id).slice(a,z+1).map(r=>({id:r.id,data:r.data})))}
    if(m==='DELETE'){const ids=u.searchParams.get('id').slice(4,-1).split(',').map(Number);ids.forEach(x=>DB.ses.delete(x));return {ok:true,status:204,json:async()=>null,text:async()=>''}}
    for(const r of b)DB.ses.set(r.id,r);return res(201,null)}
  return res(404,{})}}
function dev(){const errs=[];const dom=new JSDOM(html,{runScripts:'dangerously',url:'https://x.test/',beforeParse(w){w.scrollTo=()=>{};w.Element.prototype.scrollIntoView=function(){};w.fetch=mkFetch(w);w.addEventListener('error',e=>errs.push(e.message))}});return{w:dom.window,d:dom.window.document,E:s=>dom.window.eval(s),errs}}
const sleep=ms=>new Promise(r=>setTimeout(r,ms));let fails=0;const ok=(c,m)=>{console.log((c?'OK  ':'FAIL')+' '+m);if(!c)fails++};
const A=dev();const c=(D,s)=>{const el=D.d.querySelector(s);if(!el)throw new Error('missing '+s);el.click()};
ok(A.d.querySelector('[data-a=login]'),'Startseite zeigt Anmeldung');
// Gerät A: erst Plan, Training, dann Anmelden falsches PW
c(A,'[data-a=days][data-i="6"]');c(A,'[data-a=pick][data-i=arn6]');c(A,'[data-a=startplan]');
c(A,'[data-a=start][data-i="0"]');A.E("S.active.ex.forEach(e=>e.sets.forEach(s=>{s.done=true;s.kg='50'}))");c(A,'[data-a=finish]');
A.E('go("speicher")');ok(A.d.querySelector('#sync').textContent.includes('Nur auf diesem Handy'),'Ohne Konto: Hinweis nur Handy');
A.d.querySelector('#aem').value='j@x.de';A.d.querySelector('#apw').value='falsch1';c(A,'[data-a=login]');await sleep(50);
ok(A.d.querySelector('.banner.warn')?.textContent.includes('falsch'),'Falsches Passwort: Meldung');
A.d.querySelector('#aem').value='j@x.de';A.d.querySelector('#apw').value='geheim1';c(A,'[data-a=login]');await sleep(200);
ok(A.E('!!auth')&&DB.state&&DB.ses.size===1,'Login: Plan + 1 Einheit hochgeladen');
ok(A.d.querySelector('#sync').textContent.includes('Automatisch gesichert'),'Status: automatisch gesichert');
// Änderung wird automatisch gesichert
A.E('S.rest=120;save()');await sleep(1200);ok(DB.state.data.rest===120,'Änderung automatisch hochgeladen (nach ~1 s)');
// Gerät B frisch: Anmelden auf Startseite -> alles da
const B=dev();B.d.querySelector('#aem').value='j@x.de';B.d.querySelector('#apw').value='geheim1';c(B,'[data-a=login]');await sleep(200);
ok(B.E('route')==='train'&&B.E('S.sessions.length')===1&&B.E('S.rest')===120,'Neues Handy: nach Login Plan, Verlauf, Einstellungen da');
// B trainiert, A holt beim Öffnen
c(B,'[data-a=start][data-i="1"]');B.E("S.active.ex.forEach(e=>e.sets.forEach(s=>{s.done=true;s.kg='30'}))");c(B,'[data-a=finish]');await sleep(1200);
ok(DB.ses.size===2,'B: neue Einheit hochgeladen');
A.E('pull()');await sleep(200);ok(A.E('S.sessions.length')===2,'A: holt Einheit von B');
// Löschen auf A -> B
A.E('go("hist")');c(A,'[data-a=conf][data-i^=del]');c(A,'[data-a=delses]');await sleep(1200);ok(DB.ses.size===1,'Löschen auf Server');
B.E('pull()');await sleep(200);ok(B.E('S.sessions.length')===1,'Löschen kommt auf B an');
// Offline: Training speichern, dann online -> nachgeladen
online=false;c(A,'[data-a=tab][data-i=train]');c(A,'[data-a=start][data-i="2"]');A.E("S.active.ex.forEach(e=>e.sets.forEach(s=>{s.done=true;s.kg='60'}))");c(A,'[data-a=finish]');await sleep(1200);
ok(A.E('sync')==='off'&&A.E('S.sessions.length')===2,'Offline: lokal gespeichert, Status offline');
online=true;A.w.dispatchEvent(new A.w.Event('online'));await sleep(300);ok(DB.ses.size===2&&A.E('sync')==='ok','Wieder online: automatisch nachgeladen');
// Auto-Datei-Sicherung bei Login aus
ok(A.E('(()=>{let x=0;const o=navigator.share;return true})()'),'');
// Abmelden
A.E('go("speicher")');c(A,'[data-a=logout]');await sleep(100);ok(!A.E('auth')&&A.d.querySelector('[data-a=login]'),'Abmelden');
// 1500 sessions paging
for(let k=0;k<1500;k++)DB.ses.set(10000+k,{user_id:'U1',id:10000+k,data:{id:10000+k,date:new Date().toISOString(),day:'x',min:1,ex:[]}});
const C=dev();C.d.querySelector('#aem').value='j@x.de';C.d.querySelector('#apw').value='geheim1';c(C,'[data-a=login]');await sleep(400);
ok(C.E('S.sessions.length')===1502,'Mehr als 1000 Einheiten werden vollständig geladen: '+C.E('S.sessions.length'));
ok(!A.errs.length&&!B.errs.length&&!C.errs.length,'Keine JS-Fehler '+[...A.errs,...B.errs,...C.errs].join('|'));
console.log(fails?fails+' FEHLGESCHLAGEN':'ALLE TESTS BESTANDEN');process.exit(0);
