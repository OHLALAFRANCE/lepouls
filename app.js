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
      el("div",{class:"name",text:T.name}),
      el("span",{class:"chip"},[el("i",{style:"background:"+T.color}),document.createTextNode(T.axis)]),
      el("p",{text:T.desc}),
      R.blackout?null:el("p",{class:"pct",text:same+" participant·e"+(same>1?"s":"")+" dans cette tribu"})
    ]),
    miniMap(s.x,s.y,T.color)
  ]));
  const go=el("div",{class:"row"},[el("button",{type:"button",class:"btn",text:"Voter sur la question du jour →"})]);
  go.firstChild.addEventListener("click",()=>show("question"));
  mt.appendChild(go);
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
    tl.appendChild(el("div",{},[el("b",{style:"color:"+TRIBES[k].color,text:TRIBES[k].name}),el("span",{text:TRIBES[k].axis}),el("span",{class:"num",text:R.blackout?"–":n+" · "+(tot?Math.round(n/tot*100):0)+" %"})]));
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
