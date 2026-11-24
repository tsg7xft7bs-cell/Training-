import {JSDOM} from 'jsdom';import fs from 'fs';
// t11: Zusatzgewichte zum Aufstecken (Kabelturm/Maschinen)
const html=fs.readFileSync(new URL('../index.html', import.meta.url),'utf8');const errs=[];
const dom=new JSDOM(html,{runScripts:'dangerously',url:'https://x.test/',beforeParse(w){w.scrollTo=()=>{};w.scrollBy=()=>{};w.Element.prototype.scrollIntoView=function(){};w.addEventListener('error',e=>errs.push(e.message))}});
const w=dom.window,d=w.document,E=s=>w.eval(s);let fails=0;const ok=(c,m)=>{console.log((c?'OK  ':'FAIL')+' '+m);if(!c)fails++};
const c=s=>{const el=d.querySelector(s);if(!el)throw new Error('missing '+s);el.click()};
const inp=(sel,v)=>{const el=d.querySelector(sel);if(!el)throw new Error('missing '+sel);el.value=v;el.dispatchEvent(new w.Event('input',{bubbles:true}))};
c('[data-a=days][data-i="6"]');c('[data-a=pick][data-i=arn6]');c('[data-a=startplan]');
ok(JSON.stringify(E('parseZ("1,25 2,5")'))==='[1.25,2.5]'&&JSON.stringify(E('parseZ("1,25+2,5; 0")'))==='[1.25,2.5]','Eingabe „1,25 2,5“ und „1,25+2,5“ wird verstanden');
E('go("gewichte")');ok(d.querySelectorAll('[data-f=gz]').length===2,'Zusatzgewichte-Feld bei Kabelturm und Maschinen (nicht Kurzhanteln)');
const before=E('avail("Kabelrudern").length');
inp('[data-f=gz][data-n=K]','1,25');ok(JSON.stringify(E('S.gym.K.z'))==='[1.25]','Kabel-Zusatz 1,25 gespeichert');
ok(E('avail("Kabelrudern").includes(3.75)')&&E('avail("Kabelrudern").length')>before,'Kabel: Zwischenstufen mit Zusatz (2,5 + 1,25 = 3,75)');
ok(E('snapKg("Kabelrudern",21.1)')===21.25,'Rundet auf Zwischenstufe 21,25');
ok(E(`calcTxt({n:'Kabelrudern',sets:[{kg:'21,25',done:false}]})`)==='Stufe 8 + Zusatz 1,25','Anzeige: Stufe 8 + Zusatz 1,25');
ok(E(`calcTxt({n:'Kabelrudern',sets:[{kg:'20',done:false}]})`)==='Stufe 8','Ohne Zusatz nötig: nur Stufe');
ok(E('stepKg("Kabelrudern",20,1)')===21.25,'Plus-Taste nutzt Zusatzgewicht als Zwischenschritt');
inp('[data-f=gz][data-n=M]','1,25 2,5');ok(E('avail("Brustpresse").includes(8.75)')&&E(`calcTxt({n:'Brustpresse',sets:[{kg:'48,75',done:false}]})`)==='Stufe 9 + Zusatz 1,25 + 2,5','Maschine mit zwei Zusatzgewichten: 45 + 1,25 + 2,5');
// pro Übung
E('S.meso.on=false');E('go("train")');c('[data-a=start][data-i="0"]');
const i=E('S.active.ex.findIndex(e=>e.n==="Brustpresse")');
c(`[data-a=sw][data-i=m${i}]`);c(`[data-a=sw][data-i=eq${i}]`);inp(`[data-f=eqz][data-i="${i}"]`,'2');
ok(JSON.stringify(E('S.eq["Brustpresse"].z'))==='[2]'&&E('avail("Brustpresse").includes(7)'),'Pro Übung eigenes Zusatzgewicht (2 kg)');
E('go("gewichte")');ok(d.querySelector('#app').textContent.includes('Zusatz 2'),'In „Eigene Werte“ sichtbar');
ok(E('avail("Kabelrudern").length')<600,'Liste bleibt klein');
ok(!errs.length,'Keine JS-Fehler '+errs.join('|'));
console.log(fails?fails+' FEHLGESCHLAGEN':'ALLE TESTS BESTANDEN');process.exit(fails?1:0);
