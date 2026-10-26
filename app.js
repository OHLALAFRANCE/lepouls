/* Le Pouls 2027 — site public.
   Votes : Supabase (connexion anonyme, une ligne par personne, résultats agrégés uniquement).
   Questions du jour : data/daily.json, mis à jour chaque matin. */
(function(){
"use strict";

/* Méthode (v2, 26 oct. 2026) : chaque proposition reprend une mesure publiquement défendue par un·e candidat·e,
   sans afficher qui la porte. 6 par axe, dont 3 où « d'accord » pousse d'un côté et 3 de l'autre.
   Le même barème est recalculé côté serveur (supabase/setup.sql) : garder les deux identiques. */
const TEST=[
 {id:"e1",axis:"x",sign:-1,text:"Il faut rétablir la retraite à 60 ans, avec 40 annuités pour une carrière complète."},
 {id:"e2",axis:"x",sign:-1,text:"L'État doit bloquer les prix des produits de première nécessité (alimentation de base, carburants, énergie)."},
 {id:"e3",axis:"x",sign:-1,text:"Il faut rétablir l'impôt sur la fortune."},
 {id:"e4",axis:"x",sign:1,text:"Pour réduire le déficit, il faut baisser les dépenses publiques plutôt qu'augmenter les impôts."},
 {id:"e5",axis:"x",sign:1,text:"Il faut travailler un peu plus longtemps et introduire une part obligatoire de retraite par capitalisation."},
 {id:"e6",axis:"x",sign:1,text:"Il faut baisser les impôts des ménages et des entreprises, même si l'État doit faire moins."},
 {id:"s1",axis:"y",sign:1,text:"Les Français devraient être prioritaires pour l'emploi, les aides et le logement social."},
 {id:"s2",axis:"y",sign:1,text:"Il faut supprimer le droit du sol : la nationalité ne s'obtiendrait plus que par la filiation ou la naturalisation."},
 {id:"s3",axis:"y",sign:1,text:"La France devrait dénoncer l'accord franco-algérien de 1968 sur l'immigration."},
 {id:"s4",axis:"y",sign:-1,text:"L'aide médicale d'État (AME) pour les étrangers sans titre de séjour doit être maintenue."},
 {id:"s5",axis:"y",sign:-1,text:"La France doit respecter les règles et traités européens, même quand ils la contraignent."},
 {id:"s6",axis:"y",sign:-1,text:"La France doit continuer d'accueillir largement étudiants et travailleurs étrangers dans les métiers en tension."}
];
const QUESTIONS=[
 {id:"q6",text:"Faut-il limiter la liberté d'installation des médecins pour lutter contre les déserts médicaux ?",ctx:"La santé est le premier enjeu cité par les électeurs. La proposition de loi Garot, votée par l'Assemblée en 2025, a été adoucie par le Sénat en juin 2026 et son examen n'est pas terminé.",src:[["Caducée, 13 juin 2026","https://www.caducee.net/actualite-medicale/16919/deserts-medicaux-le-senat-adopte-une-regulation-edulcoree-de-l-installation-mais-laisse-la-loi-garot-en-plan.html"],["Ipsos, avril 2026","https://www.ipsos.com/fr-fr/presidentielle-2027-le-retour-du-vote-sur-enjeux"]]},
 {id:"q7",text:"Faut-il indexer tous les salaires, du public comme du privé, sur l'inflation ?",ctx:"Le pouvoir d'achat est la deuxième priorité des électeurs. La mesure figure au programme de La France insoumise ; ses opposants craignent une spirale prix-salaires.",src:[["France-Vote","https://www.france-vote.fr/actualites/programme-melenchon-lfi-2027"],["Ipsos, avril 2026","https://www.ipsos.com/fr-fr/presidentielle-2027-le-retour-du-vote-sur-enjeux"]]},
 {id:"q8",text:"Faut-il élire les députés à la proportionnelle intégrale ?",ctx:"Proposée dans le cadre d'une VIe République par La France insoumise, la réforme du mode de scrutin revient régulièrement dans le débat.",src:[["France-Vote","https://www.france-vote.fr/actualites/programme-melenchon-lfi-2027"]]}
];
const DUELS=[
 {id:"d1",a:"Marine Le Pen",b:"Jean-Luc Mélenchon",poll:"Dernières mesures publiées : Odoxa (24 sept.–7 oct.) 67 % – 33 %, Toluna Harris Interactive (5–8 oct.) 68 % – 32 %.",src:["Économie Matin","https://www.economiematin.fr/?p=233995"]},
 {id:"d2",a:"Marine Le Pen",b:"Édouard Philippe",poll:"Dernières mesures publiées (7–8 juillet) : Harris Interactive 51 % – 49 %, Ifop 54 % – 46 %. Le duel le plus serré testé jusqu'ici.",src:["Wikipédia, synthèse des sondages","https://en.wikipedia.org/wiki/Opinion_polling_for_the_2027_French_presidential_election"]},
 {id:"d3",a:"Marine Le Pen",b:"Raphaël Glucksmann",poll:"Pas encore testé au second tour. Glucksmann a remporté mi-octobre la primaire sociale-démocrate avec près de 66 %.",src:["Euronews, 16 oct. 2026","https://fr.euronews.com/2026/10/16/presidentielle-2027-raphael-glucksmann-progresse-dans-les-sondages-apres-sa-victoire-a-la-"]},
 {id:"d4",a:"Édouard Philippe",b:"Jean-Luc Mélenchon",poll:"Duel sans le Rassemblement national, non testé récemment par les instituts.",src:null}
];
const TRIBES={
 heron:{name:"Héron",axis:"Redistribution · ouverture",color:"var(--t-heron)",desc:"Vous privilégiez l'égalité et la justice sociale, avec une société ouverte et des libertés individuelles étendues."},
 loup:{name:"Loup",axis:"Redistribution · autorité",color:"var(--t-loup)",desc:"Vous voulez un État protecteur sur le plan social, et plus ferme sur la souveraineté, l'ordre ou l'immigration."},
 chouette:{name:"Chouette",axis:"Centre",color:"var(--t-chouette)",desc:"Vos réponses s'équilibrent : vous jugez au cas par cas plutôt que par bloc."},
 cerf:{name:"Cerf",axis:"Marché · ouverture",color:"var(--t-cerf)",desc:"Vous faites confiance à l'économie de marché et à l'Europe, avec une société plutôt libérale."},
 lynx:{name:"Lynx",axis:"Marché · autorité",color:"var(--t-lynx)",desc:"Vous souhaitez moins d'État dans l'économie et plus d'autorité sur l'ordre, l'identité et les frontières."}
};
const ORDER=["heron","loup","chouette","cerf","lynx"];
const VAL={O:1,D:0,X:-1};
const LOCAL_KEY="lepouls.v2";

let me={test:{},ans:{},duel:{},consent:false};
let daily=[];
let R=emptyResults();            // aggregated results from the server
let sb=null, session=null;
const $=id=>document.getElementById(id);

/* ---------- helpers ---------- */
function emptyResults(){return {n:0,blackout:false,tribes:{},ans:{},duel:{},map:[]};}
function scores(test){
  let x=0,y=0,c=0;
  TEST.forEach(t=>{const v=test[t.id]; if(v){c++; const s=VAL[v]*t.sign; if(t.axis==="x")x+=s; else y+=s;}});
  return {x:x/6,y:y/6,done:c===TEST.length,count:c};
}
function tribeOf(x,y){
  if(Math.abs(x)<0.3&&Math.abs(y)<0.3) return "chouette";
  if(x<0) return y>=0?"loup":"heron";
  return y>=0?"lynx":"cerf";
}
function el(tag,attrs,kids){const e=document.createElement(tag);if(attrs)for(const k in attrs){if(k==="text")e.textContent=attrs[k];else if(k==="html")e.innerHTML=attrs[k];else e.setAttribute(k,attrs[k]);}(kids||[]).forEach(k=>k&&e.appendChild(k));return e;}
function status(t,warn){const s=$("status");s.textContent=t;s.className="status"+(warn?" warn":"");}
function loadLocal(){try{const v=JSON.parse(localStorage.getItem(LOCAL_KEY)||"null");if(v&&typeof v==="object"){me.test=v.test||{};me.ans=v.ans||{};me.duel=v.duel||{};}}catch(e){}}
function saveLocal(){try{localStorage.setItem(LOCAL_KEY,JSON.stringify({test:me.test,ans:me.ans,duel:me.duel}));}catch(e){}}
function clearLocal(){try{localStorage.removeItem(LOCAL_KEY);}catch(e){}}

/* Results are hidden the day before and the day of each round (French law), Paris time. */
function inBlackout(){
  const p=new Intl.DateTimeFormat("sv-SE",{timeZone:"Europe/Paris",year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",hour12:false}).format(new Date()).replace(" ","T");
  return (p>="2027-04-17T00:00"&&p<"2027-04-18T20:00")||(p>="2027-05-01T00:00"&&p<"2027-05-02T20:00");
}


/* ---------- tribe animals (original drawings, centred on 0,0) ---------- */
const B=w=>`class="sk" stroke-width="${w}" stroke-linecap="round" fill="none"`;
const HEAD={
 heron:c=>`<path d="M-6 14 C-16 30 -2 40 -12 58" fill="none" style="stroke:${c}" stroke-width="10" stroke-linecap="round"/>
  <path d="M-12 -18 C-24 -26 -36 -24 -46 -36 C-36 -18 -24 -12 -12 -8Z" class="ink"/>
  <circle cy="-2" r="20" style="fill:${c}"/>
  <path d="M14 -9 L54 -2 L14 5Z" style="fill:var(--mid)"/><path d="M15 -2 L52 -2" ${B(1.5)}/>
  <circle cx="4" cy="-7" r="5.5" class="pap"/><circle cx="5.6" cy="-6.5" r="2.7" class="ink"/>
  <path d="M-4 -16 L11 -12" ${B(3.2)}/>`,
 loup:c=>`<path d="M-25 -8 L-20 -42 L-3 -20Z M25 -8 L20 -42 L3 -20Z" style="fill:${c}"/>
  <path d="M-17 -15 L-18 -32 L-9 -21Z M17 -15 L18 -32 L9 -21Z" class="ink" opacity=".3"/>
  <path d="M0 -26 C20 -26 30 -10 28 6 C26 20 14 30 0 34 C-14 30 -26 20 -28 6 C-30 -10 -20 -26 0 -26Z" style="fill:${c}"/>
  <path d="M-14 8 C-12 27 12 27 14 8 C8 2 -8 2 -14 8Z" class="pap"/>
  <ellipse cy="7" rx="6" ry="4" class="ink"/>
  <path d="M-8 19 Q0 25 8 19" ${B(2)}/>
  <path d="M-5 20 L-3 26 L-1 21.5Z M1 21.5 L3 26 L5 20Z" class="pap" stroke="var(--ink)" stroke-width="1"/>
  <circle cx="-10" cy="-6" r="3.3" class="ink"/><circle cx="10" cy="-6" r="3.3" class="ink"/>
  <path d="M-18 -14 L-5 -9 M18 -14 L5 -9" ${B(3.2)}/>`,
 chouette:c=>`<path d="M-26 -16 L-31 -42 L-11 -26Z M26 -16 L31 -42 L11 -26Z" style="fill:${c}"/>
  <ellipse cy="2" rx="31" ry="33" style="fill:${c}"/>
  <circle cx="-12" cy="-4" r="12.5" class="pap"/><circle cx="12" cy="-4" r="12.5" class="pap"/>
  <circle cx="-9.5" cy="-2.5" r="5.2" class="ink"/><circle cx="9.5" cy="-2.5" r="5.2" class="ink"/>
  <path d="M-5 8 L0 19 L5 8Z" class="ink"/>
  <path d="M-25 -19 L-2 -10 M25 -19 L2 -10" ${B(3.8)}/>
  <path d="M-14 24 Q-10 28 -6 24 Q-2 28 2 24 Q6 28 10 24 Q14 28 16 24" ${B(1.5)} opacity=".45"/>`,
 cerf:c=>`<path d="M-8 -20 C-14 -34 -18 -40 -16 -54 M-14 -37 C-22 -38 -29 -43 -31 -52 M-16 -47 C-10 -49 -8 -53 -8 -60 M8 -20 C14 -34 18 -40 16 -54 M14 -37 C22 -38 29 -43 31 -52 M16 -47 C10 -49 8 -53 8 -60" ${B(4.5)}/>
  <ellipse cx="-24" cy="-12" rx="12" ry="6" transform="rotate(-22 -24 -12)" style="fill:${c}"/>
  <ellipse cx="24" cy="-12" rx="12" ry="6" transform="rotate(22 24 -12)" style="fill:${c}"/>
  <path d="M0 -24 C14 -24 20 -12 18 4 C16 20 10 34 0 37 C-10 34 -16 20 -18 4 C-20 -12 -14 -24 0 -24Z" style="fill:${c}"/>
  <ellipse cy="27" rx="10" ry="9" class="pap"/><ellipse cy="29" rx="6" ry="4.5" class="ink"/>
  <circle cx="-8" cy="-1" r="3.2" class="ink"/><circle cx="8" cy="-1" r="3.2" class="ink"/>
  <path d="M-15 -10 L-3 -6 M15 -10 L3 -6" ${B(3.2)}/>`,
 lynx:c=>`<path d="M-26 -10 L-20 -43 L-5 -22Z M26 -10 L20 -43 L5 -22Z" style="fill:${c}"/>
  <path d="M-20 -43 L-22 -56 M20 -43 L22 -56" ${B(3)}/>
  <path d="M-28 0 L-41 10 L-31 14 L-39 24 L-25 24 L-27 34 L-11 30 L0 37 L11 30 L27 34 L25 24 L39 24 L31 14 L41 10 L28 0Z" style="fill:${c}"/>
  <circle cy="-2" r="27" style="fill:${c}"/>
  <path d="M-6 -27 L-4 -18 M0 -29 L0 -19 M6 -27 L4 -18" ${B(2)} opacity=".4"/>
  <ellipse cy="12" rx="13" ry="9" class="pap"/><path d="M-4 6 L4 6 L0 11Z" class="ink"/>
  <path d="M-18 -5 Q-10 -12 -3 -5 Q-10 -1 -18 -5Z M18 -5 Q10 -12 3 -5 Q10 -1 18 -5Z" style="fill:var(--mid)"/>
  <ellipse cx="-10" cy="-5" rx="1.6" ry="3.2" class="ink"/><ellipse cx="10" cy="-5" rx="1.6" ry="3.2" class="ink"/>
  <path d="M-19 -13 L-5 -9 M19 -13 L5 -9" ${B(3.2)}/>
  <path d="M7 13 L27 10 M7 15 L27 18 M-7 13 L-27 10 M-7 15 L-27 18" ${B(1)} opacity=".6"/>`
};
const NS="http://www.w3.org/2000/svg";
function icon(k,size){
  const svg=document.createElementNS(NS,"svg");
  svg.setAttribute("viewBox","-62 -64 124 124"); svg.setAttribute("width",size); svg.setAttribute("height",size); svg.setAttribute("aria-hidden","true");
  svg.innerHTML=HEAD[k](TRIBES[k].color); return svg;
}
function renderArena(){
  const g=(k,x,y,s,r)=>`<g transform="translate(${x} ${y}) rotate(${r}) scale(${s})">${HEAD[k](TRIBES[k].color)}</g>`;
  const star=(x,y,r,fill,d)=>{let pts=[];for(let i=0;i<10;i++){const a=Math.PI/5*i-Math.PI/2,rr=i%2?r*.45:r;pts.push((x+rr*Math.cos(a)).toFixed(1)+","+(y+rr*Math.sin(a)).toFixed(1));}return `<polygon class="twinkle" style="fill:${fill};animation-delay:${d}s" points="${pts.join(" ")}"/>`;};
  const C=[[232,150,55],[292,110,60],[362,106,58],[424,148,55],[330,172,66],[262,190,46],[402,194,46]];
  let h='<g class="brawl">';
  // limbs sticking out from behind the cloud
  h+='<path d="M212 205 L190 246 M190 246 L176 248 M190 246 L188 258 M190 246 L200 254" fill="none" style="stroke:var(--mid)" stroke-width="4" stroke-linecap="round"/>';
  h+='<path d="M280 222 C262 240 246 238 232 250" fill="none" style="stroke:var(--t-loup)" stroke-width="11" stroke-linecap="round"/>';
  h+='<path d="M388 228 L406 250" fill="none" style="stroke:var(--t-cerf)" stroke-width="7" stroke-linecap="round"/><path d="M402 246 L414 245 L412 256 L401 255Z" class="ink"/>';
  h+='<circle cx="458" cy="226" r="11" style="fill:var(--t-lynx)"/><path d="M452 232 L452 236 M458 233 L458 237 M464 232 L464 236" fill="none" class="sk" stroke-width="1.5" stroke-linecap="round"/>';
  h+='<path d="M338 232 C346 246 360 250 372 246 C360 240 350 234 344 226Z" style="fill:var(--t-chouette)"/>';
  // the dust cloud: outline circles first, fills on top
  h+=C.map(c=>`<circle cx="${c[0]}" cy="${c[1]}" r="${c[2]+4}" class="ink"/>`).join("")+C.map(c=>`<circle cx="${c[0]}" cy="${c[1]}" r="${c[2]}" class="cloudf"/>`).join("");
  h+='<path d="M252 152 q20 -28 40 0 M332 130 q24 -24 46 4 M300 188 q20 -20 40 0 M380 170 q14 -16 28 0" fill="none" class="sk" stroke-width="3" stroke-linecap="round" opacity=".3"/>';
  h+=g("heron",178,150,1.05,-8)+g("loup",250,80,1,-14)+g("chouette",330,64,1,0)+g("cerf",412,88,.95,14)+g("lynx",484,150,1.05,8);
  h+='</g>';
  // flying ballot, stars and shouts
  h+='<g transform="translate(96 92) rotate(-18)"><rect x="-17" y="-22" width="34" height="44" rx="2" class="pap" stroke="var(--ink)" stroke-width="2.5"/><path d="M-9 -12 L9 -12 M-9 -5 L5 -5 M-7 4 L7 16 M7 4 L-7 16" fill="none" class="sk" stroke-width="2.2" stroke-linecap="round"/></g>';
  h+='<path d="M124 112 L150 124 M120 124 L142 134" fill="none" class="sk" stroke-width="2.5" stroke-linecap="round" opacity=".5"/>';
  h+=star(150,52,13,"var(--accent)",0)+star(530,62,15,"var(--mid)",.3)+star(566,196,11,"var(--accent)",.6)+star(100,212,10,"var(--mid)",.9)+star(500,232,8,"var(--accent)",.4);
  h+='<text x="548" y="134" font-family="Big Shoulders Display, Impact, sans-serif" font-weight="900" font-size="40" style="fill:var(--accent)" transform="rotate(10 548 134)">!?</text>';
  h+='<text x="52" y="160" font-family="Big Shoulders Display, Impact, sans-serif" font-weight="900" font-size="30" style="fill:var(--ink)" transform="rotate(-12 52 160)">#@!</text>';
  $("arena").innerHTML=h;
}


/* ---------- share card (1080×1920, story format) ---------- */
const SITE="https://ohlalafrance.github.io/lepouls/";
const LIGHT={ink:"#18213a",pap:"#ffffff",paper:"#f3f4f1",mid:"#c9a227",accent:"#d1381f",accentDark:"#ff6a4d",muted:"#5d6577",soft:"#e4e7ee",line:"#cdd1da",
  heron:"#1f7a78",loup:"#b4462e",chouette:"#b8860b",cerf:"#5f7a2a",lynx:"#6b3f86"};
function headImage(k){
  const m=HEAD[k](LIGHT[k]).replace(/class="ink"/g,`fill="${LIGHT.ink}"`).replace(/class="pap"/g,`fill="${LIGHT.pap}"`)
    .replace(/class="sk"/g,`stroke="${LIGHT.ink}"`).replace(/var\(--mid\)/g,LIGHT.mid).replace(/var\(--ink\)/g,LIGHT.ink);
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="-62 -64 124 124" width="800" height="800">${m}</svg>`;
  return new Promise((res,rej)=>{const img=new Image();img.onload=()=>res(img);img.onerror=rej;img.src="data:image/svg+xml;charset=utf-8,"+encodeURIComponent(svg);});
}
function wrapText(g,text,maxW){
  const words=text.split(" "),lines=[];let line="";
  words.forEach(w=>{const t=line?line+" "+w:w;if(g.measureText(t).width>maxW&&line){lines.push(line);line=w;}else line=t;});
  if(line)lines.push(line);return lines;
}
async function makeCard(k,x,y){
  await Promise.all(['900 100px "Big Shoulders Display"','800 100px "Big Shoulders Display"','500 40px "IBM Plex Sans"','600 40px "IBM Plex Sans"','500 30px "IBM Plex Mono"']
    .map(f=>document.fonts?document.fonts.load(f).catch(()=>{}):null));
  const W=1080,H=1920,cv=document.createElement("canvas");cv.width=W;cv.height=H;const g=cv.getContext("2d");
  const T=TRIBES[k],col=LIGHT[k];
  const D='"Big Shoulders Display", Impact, "Arial Narrow", sans-serif',F='"IBM Plex Sans", system-ui, sans-serif',M='"IBM Plex Mono", ui-monospace, monospace';
  g.fillStyle=LIGHT.paper;g.fillRect(0,0,W,H);
  // top band
  g.fillStyle=LIGHT.ink;g.fillRect(0,0,W,150);
  g.textBaseline="middle";g.font=`900 74px ${D}`;g.fillStyle="#ffffff";g.fillText("LE POULS",80,80);
  const w1=g.measureText("LE POULS ").width;g.fillStyle=LIGHT.accentDark;g.fillText("2027",80+w1,80);
  // headline
  g.textBaseline="alphabetic";
  g.font=`800 70px ${D}`;g.fillStyle=LIGHT.muted;g.fillText("JE SUIS",80,300);
  g.font=`500 28px ${M}`;g.textAlign="right";g.fillText("1er tour · 18 avril 2027",W-80,296);g.textAlign="left";
  let size=260;g.font=`900 ${size}px ${D}`;
  while(g.measureText(T.name.toUpperCase()).width>W-160&&size>120){size-=10;g.font=`900 ${size}px ${D}`;}
  g.fillStyle=col;g.fillText(T.name.toUpperCase(),74,300+size*.95);
  // animal
  const cy=910;
  g.globalAlpha=.13;g.fillStyle=col;g.beginPath();g.arc(W/2,cy,320,0,Math.PI*2);g.fill();g.globalAlpha=1;
  g.lineWidth=6;g.strokeStyle=col;g.setLineDash([4,18]);g.lineCap="round";g.beginPath();g.arc(W/2,cy,350,0,Math.PI*2);g.stroke();g.setLineDash([]);
  try{const img=await headImage(k);g.drawImage(img,W/2-330,cy-330,660,660);}catch(e){}
  // axis chip
  g.font=`600 40px ${F}`;const aw=g.measureText(T.axis).width;
  const chipY=1305,chipH=78;g.fillStyle=LIGHT.pap;g.beginPath();g.roundRect?g.roundRect(80,chipY,aw+104,chipH,39):g.rect(80,chipY,aw+104,chipH);g.fill();
  g.fillStyle=col;g.beginPath();g.arc(122,chipY+chipH/2,13,0,Math.PI*2);g.fill();
  g.fillStyle=LIGHT.ink;g.textBaseline="middle";g.fillText(T.axis,150,chipY+chipH/2+2);g.textBaseline="alphabetic";
  // description (left) + mini map (right)
  g.font=`500 38px ${F}`;g.fillStyle=LIGHT.ink;
  wrapText(g,T.desc,560).slice(0,5).forEach((l,i)=>g.fillText(l,80,1460+i*54));
  const mx=720,my=1390,ms=280,c0x=mx+ms/2,c0y=my+ms/2;
  g.fillStyle=LIGHT.soft;g.fillRect(mx,my,ms,ms);
  g.strokeStyle=LIGHT.line;g.lineWidth=3;g.beginPath();g.moveTo(c0x,my);g.lineTo(c0x,my+ms);g.moveTo(mx,c0y);g.lineTo(mx+ms,c0y);g.stroke();
  g.font=`500 24px ${F}`;g.fillStyle=LIGHT.muted;g.textAlign="center";g.fillText("Autorité",c0x,my-14);g.fillText("Ouverture",c0x,my+ms+34);
  g.textAlign="left";g.fillText("◀ Redistr.",mx,my+ms+70);g.textAlign="right";g.fillText("Marché ▶",mx+ms,my+ms+70);g.textAlign="left";
  const px=c0x+x*(ms/2-22),py=c0y-y*(ms/2-22);
  g.fillStyle="#ffffff";g.beginPath();g.arc(px,py,24,0,Math.PI*2);g.fill();g.fillStyle=col;g.beginPath();g.arc(px,py,17,0,Math.PI*2);g.fill();
  // call to action
  g.fillStyle=LIGHT.ink;g.fillRect(0,1760,W,160);
  const cta="ET TOI, T'ES QUELLE TRIBU ?";let cs=70;g.font=`900 ${cs}px ${D}`;
  while(g.measureText(cta).width>W-160&&cs>40){cs-=2;g.font=`900 ${cs}px ${D}`;}
  g.fillStyle="#ffffff";g.textBaseline="middle";g.fillText(cta,80,1808);
  g.font=`500 32px ${M}`;g.fillStyle=LIGHT.accentDark;g.fillText(SITE.replace("https://",""),80,1862);
  g.font=`500 22px ${F}`;g.fillStyle="#a2a9b8";g.fillText("Consultation ouverte, pas un sondage. Résultats non représentatifs.",80,1898);
  return new Promise((res,rej)=>cv.toBlob(b=>b?res(b):rej(new Error("toBlob")),"image/png"));
}
let cardPreview=null; // {k,url} kept across re-renders
async function shareCard(k,x,y,btn,box){
  const old=btn.textContent;btn.disabled=true;btn.textContent="Création de l'image…";
  try{
    const blob=await makeCard(k,x,y),name="le-pouls-"+k+".png",file=new File([blob],name,{type:"image/png"});
    if(cardPreview)URL.revokeObjectURL(cardPreview.url);
    cardPreview={k,url:URL.createObjectURL(blob)};showPreview(box);
    let shared=false;
    if(navigator.canShare&&navigator.canShare({files:[file]})){
      try{await navigator.share({files:[file],text:"Je suis "+TRIBES[k].name+" ! Et toi, t'es quelle tribu ? "+SITE});shared=true;}catch(e){shared=e&&e.name==="AbortError";}
    }
    if(!shared){const a=el("a",{href:cardPreview.url,download:name});document.body.appendChild(a);a.click();a.remove();status("Image enregistrée : publiez-la en story et ajoutez le lien du site.");}
  }catch(e){status("Impossible de créer l'image pour le moment.",true);}
  btn.disabled=false;btn.textContent=old;
}
function showPreview(box){
  box.textContent="";
  if(!cardPreview)return;
  box.appendChild(el("img",{src:cardPreview.url,alt:"Carte de partage de votre tribu",class:"cardprev"}));
  box.appendChild(el("span",{class:"pct",text:"Sur ordinateur, l'image est téléchargée. Sur téléphone, appuyez longuement dessus pour l'enregistrer."}));
}
async function copyLink(btn){
  try{await navigator.clipboard.writeText(SITE);btn.textContent="Lien copié";}
  catch(e){btn.textContent=SITE.replace("https://","");}
  setTimeout(()=>{btn.textContent="Copier le lien";},2500);
}

/* ---------- tabs ---------- */
const TABS=["test","question","duel","carte"];
function show(t){if(!TABS.includes(t))t="test";TABS.forEach(n=>{$("panel-"+n).hidden=n!==t;$("tab-"+n).setAttribute("aria-selected",n===t?"true":"false");});try{history.replaceState(null,"","#"+t);}catch(e){}}
document.querySelectorAll("nav.tabs button").forEach(b=>b.addEventListener("click",()=>show(b.dataset.tab)));
show((location.hash||"").slice(1));

/* ---------- render: test ---------- */
function renderTest(){
  const box=$("props"); box.textContent="";
  TEST.forEach((t,i)=>{
    const oxo=el("div",{class:"oxo",role:"group","aria-label":"Votre réponse"});
    [["O","O","D'accord"],["D","△","Ça dépend"],["X","X","Pas d'accord"]].forEach(([v,s,l])=>{
      const b=el("button",{type:"button","data-v":v,"aria-label":l,"aria-pressed":me.test[t.id]===v?"true":"false",text:s});
      b.addEventListener("click",()=>{if(me.test[t.id]===v)delete me.test[t.id];else me.test[t.id]=v; changed(); renderTest(); renderMap();});
      oxo.appendChild(b);
    });
    box.appendChild(el("div",{class:"prop"},[el("span",{class:"idx",text:String(i+1).padStart(2,"0")}),el("span",{class:"txt",text:t.text}),oxo]));
  });
  const s=scores(me.test), mt=$("myTribe"); mt.textContent="";
  if(!s.done){mt.appendChild(el("p",{class:"empty",text:"Encore "+(TEST.length-s.count)+" proposition"+(TEST.length-s.count>1?"s":"")+" pour découvrir votre tribu."}));return;}
  const k=tribeOf(s.x,s.y), T=TRIBES[k];
  const same=R.tribes[k]||0;
  mt.appendChild(el("div",{class:"tribe"},[
    el("div",{},[
      el("div",{class:"eyebrow",text:"Votre tribu"}),
      el("div",{class:"tname"},[icon(k,56),el("div",{class:"name",text:T.name})]),
      el("span",{class:"chip"},[el("i",{style:"background:"+T.color}),document.createTextNode(T.axis)]),
      el("p",{text:T.desc}),
      R.blackout?null:el("p",{class:"pct",text:same+" participant·e"+(same>1?"s":"")+" dans cette tribu"})
    ]),
    miniMap(s.x,s.y,T.color)
  ]));
  const shareBtn=el("button",{type:"button",class:"btn share",id:"shareBtn",text:"Partager ma tribu"});
  const copyBtn=el("button",{type:"button",class:"btn ghost",text:"Copier le lien"});
  const nextBtn=el("button",{type:"button",class:"btn ghost",text:"Question du jour →"});
  const prev=el("div",{class:"cardbox"});
  shareBtn.addEventListener("click",()=>shareCard(k,s.x,s.y,shareBtn,prev));
  copyBtn.addEventListener("click",()=>copyLink(copyBtn));
  nextBtn.addEventListener("click",()=>show("question"));
  mt.appendChild(el("div",{class:"row"},[shareBtn,copyBtn,nextBtn]));
  if(cardPreview&&cardPreview.k===k)showPreview(prev);
  mt.appendChild(prev);
}
function miniMap(x,y,color){
  const svg=document.createElementNS("http://www.w3.org/2000/svg","svg"); svg.setAttribute("viewBox","0 0 240 240"); svg.setAttribute("role","img"); svg.setAttribute("aria-label","Votre position");
  svg.innerHTML='<rect x="20" y="20" width="200" height="200" fill="var(--soft)" rx="2"/><line x1="120" y1="20" x2="120" y2="220" stroke="var(--line)"/><line x1="20" y1="120" x2="220" y2="120" stroke="var(--line)"/>'+
   '<text x="22" y="236" font-size="10" fill="var(--muted)" font-family="IBM Plex Sans, sans-serif">Redistribution</text><text x="218" y="236" font-size="10" fill="var(--muted)" text-anchor="end" font-family="IBM Plex Sans, sans-serif">Marché</text>'+
   '<text x="120" y="13" font-size="10" fill="var(--muted)" text-anchor="middle" font-family="IBM Plex Sans, sans-serif">Autorité</text>'+
   '<circle cx="'+(120+x*95)+'" cy="'+(120-y*95)+'" r="9" fill="'+color+'" stroke="var(--card)" stroke-width="3"/>';
  return svg;
}

/* ---------- results blocks ---------- */
function bars(counts,keys,colors){
  const tot=keys.reduce((a,k)=>a+(counts[k]||0),0);
  const bar=el("div",{class:"bar"});
  if(tot)keys.forEach((k,i)=>{const w=(counts[k]||0)/tot*100;if(w>0)bar.appendChild(el("span",{style:"width:"+w+"%;background:"+colors[i],title:Math.round(w)+"%"}));});
  return {bar,tot};
}
function resultBlock(field,id,keys,colors){
  const wrap=el("div",{class:"results"});
  if(R.blackout){wrap.appendChild(el("p",{class:"empty",text:"Résultats masqués la veille et le jour du scrutin. Vous pouvez toujours voter."}));return wrap;}
  const q=R[field][id];
  const total=q?q.all:{};
  const t=bars(total,keys,colors);
  if(!t.tot){wrap.appendChild(el("p",{class:"empty",text:"Pas encore de votes. Les résultats par tribu apparaîtront ici dès les premières réponses."}));return wrap;}
  wrap.appendChild(el("div",{class:"rrow total"},[el("span",{class:"lab",text:"Ensemble"}),t.bar,el("span",{class:"n",text:String(t.tot)})]));
  ORDER.forEach(k=>{
    const b=bars((q&&q.by[k])||{},keys,colors);
    wrap.appendChild(el("div",{class:"rrow"},[el("span",{class:"lab"},[el("i",{style:"background:"+TRIBES[k].color}),document.createTextNode(TRIBES[k].name)]),b.tot?b.bar:el("div",{class:"bar"}),el("span",{class:"n",text:String(b.tot)})]));
  });
  return wrap;
}
function srcLine(list){
  if(!list||!list.length)return null;
  const p=el("p",{class:"src"},[document.createTextNode("Sources : ")]);
  list.forEach((s,i)=>{if(i)p.appendChild(document.createTextNode(" · "));p.appendChild(el("a",{href:s[1],target:"_blank",rel:"noopener",text:s[0]}));});
  return p;
}

/* ---------- render: questions ---------- */
const MOIS=["janv.","févr.","mars","avr.","mai","juin","juil.","août","sept.","oct.","nov.","déc."];
const fmt=d=>{const m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(d||"");return m?(+m[3])+" "+MOIS[+m[2]-1]:"";};
function renderQuestions(){
  const box=$("questions"); box.textContent="";
  const list=daily.map((d,i)=>({id:d.qid,hero:i===0,kicker:(i===0?"Question du jour · ":"Question du ")+fmt(d.date),text:d.text,ctx:d.ctx,src:d.src}))
    .concat(QUESTIONS.map(q=>Object.assign({kicker:"Question de fond"},q)));
  if(!daily.length)box.appendChild(el("p",{class:"empty",text:"La nouvelle question du jour est publiée chaque matin vers 6 h, à partir de l'actualité. En attendant, voici les questions de fond."}));
  list.forEach(q=>{
    const voted=me.ans[q.id];
    const choices=el("div",{class:"choices"});
    [["O","O","D'accord"],["D","△","Ça dépend"],["X","X","Pas d'accord"]].forEach(([v,s,l])=>{
      const b=el("button",{type:"button","aria-pressed":voted===v?"true":"false"},[el("span",{class:"sym",text:s}),document.createTextNode(l)]);
      b.addEventListener("click",()=>{if(me.ans[q.id]===v)delete me.ans[q.id];else me.ans[q.id]=v; changed(); renderQuestions();});
      choices.appendChild(b);
    });
    const card=el("article",{class:"ballot"+(q.hero?" hero":"")},[
      el("span",{class:"kicker",text:q.kicker}),
      el("h3",{text:q.text}),
      el("p",{class:"ctx",text:q.ctx}),
      srcLine(q.src),
      choices,
      resultBlock("ans",q.id,["O","D","X"],["var(--yes)","var(--mid)","var(--no)"])
    ]);
    if(voted)card.appendChild(el("span",{class:"stamp",text:"A voté"}));
    box.appendChild(card);
  });
}

/* ---------- render: duels ---------- */
function renderDuels(){
  const box=$("duels"); box.textContent="";
  DUELS.forEach(d=>{
    const voted=me.duel[d.id];
    const q=R.duel[d.id], a=q?(q.all.A||0):0, b=q?(q.all.B||0):0, n=a+b;
    const pa=(n&&!R.blackout)?Math.round(a/n*100):null;
    const head=el("div",{class:"duel-head"},[
      el("div",{},[el("div",{class:"cand",text:d.a}),el("div",{class:"big",text:pa===null?"–":pa+" %"})]),
      el("span",{class:"vs",text:"vs"}),
      el("div",{},[el("div",{class:"cand b",text:d.b}),el("div",{class:"big",style:"text-align:right;color:var(--accent)",text:pa===null?"–":(100-pa)+" %"})])
    ]);
    const choices=el("div",{class:"choices"});
    [["A",d.a],["B",d.b],["N","Blanc ou abstention"]].forEach(([v,l])=>{
      const btn=el("button",{type:"button","aria-pressed":voted===v?"true":"false",text:l});
      btn.addEventListener("click",()=>{if(me.duel[d.id]===v)delete me.duel[d.id];else me.duel[d.id]=v; changed(); renderDuels();});
      choices.appendChild(btn);
    });
    const legend=el("div",{class:"legend"},[
      el("span",{},[el("i",{style:"background:var(--ink)"}),document.createTextNode(d.a)]),
      el("span",{},[el("i",{style:"background:var(--accent)"}),document.createTextNode(d.b)]),
      el("span",{},[el("i",{style:"background:var(--blank)"}),document.createTextNode("Blanc / abstention")])
    ]);
    const card=el("article",{class:"ballot"},[
      el("span",{class:"kicker",text:"Second tour hypothétique"}),head,
      el("p",{class:"ctx",text:d.poll}),
      d.src?srcLine([d.src]):null,
      el("p",{class:"ctx",text:"Ici, pourcentages calculés sur les suffrages exprimés des participant·es, hors blancs et abstentions."}),
      choices,legend,
      resultBlock("duel",d.id,["A","B","N"],["var(--ink)","var(--accent)","var(--blank)"])
    ]);
    if(voted)card.appendChild(el("span",{class:"stamp",text:"A voté"}));
    box.appendChild(card);
  });
}

/* ---------- render: map ---------- */
function renderMap(){
  const P=v=>200+v*165;
  let h='<rect x="35" y="35" width="330" height="330" fill="var(--soft)" rx="2"/>'+
   '<line x1="200" y1="35" x2="200" y2="365" stroke="var(--line)" stroke-width="1.5"/><line x1="35" y1="200" x2="365" y2="200" stroke="var(--line)" stroke-width="1.5"/>'+
   '<rect x="150.5" y="150.5" width="99" height="99" fill="none" stroke="var(--line)" stroke-dasharray="3 3"/>';
  const lbl=(x,y,t,a)=>'<text x="'+x+'" y="'+y+'" font-size="11" fill="var(--muted)" text-anchor="'+a+'" font-family="IBM Plex Sans, sans-serif">'+t+'</text>';
  h+=lbl(200,24,"Autorité","middle")+lbl(200,384,"Ouverture","middle")+lbl(35,384,"← Redistribution","start")+lbl(365,384,"Marché →","end");
  const q=(x,y,k,a)=>'<text x="'+x+'" y="'+y+'" font-size="15" font-weight="800" fill="'+TRIBES[k].color+'" text-anchor="'+a+'" font-family="Big Shoulders Display, Impact, sans-serif">'+TRIBES[k].name.toUpperCase()+'</text>';
  h+=q(45,55,"loup","start")+q(355,55,"lynx","end")+q(45,355,"heron","start")+q(355,355,"cerf","end")+q(200,165,"chouette","middle");
  // one dot per answer profile; size grows with the number of people who share it
  if(!R.blackout)R.map.forEach(c=>{
    if(!TRIBES[c.t])return;
    const r=Math.min(18,4+2.2*Math.sqrt(c.n));
    h+='<circle cx="'+P(c.x).toFixed(1)+'" cy="'+P(-c.y).toFixed(1)+'" r="'+r.toFixed(1)+'" fill="'+TRIBES[c.t].color+'" fill-opacity=".6"/>';
  });
  const s=scores(me.test);
  if(s.done){const k=tribeOf(s.x,s.y);h+='<circle cx="'+P(s.x)+'" cy="'+P(-s.y)+'" r="13" fill="none" stroke="var(--ink)" stroke-width="2"/><circle cx="'+P(s.x)+'" cy="'+P(-s.y)+'" r="7" fill="'+TRIBES[k].color+'"/>';}
  if(!R.map.length&&!s.done)h+='<text x="200" y="228" font-size="12" fill="var(--muted)" text-anchor="middle" font-family="IBM Plex Sans, sans-serif">Terminez le test pour apparaître sur la carte</text>';
  $("map").innerHTML=h;
  const tl=$("tribelist"); tl.textContent="";
  const tot=ORDER.reduce((a,k)=>a+(R.tribes[k]||0),0);
  ORDER.forEach(k=>{
    const n=R.tribes[k]||0;
    tl.appendChild(el("div",{},[icon(k,44),el("b",{style:"color:"+TRIBES[k].color,text:TRIBES[k].name}),el("span",{text:TRIBES[k].axis}),el("span",{class:"num",text:R.blackout?"–":n+" · "+(tot?Math.round(n/tot*100):0)+" %"})]));
  });
}

function renderAll(){
  $("nPart").textContent=R.n;
  renderTest(); renderQuestions(); renderDuels(); renderMap();
}

/* ---------- server ---------- */
const cfg=window.LEPOULS_CONFIG||{};
const online=!!(cfg.supabaseUrl&&cfg.supabaseAnonKey&&window.supabase&&window.supabase.createClient);

function parseResults(raw){
  const out=emptyResults();
  if(!raw||typeof raw!=="object")return out;
  if(raw.blackout){out.blackout=true;return out;}
  out.n=+raw.n||0;
  (raw.rows||[]).forEach(r=>{
    const [f,k,t,v,n]=r; if((f!=="ans"&&f!=="duel")||typeof k!=="string")return;
    const slot=out[f][k]||(out[f][k]={all:{},by:{}});
    slot.all[v]=(slot.all[v]||0)+(+n||0);
    if(t&&TRIBES[t]){const b=slot.by[t]||(slot.by[t]={});b[v]=(b[v]||0)+(+n||0);}
  });
  (raw.map||[]).forEach(m=>{const [x,y,t,n]=m;if(typeof x==="number"&&typeof y==="number"&&TRIBES[t]){out.map.push({x,y,t,n:+n||1});out.tribes[t]=(out.tribes[t]||0)+(+n||1);}});
  return out;
}
async function refreshResults(){
  if(!online)return;
  try{const {data,error}=await sb.rpc("get_results");if(error)throw error;R=parseResults(data);if(inBlackout())R.blackout=true;renderAll();}
  catch(e){status("Les résultats sont momentanément indisponibles.",true);}
}

let timer=null, saving=false, again=false;
function changed(){
  saveLocal();
  if(!online)return;
  if(!me.consent){status("Cochez la case de consentement pour que vos réponses soient comptées dans les résultats.",true);return;}
  clearTimeout(timer); timer=setTimeout(save,600);
}
async function ensureSession(){
  if(session)return session;
  const {data,error}=await sb.auth.signInAnonymously();
  if(error)throw error;
  session=data.session; return session;
}
async function save(){
  if(saving){again=true;return;}
  saving=true;
  do{again=false;
    try{
      await ensureSession();
      const {error}=await sb.from("votes").upsert({id:session.user.id,test:me.test,ans:me.ans,duel:me.duel});
      if(error)throw error;
      status("Réponses enregistrées.");
    }catch(e){status("Enregistrement impossible pour le moment. Réessayez dans un instant.",true);}
  }while(again);
  saving=false;
  refreshResults();
}
async function removeServer(){
  if(!online||!session)return;
  const {error}=await sb.from("votes").delete().eq("id",session.user.id);
  if(error)throw error;
}

$("consent").addEventListener("change",async e=>{
  me.consent=e.target.checked;
  if(!online)return;
  if(me.consent){changed();}
  else{try{await removeServer();status("Consentement retiré : vos réponses ne sont plus enregistrées sur le serveur.");refreshResults();}catch(err){status("Suppression impossible pour le moment.",true);}}
});
$("del").addEventListener("click",async()=>{
  me={test:{},ans:{},duel:{},consent:false}; $("consent").checked=false; clearLocal();
  try{await removeServer();if(online&&session){await sb.auth.signOut();session=null;}status("Toutes vos réponses ont été supprimées.");}
  catch(e){status("Suppression impossible pour le moment.",true);}
  renderAll(); refreshResults();
});

/* ---------- daily questions ---------- */
async function loadDaily(){
  try{
    const r=await fetch("data/daily.json?t="+Math.floor(Date.now()/600000),{cache:"no-store"});
    if(!r.ok)return;
    const list=await r.json();
    daily=(Array.isArray(list)?list:[]).filter(d=>d&&typeof d.qid==="string"&&/^[A-Za-z0-9_-]{1,40}$/.test(d.qid)&&typeof d.text==="string"&&typeof d.date==="string")
      .sort((a,b)=>a.date<b.date?1:-1).slice(0,7)
      .map(d=>({qid:d.qid,date:d.date,text:d.text.slice(0,300),ctx:typeof d.ctx==="string"?d.ctx.slice(0,600):"",src:Array.isArray(d.src)?d.src.filter(x=>Array.isArray(x)&&typeof x[0]==="string"&&typeof x[1]==="string"&&x[1].startsWith("https://")).slice(0,4):[]}));
    renderQuestions();
  }catch(e){}
}

/* ---------- start ---------- */
loadLocal();
renderArena();
if(inBlackout())R.blackout=true;
renderAll();
loadDaily();

(async function start(){
  if(!online){status("Mode démonstration : vos réponses restent sur cet appareil.");return;}
  sb=window.supabase.createClient(cfg.supabaseUrl,cfg.supabaseAnonKey,{auth:{persistSession:true,autoRefreshToken:true}});
  try{
    const {data}=await sb.auth.getSession(); session=data.session||null;
    if(session){
      const {data:row}=await sb.from("votes").select("test,ans,duel").eq("id",session.user.id).maybeSingle();
      if(row){me={test:row.test||{},ans:row.ans||{},duel:row.duel||{},consent:true};$("consent").checked=true;saveLocal();status("Bon retour : vos réponses précédentes sont chargées.");}
      else status("Cochez la case ci-dessus pour participer.");
    }else status("Cochez la case ci-dessus pour participer. Aucun compte n'est nécessaire.");
  }catch(e){status("Cochez la case ci-dessus pour participer.");}
  await refreshResults();
  setInterval(()=>{if(!document.hidden)refreshResults();},30000);
  document.addEventListener("visibilitychange",()=>{if(!document.hidden)refreshResults();});
})();
})();
