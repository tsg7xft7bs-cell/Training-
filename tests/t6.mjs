import {JSDOM} from 'jsdom';import fs from 'fs';
const html=fs.readFileSync(new URL('../index.html', import.meta.url),'utf8');const errs=[];
const dom=new JSDOM(html,{runScripts:'dangerously',url:'https://x.test/',beforeParse(w){w.scrollTo=()=>{};w.Element.prototype.scrollIntoView=function(){};w.addEventListener('error',e=>errs.push(e.message))}});
const w=dom.window,d=w.document,E=s=>w.eval(s);let fails=0;const ok=(c,m)=>{console.log((c?'OK  ':'FAIL')+' '+m);if(!c)fails++};
const c=s=>{const el=d.querySelector(s);if(!el)throw new Error('missing '+s);el.click()};
const inp=(sel,v)=>{const el=d.querySelector(sel);el.value=v;el.dispatchEvent(new w.Event('input',{bubbles:true}))};
ok(E('LIB.length')>=240,'Übungen in der Datenbank: '+E('LIB.length'));
ok(E('new Set(LIB).size===LIB.length'),'Keine doppelten Namen');
ok(E('PLANS.every(p=>p.d.every(d=>d.ex.every(e=>MG[e.n])))'),'Alle Plan-Übungen in der Datenbank');
console.log('  pro Art:',JSON.stringify(E('Object.fromEntries(Object.keys(TY).map(t=>[t,LIB.filter(n=>MT[n]===t).length]))')));
c('[data-a=days][data-i="6"]');c('[data-a=pick][data-i=arn6]');c('[data-a=startplan]');
c('[data-a=tab][data-i=plan]');c('[data-a=go][data-i="day-0"]');c('[data-a=pickp]');
ok(d.querySelectorAll('[data-a=pickadd]').length>=240,'Auswahl zeigt alle Übungen');
c('[data-a=ptyp][data-i=KH]');ok([...d.querySelectorAll('[data-a=pickadd][data-n]')].filter(x=>x.dataset.n).every(x=>E(`MT[${JSON.stringify(x.dataset.n)}]==='KH'`)),'Filter Kurzhantel');
c('[data-a=ptyp][data-i=all]');inp('#q','curl');ok(d.querySelectorAll('[data-a=pickadd]').length>8,'Suche „curl“: '+(d.querySelectorAll('[data-a=pickadd]').length-1));
inp('#q','Brustpresse Gym80');c('[data-a=pickadd][data-n="Brustpresse Gym80"]');ok(E('route')==='eigene'&&d.querySelector('#cn').value==='Brustpresse Gym80','Eigene Übung: Formular vorausgefüllt');
c('[data-a=csave]');ok(d.querySelector('.banner.warn')&&E('route')==='eigene','Ohne Muskel: Hinweis');
d.querySelector('#cn').value='Brustpresse Gym80';c('[data-a=cgrp][data-i=brust]');c('[data-a=ctyp][data-i=M]');c('[data-a=csave]');
ok(E('route')==='day-0'&&E('S.plan.d[0].ex.at(-1).n')==='Brustpresse Gym80','Eigene Übung gespeichert und im Tag');
ok(E('MG["Brustpresse Gym80"]')==='brust'&&E('alts("Brustpresse").includes("Brustpresse Gym80")'),'Eigene Übung taucht als Tausch-Vorschlag auf');
// persists after reload
const st=w.localStorage.getItem('trn1');
const dom2=new JSDOM(html,{runScripts:'dangerously',url:'https://x.test/',beforeParse(w2){w2.localStorage.setItem('trn1',st);w2.scrollTo=()=>{}}});
ok(dom2.window.eval('MG["Brustpresse Gym80"]')==='brust','Eigene Übung nach Neustart noch da');
// cardio in workout
c('[data-a=pickp]');inp('#q','Laufband');c('[data-a=pickadd][data-n="Laufband"]');ok(JSON.stringify(E('S.plan.d[0].ex.at(-1).r'))==='[20,30]','Cardio mit Minuten-Vorgabe');
c('[data-a=start][data-i="0"]');ok(d.querySelector('#app').textContent.includes('Stufe'),'Cardio zeigt Stufe/Min');
// equipment type toggle
E('go("geraete")');c('[data-a=ttog][data-i=M]');ok(E('!has("Brustpresse")'),'Ausstattung Maschine abschaltbar');ok(!E('S.plan.d[0].ex.some(e=>MT[e.n]==="M")'),'Plan ersetzt Maschinen automatisch');c('[data-a=ttog][data-i=M]');
// own list page + delete
E('go("plan")');c('[data-a=goeig]');ok(d.querySelector('[data-a=cdel]'),'Eigene Übungen-Liste');c('[data-a=cdel]');ok(!E('MG["Brustpresse Gym80"]'),'Eigene Übung gelöscht');c('[data-a=back]');ok(E('route')==='plan','Zurück → Plan');
ok(errs.length===0,'Keine JS-Fehler '+errs.join('|'));
console.log(fails?fails+' FEHLGESCHLAGEN':'ALLE TESTS BESTANDEN');process.exit(0);
