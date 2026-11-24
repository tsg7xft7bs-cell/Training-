import {JSDOM} from 'jsdom';import fs from 'fs';
// t12: Mehrere Studios – eigene Gewichte, Kraftwerte und Verlauf für Maschinen/Kabel; Wiederholungen passend zu groben Stufen
const html=fs.readFileSync(new URL('../index.html', import.meta.url),'utf8');const errs=[];
const dom=new JSDOM(html,{runScripts:'dangerously',url:'https://x.test/',beforeParse(w){w.scrollTo=()=>{};w.scrollBy=()=>{};w.Element.prototype.scrollIntoView=function(){};w.addEventListener('error',e=>errs.push(e.message))}});
const w=dom.window,d=w.document,E=s=>w.eval(s),sleep=ms=>new Promise(r=>setTimeout(r,ms));let fails=0;const ok=(c,m)=>{console.log((c?'OK  ':'FAIL')+' '+m);if(!c)fails++};
const c=s=>{const el=d.querySelector(s);if(!el)throw new Error('missing '+s);el.click()};
const inp=(sel,v)=>{const el=d.querySelector(sel);if(!el)throw new Error('missing '+sel);el.value=v;el.dispatchEvent(new w.Event('input',{bubbles:true}))};
c('[data-a=days][data-i="6"]');c('[data-a=pick][data-i=arn6]');c('[data-a=startplan]');
// Hauptgym eingerichtet, Kraftwerte vorhanden
E(`S.eq['Latzug']={m:'s',start:50,step:1.25,max:150};S.e1={'Brustpresse':{v:100,d:'2026-11-25',h:[]},'Seitheben (Kurzhantel)':{v:20,d:'2026-11-25',h:[]}}`);
E(`S.sessions=[{id:1,g:'main',date:new Date(Date.now()-864e5).toISOString(),day:'x',min:50,ex:[{n:'Brustpresse',sets:[{kg:70,reps:9}]}]}]`);
E('go("gewichte")');ok(d.querySelector('[data-a=gymset][data-i=main]').textContent.includes('Aktiv'),'Hauptgym ist Standard und aktiv');
inp('[data-f=gyname]','McFit Nordhorn');ok(E('S.gymName')==='McFit Nordhorn','Hauptgym umbenennbar');
// Zweites Studio
c('[data-a=gymadd]');const g2=E('S.gymId');ok(g2!=='main'&&E('S.gyms.length')===1,'Zweites Studio angelegt und aktiv');
ok(d.querySelector('.banner').textContent.includes('Neues Studio'),'Hinweis zum Eintragen');
inp('[data-f=gyname]','Studio Lingen');ok(E('S.gyms[0].name')==='Studio Lingen','Zweites Studio benannt');
ok(E('GY().gym.M.s')===5&&E('Object.keys(GY().eq).length')===0,'Startet mit Kopie der Stufen, ohne Sonderwerte pro Gerät');
inp('[data-f=gy][data-n=M][data-i=s]','10');inp('[data-f=gy][data-n=M][data-i=a]','10');
ok(E('GY().gym.M.s')===10&&E('S.gym.M.s')===5,'Lingen: Maschinen 10er-Schritte, Hauptgym bleibt bei 5');
ok(E('eqOf("Latzug").step')!==1.25&&E('eqOf("Latzug").start')!==50,'Latzug-Sonderwerte (50–150/1,25) gelten nur im Hauptgym');
// Kraftwerte: Maschine eigen, Kurzhantel geteilt
ok(E('EM("Brustpresse")[\"Brustpresse\"]')===undefined,'Lingen: keine Kraftwerte für Maschinen aus dem Hauptgym übernommen');
ok(E('EM("Seitheben (Kurzhantel)")["Seitheben (Kurzhantel)"].v')===20,'Kurzhantel-Kraftwerte gelten überall');
let b=E(`buildSets({n:'Brustpresse',s:3,r:[8,10]},3)`);ok(b.test&&b.sets[0].t==='T','Lingen: Brustpresse startet mit Krafttest');
ok(b.sets.every(x=>x.pv==='–'),'Zuletzt-Werte aus dem anderen Studio werden nicht gezeigt');
// Wiederholungen passend zu groben Stufen
E(`EM('Brustpresse')['Brustpresse']={v:105,d:'x',h:[]};S.e1['Brustpresse'].v=105;S.meso.start=dkey(weekStart())`);
b=E(`buildSets({n:'Brustpresse',s:3,r:[8,10]},3)`);ok(b.sets[0].kg==='70'&&b.sets[0].reps==='12'&&b.sets[0].tr===3,'Lingen 10er-Stufen: 70 kg × 12 statt 75 kg × 9 (gibt es dort nicht): '+b.sets[0].kg+'×'+b.sets[0].reps);
c('[data-a=gymset][data-i=main]');ok(E('gymId()')==='main','Zurück ins Hauptgym');
b=E(`buildSets({n:'Brustpresse',s:3,r:[8,10]},3)`);ok(b.sets[0].kg==='75'&&b.sets[0].reps==='9'&&b.sets[0].pv.startsWith('70'),'Hauptgym 5er-Stufen: 75 kg × 9, Zuletzt aus Hauptgym: '+b.sets[0].kg+'×'+b.sets[0].reps);
ok(E('S.e1["Brustpresse"].v')===105,'Kraftwert Hauptgym unverändert');
// Training: Studio wechseln passt laufendes Training an
E('go("train")');c('[data-a=start][data-i="0"]');const i=E('S.active.ex.findIndex(e=>e.n==="Brustpresse")');
const kmain=E(`S.active.ex[${i}].sets[1].kg`);
E('go("gewichte")');c(`[data-a=gymset][data-i="${g2}"]`);ok(d.querySelector('.banner').textContent.includes('angepasst'),'Wechsel während Training: Hinweis');
const pz=E(`(()=>{const e=S.active.ex[${i}];return planSet(e.n,105,tReps(e.r),3,e.r)})()`);ok(E(`num(S.active.ex[${i}].sets[0].kg)`)===pz.kg&&E(`S.active.ex[${i}].sets[0].reps`)===String(pz.reps)&&E('GY().gym.M.s')===10&&(pz.kg%10===0),'Laufendes Training auf Lingen umgerechnet: '+kmain+' → '+pz.kg+' kg × '+pz.reps);
E('go("workout")');ok(d.querySelector('.sub').textContent.includes('Studio Lingen'),'Training zeigt aktives Studio');
// Stepper passt Wdh an
const k0=E(`num(S.active.ex[${i}].sets[0].kg)`);c(`[data-a=kstep][data-i="${i}"][data-n="1"]`);ok(E(`num(S.active.ex[${i}].sets[0].kg)`)===k0+10&&+E(`S.active.ex[${i}].sets[0].reps`)<11,'Plus um eine 10er-Stufe senkt Ziel-Wdh auf '+E(`S.active.ex[${i}].sets[0].reps`));
// Vorschlag nutzt Stufen + Wdh
E(`S.active.ex[${i}].sets[0].kg='80';S.active.ex[${i}].sets[0].reps='3'`);c(`[data-a=ck][data-i="${i}"][data-j="0"]`);c(`[data-a=rir][data-i="${i}"][data-j="0"][data-n="0"]`);
ok(/kg × \d+\?/.test(d.querySelector('.sug').textContent),'Vorschlag nennt Gewicht und Wdh: '+d.querySelector('.sug').textContent);
c(`[data-a=sugok][data-i="${i}"]`);ok(E(`S.active.ex[${i}].sets[1].reps`)===String(E(`S.active.ex[${i}].sets[1].reps`))&&E(`num(S.active.ex[${i}].sets[1].kg)`)<80,'Übernehmen setzt Gewicht und Wdh');
// Beenden: Session mit Studio, Lernen nur in Lingen
E("S.active.ex.forEach(e=>e.sets.forEach(s=>{if(!s.done){s.done=true;if(!num(s.kg))s.kg='20';if(!num(s.reps))s.reps='10';if(s.t==='T')s.t='N'}}))");c('[data-a=finish]');
ok(E('S.sessions[0].g')===g2,'Training mit Studio gespeichert');ok(E('S.e1["Brustpresse"].v')===105,'Hauptgym-Kraftwert bleibt unberührt');
c('[data-a=tab][data-i=train]');ok(d.querySelector('#app').textContent.includes('Studio: Studio Lingen'),'Startseite zeigt aktives Studio');
// Kraft-Seite zeigt Studio
E('go("kraft")');ok(d.querySelector('.sub').textContent.includes('Studio Lingen'),'Kraftwerte-Seite nennt Studio');
// Löschen
E('go("gewichte")');c('[data-a=conf][data-i=gymdel]');c('[data-a=gymdel]');ok(E('S.gyms.length')===0&&E('gymId()')==='main','Studio gelöscht, zurück im Hauptgym');
// Update alter Daten ohne Studios
E(`S=Object.assign(blank(),(()=>{const x=clone(S);delete x.gyms;delete x.gymId;return x})());migrate()`);ok(Array.isArray(E('S.gyms'))&&E('gymId()')==='main','Alte Daten: Hauptgym, nichts verloren');
// Crawler mit zwei Studios
E('S.gyms.push({id:"g9",name:"X",gym:gymDef(),plates:[20,10,5],eq:{},e1:{}});S.gymId="g9";startDay(1)');let cl=0;
for(const rt of ['gewichte','kraft','workout','plan']){E(`go(${JSON.stringify(rt)})`);const m=d.querySelectorAll('[data-a]').length;for(let q=0;q<m;q++){const snap=E('JSON.stringify(S)');E(`go(${JSON.stringify(rt)})`);const els=d.querySelectorAll('[data-a]');if(!els[q])continue;try{els[q].click();cl++}catch(e){errs.push(rt+' '+e.message)}await sleep(0);E(`S=JSON.parse(${JSON.stringify(snap)});migrate();stopRest()`)}}
ok(errs.length===0,`Crawler: ${cl} Klicks ohne Fehler `+errs.slice(0,3).join('|'));
console.log(fails?fails+' FEHLGESCHLAGEN':'ALLE TESTS BESTANDEN');process.exit(fails?1:0);
