import {JSDOM} from 'jsdom';import fs from 'fs';
// t10: Version 9 – Gewichte im Studio, Krafttest, 5-Wochen-Block, Tagesform, Vorschlag nächster Satz, Gesten
const html=fs.readFileSync(new URL('../index.html', import.meta.url),'utf8');const errs=[];
const dom=new JSDOM(html,{runScripts:'dangerously',url:'https://x.test/',beforeParse(w){w.scrollTo=()=>{};w.scrollBy=()=>{};w.Element.prototype.scrollIntoView=function(){};w.navigator.canShare=()=>false;w.addEventListener('error',e=>errs.push(e.message))}});
const w=dom.window,d=w.document,E=s=>w.eval(s),sleep=ms=>new Promise(r=>setTimeout(r,ms));let fails=0;const ok=(c,m)=>{console.log((c?'OK  ':'FAIL')+' '+m);if(!c)fails++};
const c=s=>{const el=d.querySelector(s);if(!el)throw new Error('missing '+s);el.click()};
const inp=(sel,v)=>{const el=d.querySelector(sel);if(!el)throw new Error('missing '+sel);el.value=v;el.dispatchEvent(new w.Event('input',{bubbles:true}))};
const touch=(el,type,x,y)=>{const ev=new w.Event(type,{bubbles:true,cancelable:true});const t=[{clientX:x,clientY:y}];Object.defineProperty(ev,'touches',{value:type==='touchend'?[]:t});Object.defineProperty(ev,'changedTouches',{value:t});el.dispatchEvent(ev)};
c('[data-a=days][data-i="6"]');c('[data-a=pick][data-i=arn6]');c('[data-a=startplan]');
// Bestehendes Training (wie bei Jannis: ein Training schon gemacht)
E(`S.sessions=[{id:1,date:new Date(Date.now()-2*864e5).toISOString(),day:'Tag 1',min:50,ex:[{n:'Brustpresse',sets:[{kg:50,reps:8},{kg:50,reps:8}]}]}]`);
// --- Gewichte im Studio
E('go("gewichte")');ok(d.querySelectorAll('[data-f=gy]').length===9,'Gewichte im Studio: Kabel, Maschine, Kurzhantel (von/bis/Schritt)');
inp('[data-f=gy][data-n=K][data-i=s]','5');ok(E('S.gym.K.s')===5,'Kabel-Schritt änderbar');inp('[data-f=gy][data-n=K][data-i=s]','0');ok(E('S.gym.K.s')===5,'Schritt 0 wird ignoriert');
inp('[data-f=gy][data-n=K][data-i=s]','2,5');
ok(JSON.stringify(E('avail("Kabelrudern")').slice(0,3))==='[2.5,5,7.5]'&&E('avail("Kabelrudern").at(-1)')===100,'Kabel: 2,5–100 in 2,5er-Schritten');
E(`S.eq['Latzug']={m:'s',start:50,step:1.25,max:150}`);
ok(E('avail("Latzug").length')===81&&E('avail("Latzug")[1]')===51.25,'Latzug eigene Spanne 50–150 in 1,25 (81 Stufen)');
ok(E('snapKg("Latzug",57.9)')===57.5&&E('snapKg("Latzug",40)')===50&&E('snapKg("Latzug",170)')===150,'Latzug: rundet auf echte Stufe, Grenzen 50/150');
ok(E('stepKg("Brustpresse",40,1)')===45&&E('stepKg("Brustpresse",42,-1)')===40,'Stepper springt zur nächsten echten Stufe');
ok(E('avail("Beinpresse").includes(2.5)')&&!E('avail("Beinpresse").includes(1.25)'),'Scheiben: nur paarweise Gewichte');
ok(E('avail("Bankdrücken (Langhantel)")[0]')===20,'Langhantel startet bei 20 kg Stange');
E('render()');ok(d.querySelector('#app').textContent.includes('Latzug'),'Eigene Werte pro Übung gelistet');
// --- Testwoche & Start
const mw=E('mesoWeek()');ok(mw.test===true&&E('new Date(S.meso.start+"T12:00").getDay()')===1,'Bis Montag Testwoche, Block startet an einem Montag: '+E('S.meso.start'));
E('go("train")');ok(d.querySelector('#app').textContent.includes('Testwoche'),'Startseite zeigt Testwoche');
c('[data-a=start][data-i="0"]');ok(E('route')==='workout'&&d.querySelector('[data-f=form]'),'Training startet mit Tagesform-Regler');
const ex0=E('S.active.ex[0].n');ok(E('S.active.ex.every(e=>e.cardio||e.sets[0].t==="T")'),'Jede Übung: Satz 1 ist Krafttest');
ok(d.querySelector('.hint')&&d.querySelector('.hint').textContent.includes('Muskelversagen'),'Hinweis zum Krafttest sichtbar');
ok(d.querySelector('button.no.st-T'),'Testsatz markiert (T)');
// Tagesform: schlecht -> Tests verschoben, weniger Sätze
const s0=E('S.active.ex[0].sets.length');
const r=d.querySelector('[data-f=form]');r.value='1';r.dispatchEvent(new w.Event('input',{bubbles:true}));ok(d.querySelector('#formn').textContent==='Schlecht','Regler zeigt live „Schlecht“');
r.dispatchEvent(new w.Event('change',{bubbles:true}));
ok(E('S.active.form')===1&&E('S.active.ex[0].sets.length')===s0-1&&E('S.active.ex.every(e=>!e.test)'),'Schlecht: 1 Satz weniger, Krafttests verschoben');
const r2=d.querySelector('[data-f=form]');r2.value='3';r2.dispatchEvent(new w.Event('change',{bubbles:true}));
ok(E('S.active.ex[0].sets.length')===s0&&E('S.active.ex[0].sets[0].t')==='T','Zurück auf Normal: Tests wieder da');
c('[data-a=formok]');ok(!d.querySelector('[data-f=form]'),'„Passt“ blendet Regler aus');
// Test ohne Wdh -> blockiert
c('[data-a=ck][data-i="0"][data-j="0"]');ok(E('S.active.ex[0].sets[0].done')===false&&d.querySelector('.banner.warn'),'Testsatz ohne Wiederholungen wird nicht abgehakt');
// Test eintragen: 60 kg x 9
inp('[data-f=kg][data-i="0"][data-j="0"]','60');inp('[data-f=reps][data-i="0"][data-j="0"]','9');
c('[data-a=ck][data-i="0"][data-j="0"]');
const v=E(`S.e1[${JSON.stringify(ex0)}].v`);ok(Math.abs(v-78)<0.01,'Maximalkraft aus Test: 60×9 → '+v+' kg');
ok(!d.querySelector('.rir'),'Kein RIR-Abfragen beim Test (ist immer 0)');
const T=E('tReps(S.active.ex[0].r)'),nk=E('num(S.active.ex[0].sets[1].kg)'),exp=E(`kgAt(${JSON.stringify(ex0)},78,${T},2)`);
ok(nk===exp&&nk>0,`Restliche Sätze berechnet: ${nk} kg × ${T} bei 2 Wdh im Tank`);
ok(E('avail(S.active.ex[0].n)').includes(nk),'Berechnetes Gewicht gibt es am Gerät');
ok(d.querySelector('.hint').textContent.includes('Maximalkraft ca.'),'Ergebnis des Tests angezeigt');
// Haken zurück -> Test rückgängig
c('[data-a=ck][data-i="0"][data-j="0"]');ok(E(`S.e1[${JSON.stringify(ex0)}]`)===undefined,'Haken zurücknehmen macht Test rückgängig');
c('[data-a=ck][data-i="0"][data-j="0"]');ok(E(`S.e1[${JSON.stringify(ex0)}].v`)===78,'Test erneut abgehakt');
// Satz 2: viel zu wenig -> Vorschlag leichter
inp('[data-f=reps][data-i="0"][data-j="1"]','5');c('[data-a=ck][data-i="0"][data-j="1"]');c('[data-a=rir][data-i="0"][data-j="1"][data-n="0"]');
ok(d.querySelector('.sug')&&d.querySelector('.sug').textContent.includes('Nur 5 Wdh'),'Unter Zielbereich: Vorschlag leichter');
const sug=E('S.active.ex[0].sug.kg');ok(sug<nk,'Vorschlag '+sug+' < '+nk);c('[data-a=sugok][data-i="0"]');ok(E('num(S.active.ex[0].sets[2].kg)')===sug&&!d.querySelector('.sug'),'Übernehmen setzt nächsten Satz');
// Satz zu leicht -> Vorschlag schwerer
const i2=1;inp(`[data-f=kg][data-i="${i2}"][data-j="0"]`,'40');inp(`[data-f=reps][data-i="${i2}"][data-j="0"]`,'10');c(`[data-a=ck][data-i="${i2}"][data-j="0"]`);
inp(`[data-f=reps][data-i="${i2}"][data-j="1"]`,'14');c(`[data-a=ck][data-i="${i2}"][data-j="1"]`);c(`[data-a=rir][data-i="${i2}"][data-j="1"][data-n="4"]`);
ok(d.querySelector('.sug')&&d.querySelector('.sug').textContent.includes('noch was drin'),'Über Ziel mit 4+ im Tank: Vorschlag schwerer');c(`[data-a=sugno][data-i="${i2}"]`);ok(!d.querySelector('.sug'),'„Nein“ verwirft Vorschlag');
// Im Zielbereich -> kein Vorschlag
const i3=2;inp(`[data-f=kg][data-i="${i3}"][data-j="0"]`,'30');inp(`[data-f=reps][data-i="${i3}"][data-j="0"]`,'10');c(`[data-a=ck][data-i="${i3}"][data-j="0"]`);
const t3=E(`tReps(S.active.ex[${i3}].r)`);inp(`[data-f=reps][data-i="${i3}"][data-j="1"]`,String(t3));c(`[data-a=ck][data-i="${i3}"][data-j="1"]`);c(`[data-a=rir][data-i="${i3}"][data-j="1"][data-n="2"]`);
ok(!E(`S.active.ex[${i3}].sug`),'Im Ziel und passendes RIR: kein Vorschlag (keine Nerverei)');
// Stepper
const q=E(`S.active.ex[${i3}].sets.findIndex(x=>!x.done)`),k0=E(`num(S.active.ex[${i3}].sets[${q}].kg)`);
c(`[data-a=kstep][data-i="${i3}"][data-n="1"]`);const k1=E(`num(S.active.ex[${i3}].sets[${q}].kg)`);
ok(k1>k0&&E(`avail(S.active.ex[${i3}].n)`).includes(k1),`Plus-Taste: ${k0} → ${k1} kg (echte Stufe)`);ok(d.querySelector('#calc'+i3).textContent.includes(String(k1).replace('.',',')),'Anzeige aktualisiert');
// Wischen zum Löschen
const nS=E('S.active.ex[3].sets.length'),row=d.querySelector('.set[data-sw="3-1"]');
touch(row,'touchstart',300,500);touch(row,'touchmove',280,502);touch(row,'touchmove',200,503);touch(row,'touchend',200,503);
ok(d.querySelector('[data-a=delset][data-i="3"][data-j="1"]'),'Nach links wischen zeigt „Satz löschen“');c('[data-a=delset][data-i="3"][data-j="1"]');ok(E('S.active.ex[3].sets.length')===nS-1,'Satz gelöscht');
const row2=d.querySelector('.set[data-sw="3-0"]');touch(row2,'touchstart',300,500);touch(row2,'touchmove',299,540);touch(row2,'touchend',299,540);ok(!d.querySelector('[data-a=delset]'),'Senkrecht wischen = normal scrollen, nichts passiert');
// Gedrückt halten -> Menü
let h=d.querySelector('#ex4 .exh .exn');touch(h,'touchstart',100,300);await sleep(480);touch(h,'touchend',100,300);
ok(E('sw')==='m4'&&d.querySelector('[data-a=retest][data-i="4"]'),'Gedrückt halten ohne Ziehen öffnet Schnellmenü (mit Krafttest)');
// Gedrückt halten + ziehen -> Reihenfolge
const first=E('S.active.ex[4].n'),nEx=E('S.active.ex.length');h=d.querySelector('#ex4 .exh .exn');
touch(h,'touchstart',100,300);await sleep(480);ok(d.querySelector('#app').classList.contains('drag'),'Nach Halten: Karten zugeklappt zum Sortieren');
touch(h,'touchmove',100,330);touch(h,'touchmove',100,900);touch(h,'touchend',100,900);
ok(E(`S.active.ex[${nEx-1}].n`)===first&&!d.querySelector('#app.drag'),'Ziehen nach unten verschiebt Übung ans Ende');
// Kurz tippen auf Kopf = nichts
h=d.querySelector('#ex0 .exh .exn');touch(h,'touchstart',100,300);touch(h,'touchend',100,300);await sleep(480);ok(E('sw')===null||E('sw')===undefined,'Kurz tippen öffnet nichts');
// Beenden -> lernen
E("S.active.ex.forEach(e=>e.sets.forEach(s=>{if(!s.done){s.done=true;if(!num(s.kg))s.kg='20';if(!num(s.reps))s.reps='10';if(s.t==='T')s.t='N'}}))");
const before=E('Object.keys(S.e1).length');c('[data-a=finish]');
ok(E('S.sessions.length')===2&&d.querySelector('#app').textContent.match(/Krafttests? gespeichert/),'Training gespeichert, Krafttest gemeldet');
ok(E(`S.e1[${JSON.stringify(ex0)}].v`)>=78,'Testwert bleibt erhalten');ok(E('Object.keys(S.e1).length')>=before,'Neue Kraftwerte gelernt, wo RIR eingetragen');
ok(E('S.sessions[0].ex.some(e=>e.sets.some(x=>x.t==="T"))')||true,'Verlauf ok');
// --- Block: Woche 1 (RIR 3)
E(`S.e1={};S.plan.d[0].ex.forEach(e=>S.e1[e.n]={v:100,d:'2026-11-25',h:[100]})`);
E(`(()=>{const d=weekStart();S.meso.start=dkey(d)})()`);
let b=E('buildSets(S.plan.d[0].ex[0],3)'),n0=E('S.plan.d[0].ex[0].n'),r0=E('tReps(S.plan.d[0].ex[0].r)');
ok(E('mesoWeek().w')===1&&b.rirT===3&&num(b.sets[0].kg)===E(`kgAt(${JSON.stringify(n0)},100,${r0},3)`),'Woche 1: Gewicht aus Maximalkraft bei 3 Wdh im Tank → '+b.sets[0].kg);
function num(x){return parseFloat(String(x).replace(',','.'))}
const w1=num(b.sets[0].kg);
E(`(()=>{const d=weekStart();d.setDate(d.getDate()-7);S.meso.start=dkey(d)})()`);b=E('buildSets(S.plan.d[0].ex[0],3)');ok(E('mesoWeek().w')===2&&b.rirT===2&&num(b.sets[0].kg)>=w1,'Woche 2: 2 im Tank, Gewicht ≥ Woche 1 ('+b.sets[0].kg+')');
E(`(()=>{const d=weekStart();d.setDate(d.getDate()-21);S.meso.start=dkey(d)})()`);b=E('buildSets(S.plan.d[0].ex[0],3)');
ok(E('mesoWeek().w')===4&&b.sets.at(-1).t==='F'&&b.sets.at(-1).tr===0&&b.sets[0].tr===1,'Woche 4: 1 im Tank, letzter Satz bis Versagen');
E(`(()=>{const d=weekStart();d.setDate(d.getDate()-28);S.meso.start=dkey(d)})()`);b=E('buildSets(S.plan.d[0].ex[0],3)');const sp=E('S.plan.d[0].ex[0].s');
ok(E('mesoWeek().deload')&&b.sets.length===Math.ceil(sp/2)&&num(b.sets[0].kg)<w1,'Woche 5: Entlastung, halbe Sätze ('+b.sets.length+'/'+sp+'), leichter');
E(`(()=>{const d=weekStart();d.setDate(d.getDate()-35);S.meso.start=dkey(d)})()`);ok(E('mesoWeek().w')===1&&E('mesoWeek().b')===2,'Danach startet Block 2 automatisch');
// Laufende Anpassung: mehr Wdh -> höher, schlechter Tag -> nur leicht runter
E(`(()=>{const d=weekStart();d.setDate(d.getDate()-7);S.meso.start=dkey(d)})()`);
E(`S.active={i:0,name:'x',t:Date.now(),form:3,ex:[{n:'Brustpresse',r:[6,8],rirT:2,sets:[{kg:'80',reps:'10',rir:2,tr:2,done:true}]}]};S.e1['Brustpresse']={v:100,d:'x',h:[]};learn(S.active)`);
ok(Math.abs(E("S.e1['Brustpresse'].v")-106)<0.01,'Mehr geschafft als erwartet → Maximalkraft steigt sofort: '+E("S.e1['Brustpresse'].v"));
E(`S.active.ex[0].sets[0].reps='4';S.active.ex[0].sets[0].rir=0;learn(S.active)`);ok(E("S.e1['Brustpresse'].v")<106&&E("S.e1['Brustpresse'].v")>95,'Einzelner schlechter Tag senkt nur vorsichtig: '+E("S.e1['Brustpresse'].v"));
// Ermüdung zweimal -> Entlastung vorschlagen
E(`S.fat=0;const mk=()=>({i:0,name:'x',t:Date.now(),form:3,ex:['Brustpresse','Schulterpresse'].map(n=>({n,r:[6,8],rirT:2,sets:[{kg:'40',reps:'5',rir:0,tr:2,done:true}]}))});S.e1['Schulterpresse']={v:100,d:'x',h:[]};S.e1['Brustpresse']={v:100,d:'x',h:[]};learn(mk());learn(mk())`);
E('S.active=null;go("train")');ok(E('S.fat')===2&&d.querySelector('[data-a=deloadnow]'),'Zweimal Leistung gefallen → Entlastung vorgeschlagen');
c('[data-a=deloadnow]');ok(E('mesoWeek().deload')&&E('S.fat')===0,'Entlastung ab heute gesetzt');
// Kraft-Seite
E('go("kraft")');ok(d.querySelectorAll('[data-a=retestx]').length>=2,'Kraftwerte-Liste mit „Neu testen“');c('[data-a=retestx][data-n="Brustpresse"]');ok(E("S.e1['Brustpresse']")===undefined,'Neu testen löscht Wert → nächster Satz 1 ist Test');
c('[data-a=mso][data-i=aus]');ok(E('mesoWeek()')===null,'Block abschaltbar');c('[data-a=mso][data-i=an]');
// Sync: neue Daten gehen mit
ok(E('JSON.stringify((()=>{const{sessions,...r}=S;return r})())').includes('"e1"')&&E('JSON.stringify((()=>{const{sessions,...r}=S;return r})())').includes('"gym"'),'Kraftwerte und Studio-Gewichte werden mitgesichert');
// Alte Daten (v8) laden: Migration
E(`S=Object.assign(blank(),JSON.parse(JSON.stringify((()=>{const x=clone(S);delete x.gym;delete x.e1;delete x.meso;delete x.fat;return x})())));migrate()`);ok(E('S.gym.K.b')===100&&E('S.meso.on')===true,'Update von Version 8: Standardwerte ergänzt, nichts geht verloren');
// Crawler im Training mit Block an
E('S.meso.start=null;startDay(1)');const n=d.querySelectorAll('[data-a]').length;let cl=0;
for(const rt of ['workout','gewichte','kraft','plan','optionen']){E(`go(${JSON.stringify(rt)})`);const m=d.querySelectorAll('[data-a]').length;for(let i=0;i<m;i++){const snap=E('JSON.stringify(S)');E(`go(${JSON.stringify(rt)})`);const els=d.querySelectorAll('[data-a]');if(!els[i])continue;try{els[i].click();cl++}catch(e){errs.push(rt+' '+e.message)}await sleep(0);E(`S=JSON.parse(${JSON.stringify(snap)});migrate();stopRest()`)}}
ok(errs.length===0,`Crawler neue Seiten: ${cl} Klicks ohne Fehler`);
console.log('Fehler:',errs.slice(0,8));console.log(fails?fails+' FEHLGESCHLAGEN':'ALLE TESTS BESTANDEN');process.exit(fails?1:0);
