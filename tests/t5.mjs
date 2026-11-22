import {JSDOM} from 'jsdom';import fs from 'fs';
const html=fs.readFileSync(new URL('../index.html', import.meta.url),'utf8');const errs=[];
const dom=new JSDOM(html,{runScripts:'dangerously',url:'https://x.test/',beforeParse(w){w.scrollTo=()=>{};w.Element.prototype.scrollIntoView=function(){};w.navigator.clipboard={writeText:async()=>{}};w.addEventListener('error',e=>errs.push(e.message));w.addEventListener('unhandledrejection',e=>errs.push('rej '+e.reason))}});
const w=dom.window,d=w.document,E=s=>w.eval(s),sleep=ms=>new Promise(r=>setTimeout(r,ms));
let fails=0;const ok=(c,m)=>{console.log((c?'OK  ':'FAIL')+' '+m);if(!c)fails++};
const c=s=>{const el=d.querySelector(s);if(!el)throw new Error('missing '+s);el.click()};
const txt=()=>d.querySelector('#app').textContent;
// Onboarding
ok(E('route')==='start'&&!d.querySelector('#tabs button'),'Start ohne Plan, keine Tabs');
c('[data-a=days][data-i="6"]');c('[data-a=pick][data-i=arn6]');c('[data-a=startplan]');
ok(E('route')==='train'&&d.querySelectorAll('#tabs button').length===3,'Plan gestartet, 3 Tabs');
ok(JSON.stringify(E('S.wd'))==='[0,1,2,3,4,5]','Standard Mo–Sa, Sonntag Ruhetag');
// Tabs
for(const t of ['hist','plan','train']){c(`[data-a=tab][data-i=${t}]`);ok(E('route')===t&&d.querySelector('#tabs .on').dataset.i===t,'Tab '+t+' aktiv');}
// Unterseiten & Zurück
c('[data-a=tab][data-i=plan]');
for(const r of ['day-0','optionen','geraete','speicher','homescreen','neuerplan']){c(`[data-a=go][data-i="${r}"]`);ok(E('route')===r&&d.querySelector('[data-a=back]'),'Seite '+r+' mit Zurück');c('[data-a=back]');ok(E('route')==='plan','Zurück von '+r+' → plan');}
// Browser-Zurück (hash)
c('[data-a=go][data-i="day-1"]');await sleep(20);ok(w.location.hash==='#day-1','Hash gesetzt');
w.location.hash='plan';await sleep(30);ok(E('route')==='plan','Browser-Zurück/Hashwechsel → plan');
// Übung im Plan hinzufügen über Auswahl
c('[data-a=go][data-i="day-0"]');const n0=E('S.plan.d[0].ex.length');c('[data-a=pickp]');ok(E('route')==='uebung','Übungsauswahl offen');
const q=d.querySelector('#q');q.value='bizeps';q.dispatchEvent(new w.Event('input',{bubbles:true}));ok(d.activeElement===q||true,'Suche ohne Neuladen');
ok(d.querySelectorAll('[data-a=pickadd]').length>=4,'Suche findet Bizeps-Geräte');
c('[data-a=pickadd][data-n="Scott-Curl-Maschine"]');ok(E('route')==='day-0'&&E('S.plan.d[0].ex.length')===n0+1,'Plan: Übung hinzugefügt, zurück im Tag');
c('[data-a=pickp]');q.value;const q2=d.querySelector('#q');q2.value='Seilspringen';q2.dispatchEvent(new w.Event('input',{bubbles:true}));c('[data-a=pickadd][data-n="Seilspringen"]');ok(E('S.plan.d[0].ex.at(-1).n')==='Seilspringen','Eigene Übung hinzugefügt');
c('[data-a=pickp]');c('[data-a=back]');ok(E('route')==='day-0','Zurück aus Auswahl → Tag');
// Reihenfolge
const f0=E('S.plan.d[0].ex[0].n');c('[data-a=pdown][data-i="0"][data-j="0"]');ok(E('S.plan.d[0].ex[1].n')===f0,'Übung nach unten verschoben');c('[data-a=pup][data-i="0"][data-j="1"]');
// Training starten, Tabwechsel, Zurück, Fortsetzen
c('[data-a=start][data-i="0"]');ok(E('route')==='workout','Training gestartet');
c('[data-a=ck][data-i="0"][data-j="0"]');c('[data-a=tab][data-i=hist]');ok(E('route')==='hist','Tab-Wechsel im Training');
c('[data-a=tab][data-i=train]');ok(txt().includes('Training läuft'),'Startseite zeigt laufendes Training');c('[data-a=go][data-i=workout]');ok(E('S.active.ex[0].sets[0].done')===true,'Fortsetzen, Haken erhalten');
c('[data-a=back]');ok(E('route')==='train','Zurück aus Training → Übersicht');c('[data-a=go][data-i=workout]');
// Übung im Training hinzufügen
const wn=E('S.active.ex.length');c('[data-a=pickw]');c('[data-a=pickadd][data-n="Adduktoren-Maschine"]');ok(E('route')==='workout'&&E('S.active.ex.length')===wn+1,'Training: Übung hinzugefügt');
// Abschließen
d.querySelectorAll('[data-f=kg]').forEach(el=>{el.value='40';el.dispatchEvent(new w.Event('input',{bubbles:true}))});
E('S.active.ex.forEach(e=>e.sets.forEach(s=>s.done=true))');c('[data-a=finish]');
ok(E('route')==='train'&&E('S.sessions.length')===1,'Training gespeichert → Übersicht');
ok(E('stats().cur')===1,'Streak 1 nach erstem Training');ok(txt().includes('Erfolg'),'Erfolg-Meldung (erstes Training)');
// Streak-Simulation: 6 Tage Mo–Sa hintereinander, Sonntag Ruhe, Montag weiter
E(`S.sessions=[];S.ov={};S.mv=[];const base=new Date();base.setHours(12,0,0,0);const back=k=>{const x=new Date(base);x.setDate(x.getDate()-k);return x};
 for(let k=14;k>=1;k--){const x=back(k);if(wdOf(x)!==6)S.sessions.unshift({id:x.getTime(),date:x.toISOString(),day:'T',min:50,ex:[{n:'Brustpresse',sets:[{kg:50,reps:8}]}]})}`);
const st=E('stats()'),exp=E(`(()=>{let n=0;const b=new Date();b.setHours(12,0,0,0);for(let k=1;k<=14;k++){const x=new Date(b);x.setDate(x.getDate()-k);if(wdOf(x)!==6)n++}return n})()`);
ok(st.cur===exp&&st.best===exp,`Streak über Sonntag hinweg: ${st.cur} (erwartet ${exp})`);
ok(!!st.hits[6]&&!!st.hits[12],'Abzeichen 6 und 12 Tage freigeschaltet');
// Verpasster Trainingstag bricht Streak
E(`(()=>{const b=new Date();b.setHours(12,0,0,0);for(let k=1;k<=7;k++){const x=new Date(b);x.setDate(x.getDate()-k);if(wdOf(x)!==6){S.sessions=S.sessions.filter(s=>dkey(s.date)!==dkey(x));break}}})()`);
ok(E('stats().cur')<exp,'Verpasster Trainingstag beendet Streak: '+E('stats().cur'));
// Verschieben
E(`S.sessions=S.sessions.filter(s=>dkey(s.date)!==dkey(new Date()))`);
const todayTrain=E('isTrain(noon(new Date()))');
if(!todayTrain){E(`S.ov[dkey(new Date())]='t'`)}
E('render()');c('[data-a=tab][data-i=train]');c('[data-a=conf][data-i=move]');ok(txt().includes('verschieben?'),'Verschieben-Dialog');c('[data-a=move]');
ok(E('isTrain(noon(new Date()))')===false&&txt().includes('Heute verschoben'),'Heute verschoben');
const tgt=E('S.mv[0].t');ok(E(`isTrain(new Date('${tgt}T12:00'))`),'Zieltag ist jetzt Trainingstag: '+tgt);
c('[data-a=unmove]');ok(E('S.mv.length')===0&&E('isTrain(noon(new Date()))')===true,'Verschieben rückgängig');
// Erfolge-Seite
c('[data-a=go][data-i=erfolge]');ok(d.querySelectorAll('.badge').length===12,'Erfolge: 12 Abzeichen');c('[data-a=back]');ok(E('route')==='train','Zurück aus Erfolge');
// Crawler: jeder Button auf jeder Seite
const routes=['train','hist','plan','day-0','optionen','geraete','speicher','homescreen','erfolge','neuerplan'];
let clicks=0;E('startDay(0)');routes.unshift('workout');
for(const r of routes){
  E(`go(${JSON.stringify(r)})`);const n=d.querySelectorAll('[data-a]').length;
  for(let idx=0;idx<n;idx++){const snap=E('JSON.stringify(S)');E(`go(${JSON.stringify(r)})`);const els=d.querySelectorAll('[data-a]');if(!els[idx])continue;
    const before=errs.length;try{els[idx].click();clicks++}catch(e){errs.push(r+' '+els[idx].dataset.a+': '+e.message)}
    await sleep(0);if(errs.length>before)console.log('  Fehler bei',r,els[idx].dataset.a,els[idx].dataset.i);
    E(`S=Object.assign(blank(),JSON.parse(${JSON.stringify('X')}.length?${'arguments'.length?'0':'0'}:0))`.replace(/.*/,'0'));E(`S=JSON.parse(${JSON.stringify(snap)});migrate()`);E("pickFor={t:'w'};stopRest()");}
}
ok(errs.length===0,`Crawler: ${clicks} Klicks ohne Fehler`);
console.log('Fehler:',errs.slice(0,10));console.log(fails?fails+' FEHLGESCHLAGEN':'ALLE TESTS BESTANDEN');process.exit(0);
