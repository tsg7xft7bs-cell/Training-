import {JSDOM} from 'jsdom';import fs from 'fs';
const html=fs.readFileSync(new URL('../index.html', import.meta.url),'utf8');const errs=[];
const dom=new JSDOM(html,{runScripts:'dangerously',url:'https://x.test/',beforeParse(w){w.__shared=0;w.navigator.canShare=()=>true;w.navigator.share=async()=>{w.__shared++};w.File=class extends w.Blob{constructor(p,n,o){super(p,o);this.name=n}};w.scrollTo=()=>{};w.Element.prototype.scrollIntoView=function(){};w.addEventListener('error',e=>errs.push(e.message))}});
const w=dom.window,d=w.document,E=s=>w.eval(s);let fails=0;const ok=(c,m)=>{console.log((c?'OK  ':'FAIL')+' '+m);if(!c)fails++};
const c=s=>{const el=d.querySelector(s);if(!el)throw new Error('missing '+s);el.click()};
const inp=(sel,v)=>{const el=d.querySelector(sel);el.value=v;el.dispatchEvent(new w.Event('input',{bubbles:true}))};
c('[data-a=days][data-i="6"]');c('[data-a=pick][data-i=arn6]');c('[data-a=startplan]');w.eval('S.meso.on=false');
// Rechner: Beinpresse (Scheiben), Brustpresse (Block), Langhantel
console.log('  eq Beinpresse',JSON.stringify(E('eqOf("Beinpresse")')),'Brustpresse',JSON.stringify(E('eqOf("Brustpresse")')));
ok(E(`calcTxt({n:'Bankdrücken (Langhantel)',sets:[{kg:'82,5',done:false}]})`).includes('Pro Seite 25 + 5 + 1,25'),'Langhantel 82,5 kg → 25 + 5 + 1,25 pro Seite');
ok(E(`calcTxt({n:'Brustpresse',sets:[{kg:'40',done:false}]})`).includes('Stufe 8'),'Gewichtsblock 40 kg → Stufe 8 (Start 5, +5)');
ok(E(`calcTxt({n:'Brustpresse',sets:[{kg:'42',done:false}]})`).includes('= 40 kg'),'Block rundet auf echte Stufe');
c('[data-a=start][data-i="0"]');
inp('[data-f=kg][data-i="0"][data-j="0"]','45');ok(d.querySelector('#calc0').textContent.includes('Stufe 9'),'Rechner aktualisiert live beim Tippen');
c('[data-a=sw][data-i=m0]');c('[data-a=sw][data-i=eq0]');c('[data-a=eqm][data-i=p][data-n="0"]');inp('[data-f=eqbar][data-i="0"]','20');
ok(d.querySelector('#calc0').textContent.includes('Pro Seite 10 + 2,5'),'Auf Scheiben umgestellt, Schlitten 20 kg: '+d.querySelector('#calc0').textContent);
ok(E('S.eq["Brustpresse"].m')==='p'&&E('S.eq["Brustpresse"].bar')===20,'Einstellung pro Gerät gespeichert');
// Satz-Typen
c('[data-a=stype][data-i="0"][data-j="3"]');ok(E('S.active.ex[0].sets[3].t')==='RP','Satznummer tippen → Rest-Pause');
c('[data-a=stype][data-i="0"][data-j="3"]');ok(E('S.active.ex[0].sets[3].t')==='F','→ Failure');
// RIR
c('[data-a=ck][data-i="2"][data-j="0"]');ok(d.querySelector('.rir'),'Nach Haken: RIR-Abfrage');
c('[data-a=rir][data-i="2"][data-j="0"][data-n="2"]');ok(E('S.active.ex[2].sets[0].rir')===2&&d.querySelector('.rv')&&!d.querySelector('.rir'),'RIR 2 gespeichert, Zahl im Haken');
// Progression mit RIR: alle Sätze top reps, RIR 3 -> +2 Stufen
E(`S.sessions=[{id:1,date:new Date(Date.now()-864e5).toISOString(),day:'x',min:1,ex:[{n:'Schulterpresse',sets:[{kg:40,reps:10,rir:3},{kg:40,reps:10,rir:3},{kg:40,reps:10,rir:4},{kg:40,reps:10,rir:3},{kg:30,reps:10,t:'D'}]}]}]`);
let b=E(`buildSets({n:'Schulterpresse',s:4,r:[8,10]})`);ok(b.sets[0].kg==='50'&&b.tip.includes('locker'),'RIR 3+ und Ziel → +2 echte Stufen (5er): '+b.sets[0].kg);
E(`S.sessions[0].ex[0].sets.forEach(s=>{if(!s.t)s.rir=1})`);b=E(`buildSets({n:'Schulterpresse',s:4,r:[8,10]})`);ok(b.sets[0].kg==='45','RIR 1 und Ziel → +1 Stufe = 45 kg');
E(`S.sessions[0].ex[0].sets=[{kg:40,reps:6,rir:0},{kg:40,reps:5,rir:0}]`);b=E(`buildSets({n:'Schulterpresse',s:2,r:[8,10]})`);ok(b.sets[0].kg==='35'&&b.tip.includes('zu schwer'),'Zu wenig Wdh bei RIR 0 → −1 Stufe = 35 kg');
// Drop wird bei Progression ignoriert
E(`S.sessions[0].ex[0].sets=[{kg:40,reps:10},{kg:40,reps:10},{kg:20,reps:6,t:'D'}]`);b=E(`buildSets({n:'Schulterpresse',s:2,r:[8,10]})`);ok(b.sets[0].kg==='45','Drop-Satz zählt nicht gegen das Ziel');
// Finish speichert t & rir
E("S.active.ex.forEach(e=>e.sets.forEach(s=>{s.done=true;if(!s.kg)s.kg='30'}))");c('[data-a=finish]');
const sv=E('JSON.stringify(S.sessions[0].ex.find(e=>e.sets.some(x=>x.t==="F")).sets)');ok(sv.includes('"t":"F"')&&E('S.sessions[0].ex[2].sets[0].rir')===2,'Typ und RIR im Verlauf gespeichert');
await new Promise(r=>setTimeout(r,20));ok(w.__shared===1&&E('S.lastBk>0'),'Auto-Sicherung nach Training: Teilen-Menü geöffnet');
c('[data-a=tab][data-i=hist]');ok(d.querySelector('#app').textContent.includes(' F'),'Verlauf zeigt Failure');
// Optionen
E('go("gewichte")');c('[data-a=plt][data-i="1.25"]');E('go("optionen")');ok(!E('S.plates.includes(1.25)'),'Scheibe 1,25 abwählbar');c('[data-a=rirt][data-i=aus]');ok(E('S.rirOn')===false,'RIR abschaltbar');
ok(!d.querySelector('#app').textContent.includes('Tipp auf'),'Keine Hilfetexte mehr');
E('go("speicher")');c('[data-a=abk][data-i=t]');ok(E('S.autoBk')==='t','Auto-Sicherung umstellbar');
ok(errs.length===0,'Keine JS-Fehler '+errs.join('|'));
console.log(fails?fails+' FEHLGESCHLAGEN':'ALLE TESTS BESTANDEN');process.exit(0);
