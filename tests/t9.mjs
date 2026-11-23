import {JSDOM} from 'jsdom';import fs from 'fs';
// t9: Apple-Design (Tokens) + Ablauf-Verbesserungen: Beenden mit offenen Sätzen, Tag-Start bei laufendem Training, Pausen-Timer übersteht Neuladen
const html=fs.readFileSync(new URL('../index.html', import.meta.url),'utf8');const errs=[];
const mk=(store)=>new JSDOM(html,{runScripts:'dangerously',url:'https://x.test/',beforeParse(w){if(store)for(const[k,v]of Object.entries(store))w.localStorage.setItem(k,v);w.scrollTo=()=>{};w.Element.prototype.scrollIntoView=function(){w.__scrolled=(w.__scrolled||0)+1};w.addEventListener('error',e=>errs.push(e.message))}});
let dom=mk(),w=dom.window,d=w.document,E=s=>w.eval(s);let fails=0;const ok=(c,m)=>{console.log((c?'OK  ':'FAIL')+' '+m);if(!c)fails++};
const c=s=>{const el=d.querySelector(s);if(!el)throw new Error('missing '+s);el.click()};
ok(html.includes('--blue:#0066cc')&&html.includes('--bg:#f5f5f7')&&html.includes('--fg:#1d1d1f'),'Apple-Farbtokens gesetzt');
ok(!/linear-gradient/.test(html),'Keine dekorativen Verläufe');
ok(/\.btn\{[^}]*border-radius:9999px/.test(html),'Buttons als Pill');
ok(!/font-size:1[0-5]px[^}]*\}[^{]*$/.test('')&&!/input[^{]*\{[^}]*font-size:1[0-5]px/.test(html.split('</style>')[0].replace(/\.set\.warm \.no\{[^}]*\}/,'')),'Eingabefelder ≥16px (kein iOS-Zoom)');
c('[data-a=days][data-i="6"]');c('[data-a=pick][data-i=arn6]');c('[data-a=startplan]');
c('[data-a=start][data-i="0"]');ok(E('route')==='workout','Training gestartet');
c('[data-a=ck][data-i="0"][data-j="0"]');
c('[data-a=finish]');ok(E('S.active')!==null&&d.querySelector('#fin'),'Offene Sätze: Rückfrage statt sofort beenden');
c('[data-a=noconf]');ok(E('S.active')!==null&&!d.querySelector('#fin'),'Weiter trainieren bricht ab');
ok(E('restEnd')>0&&w.localStorage.getItem('trn_rest'),'Pausen-Timer gespeichert');
// Tag aus Plan starten, während Training läuft
E('go("day-1")');c('[data-a=start][data-i="1"]');ok(E('S.active.i')===0&&d.querySelector('[data-a=startnew]'),'Anderer Tag bei laufendem Training: Warnung');
c('[data-a=go][data-i=workout]');ok(E('route')==='workout'&&E('S.active.i')===0,'Zum Training zurück, nichts verloren');
E('go("day-0")');ok(d.querySelector('[data-a=start][data-i="0"]').textContent.includes('fortsetzen'),'Gleicher Tag: „Training fortsetzen“');
c('[data-a=start][data-i="0"]');ok(E('route')==='workout','Fortsetzen öffnet Training');
// Neuladen: Pausen-Timer läuft weiter
const st={};for(let k=0;k<w.localStorage.length;k++){const key=w.localStorage.key(k);st[key]=w.localStorage.getItem(key)}
dom=mk(st);w=dom.window;d=w.document;
ok(w.eval('restEnd')>Date.now()&&d.querySelector('#rest').style.display==='flex','Pausen-Timer nach Neuladen sichtbar');
// Beenden mit allen Sätzen: keine Rückfrage
w.eval('S.active.ex.forEach(e=>e.sets.forEach(s=>{s.done=true;s.kg=s.kg||"20";s.reps=s.reps||"10"}));render()');
d.querySelector('[data-a=finish]').click();ok(w.eval('S.active')===null&&w.eval('S.sessions.length')===1,'Alles abgehakt: direkt gespeichert');
ok(!errs.length,'Keine JS-Fehler '+errs.join(' | '));
console.log(fails?fails+' FEHLER':'ALLE TESTS BESTANDEN');process.exit(fails?1:0);
