import {JSDOM} from 'jsdom';import fs from 'fs';
// t13: WHOOP – Verbinden (OAuth-Rückkehr), Daten laden, Tagesform vorbelegt, rote Tage, Strain im Verlauf (Server gemockt)
const html=fs.readFileSync(new URL('../index.html', import.meta.url),'utf8');const errs=[];const calls=[];
const now=Date.now(),iso=ms=>new Date(ms).toISOString();
let rec=[{at:iso(now-3*3600e3),score:52,hrv:61,rhr:54,calibrating:false},{at:iso(now-27*3600e3),score:70},{at:iso(now-51*3600e3),score:40},{at:iso(now-75*3600e3),score:80}];
const mk=(url,store)=>new JSDOM(html,{runScripts:'dangerously',url,beforeParse(w){
  if(store)for(const[k,v]of Object.entries(store))w.localStorage.setItem(k,v);
  w.scrollTo=()=>{};w.scrollBy=()=>{};w.Element.prototype.scrollIntoView=function(){};w.addEventListener('error',e=>errs.push(e.message));w.addEventListener('unhandledrejection',e=>errs.push('rej '+e.reason));
  w.fetch=async(u,o)=>{const b=o&&o.body?JSON.parse(o.body):{};calls.push({u:String(u),b,h:o&&o.headers});
    const R=(j,s=200)=>({ok:s<400,status:s,json:async()=>j,text:async()=>JSON.stringify(j)});
    if(String(u).includes('/functions/v1/whoop')){if(b.action==='connect')return R({ok:true,offline:true});if(b.action==='data')return R({connected:true,at:new Date().toISOString(),recovery:rec,sleep:[],cycles:[],workouts:[{start:iso(now-3600e3),end:iso(now-60e3),strain:11.24,avgHr:128,maxHr:171}],maxHr:198});if(b.action==='disconnect')return R({ok:true})}
    if(String(u).includes('/rest/v1/'))return R([]);return R({})}}});
const auth=JSON.stringify({access_token:'tok',refresh_token:'r',expires_at:Date.now()+3600e3,user:{id:'u1',email:'a@b.de'}});
let dom=mk('https://tsg7xft7bs-cell.github.io/Training-/',{trn_auth:auth}),w=dom.window,d=w.document,E=s=>w.eval(s);
const sleep=ms=>new Promise(r=>setTimeout(r,ms));let fails=0;const ok=(c,m)=>{console.log((c?'OK  ':'FAIL')+' '+m);if(!c)fails++};
const c=s=>{const el=d.querySelector(s);if(!el)throw new Error('missing '+s);el.click()};
c('[data-a=days][data-i="6"]');c('[data-a=pick][data-i=arn6]');c('[data-a=startplan]');
E('go("kraft")');ok(d.querySelector('[data-a=whon]'),'Knopf „Mit WHOOP verbinden“');
// whStart baut richtige Adresse (location.href abfangen)
let target='';E('whStart.toString()');w.eval(`location.__set=null`);
const st=E(`(()=>{const o=location.href;try{whStart()}catch(e){}return localStorage.getItem('trn_whst')})()`);
ok(st&&st.length>=8,'State für Sicherheit gespeichert ('+st.length+' Zeichen, mind. 8)');
// OAuth-Rückkehr simulieren
const store={};for(let k=0;k<w.localStorage.length;k++){const key=w.localStorage.key(k);store[key]=w.localStorage.getItem(key)}
dom=mk('https://tsg7xft7bs-cell.github.io/Training-/?code=abc&state='+st,store);w=dom.window;d=w.document;
await sleep(300);const E2=s=>w.eval(s);
const con=calls.find(x=>x.b.action==='connect');ok(con&&con.b.code==='abc'&&con.b.redirect_uri==='https://tsg7xft7bs-cell.github.io/Training-/','Code an Server geschickt, Redirect stimmt');
ok(con&&con.h.Authorization==='Bearer tok'&&con.h.apikey,'Mit eigenem Login abgesichert');
ok(E2('S.whOn')===true&&!w.location.search.includes('code'),'Verbunden, Code aus der Adresse entfernt');
ok(E2('S.whoop.recovery[0].score')===52&&E2('S.whoop.maxHr')===198,'Erholung und max. Herzfrequenz geladen');
// falscher state -> abgelehnt
const n0=calls.filter(x=>x.b.action==='connect').length;
const dom3=mk('https://tsg7xft7bs-cell.github.io/Training-/?code=evil&state=xxxxxxxx',{...store,trn_whst:'anders123'});await sleep(200);
ok(calls.filter(x=>x.b.action==='connect').length===n0,'Fremder/falscher State wird abgelehnt');
// Tagesform vorbelegt: 52 % -> Normal(3)
E2('go("train")');d.querySelector('[data-a=start][data-i="0"]').click();
ok(E2('S.active.form')===3&&d.querySelector('.form').textContent.includes('Erholung 52 %'),'Tagesform aus WHOOP (52 % = Normal), Werte sichtbar');
E2('S.active=null;S.whoop.recovery[0].score=15;go("train")');d.querySelector('[data-a=start][data-i="0"]').click();
ok(E2('S.active.form')===1&&E2('S.active.ex.every(e=>!e.test)'),'Rote Erholung 15 % → Schlecht, Krafttests verschoben');
E2('S.active=null;S.whoop.recovery[0].score=90;go("train")');d.querySelector('[data-a=start][data-i="0"]').click();ok(E2('S.active.form')===5,'90 % → Top');
E2('S.active=null;S.whoop.recovery[0].at=new Date(Date.now()-30*3600e3).toISOString();go("train")');d.querySelector('[data-a=start][data-i="0"]').click();ok(E2('S.active.form')===3,'Alter Wert (gestern) wird nicht genutzt');
// Rote Tage -> Entlastung
E2(`S.active=null;S.meso.start=dkey((()=>{const x=weekStart();x.setDate(x.getDate()-7);return x})());S.whoop.recovery=[{at:new Date().toISOString(),score:20},{at:'x',score:25},{at:'x',score:60},{at:'x',score:30}];S.fat=0;go("train")`);
ok(d.querySelector('[data-a=deloadnow]')&&d.querySelector('#app').textContent.includes('WHOOP zeigt'),'3 von 4 Tagen rot → Entlastung vorgeschlagen');
// Strain im Verlauf
E2(`S.sessions=[{id:5,date:new Date(Date.now()-120e3).toISOString(),day:'Brust',min:60,ex:[{n:'Brustpresse',sets:[{kg:50,reps:8}]}]}];S.whoop.at=new Date(0).toISOString()`);
await w.eval('whSync(true)');ok(E2('S.sessions[0].wh.strain')===11.2&&E2('S.sessions[0].wh.avg')===128,'Training mit WHOOP-Workout verknüpft');
E2('go("hist")');ok(d.querySelector('#app').textContent.includes('Strain 11,2'),'Verlauf zeigt Strain und Puls');
// Trennen
E2('go("kraft")');d.querySelector('[data-a=whoff]').click();await sleep(50);ok(E2('S.whOn')===false&&calls.some(x=>x.b.action==='disconnect'),'Trennen löscht Verbindung');
// Ohne Login: Hinweis statt Weiterleitung
E2('dropAuth();go("kraft")');d.querySelector('[data-a=whon]').click();ok(d.querySelector('.banner').textContent.includes('Melde dich zuerst'),'Ohne Konto: Hinweis zur Anmeldung');
ok(!errs.filter(x=>!/navigation|Not implemented/.test(x)).length,'Keine JS-Fehler '+errs.join('|'));
console.log(fails?fails+' FEHLGESCHLAGEN':'ALLE TESTS BESTANDEN');process.exit(fails?1:0);
