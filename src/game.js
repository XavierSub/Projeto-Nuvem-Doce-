/* ================= SOM ================= */
let AC=null,muted=false;
function tone(f,d,type='sine',v=.15,when=0,slide){
  if(muted)return;
  try{
    AC=AC||new (window.AudioContext||window.webkitAudioContext)();
    const t=AC.currentTime+when,o=AC.createOscillator(),g=AC.createGain();
    o.type=type;o.frequency.setValueAtTime(f,t);if(slide)o.frequency.exponentialRampToValueAtTime(slide,t+d);
    g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.001,t+d);
    o.connect(g).connect(AC.destination);o.start(t);o.stop(t+d+.02);
  }catch(e){}
}
const sfx={
  click:()=>tone(1400,.04,'square',.035),
  ok:()=>{tone(660,.12,'triangle',.16);tone(990,.22,'triangle',.16,.1)},
  bad:()=>{tone(180,.4,'sawtooth',.1,0,90);tone(120,.4,'square',.05,.04)},
  clank:()=>{tone(110,.5,'square',.18,0,50);tone(70,.7,'sawtooth',.12,.04);tone(2200,.06,'square',.05,.02);tone(1700,.06,'square',.04,.12)},
  alarm:()=>[0,.3,.6].forEach(t=>tone(700,.25,'sawtooth',.05,t,1100)),
  win:()=>[523,659,784,1047,1319].forEach((f,i)=>tone(f,.3,'triangle',.12,i*.12)),
  tick:()=>tone(2400,.02,'square',.03),
  dark:()=>{tone(220,.6,'sawtooth',.08,0,110);tone(165,.8,'sine',.1,.1,80)},
  cough:()=>[0,.22,.4].forEach(t=>tone(160,.12,'sawtooth',.09,t,90)),
  run:()=>{for(let i=0;i<9;i++)tone(300+(i%2)*80,.05,'square',.03,i*.22)}
};

/* ================= UTIL ================= */
const $=s=>document.querySelector(s);
const esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const S=$('#screen');
function fmt(ms){const s=Math.floor(ms/1000);return Math.floor(s/60)+':'+String(s%60).padStart(2,'0')}
function scrollToEl(el){setTimeout(()=>el&&el.scrollIntoView({behavior:'smooth',block:'start'}),80)}

/* ================= PERSONAGEM ================= */
const SKINS=['#f3d6bd','#dcae84','#a86b46','#6b4128'];
const HAIRC=['#1c1612','#5a3820','#c98a3a','#ead58e','#c0392b','#7a5cff'];
const HAIRS=['Curto','Cacheado','Longo','Raspado','Coque'];
const SUITS=[['#ff8a1f','#b35c0a'],['#8a929c','#575e67'],['#3b6fd8','#25499a'],['#3aa565','#226b40']];
const ACCS=['Nenhum','Boné','Óculos','Fone'];
const PERKS=[
  {id:'atleta',i:'🏃',n:'Atleta',d:'Começa com 120 de fôlego.'},
  {id:'hacker',i:'💻',n:'Hacker',d:'2 pistas que eliminam uma opção errada.'},
  {id:'lider',i:'🗣️',n:'Líder',d:'+50 pontos extras a cada escolha de autonomia.'}
];
let CH={name:'',s:1,h:0,hc:0,u:0,a:0,p:0};

function avatar(c){
  const sk=SKINS[c.s]||SKINS[0],hc=HAIRC[c.hc]||HAIRC[0],[su,sd]=SUITS[c.u]||SUITS[0];
  const cap=`<path d="M16 26 Q15 9 30 9 Q45 9 44 26 Q40 17 30 17 Q20 17 16 26Z" fill="${hc}"/>`;
  let back='',front='';
  switch(c.h){
    case 0:front=cap;break;
    case 1:front=[[18,19,6],[23,13,6],[30,10,6.5],[37,13,6],[42,19,6],[16,26,4],[44,26,4]].map(([x,y,r])=>`<circle cx="${x}" cy="${y}" r="${r}" fill="${hc}"/>`).join('');break;
    case 2:back=`<rect x="14" y="18" width="8" height="30" rx="4" fill="${hc}"/><rect x="38" y="18" width="8" height="30" rx="4" fill="${hc}"/>`;front=cap;break;
    case 3:front=`<path d="M17 24 Q17 12 30 12 Q43 12 43 24 Q38 18 30 18 Q22 18 17 24Z" fill="${hc}" opacity=".5"/>`;break;
    case 4:front=cap+`<circle cx="30" cy="7" r="6" fill="${hc}"/>`;break;
  }
  let acc='';
  if(c.a===1)acc=`<path d="M16 22 Q16 9 30 9 Q44 9 44 22Z" fill="${sd}"/><rect x="28" y="19" width="22" height="4.5" rx="2" fill="${sd}"/>`;
  if(c.a===2)acc=`<rect x="20.5" y="23" width="8" height="6" rx="1.5" fill="rgba(92,225,255,.25)" stroke="#111" stroke-width="1.5"/><rect x="31.5" y="23" width="8" height="6" rx="1.5" fill="rgba(92,225,255,.25)" stroke="#111" stroke-width="1.5"/><path d="M28.5 25h3" stroke="#111" stroke-width="1.5"/>`;
  if(c.a===3)acc=`<path d="M15 27 Q15 6 30 6 Q45 6 45 27" stroke="#222" stroke-width="3" fill="none"/><rect x="11" y="23" width="7" height="11" rx="3" fill="#222"/><rect x="42" y="23" width="7" height="11" rx="3" fill="#222"/>`;
  return `${back}
    <rect x="9" y="45" width="8" height="24" rx="4" fill="${su}"/><rect x="43" y="45" width="8" height="24" rx="4" fill="${su}"/>
    <circle cx="13" cy="70" r="3.5" fill="${sk}"/><circle cx="47" cy="70" r="3.5" fill="${sk}"/>
    <rect x="13" y="42" width="34" height="36" rx="11" fill="${su}"/>
    <rect x="26" y="36" width="8" height="8" fill="${sk}"/>
    <rect x="24" y="50" width="12" height="7" rx="1" fill="#fff"/><text x="30" y="55.6" font-size="5" text-anchor="middle" font-family="monospace" font-weight="700" fill="#111">017</text>
    <circle cx="30" cy="25" r="13" fill="${sk}"/>
    <circle cx="25" cy="26" r="1.7" fill="#1a1a1a"/><circle cx="35" cy="26" r="1.7" fill="#1a1a1a"/>
    <path d="M26 32 Q30 35 34 32" stroke="#1a1a1a" stroke-width="1.4" fill="none" stroke-linecap="round"/>
    ${front}${acc}`;
}
const avatarSVG=(c,cls='')=>`<svg class="${cls}" viewBox="0 0 60 80">${avatar(c)}</svg>`;
function cleanChar(c){
  const n=v=>Number.isInteger(v)?v:0;
  return {s:clamp(n(c&&c.s),0,SKINS.length-1),h:clamp(n(c&&c.h),0,HAIRS.length-1),hc:clamp(n(c&&c.hc),0,HAIRC.length-1),u:clamp(n(c&&c.u),0,SUITS.length-1),a:clamp(n(c&&c.a),0,ACCS.length-1)};
}

/* ================= CENAS SVG ================= */
const BARS=(n=13)=>{let s='<g class="bars">';for(let i=0;i<n;i++)s+=`<rect x="${8+i*28}" y="0" width="7" height="200" fill="url(#steel)"/>`;
  return s+`<rect x="0" y="22" width="360" height="7" fill="url(#steel)"/><rect x="0" y="170" width="360" height="7" fill="url(#steel)"/><rect x="168" y="92" width="26" height="20" rx="3" fill="#3b3f46" stroke="#111"/><circle cx="181" cy="100" r="3" fill="#111"/><rect x="180" y="100" width="2" height="7" fill="#111"/></g>`};
const DEFS=`<defs>
  <linearGradient id="steel" x1="0" x2="1"><stop offset="0" stop-color="#4a4f57"/><stop offset=".45" stop-color="#c3c9d2"/><stop offset="1" stop-color="#3a3e45"/></linearGradient>
  <linearGradient id="wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4a4e55"/><stop offset="1" stop-color="#2c2f34"/></linearGradient>
  <pattern id="bricks" width="40" height="20" patternUnits="userSpaceOnUse"><path d="M0 0H40M0 10H40M0 20H40M20 0V10M0 10V20M40 10V20" stroke="#00000033" stroke-width="1" fill="none"/></pattern>
  <radialGradient id="redglow"><stop offset="0" stop-color="#ff3b3b" stop-opacity=".7"/><stop offset="1" stop-color="#ff3b3b" stop-opacity="0"/></radialGradient>
  <radialGradient id="lamp"><stop offset="0" stop-color="#ffe6a3" stop-opacity=".5"/><stop offset="1" stop-color="#ffe6a3" stop-opacity="0"/></radialGradient>
  <linearGradient id="beamg" x1="0" x2="1"><stop offset="0" stop-color="#fff7c2" stop-opacity=".55"/><stop offset="1" stop-color="#fff7c2" stop-opacity="0"/></linearGradient>
  <linearGradient id="screen" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ff6fd8"/><stop offset=".55" stop-color="#7a5cff"/><stop offset="1" stop-color="#22d3ee"/></linearGradient>
  <linearGradient id="dawn" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2b4c7e"/><stop offset=".55" stop-color="#f08a4b"/><stop offset="1" stop-color="#ffd27a"/></linearGradient>
  <linearGradient id="dusk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1d1533"/><stop offset=".6" stop-color="#5b3a6e"/><stop offset="1" stop-color="#a0617a"/></linearGradient>
  <pattern id="chain" width="14" height="14" patternUnits="userSpaceOnUse"><path d="M0 0L14 14M14 0L0 14" stroke="#9aa3ad" stroke-width="1.3"/></pattern>
</defs>`;
const ALARM=`<circle cx="22" cy="18" r="22" fill="url(#redglow)" class="alarm-glow"/><rect x="14" y="8" width="16" height="6" fill="#222"/><circle class="alarm" cx="22" cy="18" r="7"/>`;
const FOG=`<g opacity=".55"><ellipse class="fog" cx="120" cy="120" rx="140" ry="26" fill="#e6f3ff" opacity=".18"/><ellipse class="fog2" cx="250" cy="85" rx="120" ry="20" fill="#d8ffe9" opacity=".16"/><ellipse class="fog" cx="200" cy="150" rx="160" ry="18" fill="#fff" opacity=".12"/></g>`;
const GUARD=(y=0)=>`<g class="guard"><g transform="translate(0 ${y})"><polygon points="26,112 140,92 140,150" fill="url(#beamg)" opacity=".7"/><g class="bob"><circle cx="12" cy="96" r="9" fill="#050505"/><rect x="2" y="88" width="20" height="5" rx="2" fill="#050505"/><rect x="0" y="106" width="24" height="46" rx="8" fill="#050505"/><rect x="20" y="110" width="9" height="5" rx="1" fill="#ddd"/><rect x="4" y="150" width="7" height="12" fill="#050505"/><rect x="14" y="150" width="7" height="12" fill="#050505"/></g></g></g>`;
const ME=(x,y,s)=>`<g transform="translate(${x} ${y}) scale(${s})"><g class="enter"><g class="bob">${avatar(CH)}</g></g></g>`;
const RAT=`<g transform="translate(232 112)"><circle cx="0" cy="0" r="9" fill="#9a8f84"/><circle cx="-7" cy="-7" r="4" fill="#9a8f84"/><circle cx="7" cy="-7" r="4" fill="#9a8f84"/><circle cx="-3" cy="-1" r="1.3" fill="#111"/><circle cx="3" cy="-1" r="1.3" fill="#111"/><circle cx="0" cy="3" r="1.6" fill="#e58a9a"/><rect x="-11" y="9" width="22" height="30" rx="8" fill="#ff8a1f" opacity=".8"/></g>`;

const SCENES={
  cela:()=>`<svg viewBox="0 0 360 200" preserveAspectRatio="xMidYMid slice">${DEFS}
    <rect width="360" height="200" fill="url(#wall)"/><rect width="360" height="160" fill="url(#bricks)"/>
    <rect y="158" width="360" height="42" fill="#1e2024"/><path d="M0 158H360" stroke="#000" stroke-width="2"/>
    <rect x="150" y="18" width="62" height="40" fill="#0b1830" stroke="#222" stroke-width="3"/><circle cx="196" cy="32" r="7" fill="#f1f0d0"/>
    ${[162,174,186,198].map(x=>`<rect x="${x}" y="18" width="3" height="40" fill="#555"/>`).join('')}
    
    <rect x="18" y="128" width="120" height="8" fill="#5b4330"/><rect x="22" y="118" width="112" height="11" rx="3" fill="#8193a8"/><rect x="24" y="112" width="26" height="9" rx="4" fill="#dfe6ee"/>
    <rect x="22" y="136" width="5" height="24" fill="#3b2c20"/><rect x="129" y="136" width="5" height="24" fill="#3b2c20"/>
    <rect x="86" y="108" width="9" height="12" rx="2" fill="#2a2a2e"/><rect class="podglow" x="88" y="110" width="5" height="3" rx="1" fill="#7cf9ff"/>
    <rect x="70" y="122" width="18" height="12" fill="#e9e2cf" transform="rotate(-8 79 128)"/>
    <path d="M285 158v-18a12 8 0 0 1 24 0v18z" fill="#c9cfd6"/><rect x="290" y="126" width="14" height="14" rx="2" fill="#aab2bb"/>
    ${RAT}${ME(150,98,.78)}
    ${FOG}${ALARM}${BARS()}${GUARD(14)}<g transform="rotate(-4 281 50)"><path d="M262 36 L281 26 L300 36" stroke="#333" stroke-width="1.5" fill="none"/><rect x="252" y="38" width="58" height="22" rx="2" fill="#f5c518" stroke="#8a6d00"/><text x="281" y="53" font-family="JetBrains Mono,monospace" font-size="10" font-weight="700" text-anchor="middle" fill="#111">CELA 17</text></g></svg>`,
  cofre:()=>`<svg viewBox="0 0 360 200" preserveAspectRatio="xMidYMid slice">${DEFS}
    <rect width="360" height="200" fill="#2a3530"/><rect width="360" height="200" fill="url(#bricks)" opacity=".5"/>
    <rect y="160" width="360" height="40" fill="#1a1d1b"/>
    <circle cx="90" cy="40" r="80" fill="url(#lamp)"/><path d="M80 0v22" stroke="#222" stroke-width="2"/><path d="M68 22h24l-5 10H73z" fill="#3a3a3a"/>
    <rect x="22" y="40" width="70" height="56" fill="#efe9da" transform="rotate(-3 57 68)"/>
    <text x="57" y="62" font-size="20" text-anchor="middle">🧠</text><text x="57" y="84" font-family="JetBrains Mono,monospace" font-size="7.5" font-weight="700" text-anchor="middle" fill="#7a1b1b">DOPAMINA</text>
    <path d="M30 88 L42 74 L52 82 L66 60 L84 78" stroke="#c0392b" stroke-width="2" fill="none"/>
    <rect x="18" y="128" width="110" height="10" fill="#5b4330"/><rect x="24" y="138" width="6" height="22" fill="#3b2c20"/><rect x="116" y="138" width="6" height="22" fill="#3b2c20"/>
    <rect x="40" y="116" width="30" height="12" fill="#e9e2cf"/><rect x="88" y="112" width="14" height="16" rx="2" fill="#444"/>
    <rect x="186" y="56" width="132" height="120" rx="6" fill="#1c1e22"/><rect x="190" y="60" width="124" height="112" fill="#0d0e10"/>
    <circle class="keyglow" cx="252" cy="112" r="22" fill="#f5c518" opacity=".25"/><text x="252" y="122" font-size="26" text-anchor="middle">🗝️</text>
    <g class="safe-door"><rect x="190" y="60" width="124" height="112" rx="4" fill="#5d6570" stroke="#2a2e33" stroke-width="3"/>
      <rect x="198" y="68" width="108" height="96" rx="3" fill="none" stroke="#7d8692" stroke-width="2"/>
      <circle cx="250" cy="120" r="26" fill="#3a4048" stroke="#9aa3ad" stroke-width="3"/>
      <g class="dial">${Array.from({length:12},(_,i)=>`<rect x="249" y="96" width="2" height="6" fill="#d7dde4" transform="rotate(${i*30} 250 120)"/>`).join('')}<rect x="248" y="104" width="4" height="16" rx="2" fill="#f5c518"/></g>
      <circle cx="250" cy="120" r="5" fill="#d7dde4"/><rect x="290" y="108" width="8" height="26" rx="3" fill="#9aa3ad"/></g>
    ${ME(140,104,.7)}${ALARM}</svg>`,
  patio:()=>`<svg viewBox="0 0 360 200" preserveAspectRatio="xMidYMid slice">${DEFS}
    <rect width="360" height="200" fill="#0d1424"/>${Array.from({length:18},(_,i)=>`<circle cx="${(i*67)%360}" cy="${(i*29)%60+5}" r="1" fill="#fff" opacity=".6"/>`).join('')}
    <rect y="96" width="360" height="40" fill="#3a3d42"/><rect y="96" width="360" height="40" fill="url(#bricks)"/>
    <path d="M0 96h360" stroke="#c9cfd6" stroke-width="2" stroke-dasharray="3 4"/>
    <rect y="136" width="360" height="64" fill="#3b3a35"/><path d="M40 200L120 136M320 200L240 136" stroke="#f5c518" stroke-width="2" opacity=".5"/>
    <polygon class="beam" points="52,52 360,10 360,110" fill="url(#beamg)"/>
    <rect x="40" y="52" width="24" height="84" fill="#2a2c30"/><rect x="34" y="40" width="36" height="16" fill="#3a3c42"/><path d="M30 40h44l-8-10H38z" fill="#222"/><circle cx="52" cy="50" r="5" fill="#fff7c2"/>
    <rect x="150" y="34" width="120" height="74" rx="4" fill="#111" stroke="#444" stroke-width="3"/>
    <rect class="flicker" x="156" y="40" width="108" height="62" fill="url(#screen)"/>
    <text x="210" y="70" font-size="20" text-anchor="middle">🍉✨💨</text>
    <text x="210" y="92" font-family="JetBrains Mono,monospace" font-size="8" font-weight="700" text-anchor="middle" fill="#fff">❤ 48,2 mil</text>
    <rect x="206" y="108" width="8" height="28" fill="#222"/>
    <g class="runner">${ME(70,128,.62)}</g>
    ${ALARM}${GUARD(30)}
    <g class="gate-l"><rect x="0" y="0" width="180" height="200" fill="url(#chain)" opacity=".85"/><rect x="0" y="0" width="180" height="6" fill="#9aa3ad"/><rect x="174" y="0" width="6" height="200" fill="#9aa3ad"/></g>
    <g class="gate-r"><rect x="180" y="0" width="180" height="200" fill="url(#chain)" opacity=".85"/><rect x="180" y="0" width="180" height="6" fill="#9aa3ad"/><rect x="180" y="0" width="6" height="200" fill="#9aa3ad"/><rect x="172" y="92" width="16" height="22" rx="3" fill="#c0392b"/></g>
    </svg>`,
  saida:(ending)=>{
    const dark=ending==='corrente';
    return `<svg viewBox="0 0 360 200" preserveAspectRatio="xMidYMid slice">${DEFS}
    <rect width="360" height="200" fill="url(#${dark?'dusk':'dawn'})"/>
    <g class="rays" opacity="${dark?.08:.25}">${Array.from({length:16},(_,i)=>`<rect x="178" y="0" width="4" height="120" fill="#fff" transform="rotate(${i*22.5} 180 120)"/>`).join('')}</g>
    <circle class="sun" cx="180" cy="120" r="34" fill="${dark?'#c58aa0':'#ffe08a'}"/>
    <path d="M0 140 Q90 118 180 136 T360 128 V200 H0z" fill="${dark?'#2e3b3a':'#3f6b3a'}"/><path d="M150 200 L172 136 L188 136 L210 200z" fill="#c9a874"/>
    <g class="bird"><path d="M60 50q6-6 12 0q6-6 12 0" stroke="#2b2b2b" stroke-width="2" fill="none"/></g>
    <g class="bird" style="animation-delay:-4s"><path d="M40 70q5-5 10 0q5-5 10 0M70 62q4-4 8 0q4-4 8 0" stroke="#2b2b2b" stroke-width="2" fill="none"/></g>
    <rect x="0" y="0" width="70" height="200" fill="#2c2f34"/><rect x="290" y="0" width="70" height="200" fill="#2c2f34"/>
    <g transform="translate(-58 0)">${Array.from({length:5},(_,i)=>`<rect x="${70+i*13}" y="10" width="5" height="190" fill="url(#steel)"/>`).join('')}</g>
    <g transform="translate(58 0)">${Array.from({length:5},(_,i)=>`<rect x="${226+i*13}" y="10" width="5" height="190" fill="url(#steel)"/>`).join('')}</g>
    <g class="walker">
      ${dark?`<path d="M170 176 Q140 170 128 150" stroke="#555" stroke-width="2.5" stroke-dasharray="4 3" fill="none"/><g class="fog"><ellipse cx="124" cy="140" rx="16" ry="20" fill="#3b1d5c" opacity=".85"/><circle cx="119" cy="135" r="2.5" fill="#ff4d4d"/><circle cx="129" cy="135" r="2.5" fill="#ff4d4d"/></g>`:''}
      ${ME(164,142,.55)}</g>
    </svg>`},
  solitaria:()=>`<svg viewBox="0 0 360 200" preserveAspectRatio="xMidYMid slice">${DEFS}
    <rect width="360" height="200" fill="#121315"/><rect width="360" height="200" fill="url(#bricks)" opacity=".6"/>
    <rect x="165" y="20" width="30" height="16" fill="#0b1830"/><circle cx="180" cy="28" r="70" fill="url(#lamp)" opacity=".3"/>
    ${ME(150,100,.72)}${BARS()}</svg>`
};

/* ================= ESTADO ================= */
let t0=null,tick=null,errors=0,score=0,done=0,ph=0,st=0,lockIdx=0,firstTry=true;
let F=100,FMAX=100,D=0,hints=0,ally=false,skipNext=false,choices=[];
const TOTAL=15;
let pendingExtra=[],VARAL='';

function startTimer(){t0=Date.now();clearInterval(tick);tick=setInterval(()=>{$('#timer').textContent=fmt(Date.now()-t0)},1000)}
function drawProg(){$('#prog').innerHTML=Array.from({length:TOTAL},(_,i)=>`<i class="${i<done?'on':i===done&&t0?'cur':''}"></i>`).join('')}
function popText(txt,color){const d=document.createElement('div');d.className='delta';d.style.color=color;d.textContent=txt;document.body.appendChild(d);setTimeout(()=>d.remove(),1700)}
function addPts(n){score+=n;const sp=$('#score');sp.textContent='⭐ '+score;sp.classList.remove('bump');void sp.offsetWidth;sp.classList.add('bump');const d=document.createElement('div');d.className='pts';d.textContent=(n>0?'+':'')+n;if(n<0)d.style.color='#ff4d4d';document.body.appendChild(d);setTimeout(()=>d.remove(),1200)}
function drawStatus(){
  const st=$('#status');st.classList.remove('hidden');
  $('#stav').innerHTML=avatarSVG(CH);
  $('#stnm').textContent=CH.name;
  $('#stpk').textContent=PERKS[CH.p].i+' '+PERKS[CH.p].n+(CH.p===1?` · ${hints} pista${hints===1?'':'s'}`:'');
  $('#mf').style.width=(F/FMAX*100)+'%';$('#mfv').textContent=F;
  $('#mf').parentElement.parentElement.classList.toggle('low',F<70);
  $('#md').style.width=D+'%';$('#mdv').textContent=D;
}
function changeMeters(df,dd){
  if(df){F=clamp(F+df,0,FMAX);const m=$('#mf').parentElement.parentElement;m.classList.remove('hit');void m.offsetWidth;m.classList.add('hit');popText((df>0?'+':'')+df+' 🫁 fôlego',df<0?'#ff8080':'#4ade80')}
  if(dd){D=clamp(D+dd,0,100);const m=$('#md').parentElement.parentElement;m.classList.remove('hit');void m.offsetWidth;m.classList.add('hit');setTimeout(()=>popText((dd>0?'+':'')+dd+' ⛓️ dependência',dd>0?'#d48bff':'#4ade80'),dd&&df?500:0)}
  drawStatus();
}
function flash(c){const f=$('#sc .flash');if(!f)return;f.className='flash';void f.offsetWidth;f.className='flash '+c}
function shakeScene(){const sc=$('#sc');if(!sc)return;sc.classList.remove('shake');void sc.offsetWidth;sc.classList.add('shake')}
function sparks(){const sc=$('#sc');for(let i=0;i<26;i++){const s=document.createElement('div');s.className='spark';s.style.left=(30+Math.random()*40)+'%';s.style.top=(35+Math.random()*30)+'%';s.style.setProperty('--dx',(Math.random()*240-120)+'px');s.style.setProperty('--dy',(Math.random()*160-90)+'px');s.style.animationDelay=(Math.random()*.25)+'s';sc.appendChild(s);setTimeout(()=>s.remove(),1400)}}
function confetti(){const cs=['#ff8a1f','#f5c518','#4ade80','#5ce1ff','#ff6fd8'];for(let i=0;i<90;i++){const c=document.createElement('div');c.className='confetti';c.style.left=Math.random()*100+'vw';c.style.background=cs[i%cs.length];c.style.animationDuration=(2+Math.random()*2.5)+'s';c.style.animationDelay=(Math.random()*.8)+'s';c.style.borderRadius=Math.random()>.5?'50%':'2px';document.body.appendChild(c);setTimeout(()=>c.remove(),5500)}}

function renderPlain(html){S.innerHTML=`<div class="card"><div class="body in" id="body">${html}</div></div>`;window.scrollTo({top:0,behavior:'smooth'})}
function renderScene(scene,label,locks=3,clank='CLANK! 🔓',arg){
  S.innerHTML=`<div class="card"><div class="scene" id="sc">${SCENES[scene](arg)}
    ${dustHTML()}<div class="scanlines"></div><div class="clank">${clank}</div><div class="label">${label}</div>
    ${locks?`<div class="plocks">${'<span>🔒</span>'.repeat(locks)}</div>`:''}<div class="flash"></div></div>
    <div class="body" id="body"></div></div>`;
  window.scrollTo({top:0,behavior:'smooth'});
}
function setBody(html){const b=$('#body');b.innerHTML=`<button class="relisten" type="button">🔁 Ouvir de novo</button><div class="in">${html}</div>`;if(NARR.on)readScreen();return b}
function head(tag,title){return `<div class="tag">${tag}</div><h2>${title}</h2>`}

/* ---------- Acerto, erro e avanço ---------- */
function nextStep(){st++;runStep()}
function solved(html,opts={}){
  if(!opts.silent){
    let bonus=0;if(firstTry){combo++;if(combo>=2){bonus=(combo-1)*20;setTimeout(()=>showCombo(combo),250)}}else combo=0;
    sfx.ok();addPts((firstTry?100:50)+bonus);say(pick(N.cheer));
    burst(document.querySelector('#body .opt.right:last-of-type,#body .door.ok,#body .ch.pick')||document.querySelector('#body .in'));
  }
  done++;drawProg();
  const l=document.querySelectorAll('#sc .plocks span')[lockIdx];if(l){l.textContent='🔓';l.classList.add('ok')}
  lockIdx++;
  const last=st===PH[ph].steps.length-1,fb=$('#fb');
  fb.innerHTML=`<div class="fb good">${html}${LISTEN}</div><button class="btn ${last?'go':''}" id="nx">${last?'🔓 Abrir a grade!':'➡️ Continuar'}</button>`;
  $('#nx').onclick=()=>{sfx.click();if(last)phaseEnd();else nextStep()};
  scrollToEl(fb);
}
function failed(html,block=true){
  sfx.bad();errors++;firstTry=false;combo=0;shakeScene();flash('red');glitch();
  if(block){const fb=$('#fb');fb.innerHTML=`<div class="fb bad">${html}${LISTEN}</div>`;scrollToEl(fb);say(pick(N.oops))}
}
function reflect(r){return `<div class="reflect"><div class="tag">⚡ Pergunta-relâmpago</div><p style="margin:0">${r.q}</p>
  <div class="chips">${r.chips.map(c=>`<button class="chip">${c}</button>`).join('')}</div>
  <p class="muted" id="rmsg" style="margin:10px 0 0;display:none">${r.after}</p></div>`}
function bindReflect(){document.querySelectorAll('.chip').forEach(c=>c.onclick=()=>{sfx.click();document.querySelectorAll('.chip').forEach(x=>x.classList.remove('on'));c.classList.add('on');$('#rmsg').style.display='block'})}

/* ---------- Tipos de desafio ---------- */
function mcq(c){
  const canHint=CH.p===1&&hints>0;
  const b=setBody(`${head(c.tag,c.title)}${c.intro||''}<p><b>${c.q}</b></p>
    <div class="opts">${c.opts.map((o,i)=>`<button class="opt" data-i="${i}"><span class="k">${'ABCD'[i]}</span><span>${o.t}</span></button>`).join('')}</div>
    ${canHint?`<button class="hintbtn" id="hint">💻 Usar pista hacker (${hints})</button>`:''}<div id="fb"></div>`);
  if(canHint)$('#hint').onclick=()=>{
    const wr=[...b.querySelectorAll('.opt')].filter(x=>!c.opts[+x.dataset.i].ok&&!x.classList.contains('wrong'));
    if(!wr.length)return;
    const x=wr[Math.floor(Math.random()*wr.length)];x.classList.add('wrong');x.style.animation='none';
    hints--;sfx.tick();drawStatus();$('#hint').remove();
  };
  b.querySelectorAll('.opt').forEach(btn=>btn.onclick=()=>{
    if(btn.classList.contains('wrong')||b.querySelector('.opt.right'))return;
    const o=c.opts[+btn.dataset.i];
    if(o.ok){btn.classList.add('right');b.querySelectorAll('.opt').forEach(x=>x.setAttribute('aria-disabled','true'));const h=$('#hint');if(h)h.remove();solved(c.explain)}
    else{btn.classList.add('wrong');failed(`<h3>🚨 Alarme! Essa não abre.</h3>${o.why}<p class="muted" style="margin-top:8px">Use a pista e tente outra 👆</p>`)}
  });
}

function mythTruth(c){
  let i=0,hits=0;
  function card(){
    const it=c.items[i];
    setBody(`${head(c.tag,c.title)}<p class="muted">${c.intro}</p>
      <div class="mvcount">CARTA ${i+1} DE ${c.items.length}</div>
      <div class="mvcard" id="mv"><div class="mvinner">
        <div class="mvface mvfront"><small>DETENTO ANTIGO DIZ:</small>"${it.s}"</div>
        <div class="mvface mvback" id="mvb"></div></div></div>
      <div class="mvbtns" id="mvbtns"><button class="bm" data-v="0">🚫 MITO</button><button class="bv" data-v="1">✅ VERDADE</button></div>
      <div id="fb"></div>`);
    document.querySelectorAll('#mvbtns button').forEach(bt=>bt.onclick=()=>{
      const ans=bt.dataset.v==='1',right=ans===it.v;
      $('#mvbtns').remove();
      const back=$('#mvb');
      back.innerHTML=`<h4>${right?'✅ Acertou!':'🔁 Quase!'} É ${it.v?'VERDADE':'MITO'}.</h4>${it.e}`;
      if(!it.v)back.classList.add('no');
      $('#mv').classList.add('flip');
      if(right){hits++;sfx.ok()}else{failed('',false)}
      setTimeout(()=>{
        if(i<c.items.length-1){$('#fb').innerHTML=`<button class="btn" id="nc">Próxima carta →</button>`;$('#nc').onclick=()=>{sfx.click();i++;card()}}
        else solved(`<h3>🔓 Cadeado aberto! Você acertou ${hits} de ${c.items.length}.</h3>${c.explain}`);
      },650);
    });
  }
  card();
}

function scanner(c){
  const b=setBody(`${head(c.tag,c.title)}${c.intro}<p><b>${c.q}</b></p>
    <div class="scan">${c.items.map((it,k)=>`<button class="sc" data-k="${k}">${it.t}</button>`).join('')}</div>
    <div class="counter" id="cnt">Selecionados: 0</div>
    <button class="btn" id="go">📡 Escanear</button><div id="fb"></div>`);
  const sel=new Set();
  b.querySelectorAll('.sc').forEach(x=>x.onclick=()=>{sfx.tick();const k=+x.dataset.k;sel.has(k)?sel.delete(k):sel.add(k);x.classList.toggle('on');x.classList.remove('miss','bad');readNow([{text:x.innerText+(x.classList.contains('on')?', marcado':', desmarcado'),el:x}]);$('#cnt').textContent='Selecionados: '+sel.size});
  $('#go').onclick=()=>{
    const wrong=[...sel].filter(k=>!c.items[k].ok),miss=c.items.map((it,k)=>it.ok&&!sel.has(k)?k:-1).filter(k=>k>=0);
    if(!wrong.length&&!miss.length){$('#go').remove();b.querySelectorAll('.sc').forEach(x=>x.style.pointerEvents='none');solved(c.explain);return}
    wrong.forEach(k=>b.querySelector(`.sc[data-k="${k}"]`).classList.add('bad'));
    failed(`<h3>🚨 O scanner apitou!</h3>${wrong.length?`<p data-say="Os itens em vermelho não fazem parte do aerossol.">Em vermelho: ${wrong.map(k=>c.items[k].why).join(' ')}</p>`:''}${miss.length?`<p data-say="E ainda falta coisa que está no aerossol. Procure de novo!">E ainda falta${miss.length>1?'m':''} <b>${miss.length}</b> substância${miss.length>1?'s':''} que está${miss.length>1?'o':''} no aerossol. Procure de novo!</p>`:''}`);
  };
}

function dial(c){
  let idx=0,rot=0;const n=c.vals.length,step=360/n;
  const b=setBody(`${head(c.tag,c.title)}${c.intro}${ally?`<div class="npc"><div class="face">🐀</div><div class="say"><small>Rato (seu aliado)</small>Psiu… ouvi o diretor dizer que é a idade em que o cérebro "fica pronto". Bem depois dos 20, mas antes dos 30.</div></div>`:''}<p><b>${c.q}</b></p>
    <div class="dialwrap"><svg viewBox="0 0 200 200">
      <circle cx="100" cy="100" r="96" fill="#1c1e22" stroke="#5d6570" stroke-width="4"/>
      <circle cx="100" cy="100" r="82" fill="#3a4048" stroke="#9aa3ad" stroke-width="2"/>
      <g class="ring" id="ring">${c.vals.map((v,i)=>`<g transform="rotate(${i*step} 100 100)"><text x="100" y="42" text-anchor="middle" font-family="JetBrains Mono,monospace" font-size="17" font-weight="700" fill="#e8ecf0">${v}</text><rect x="99" y="22" width="2" height="6" fill="#9aa3ad"/></g>`).join('')}
        ${Array.from({length:n*4},(_,i)=>`<rect x="99.5" y="20" width="1" height="4" fill="#6b737d" transform="rotate(${i*step/4} 100 100)"/>`).join('')}</g>
      <circle cx="100" cy="100" r="30" fill="#5d6570" stroke="#2a2e33" stroke-width="3"/><circle cx="100" cy="100" r="8" fill="#d7dde4"/>
      <polygon points="100,4 92,16 108,16" fill="#f5c518"/></svg>
      <div class="dialbtns"><button id="dl">⟲</button><div class="dialval" id="dv">${c.vals[0]}</div><button id="dr">⟳</button></div></div>
    <button class="btn" id="go">🔐 Testar combinação</button><div id="fb"></div>`);
  const upd=d=>{idx=(idx+d+n)%n;rot-=d*step;$('#ring').style.transform=`rotate(${rot}deg)`;$('#dv').textContent=c.vals[idx];sfx.tick();readNow([{text:String(c.vals[idx])}]);setTimeout(sfx.tick,60)};
  $('#dl').onclick=()=>upd(-1);$('#dr').onclick=()=>upd(1);
  $('#go').onclick=()=>{
    const v=c.vals[idx];
    if(v===c.answer){$('#go').remove();b.querySelector('.dialbtns').style.pointerEvents='none';solved(c.explain)}
    else failed(`<h3>🚨 Combinação errada!</h3><p>${v<c.answer?c.low:c.high}</p>`);
  };
}

function order(c){
  if(skipNext){
    skipNext=false;
    setBody(`${head(c.tag,c.title)}<div class="story">O cadeado já está aberto: o <b>Diretor</b> destrancou com o atalho. Mas você não aprendeu como o Nico prende os detentos… e ele já está te prendendo.</div><div id="fb"></div>`);
    solved(`<h3>🔓 Aberto pelo atalho (0 pontos)</h3><p>Para registro, a armadilha do Nico é: nicotina chega ao cérebro → pico de dopamina → queda e vontade de usar de novo → o cérebro se adapta e pede mais.</p>`,{silent:true});
    return;
  }
  let picked=[];
  const draw=()=>{
    picked=[];
    const b=setBody(`${head(c.tag,c.title)}${c.intro}<p class="muted">Toque nas etapas na ordem em que acontecem.</p>
      <div class="order">${c.items.map((_,i)=>`<div class="slot" id="s${i}"><span class="n">${i+1}</span><span>…</span></div>`).join('')}</div>
      <div class="pool">${c.shuffle.map(k=>`<button class="opt" data-id="${k}"><span>${c.items[k]}</span></button>`).join('')}</div>
      <button class="btn ghost" id="reset">↺ Girar o disco de novo</button><div id="fb"></div>`);
    b.querySelectorAll('.pool .opt').forEach(x=>x.onclick=()=>{
      if(x.classList.contains('sel')||picked.length>=c.items.length)return;
      sfx.tick();x.classList.add('sel');x.setAttribute('aria-disabled','true');
      const k=+x.dataset.id;picked.push(k);
      const s=$('#s'+(picked.length-1));s.classList.add('filled');s.lastChild.textContent=c.items[k];
      if(picked.length===c.items.length){
        if(picked.every((v,i)=>v===i)){$('#reset').remove();solved(c.explain)}
        else failed(`<h3>🚨 Combinação errada!</h3>${c.hint}<p class="muted" style="margin-top:8px">Toque em ↺ e tente de novo.</p>`);
      }
    });
    $('#reset').onclick=()=>{sfx.click();draw()};
  };
  draw();
}

function hunt(c){
  const b=setBody(`${head(c.tag,c.title)}${c.intro}
    <div class="post hunting"><div class="ph">🍉✨💨</div><div class="pb" data-say="O post diz: Novo sabor melancia gelo! Todo mundo da galera já tá usando, nem tem cheiro e é tão leve. Hashtag aesthetic, hashtag vibe. Quarenta e oito mil curtidas. Agora toque nas cinco iscas escondidas no texto."><div class="pu">@vibe.cloudz ✔️</div>${c.post}</div></div>
    <div class="counter" id="cnt">Iscas encontradas: 0 / ${Object.keys(c.baits).length}</div>
    <div class="baitlog" id="log"></div><div id="fb"></div>`);
  const total=Object.keys(c.baits).length;let found=0,decoyHits=0;
  b.querySelectorAll('.seg').forEach(s=>s.onclick=()=>{
    const k=s.dataset.k;
    if(s.classList.contains('found')||found===total)return;
    if(c.baits[k]){
      s.classList.add('found');found++;sfx.ok();
      $('#log').insertAdjacentHTML('beforeend',`<div class="bait">🎣 ${c.baits[k]}</div>`);
      $('#cnt').textContent=`Iscas encontradas: ${found} / ${total}`;
      {const lb=$('#log').lastElementChild;readNow([{text:lb.innerText,el:lb}])}
      if(found===total){firstTry=decoyHits===0;solved(c.explain)}
    }else{
      decoyHits++;sfx.bad();s.classList.remove('nope');void s.offsetWidth;s.classList.add('nope');
      $('#cnt').textContent=`"${s.textContent.trim()}" é só parte do app, não é isca. Iscas: ${found} / ${total}`;readNow([{text:s.textContent.trim()+' é só parte do app, não é isca. Continue procurando!'}]);
    }
  });
}

function chat(c){
  let r=0;
  setBody(`${head(c.tag,c.title)}${c.intro}<div class="chat" id="chat"></div><div id="q"></div><div id="fb"></div>`);
  const box=$('#chat');
  function sayMsgs(msgs,cb){
    let k=0;
    (function next(){
      if(k>=msgs.length)return cb();
      const t=document.createElement('div');t.className='bub';t.innerHTML='<span class="dots"><i></i><i></i><i></i></span>';t.style.padding='0';box.appendChild(t);
      setTimeout(()=>{t.style.padding='';t.innerHTML=`<small>${msgs[k][0]}</small>${msgs[k][1]}`;sfx.tick();speakItems([{text:msgs[k][0]+' diz: '+msgs[k][1],el:t}],true);k++;setTimeout(next,350)},800);
    })();
  }
  function round(){
    const R=c.rounds[r];
    sayMsgs(R.msgs,()=>{
      const q=$('#q');
      q.innerHTML=`<p><b>${R.q}</b></p><div class="opts">${R.opts.map((o,i)=>`<button class="opt" data-i="${i}"><span class="k">${'ABCD'[i]}</span><span>${o.t}</span></button>`).join('')}</div>`;
      scrollToEl(q);speakItems(itemsFrom(q),true);
      q.querySelectorAll('.opt').forEach(btn=>btn.onclick=()=>{
        if(btn.classList.contains('wrong'))return;
        const o=R.opts[+btn.dataset.i];
        if(o.ok){
          q.innerHTML='';$('#fb').innerHTML='';
          const me=document.createElement('div');me.className='bub me';me.innerHTML=`<small>${esc(CH.name)}</small>${o.t.replace(/^"|"$/g,'')}`;box.appendChild(me);sfx.ok();say(pick(N.cheer));
          r++;
          if(r<c.rounds.length)setTimeout(round,600);
          else setTimeout(()=>solved(c.explain),500);
        }else{btn.classList.add('wrong');failed(`<h3>🚨 Essa ainda não abre.</h3>${o.why}`)}
      });
    });
  }
  round();
}

/* ---------- Escolhas com consequência ---------- */
function choice(c){
  const b=setBody(`<span class="choice-tag">⚠️ ESCOLHA · NÃO DÁ PARA VOLTAR</span><h2>${c.title}</h2>${c.story}
    <p><b>${c.q}</b></p><div class="opts" id="chs">${c.opts.map((o,i)=>`<button class="ch" data-i="${i}">${o.t}</button>`).join('')}</div><div id="fb"></div>`);
  b.querySelectorAll('.ch').forEach(btn=>btn.onclick=()=>{
    const o=c.opts[+btn.dataset.i];
    b.querySelectorAll('.ch').forEach(x=>x.classList.add('dim'));btn.classList.remove('dim');btn.classList.add('pick');
    choices.push({ph:ph+1,txt:o.log,good:o.good});
    const fx=[];
    if(o.f)fx.push(`${o.f>0?'+':''}${o.f} 🫁 Fôlego`);
    if(o.d)fx.push(`${o.d>0?'+':''}${o.d} ⛓️ Dependência`);
    let pts=o.pts||0;if(o.good&&CH.p===2)pts+=50;
    if(pts)fx.push(`${pts>0?'+':''}${pts} ⭐`);
    if(o.good){sfx.ok()}else{sfx.dark();flash('red');shakeScene()}
    say(pick(o.good?N.good:N.bad));
    changeMeters(o.f||0,o.d||0);if(pts)addPts(pts);
    const rhtml=typeof o.r==='function'?o.r():o.r;
    if(o.fx)o.fx();
    const fb=$('#fb');
    fb.innerHTML=`<div class="conseq ${o.good?'good':'bad'}">${rhtml}${fx.length?`<div class="fx">${fx.map(x=>`<span>${x}</span>`).join('')}</div>`:''}${LISTEN}</div><button class="btn" id="nx">➡️ Continuar</button>`;
    $('#nx').onclick=()=>{sfx.click();nextStep()};
    scrollToEl(fb);
  });
}

function craving(){
  if(D<30){nextStep();return}
  sfx.dark();
  $('#sc').classList.add('crave');
  const b=setBody(`<span class="choice-tag">😵 CRISE DE FISSURA</span><h2>O Nico está cobrando</h2>
    <div class="story">No meio do pátio, sua mão treme e o peito aperta. É a <b>abstinência</b>: irritação, ansiedade e uma vontade enorme de dar um trago. Essa é a consequência das doses que você aceitou.</div>
    <p>A fissura vem em ondas e <b>passa em poucos minutos</b>. Respire fundo para atravessar a onda:</p>
    <div class="breath"><div class="bcirc" id="bc"></div><div class="blbl" id="bl">Segure o botão para inspirar</div><div class="bdots">${'<i></i>'.repeat(3)}</div></div>
    <button class="btn holdbtn" id="hold">🫁 Segure para inspirar</button>
    <button class="btn ghost" id="give">😮‍💨 Ceder e dar um trago</button><div id="fb"></div>`);
  let state='ready',cycles=0,tm=null;
  const bc=$('#bc'),bl=$('#bl'),hold=$('#hold');
  const down=e=>{e.preventDefault();if(state!=='ready')return;state='in';bc.classList.add('big');bl.textContent='Inspirando… 1, 2, 3';tm=setTimeout(()=>{state='full';bl.textContent='Agora solte e expire devagar';sfx.tick()},3000)};
  const up=()=>{
    if(state==='in'){clearTimeout(tm);state='ready';bc.classList.remove('big');bl.textContent='Rápido demais! Segure por 3 segundos.';return}
    if(state!=='full')return;
    state='out';bc.classList.remove('big');bl.textContent='Expirando… 1, 2, 3';hold.setAttribute('disabled','');
    setTimeout(()=>{
      cycles++;document.querySelectorAll('.bdots i')[cycles-1].classList.add('on');sfx.ok();
      if(cycles>=3){
        state='done';$('#sc').classList.remove('crave');hold.remove();$('#give').remove();
        choices.push({ph:ph+1,txt:'Atravessou a crise de fissura respirando',good:true});
        changeMeters(0,-10);addPts(50);
        $('#fb').innerHTML=`<div class="conseq good"><h3>🌊 A onda passou!</h3><p>Você atravessou a fissura sem ceder. Respirar fundo, beber água, se mexer e conversar com alguém ajudam. Cada fissura vencida enfraquece a corrente.</p><div class="fx"><span>−10 ⛓️ Dependência</span><span>+50 ⭐</span></div></div><button class="btn" id="nx">➡️ Continuar</button>`;
        $('#nx').onclick=()=>{sfx.click();nextStep()};scrollToEl($('#fb'));
      }else{state='ready';hold.removeAttribute('disabled');bl.textContent='Mais uma vez: segure para inspirar'}
    },3000);
  };
  hold.addEventListener('pointerdown',down);hold.addEventListener('pointerup',up);hold.addEventListener('pointerleave',up);hold.addEventListener('pointercancel',up);
  hold.oncontextmenu=e=>e.preventDefault();
  $('#give').onclick=()=>{
    clearTimeout(tm);$('#sc').classList.remove('crave');sfx.dark();
    hold.remove();$('#give').remove();
    choices.push({ph:ph+1,txt:'Cedeu à fissura e deu outro trago',good:false});
    changeMeters(-15,15);
    $('#fb').innerHTML=`<div class="conseq bad"><h3>⛓️ Alívio de 5 minutos</h3><p>A fissura passou… porque você deu ao Nico o que ele queria. É assim que o ciclo se fecha: o "alívio" é só o fim da falta que a própria nicotina criou. Da próxima vez, a vontade volta mais forte.</p><div class="fx"><span>−15 🫁 Fôlego</span><span>+15 ⛓️ Dependência</span></div></div><button class="btn" id="nx">➡️ Continuar</button>`;
    $('#nx').onclick=()=>{sfx.click();nextStep()};scrollToEl($('#fb'));
  };
}

function race(){
  setBody(`<span class="choice-tag">🏃 TESTE DE FÔLEGO</span><h2>Corrida pelo pátio</h2>
    <div class="story" data-say="O holofote vai varrer o pátio de novo em segundos. Você precisa atravessar correndo até o portão sem ser visto. Olhe o seu fôlego no topo da tela.">O holofote vai varrer o pátio de novo em segundos. Você precisa <b>atravessar correndo</b> até o portão sem ser visto. Seu fôlego agora: <b>${F}</b>.<span hidden></span></div>
    <p class="muted">Precisa de pelo menos 70 de fôlego para chegar sem parar.</p>${''}
    <button class="btn" id="run">🏃 CORRER!</button><div id="fb"></div>`);
  $('#run').onclick=()=>{
    $('#run').remove();sfx.run();
    const sc=$('#sc'),ok=F>=70;
    if(ok){
      sc.classList.add('run');
      setTimeout(()=>{sfx.ok();addPts(50);say(N.raceOk);choices.push({ph:ph+1,txt:'Atravessou o pátio correndo, com fôlego de sobra',good:true});
        $('#fb').innerHTML=`<div class="conseq good"><h3>💨 Chegou ao portão!</h3><p>Pulmão sem irritação faz diferença: você correu sem tossir e ninguém te viu.</p><div class="fx"><span>+50 ⭐</span></div></div><button class="btn" id="nx">➡️ Continuar</button>`;
        $('#nx').onclick=()=>{sfx.click();nextStep()};scrollToEl($('#fb'))},2300);
      return;
    }
    sc.classList.add('runfail');
    setTimeout(()=>{
      sfx.cough();shakeScene();say(N.raceBad);
      if(ally){
        choices.push({ph:ph+1,txt:'Travou de tosse na corrida, mas o Rato te salvou',good:false});
        sc.classList.remove('runfail');sc.classList.add('run');
        $('#fb').innerHTML=`<div class="conseq bad"><h3>😮‍💨 Tosse no meio do caminho…</h3><p>Você trava, tossindo e sem ar. Mas o <b>Rato</b> bate na grade do outro lado e o guarda vira o holofote para lá. Ufa! Tosse e falta de ar são sinais de vias aéreas irritadas pelo aerossol.</p></div><button class="btn" id="nx">➡️ Continuar</button>`;
        $('#nx').onclick=()=>{sfx.click();nextStep()};scrollToEl($('#fb'));
      }else{
        sc.classList.add('caught');flash('red');sfx.alarm();
        choices.push({ph:ph+1,txt:'Sem fôlego, foi pego pelo holofote e foi para a solitária',good:false});
        $('#fb').innerHTML=`<div class="conseq bad"><h3>🚨 Pego pelo holofote!</h3><p>A tosse e a falta de ar te travaram no meio do pátio. O aerossol irrita e inflama as vias aéreas, e isso cobra a conta justamente quando você precisa do pulmão.</p><div class="fx"><span>−100 ⭐</span><span>Solitária: 8 s</span></div></div><button class="btn" id="nx">🔒 Ir para a solitária</button>`;
        addPts(-100);
        $('#nx').onclick=()=>{sfx.click();solitary(()=>{
          restoreScene();nextStep();
        })};
        scrollToEl($('#fb'));
      }
    },1500);
  };
}

function solitary(cb){
  renderScene('solitaria','SOLITÁRIA',0);
  let n=8;
  setBody(`<span class="choice-tag">🔒 SOLITÁRIA</span><h2>Tempo para pensar</h2>
    <div class="story">Cela escura, silêncio. Enquanto espera, o alto-falante repete: <i>"Fôlego perdido não volta na hora em que você precisa."</i></div>
    <p>Fato: parar de usar nicotina faz a respiração e a tosse melhorarem com o tempo. O corpo se recupera quando a gente para de agredir.</p>
    <div class="stat"><div><span id="cd">${n}</span><small>SEGUNDOS</small></div></div><div id="fb"></div>`);
  const iv=setInterval(()=>{n--;$('#cd').textContent=n;sfx.tick();
    if(n<=0){clearInterval(iv);sfx.clank();$('#fb').innerHTML=`<button class="btn" id="nx">🚪 Voltar ao pátio</button>`;$('#nx').onclick=()=>{sfx.click();cb()}}},1000);
}

/* ---------- Transições ---------- */
function transition(label,title,sub,cb,extra){
  sfx.alarm();
  const d=document.createElement('div');d.className='tr'+(extra?' extra':'');
  d.className+=' shakeit';setTimeout(()=>{tone(90,.35,'square',.18,0,45);tone(60,.5,'sawtooth',.1,.03)},360);
  d.innerHTML=`<div class="dl"></div><div class="dr"></div><div class="slam"></div><div class="sweep"></div><div class="strip s1"></div><div class="strip s2"></div>
    <div class="box"><div class="n">${label}</div><div class="t">${title}</div><div class="sub">${sub}</div></div><div class="skip">toque para pular</div>`;
  document.body.appendChild(d);
  let gone=false;const end=()=>{if(gone)return;gone=true;d.classList.add('out');cb();setTimeout(()=>d.remove(),600)};
  d.onclick=end;setTimeout(end,2400);
}
function typeText(el,text,speed=22){
  if(!el||!el.isConnected)return;
  let i=0;el.classList.add('type');
  const iv=setInterval(()=>{if(!el.isConnected){clearInterval(iv);return}el.textContent=text.slice(0,++i);if(i%3===0)sfx.tick();if(i>=text.length){clearInterval(iv);el.classList.add('done')}},speed);
  el.onclick=()=>{clearInterval(iv);el.textContent=text;el.classList.add('done')};
}

/* ================= NOVAS CENAS ================= */
const NURSE=(x,y)=>`<g transform="translate(${x} ${y})"><circle cx="0" cy="0" r="9" fill="#e3c7a3"/><path d="M-9 -3 Q0 -14 9 -3Z" fill="#fff"/><rect x="-2" y="-11" width="4" height="4" fill="#e11"/><rect x="-11" y="10" width="22" height="34" rx="8" fill="#f4f7f8"/><rect x="-2" y="16" width="4" height="10" fill="#3aa565"/><rect x="-5" y="19" width="10" height="4" fill="#3aa565"/></g>`;
const ECG=(x,y,fast)=>`<rect x="${x}" y="${y}" width="92" height="56" rx="4" fill="#0a0f0d" stroke="#333" stroke-width="3"/><polyline class="ecg ${fast?'fast':''}" points="${x+4},${y+30} ${x+22},${y+30} ${x+28},${y+16} ${x+34},${y+44} ${x+40},${y+30} ${x+58},${y+30} ${x+64},${y+14} ${x+70},${y+46} ${x+76},${y+30} ${x+88},${y+30}" fill="none" stroke="#4ade80" stroke-width="2"/><text x="${x+86}" y="${y+12}" font-family="JetBrains Mono,monospace" font-size="8" text-anchor="end" fill="#4ade80">${fast?'138':'82'} bpm</text>`;
Object.assign(SCENES,{
  lab:()=>`<svg viewBox="0 0 360 200" preserveAspectRatio="xMidYMid slice">${DEFS}
    <rect width="360" height="200" fill="#cfdcd8"/><rect width="360" height="150" fill="url(#bricks)" opacity=".25"/>
    <rect y="150" width="360" height="50" fill="#9fb0ab"/><path d="M0 150H360" stroke="#7d8d88" stroke-width="2"/>
    ${ECG(24,26,false)}
    <rect x="196" y="18" width="134" height="98" rx="4" fill="#20262b" stroke="#555" stroke-width="3"/>
    <rect x="202" y="24" width="122" height="86" fill="#0b1418"/><rect x="202" y="24" width="122" height="86" fill="#cfe7ff" opacity=".12"/>
    <path d="M262 32v66" stroke="#dfe9f2" stroke-width="3" opacity=".7"/>
    <path d="M258 44 Q228 46 224 74 Q222 98 244 100 Q258 100 258 84Z" fill="#dfe9f2" opacity=".55"/>
    <path d="M266 44 Q296 46 300 74 Q302 98 280 100 Q266 100 266 84Z" fill="#dfe9f2" opacity=".55"/>
    <circle class="spot" cx="238" cy="72" r="7" fill="#ff6b6b" opacity=".7"/><circle class="spot" cx="288" cy="80" r="6" fill="#ff6b6b" opacity=".7" style="animation-delay:.5s"/><circle class="spot" cx="244" cy="90" r="4" fill="#ff6b6b" opacity=".7" style="animation-delay:1s"/>
    <rect x="236" y="120" width="60" height="16" rx="2" fill="#f5c518"/><text x="266" y="131.5" font-family="JetBrains Mono,monospace" font-size="9" font-weight="700" text-anchor="middle" fill="#111">RAIO-X</text>
    <rect x="22" y="122" width="116" height="10" rx="3" fill="#eef3f4"/><rect x="28" y="132" width="5" height="18" fill="#7d8d88"/><rect x="128" y="132" width="5" height="18" fill="#7d8d88"/>
    ${NURSE(330,118)}${ME(150,98,.72)}${ALARM}</svg>`,
  enfermaria:()=>`<svg viewBox="0 0 360 200" preserveAspectRatio="xMidYMid slice">${DEFS}
    <rect width="360" height="200" fill="#e7dcdc"/><rect width="360" height="200" fill="#ff3b3b" opacity=".08" class="alarm-glow"/>
    <rect y="156" width="360" height="44" fill="#b9aaaa"/>
    <rect x="300" y="24" width="34" height="34" rx="4" fill="#fff"/><rect x="313" y="30" width="8" height="22" fill="#e11"/><rect x="306" y="37" width="22" height="8" fill="#e11"/>
    ${ECG(190,30,true)}
    <path d="M150 20v120" stroke="#888" stroke-width="3"/><rect x="138" y="22" width="24" height="30" rx="6" fill="#cfe7ff" stroke="#888"/><path d="M150 52 Q160 90 112 118" stroke="#9ab" stroke-width="1.5" fill="none"/>
    <rect x="20" y="126" width="140" height="14" rx="4" fill="#fff"/><rect x="20" y="120" width="34" height="10" rx="5" fill="#dfe6ee"/>
    <rect x="26" y="140" width="6" height="18" fill="#888"/><rect x="148" y="140" width="6" height="18" fill="#888"/>
    <g transform="translate(36 130) rotate(-90) scale(.55)">${avatar(CH)}</g>
    ${NURSE(262,112)}${ALARM}</svg>`,
  corredor:()=>`<svg viewBox="0 0 360 200" preserveAspectRatio="xMidYMid slice">${DEFS}
    <rect width="360" height="200" fill="#16181b"/>
    <polygon points="0,0 360,0 250,70 110,70" fill="#202328"/>
    <polygon points="0,200 360,200 250,120 110,120" fill="#2a2c30"/>
    <polygon points="0,0 110,70 110,120 0,200" fill="#33363c"/><polygon points="360,0 250,70 250,120 360,200" fill="#2e3136"/>
    <rect x="110" y="70" width="140" height="50" fill="#0d0f12"/>
    <rect class="glowexit" x="160" y="76" width="40" height="12" rx="2" fill="#3aa565"/><text x="180" y="85" font-family="JetBrains Mono,monospace" font-size="7" font-weight="700" text-anchor="middle" fill="#fff">SAÍDA</text>
    <polygon points="20,40 60,64 60,146 20,176" fill="#4a4f57"/><polygon points="78,74 98,86 98,126 78,138" fill="#4a4f57"/>
    <polygon points="340,40 300,64 300,146 340,176" fill="#4a4f57"/><polygon points="282,74 262,86 262,126 282,138" fill="#4a4f57"/>
    <circle class="alarm" cx="180" cy="20" r="6"/><circle class="alarm" cx="70" cy="40" r="4"/><circle class="alarm" cx="290" cy="40" r="4"/>
    <path d="M110 160 L250 160" stroke="#f5c518" stroke-width="2" stroke-dasharray="10 8" opacity=".4"/>
    <g class="chaser"><polygon points="44,112 170,96 170,150" fill="url(#beamg)" opacity=".8"/><g class="bob" transform="translate(14 0)"><circle cx="12" cy="96" r="10" fill="#050505"/><rect x="1" y="87" width="22" height="5" rx="2" fill="#050505"/><rect x="0" y="107" width="26" height="50" rx="8" fill="#050505"/><rect x="22" y="112" width="10" height="5" rx="1" fill="#ddd"/></g></g>
    <g class="corr-run">${ME(212,104,.66)}</g></svg>`,
  contrabando:()=>`<svg viewBox="0 0 360 200" preserveAspectRatio="xMidYMid slice">${DEFS}
    <rect width="360" height="200" fill="#15120f"/><rect width="360" height="200" fill="url(#bricks)" opacity=".4"/>
    <g class="bulb"><path d="M200 0v40" stroke="#333" stroke-width="2"/><circle cx="200" cy="46" r="8" fill="#ffd27a"/><circle cx="200" cy="80" r="90" fill="url(#lamp)"/></g>
    <rect y="160" width="360" height="40" fill="#0e0c0a"/>
    ${[[10,110],[52,110],[30,70]].map(([x,y])=>`<g transform="translate(${x} ${y})"><rect width="44" height="50" fill="#6b4f30" stroke="#3b2c20" stroke-width="2"/><path d="M0 0L44 50M44 0L0 50" stroke="#3b2c20" stroke-width="2"/></g>`).join('')}
    <rect x="200" y="122" width="130" height="8" fill="#4a3826"/><rect x="208" y="130" width="6" height="30" fill="#3b2c20"/><rect x="316" y="130" width="6" height="30" fill="#3b2c20"/>
    ${[['#ff6fd8',214],['#5ce1ff',236],['#f5c518',258],['#4ade80',280],['#ff8a1f',302]].map(([c,x])=>`<rect x="${x}" y="108" width="10" height="14" rx="2" fill="#222"/><rect class="podglow" x="${x+2}" y="110" width="6" height="3" fill="${c}"/>`).join('')}
    <g transform="translate(300 64)"><path d="M-16 20 Q-16 -8 0 -8 Q16 -8 16 20Z" fill="#1d1a2b"/><circle cx="0" cy="6" r="9" fill="#0a0a0a"/><rect x="-8" y="2" width="16" height="5" rx="2" fill="#111" stroke="#5ce1ff" stroke-width="1"/><rect x="-14" y="20" width="28" height="40" rx="8" fill="#1d1a2b"/></g>
    ${ME(130,104,.68)}</svg>`,
  portao:()=>`<svg viewBox="0 0 360 200" preserveAspectRatio="xMidYMid slice">${DEFS}
    <rect width="360" height="200" fill="url(#dawn)"/><circle cx="180" cy="120" r="40" fill="#ffe08a" opacity=".8"/>
    <path d="M0 150 Q90 132 180 146 T360 140 V200 H0z" fill="#3f6b3a"/>
    <rect y="150" width="360" height="50" fill="#3b3a35"/>
    <g class="bars">${Array.from({length:12},(_,i)=>`<rect x="${6+i*30}" y="0" width="12" height="200" fill="url(#steel)"/>`).join('')}
      <rect x="0" y="18" width="360" height="12" fill="url(#steel)"/><rect x="0" y="120" width="360" height="12" fill="url(#steel)"/>
      ${[120,180,240].map(x=>`<g transform="translate(${x} 128)"><path d="M-8 0 v-8 a8 8 0 0 1 16 0 v8" stroke="#9aa3ad" stroke-width="3" fill="none"/><rect x="-11" y="0" width="22" height="18" rx="3" fill="#c0392b"/><circle cx="0" cy="8" r="2.5" fill="#111"/></g>`).join('')}</g>
    <g class="runner">${ME(36,128,.62)}</g>${ALARM}${GUARD(34)}</svg>`
});

/* ================= NOVOS DESAFIOS ================= */
function match(c){
  const order=c.shuffle;
  const b=setBody(`${head(c.tag,c.title)}${c.intro}
    <div class="bodymap"><svg viewBox="0 0 80 170">
      <circle cx="40" cy="22" r="17" fill="#3a3f47"/><rect x="18" y="40" width="44" height="74" rx="16" fill="#3a3f47"/>
      <rect x="8" y="44" width="10" height="58" rx="5" fill="#3a3f47"/><rect x="62" y="44" width="10" height="58" rx="5" fill="#3a3f47"/>
      <rect x="24" y="110" width="13" height="56" rx="6" fill="#3a3f47"/><rect x="43" y="110" width="13" height="56" rx="6" fill="#3a3f47"/>
      <ellipse class="organ" id="o0" cx="31" cy="64" rx="8" ry="15" fill="#6b737d"/><ellipse class="organ" id="o0b" cx="49" cy="64" rx="8" ry="15" fill="#6b737d"/>
      <path class="organ" id="o1" d="M40 86 l-7 -7 a4 4 0 0 1 7 -5 a4 4 0 0 1 7 5z" fill="#6b737d"/>
      <ellipse class="organ" id="o2" cx="40" cy="17" rx="11" ry="8" fill="#6b737d"/>
      <rect class="organ" id="o3" x="34" y="29" width="12" height="4" rx="2" fill="#6b737d"/>
    </svg>
    <div class="organs">${c.pairs.map((p,i)=>`<button data-i="${i}">${p.l}</button>`).join('')}</div></div>
    <p class="muted">Toque num órgão e depois no efeito que combina com ele.</p>
    <div class="effects">${order.map(i=>`<button data-i="${i}">${c.pairs[i].r}</button>`).join('')}</div><div id="fb"></div>`);
  let sel=null,ok=0;const cols=['#ff6b9a','#ff4d4d','#a78bfa','#f5c518'];
  b.querySelectorAll('.organs button').forEach(x=>x.onclick=()=>{sfx.tick();b.querySelectorAll('.organs button').forEach(y=>y.classList.remove('sel'));x.classList.add('sel');sel=+x.dataset.i;readNow([{text:x.innerText,el:x}])});
  b.querySelectorAll('.effects button').forEach(x=>x.onclick=()=>{
    if(sel===null){$('#fb').innerHTML=`<div class="fb bad"><p>Primeiro escolha um órgão lá em cima 👆</p></div>`;return}
    const i=+x.dataset.i,ob=b.querySelector(`.organs button[data-i="${sel}"]`);
    if(i===sel){
      sfx.ok();ok++;ob.classList.remove('sel');ob.classList.add('ok');x.classList.add('ok');
      x.innerHTML=`<span class="pairtag">✓ ${c.pairs[i].l}</span>`+x.innerHTML;
      ['o'+i,'o'+i+'b'].forEach(id=>{const o=document.getElementById(id);if(o){o.setAttribute('fill',cols[i]);o.classList.add('lit')}});
      $('#fb').innerHTML='';sel=null;
      if(ok===c.pairs.length)solved(c.explain);
    }else{
      x.classList.remove('bad');ob.classList.remove('bad');void x.offsetWidth;x.classList.add('bad');ob.classList.add('bad');
      failed(`<h3>🚨 Não combina!</h3><p>${c.pairs[sel].hint}</p>`);
    }
  });
}

function varal(c){
  const b=setBody(`${head(c.tag,c.title)}${c.intro}
    <div class="varal"><textarea id="vt" maxlength="120" placeholder="Ex.: Seu pulmão não é descartável 💚"></textarea><div class="cnt" id="vc">0/120</div></div>
    <div class="chips">${c.ideas.map(t=>`<button class="chip">${t}</button>`).join('')}</div>
    <button class="btn" id="go" disabled>📌 Pendurar no varal</button><div id="vl"></div><div id="fb"></div>`);
  const vt=$('#vt'),go=$('#go');
  const upd=()=>{$('#vc').textContent=vt.value.length+'/120';vt.value.trim().length>=6?go.removeAttribute('disabled'):go.setAttribute('disabled','')};
  vt.oninput=upd;
  b.querySelectorAll('.chip').forEach(ch=>ch.onclick=()=>{sfx.tick();vt.value=ch.textContent;upd();readNow([{text:ch.textContent,el:ch}])});
  go.onclick=()=>{
    VARAL=vt.value.trim().slice(0,120);enviarVaral(VARAL);
    vt.setAttribute('readonly','');go.remove();b.querySelectorAll('.chip').forEach(x=>x.remove());
    const vl=$('#vl');vl.innerHTML=`<div class="line"></div><div class="postit"></div>`;vl.querySelector('.postit').textContent=VARAL;
    setTimeout(()=>solved(c.explain),900);
  };
}

function chase(c,done){
  let dist=F<70?1:0,idx=0;
  const sc=$('#sc');sc.classList.toggle('d1',dist===1);
  const draw=()=>{
    const q=c.qs[idx];
    setBody(`<span class="choice-tag">🚨 FASE EXTRA · CONSEQUÊNCIA</span><h2>${c.title}</h2>${idx===0?c.intro:''}
      <div class="dist">GUARDA ${[0,1].map(i=>`<i class="${i<dist?'on':''}"></i>`).join('')} ${dist?'chegando perto!':'longe… por enquanto'}</div>
      <div class="qcard"><small>BIFURCAÇÃO ${idx+1} DE ${c.qs.length} · ESCOLHA A PORTA CERTA</small>"${q.s}"</div>
      <div class="doors"><button class="door" data-v="0"><small>🚪</small>MITO</button><button class="door" data-v="1"><small>🚪</small>VERDADE</button></div><div id="fb"></div>`);
    document.querySelectorAll('.door').forEach(d=>d.onclick=()=>{
      document.querySelectorAll('.door').forEach(x=>x.style.pointerEvents='none');
      const right=(d.dataset.v==='1')===q.v;
      const fb=$('#fb');
      if(right){d.classList.add('ok');sfx.run();addPts(30)}
      else{d.classList.add('bad');dist++;errors++;sfx.cough();shakeScene();flash('red');changeMeters(-5,0);sc.classList.remove('d1','d2');sc.classList.add('d'+Math.min(dist,2))}
      const caught=dist>=2;
      fb.innerHTML=`<div class="fb ${right?'good':'bad'}"><h3>${right?'🏃 Porta certa! Você ganhou distância.':'😮‍💨 Porta errada: beco sem saída e tosse…'}</h3><p>É ${q.v?'VERDADE':'MITO'}. ${q.e}</p></div>
        <button class="btn" id="nx">${caught?'🚨 Você foi pego!':idx<c.qs.length-1?'🏃 Próxima bifurcação':'🚪 Atravessar a saída'}</button>`;
      scrollToEl(fb);
      $('#nx').onclick=()=>{
        sfx.click();
        if(caught){choices.push({ph:'Extra',txt:'Foi pego pelo guarda na perseguição',good:false});addPts(-50);solitary(done);return}
        idx++;
        if(idx<c.qs.length)draw();
        else{
          sc.classList.add('escaped');sfx.ok();addPts(50);
          choices.push({ph:'Extra',txt:'Escapou da perseguição no corredor',good:true});
          setBody(`<span class="choice-tag">🚨 FASE EXTRA · CONSEQUÊNCIA</span><h2>Despistou o guarda!</h2><div class="conseq good"><p>${c.win}</p><div class="fx"><span>+50 ⭐</span></div></div><button class="btn" id="nx">➡️ Voltar para a fuga</button>`);
          $('#nx').onclick=()=>{sfx.click();done()};
        }
      };
    });
  };
  draw();
}

/* Desafio único usado dentro de uma fase extra */
function extraScan(c,done){
  const b=setBody(`<span class="choice-tag">🚨 FASE EXTRA · CONSEQUÊNCIA</span><h2>${c.title}</h2>${c.intro}<p><b>${c.q}</b></p>
    <div class="scan">${c.items.map((it,k)=>`<button class="sc" data-k="${k}">${it.t}</button>`).join('')}</div>
    <button class="btn" id="go">${c.btn}</button><div id="fb"></div>`);
  const sel=new Set();let tries=0;
  b.querySelectorAll('.sc').forEach(x=>x.onclick=()=>{sfx.tick();const k=+x.dataset.k;sel.has(k)?sel.delete(k):sel.add(k);x.classList.toggle('on');x.classList.remove('bad');readNow([{text:x.innerText+(x.classList.contains('on')?', marcado':', desmarcado'),el:x}])});
  $('#go').onclick=()=>{
    const wrong=[...sel].filter(k=>!c.items[k].ok),miss=c.items.filter((it,k)=>it.ok&&!sel.has(k)).length;
    if(!wrong.length&&!miss){
      $('#go').remove();b.querySelectorAll('.sc').forEach(x=>x.style.pointerEvents='none');sfx.ok();addPts(tries?20:40);
      choices.push({ph:'Extra',txt:c.log,good:false});
      if(c.after)c.after();
      $('#fb').innerHTML=`<div class="fb good">${c.explain}</div><button class="btn" id="nx">➡️ Voltar para a fuga</button>`;
      $('#nx').onclick=()=>{sfx.click();done()};scrollToEl($('#fb'));return;
    }
    tries++;wrong.forEach(k=>b.querySelector(`.sc[data-k="${k}"]`).classList.add('bad'));
    failed(`<h3>🚨 Ainda não.</h3>${wrong.length?`<p data-say="Os itens em vermelho não estão certos.">${wrong.map(k=>c.items[k].why).join(' ')}</p>`:''}${miss?`<p data-say="Ainda falta marcar alguma coisa. Olhe de novo!">Falta${miss>1?'m':''} <b>${miss}</b>. Olhe de novo!</p>`:''}`);
  };
}

/* ================= FASES EXTRAS (consequências) ================= */
const EXTRA={
  perseguicao:{scene:'corredor',label:'EXTRA · CORREDOR B',title:'PERSEGUIÇÃO',sub:'O guarda sentiu o cheiro',
    run:done=>chase({title:'🚨 Corra pelo corredor!',
      intro:`<div class="story">O cheiro adocicado do aerossol ficou no ar da cela, e o guarda sentiu. <b>Alarme!</b> Você corre pelo corredor. Em cada bifurcação, a porta certa depende de você saber a verdade.${F<70?' <b>Com o fôlego baixo, o guarda já começa mais perto.</b>':''}</div>`,
      qs:[
        {s:'O cheiro do vape some rápido e não deixa nada no ar.',v:false,e:'O aerossol espalha partículas no ambiente, e quem está por perto também acaba inalando.'},
        {s:'Um trago só não muda nada no cérebro.',v:false,e:'A nicotina chega ao cérebro em segundos, e as primeiras doses já começam a ensinar o cérebro a querer mais.'},
        {s:'Quem fica perto de alguém usando vape também é exposto às substâncias.',v:true,e:'Isso se chama exposição passiva: as partículas e a nicotina do aerossol ficam no ar.'}],
      win:'Você despistou o guarda! Mas repare: essa corrida só aconteceu por causa daquele trago. Uma escolha pequena puxou um problema grande.'},done)},
  emergencia:{scene:'enfermaria',label:'EXTRA · ENFERMARIA',title:'EMERGÊNCIA',sub:'Nicotina demais',
    run:done=>extraScan({title:'🚑 Mal-estar na enfermaria',
      intro:`<div class="npc"><div class="face">👩‍⚕️</div><div class="say"><small>Enfermeira Clara</small>O pod do Diretor tinha nicotina alta, e seu corpo não aguentou. Calma, você está sendo cuidado. Me ajuda: quais desses sinais você está sentindo?</div></div>`,
      q:'Marque os sinais de excesso de nicotina:',btn:'🩺 Mostrar para a enfermeira',
      items:[{t:'🤢 Náusea ou vômito',ok:true},{t:'💫 Tontura',ok:true},{t:'💓 Coração acelerado',ok:true},{t:'💦 Suor frio',ok:true},
        {t:'😴 Sono tranquilo e relaxado',why:'Nicotina é estimulante: ela agita, não relaxa.'},{t:'💪 Mais força nos músculos',why:'Nicotina não dá força. Em excesso, ela causa fraqueza e mal-estar.'}],
      log:'Passou mal com a nicotina alta e foi para a enfermaria',after:()=>changeMeters(-10,0),
      explain:`<h3>🩺 Você foi atendido</h3><p>Náusea, tontura, coração acelerado e suor frio podem ser sinais de <b>excesso de nicotina</b>. Os pods variam muito na concentração, e o usuário nunca sabe direito quanto está inalando. O líquido de refil também é perigoso se for engolido, principalmente por crianças.</p><div class="fx"><span>−10 🫁 Fôlego</span></div>`},done)},
  pirata:{scene:'contrabando',label:'EXTRA · DEPÓSITO CLANDESTINO',title:'O POD PIRATA',sub:'O que tem nesse pod?',
    run:done=>extraScan({title:'📦 O pod pirata',
      intro:`<div class="story">O pod "zero nicotina" que você comprou veio de um depósito escondido. Sua garganta arde e a cabeça gira. Ele <b>tinha nicotina</b>, sim. Investigue a embalagem antes de jogar fora:</div>
        <div class="doc">ＶＡＰＥ ＣＬＯＵＤ — ０％ ＮＩＣ<br>Made in ███ · Lote: —<br>Sabor: Ice Candy 🍬<br><span class="stamp">SEM REGISTRO</span></div>`,
      q:'Toque em todos os sinais de alerta:',btn:'🔍 Fechar a investigação',
      items:[{t:'🚫 Sem registro e origem desconhecida',ok:true},{t:'❓ "0% nicotina" sem nenhuma análise',ok:true},{t:'🌐 Rótulo sem tradução nem informações',ok:true},{t:'🔓 Lacre violado e lote em branco',ok:true},
        {t:'🎨 A cor da embalagem',why:'A cor é só estética, não é um sinal de perigo em si.'},{t:'🍬 O nome do sabor',why:'O nome do sabor não diz nada sobre o conteúdo. É marketing.'}],
      log:'Comprou um pod pirata "zero nicotina" e investigou a embalagem',
      explain:`<h3>🔍 Investigação concluída</h3><p>No Brasil, a <b>Anvisa proíbe</b> fabricar, importar, vender, distribuir e fazer propaganda de cigarros eletrônicos (RDC nº 855/2024). Ou seja, todo pod vendido aqui é ilegal e <b>não tem controle de qualidade</b>: o rótulo pode dizer qualquer coisa, e você não sabe o que está inalando.</p>`},done)}
};

/* ================= CONTEÚDO DAS FASES ================= */
const PH=[
 {scene:'cela',label:'FASE 1 · CELA 17',title:'A CELA',sub:'A Névoa',
  steps:[
   ()=>mcq({tag:'Fase 1 · Cadeado 1 de 3',title:'🌫️ O laudo escondido',
    intro:`<p>Embaixo do colchão você acha um <b>laudo confiscado</b> sobre o pod. O resultado está borrado.</p>
      <div class="doc">PRESÍDIO NUVEM DOCE · CONFIDENCIAL<br>LAUDO Nº 017 · POD "MELANCIA ICE"<br>Composição: ███████ ██ ████████<br><span class="stamp">OCULTADO</span></div>`,
    q:'O que é, de verdade, a "fumacinha" do pod?',
    opts:[
     {t:'💧 Vapor de água com aroma. Some no ar e não deixa nada no pulmão.',why:`<p>Esse é o mito favorito do carcereiro. O que sai do pod <b>não é vapor de água</b>: é um <b>aerossol</b>, ou seja, gotículas e partículas muito finas que chegam ao fundo do pulmão.</p>`},
     {t:'🌫️ Um aerossol aquecido: gotículas e partículas finas carregando substâncias até o fundo do pulmão.',ok:true},
     {t:'🍓 Fumaça de fruta. Como é sabor, é natural.',why:`<p>O sabor vem de <b>aromatizantes químicos</b>, não da fruta. E nada ali é "natural": o líquido é aquecido por uma resistência de metal antes de virar névoa.</p>`},
     {t:'☁️ Ar com cheiro. Não tem nada dentro, por isso é leve.',why:`<p>"Leve" é sensação, não composição. A névoa é visível justamente porque <b>tem coisa dentro</b>: gotículas e partículas suspensas.</p>`}],
    explain:`<h3>🔓 Primeiro cadeado aberto!</h3><p>Não é vapor d'água. É <b>aerossol</b>, uma névoa de gotículas e partículas tão finas que entram fundo nos pulmões.</p>`}),
   ()=>choice({title:'🐀 O colega de cela',
    story:`<div class="npc"><div class="face">🐀</div><div class="say"><small>Rato, colega de cela</small>Ei, novato… dá um trago aqui. Ajuda a pensar nesses enigmas. Todo mundo aqui usa.</div></div>`,
    q:'O que você faz?',
    opts:[
     {t:'💨 Dar só um trago pra testar',good:false,f:-20,d:30,pts:-50,log:'Aceitou o trago do Rato',fx:()=>pendingExtra.push('perseguicao'),
      r:`<h3>⛓️ Primeira dose</h3><p>Bate uma tontura e um "barato" que some em minutos. O Rato sorri: "Viu? Agora você é da casa." Só que o cheiro ficou no ar… <b>e alguém sentiu.</b></p><p class="muted">⚠️ Essa escolha vai abrir uma fase extra.</p>`},
     {t:'🙅 "Valeu, tô de boa. Preciso da cabeça limpa."',good:true,pts:50,log:'Recusou o pod do Rato',
      r:`<h3>💪 Cabeça limpa</h3><p>O Rato dá de ombros e volta a dormir. Foco total no próximo cadeado.</p>`},
     {t:'🤔 "Por que você usa, Rato?"',good:true,pts:50,log:'Perguntou ao Rato por que ele usa, e ganhou um aliado',fx:()=>{ally=true},
      r:`<h3>🤝 Novo aliado</h3><p>O Rato fica quieto… "Comecei por zoeira. Agora não consigo ficar uma hora sem." Ele guarda o pod. "Vou te ajudar a sair daqui." <b>O Rato virou seu aliado</b>, e isso vai fazer diferença mais tarde.</p>`}]}),
   ()=>mythTruth({tag:'Fase 1 · Cadeado 2 de 3',title:'🃏 Mito ou verdade?',
    intro:'Os detentos antigos espalham histórias pela cela. Vire as cartas: é mito ou verdade?',
    items:[
     {s:'Se o pod diz "zero nicotina", não faz mal nenhum.',v:false,e:`<p>Mesmo sem nicotina, você inala solventes aquecidos, aromatizantes e partículas finas que irritam as vias aéreas. E análises já acharam nicotina em produtos vendidos como "zero".</p>`},
     {s:'O aerossol pode ter metais como níquel e chumbo.',v:true,e:`<p>Os metais saem da <b>resistência</b> que aquece o líquido e vão junto com a névoa para dentro do pulmão.</p>`},
     {s:'Se quase não tem cheiro, é porque não tem nada tóxico.',v:false,e:`<p>Cheiro não mede perigo. Partículas ultrafinas e várias substâncias irritantes <b>não têm cheiro</b> perceptível.</p>`}],
    explain:`<p>Os detentos espalham muito mito. Quem conhece os fatos não cai na conversa.</p>`}),
   ()=>scanner({tag:'Fase 1 · Cadeado 3 de 3',title:'📡 Scanner da névoa',
    intro:`<p>Na grade há um scanner. Ele só abre se você marcar <b>tudo</b> o que tem no aerossol e <b>nada</b> que não tem.</p>`,
    q:'Toque em tudo o que o scanner encontrou na névoa:',
    items:[
     {t:'⚡ Nicotina',ok:true},{t:'💧 Só água pura',why:'"Só água" é o mito do primeiro cadeado.'},
     {t:'🧪 Propilenoglicol e glicerina',ok:true},{t:'🍊 Vitaminas',why:'Não existe vitamina "inalável" no pod: isso é marketing.'},
     {t:'☠️ Formaldeído e acroleína',ok:true},{t:'🫁 Oxigênio extra',why:'O aerossol não leva oxigênio a mais pro pulmão: ele ocupa espaço e irrita.'},
     {t:'🔩 Metais (níquel, chumbo)',ok:true},{t:'✨ Partículas ultrafinas',ok:true}],
    explain:`<h3>🔓 Scanner liberado!</h3><ul>
      <li><b>Nicotina</b>: a corrente que prende.</li>
      <li><b>Propilenoglicol e glicerina</b>: formam a "fumaça".</li>
      <li><b>Formaldeído e acroleína</b>: surgem quando o líquido e os aromatizantes são aquecidos.</li>
      <li><b>Metais e partículas ultrafinas</b>: vêm da resistência e entram fundo no pulmão.</li></ul>`})
  ],
  end:{title:'CLANK! A cela abriu!',html:`<p>Resumo da Fase 1: vape <b>não é vapor</b>. É um aerossol com nicotina, solventes aquecidos, compostos irritantes e metais.</p>`,
   reflect:{q:'Você já ouviu alguém dizer que vape é "só vapor"?',chips:['Já, várias vezes','Uma ou outra vez','Nunca'],after:'Agora você tem os argumentos para responder. 💪'},next:'🏃 Correr pelo corredor'}},

 {scene:'cofre',label:'FASE 2 · SALA DO DIRETOR',title:'O COFRE',sub:'da Dopamina',clank:'CLICK! 🔓',
  steps:[
   ()=>dial({tag:'Fase 2 · Cadeado 1 de 3',title:'🧠 O disco do cofre',
    intro:`<div class="story">A chave do portão está no cofre do diretor. No disco, um recado riscado: <b>"o cérebro termina a obra aos…"</b></div>`,
    q:'Gire até a idade em que o cérebro termina de amadurecer, mais ou menos.',
    vals:[12,15,18,21,25,30],answer:25,
    low:'Ainda não! O cérebro continua em obra depois disso, principalmente a área da frente (córtex pré-frontal), responsável por decisões e controle de impulsos. Gire mais.',
    high:'Passou um pouco! A maior parte do amadurecimento termina antes disso. Volte um pouco.',
    explain:`<h3>🔓 25! Primeiro cadeado aberto.</h3><p>O cérebro só termina de amadurecer <b>por volta dos 25 anos</b>. Enquanto está em obra, ele aprende rápido… inclusive a depender de nicotina.</p>`}),
   ()=>choice({title:'🕴️ A proposta do Diretor',
    story:`<div class="npc"><div class="face">🕴️</div><div class="say"><small>Diretor da Nuvem Doce</small>Esperto você, hein? Vamos fazer um acordo: eu abro o próximo cadeado pra você… se você experimentar o nosso <b>pod novo, sabor menta ice</b>. É por conta da casa.</div></div>`,
    q:'O que você responde?',
    opts:[
     {t:'🤝 Aceitar o atalho',good:false,f:-15,d:35,pts:-50,log:'Aceitou o atalho do Diretor em troca de usar o pod',fx:()=>{skipNext=true;pendingExtra.push('emergencia')},
      r:`<h3>⛓️ "Cliente fiel"</h3><p>O cadeado abre sozinho… mas o pod novo tinha nicotina alta. Sua cabeça gira e o estômago embrulha. O Diretor anota no caderno: "cliente fiel". <b>Atalho oferecido por quem lucra com você sempre cobra depois.</b></p><p class="muted">⚠️ Essa escolha vai abrir uma fase extra.</p>`},
     {t:'✋ "Não preciso do seu atalho."',good:true,pts:50,log:'Recusou o atalho do Diretor',
      r:`<h3>💪 Do seu jeito</h3><p>O Diretor fecha a cara. Você vai abrir sozinho, e vai entender como a armadilha funciona.</p>`},
     {t:'🕵️ "Por que você quer tanto que eu use?"',good:true,pts:50,log:'Desmascarou o modelo de negócio do Diretor',
      r:`<h3>🕵️ Desmascarado</h3><p>"…Porque cliente viciado volta sempre", ele deixa escapar, e logo se arrepende. <b>Você entendeu o modelo de negócio</b>: quanto antes alguém começa, mais tempo fica preso.</p>`}]}),
   ()=>order({tag:'Fase 2 · Cadeado 2 de 3',title:'🔁 A armadilha do Nico',
    intro:`<div class="story">Segundo cadeado. No visor: <b>"Coloque em ordem como o Nico prende os detentos."</b></div>`,
    items:['⚡ A nicotina chega ao cérebro em poucos segundos','😌 Pico de dopamina: sensação de prazer ou alívio','📉 O efeito passa rápido: irritação, ansiedade e vontade de usar de novo','🔁 O cérebro se adapta e precisa de mais para sentir o mesmo'],
    shuffle:[2,0,3,1],
    hint:`<p>Pista: tudo começa com a nicotina <b>chegando</b> ao cérebro. Depois vem a <b>recompensa</b> (dopamina), em seguida a <b>queda</b>, e por último o cérebro <b>se adapta</b> e pede mais.</p>`,
    explain:`<h3>🔓 Esse é o ciclo que prende!</h3><p>A nicotina dispara <b>dopamina</b> no sistema de recompensa, o efeito some rápido e o cérebro passa a cobrar a próxima dose. Com a <b>tolerância</b>, ele precisa de cada vez mais. Alguns pods podem ter tanta nicotina quanto um maço de cigarros, ou mais.</p>`}),
   ()=>mcq({tag:'Fase 2 · Cadeado 3 de 3',title:'😮‍💨 O papo do detento',
    intro:`<div class="npc"><div class="face">🧔</div><div class="say"><small>Detento da cela 12</small>Cara, o vape me acalma. Quando fico ansioso, dou um trago e passa.</div></div>`,
    q:'O que está acontecendo de verdade?',
    opts:[
     {t:'É verdade: nicotina é um tipo de remédio para ansiedade.',why:`<p>Nicotina não trata ansiedade. Estudos associam o uso em jovens a <b>mais</b> sintomas de ansiedade e depressão, não menos.</p>`},
     {t:'A "calma" é, em boa parte, o alívio da abstinência que a própria nicotina criou. Com o tempo, a ansiedade pode piorar.',ok:true},
     {t:'Só acalma quem já tem ansiedade. Para os outros, não faz efeito.',why:`<p>A nicotina age no cérebro de qualquer pessoa. O "alívio" aparece em quem já está dependente: é o fim da falta que ela mesma causou.</p>`},
     {t:'A nicotina não mexe com o humor, então é só efeito placebo.',why:`<p>Mexe, sim! A nicotina mexe com dopamina e outros neurotransmissores ligados a humor, atenção e estresse. Por isso vicia.</p>`}],
    explain:`<h3>🔓 Cofre destravado!</h3><p>Esse é o golpe do Nico: ele causa a ansiedade da abstinência e depois "vende" o alívio. No cérebro adolescente isso pesa mais e pode afetar <b>atenção, memória, controle de impulsos e humor</b>.</p>`})
  ],
  end:{title:'CLICK! A chave é sua!',html:`<p>Resumo da Fase 2: a nicotina usa a <b>dopamina</b> para viciar rápido, e o cérebro adolescente, que vai estar em obra até ~25 anos, é o alvo mais fácil.</p>`,
   reflect:{q:'Quando bate ansiedade ou tédio, o que te ajuda de verdade?',chips:['🎧 Música','🏃 Me mexer','💬 Conversar','🎮 Jogar','😴 Descansar'],after:'Isso é regulação emocional sem dar a chave pro Nico. 💚'},next:'🩻 Descer até o Raio-X'}},

 {scene:'lab',label:'FASE 3 · SALA DE RAIO-X',title:'O RAIO-X',sub:'O que acontece no corpo',
  steps:[
   ()=>match({tag:'Fase 3 · Cadeado 1 de 3',title:'🫀 Mapa do corpo',
    intro:`<p>A porta da sala de Raio-X só abre quando o painel do corpo estiver completo. Ligue cada órgão ao que o vape pode causar nele.</p>`,
    pairs:[
     {l:'🫁 Pulmões',r:'Irritação, tosse, chiado e risco de lesão pulmonar (EVALI)',hint:'Pense em onde o aerossol entra primeiro e "pousa".'},
     {l:'❤️ Coração',r:'Aumento da frequência cardíaca e da pressão arterial',hint:'A nicotina é estimulante: ela acelera alguma coisa que bate.'},
     {l:'🧠 Cérebro',r:'Dependência, alterações de humor e prejuízo à atenção e à memória',hint:'Lembre do cofre da dopamina.'},
     {l:'👄 Boca e gengivas',r:'Boca seca, irritação e inflamação da gengiva',hint:'É a primeira parte do corpo que o aerossol toca.'}],
    shuffle:[2,0,3,1],
    explain:`<h3>🔓 Painel completo!</h3><p>O vape não afeta só o pulmão. A nicotina mexe com o <b>coração</b> e o <b>cérebro</b>, e o aerossol irrita tudo por onde passa, da <b>boca</b> até o fundo dos <b>pulmões</b>.</p>`}),
   ()=>choice({title:'🩺 A consulta',
    story:`<div class="npc"><div class="face">👨‍⚕️</div><div class="say"><small>Enfermeiro Davi</small>Antes do exame, preciso perguntar, sem julgamento: você já usou vape? Isso muda como eu cuido de você.</div></div>`,
    q:'O que você responde?',
    opts:[
     {t:'🤥 "Nunca usei." (mesmo tendo usado)',good:false,pts:-30,log:'Escondeu do enfermeiro que tinha usado',
      r:`<h3>🙊 Informação escondida</h3><p>O Davi anota "não usa" e segue. Sem saber a verdade, ele não consegue te orientar nem te ajudar a parar. <b>Profissionais de saúde não estão ali para julgar</b>: o que você conta ajuda no seu cuidado.</p>`},
     {t:'🗣️ Contar a verdade, seja ela qual for',good:true,pts:50,log:'Foi honesto com o enfermeiro',fx:()=>{if(D>0)changeMeters(10,-15)},
      r:()=>D>0?`<h3>🤝 Acolhido</h3><p>"Obrigado por confiar em mim." O Davi explica que dá para parar, que o SUS tem tratamento gratuito e passa algumas estratégias. <b>Pedir ajuda já é parte da saída.</b></p><div class="fx"><span>+10 🫁 Fôlego</span><span>−15 ⛓️ Dependência</span></div>`:`<h3>🤝 Confiança</h3><p>"Que bom! Nunca ter começado é a melhor proteção." O Davi te dá um toca aqui. Falar a verdade com profissionais de saúde é sempre o melhor caminho.</p>`},
     {t:'🙄 "Isso não é da sua conta."',good:false,log:'Se recusou a conversar com o enfermeiro',
      r:`<h3>🚪 Porta fechada</h3><p>Você tem direito de não falar, e o Davi respeita. Mas perde uma chance de tirar dúvidas e receber orientação, sem nenhum julgamento.</p>`}]}),
   ()=>scanner({tag:'Fase 3 · Cadeado 2 de 3',title:'📋 Prontuário de alerta',
    intro:`<p>O cadeado é um prontuário. Marque <b>os sinais que pedem procurar um serviço de saúde</b> em quem usa vape.</p>`,
    q:'Quais sinais são de alerta?',
    items:[
     {t:'😮‍💨 Falta de ar',ok:true},{t:'🤧 Um espirro isolado',why:'Um espirro isolado não é sinal de alerta.'},
     {t:'💔 Dor no peito',ok:true},{t:'😐 Uma leve preguiça de manhã',why:'Preguiça de manhã não é sinal de doença respiratória.'},
     {t:'🫁 Tosse que não passa',ok:true},{t:'🎵 Chiado ao respirar',ok:true}],
    explain:`<h3>🔓 Prontuário certo!</h3><p><b>Falta de ar, dor no peito, tosse persistente e chiado</b> em quem usa vape são motivos para procurar a UBS ou um serviço de saúde, e contar sobre o uso.</p>`}),
   ()=>mcq({tag:'Fase 3 · Cadeado 3 de 3',title:'🩻 O raio-X misterioso',
    intro:`<p>Na parede, o raio-X de um jovem de 17 anos que usava vape mostra os pulmões inflamados. O laudo diz: <b>"suspeita de EVALI"</b>.</p>`,
    q:'O que é EVALI?',
    opts:[
     {t:'Uma alergia ao sabor de melancia.',why:`<p>Não é alergia de sabor. É uma lesão no próprio pulmão.</p>`},
     {t:'Uma lesão pulmonar associada ao uso de cigarro eletrônico, que pode causar falta de ar, tosse, dor no peito e até internação.',ok:true},
     {t:'Uma gripe comum que passa sozinha em dois dias.',why:`<p>Os sintomas podem até parecer de gripe no começo, mas a EVALI é uma lesão pulmonar que pode exigir internação.</p>`},
     {t:'Algo que só acontece com quem fuma cigarro comum.',why:`<p>O "E" de EVALI vem de <i>e-cigarette</i>, cigarro eletrônico em inglês. Ela está ligada justamente ao vape.</p>`}],
    explain:`<h3>🔓 Raio-X decifrado!</h3><p><b>EVALI</b> é a lesão pulmonar associada ao uso de cigarro eletrônico. Já houve surtos com muitos jovens internados, alguns em estado grave. Por isso "é só vapor" é um mito perigoso.</p>`})
  ],
  end:{title:'CLANK! Saída do Raio-X liberada!',html:`<p>Resumo da Fase 3: o vape afeta <b>pulmões, coração, cérebro e boca</b>. Sinais como falta de ar e dor no peito pedem atendimento, e falar a verdade com profissionais de saúde ajuda no cuidado.</p>`,
   reflect:{q:'Se você tivesse uma dúvida sobre saúde, com quem falaria primeiro?',chips:['👨‍👩‍👧 Família','🏫 Professor(a)','🏥 Profissional de saúde','👯 Amigo(a)'],after:'Ter alguém de confiança para conversar é uma proteção enorme.'},next:'📺 Ir para o pátio'}},

 {scene:'patio',label:'FASE 4 · PÁTIO',title:'O TELÃO',sub:'Redes e desinformação',
  steps:[
   ()=>hunt({tag:'Fase 4 · Cadeado 1 de 3',title:'🎣 Caça às iscas',
    intro:`<p>O telão do pátio repete o post que atrai novos detentos. <b>Toque nas 5 iscas</b> escondidas no texto.</p>`,
    post:`<span class="seg" data-k="a">Novo sabor melancia gelo 🍉🧊</span> <span class="seg" data-k="b">todo mundo da galera já tá usando,</span> <span class="seg" data-k="c">nem tem cheiro e é tão leve 😍</span> <span class="seg" data-k="d">#aesthetic #vibe</span>
      <div class="ps"><span class="seg" data-k="e">❤️ 48,2 mil</span><span class="seg" data-k="x">Postado há 2 h</span><span class="seg" data-k="y">Ver tradução</span></div>`,
    baits:{a:'<b>Sabor doce</b>: dá cara de bala e atrai quem nunca fumou.',b:'<b>Falso "todo mundo usa"</b>: na real, a maioria dos adolescentes não usa.',c:'<b>Minimiza o risco</b>: cheiro e "leveza" não dizem nada sobre o que vai pro pulmão.',d:'<b>Estética</b>: vende estilo, não informação.',e:'<b>Prova social</b>: curtida mede alcance, não segurança.'},
    explain:`<h3>🔓 Iscas desarmadas!</h3><p>E a maior isca é o que <b>não está</b> no post: nada sobre nicotina ou dependência. Pergunta-chave: <b>quem ganha se eu acreditar nisso?</b></p>`}),
   ()=>choice({title:'🕶️ O contrabandista',
    story:`<div class="npc"><div class="face">🕶️</div><div class="say"><small>Detento "Fumaça"</small>Psiu. Tenho um pod importado, <b>zero nicotina</b>, "saudável". Te passo baratinho, só pra relaxar antes da fuga.</div></div>`,
    q:'O que você faz?',
    opts:[
     {t:'💸 Comprar. Se é zero nicotina, qual o problema?',good:false,f:-15,d:20,pts:-50,log:'Comprou o pod "zero nicotina" do contrabandista',fx:()=>pendingExtra.push('pirata'),
      r:`<h3>⛓️ Garganta ardendo</h3><p>No primeiro trago, a garganta arde e a cabeça gira. Esse "zero nicotina" não parece nada zero… <b>De onde veio esse pod?</b></p><p class="muted">⚠️ Essa escolha vai abrir uma fase extra.</p>`},
     {t:'🧐 "Zero nicotina segundo quem? Tem registro?"',good:true,pts:50,log:'Questionou a origem do pod e recusou',
      r:`<h3>🕵️ Pergunta certeira</h3><p>O Fumaça desconversa e some. No Brasil, a venda de cigarros eletrônicos é <b>proibida pela Anvisa</b>: não existe pod "com registro", e ninguém garante o que tem dentro.</p>`},
     {t:'🙅 "Passo. Quero sair daqui inteiro."',good:true,pts:50,log:'Recusou o pod do contrabandista',
      r:`<h3>💪 Decisão firme</h3><p>Sem discussão, sem sermão. Um "não" curto já resolve.</p>`}]}),
   ()=>scanner({tag:'Fase 4 · Cadeado 2 de 3',title:'🔎 Por que tantos experimentam?',
    intro:`<p>O telão exibe uma pesquisa: <i>"Por que adolescentes experimentam vape?"</i> Marque os <b>fatores reais</b> de influência.</p>`,
    q:'Quais fatores influenciam de verdade?',
    items:[
     {t:'🤔 Curiosidade',ok:true},{t:'🍬 Sabores e aparência bonita',ok:true},
     {t:'👥 Influência e pressão dos amigos',ok:true},{t:'📱 Propaganda e influenciadores',ok:true},
     {t:'🩺 Recomendação de médicos',why:'Médicos não recomendam vape para adolescentes.'},{t:'🙈 A ideia de que é inofensivo',ok:true},
     {t:'💪 Porque melhora o desempenho no esporte',why:'Vape piora o fôlego. Isso é mito.'},{t:'😟 Estresse e ansiedade',ok:true}],
    explain:`<h3>🔓 Fatores mapeados!</h3><p><b>Curiosidade, sabores, amigos, propaganda, a falsa ideia de que é inofensivo e o estresse</b> estão entre os principais motivos. Saber disso ajuda a perceber quando alguém está tentando te influenciar.</p>`}),
   ()=>mcq({tag:'Fase 4 · Cadeado 3 de 3',title:'🕵️ Checagem de fake',
    intro:`<p>Nos comentários do post, alguém escreveu:</p><div class="post"><div class="comment" data-say="O Léo comentou: li que vape é noventa e cinco por cento mais seguro que cigarro, então pra gente tá liberado."><b>@leo_zz</b> li que vape é 95% mais seguro que cigarro, então pra gente tá liberado 🤙</div></div>`,
    q:'Como desmontar esse argumento?',
    opts:[
     {t:'Se tem número e porcentagem, deve ser verdade.',why:`<p>Número sem contexto é uma tática clássica de desinformação. Sempre pergunte: <b>comparado com o quê? Para quem? Quem disse?</b></p>`},
     {t:'Essa comparação é com o cigarro, para adultos que já fumam. Para quem não fuma, "menos pior" não é seguro: é começar uma dependência do zero.',ok:true},
     {t:'Então vape é seguro para qualquer pessoa.',why:`<p>"Menos danoso que cigarro" não quer dizer "seguro". Pular da janela do 2º andar é menos pior que do 10º, e nem por isso é boa ideia.</p>`},
     {t:'Só faz mal se usar muito. Pouco não tem problema.',why:`<p>A dependência de nicotina pode começar com uso ocasional, principalmente no cérebro adolescente. "Só um pouco" é como o ciclo começa.</p>`}],
    explain:`<h3>🔓 Fake desmontada!</h3><p>Desinformação adora <b>meia-verdade fora de contexto</b>. Antes de acreditar, cheque três coisas: <b>quem disse</b>, <b>comparado com o quê</b> e <b>para quem</b>.</p>`})
  ],
  end:{title:'CLANK! Telão desligado!',html:`<p>Resumo da Fase 4: sabores, estética, influenciadores e "todo mundo usa" são <b>iscas</b>. Meia-verdade fora de contexto é <b>desinformação</b>. E o vape é proibido no Brasil: ninguém garante o que tem dentro.</p>`,
   reflect:{q:'Você já viu vape aparecendo em vídeo ou post?',chips:['Toda hora','Às vezes','Quase nunca'],after:'Agora você sabe identificar as iscas. 🎣'},next:'🚪 Correr até o portão'}},

 {scene:'portao',label:'FASE 5 · PORTÃO FINAL',title:'O PORTÃO',sub:'Autonomia',
  steps:[
   ()=>craving(),
   ()=>race(),
   ()=>chat({tag:'Fase 5 · Cadeado 1 de 3',title:'👥 A lembrança',
    intro:`<div class="story">O primeiro cadeado do portão mostra uma <b>lembrança</b>: o dia em que tudo começou, na saída da escola. Para abrir, <b>escolha diferente desta vez</b>.</div>`,
    rounds:[
     {msgs:[['Lucas','Dá um trago aí, é sabor melancia 🍉'],['Bia','Relaxa, todo mundo aqui usa'],['Lucas','Vai ficar de fora? 😏']],
      q:'O que você responde?',
      opts:[
       {t:'"Tá bom, só um pra não ficar chato."',why:`<p>Dá para entender: ninguém quer ficar de fora. Só que fazer algo "pra não ficar chato" é deixar a decisão com o grupo. E o "só um" é exatamente como o ciclo do cofre começa.</p>`},
       {t:'"Valeu, mas tô de boa. Bora pegar um açaí?"',ok:true},
       {t:'"Vocês são burros de usar isso."',why:`<p>Seu "não" está certo, mas atacar a galera costuma gerar briga e mais pressão. Dá para recusar <b>sem humilhar ninguém</b>.</p>`},
       {t:'Inventar uma desculpa e sair correndo sem falar nada.',why:`<p>Sair é válido quando você se sente desconfortável. Mas um "não" curto e firme mostra que a escolha é <b>sua</b>, e costuma encerrar o assunto mais rápido.</p>`}]},
     {msgs:[['Lucas','Ah, para… só unzinho, ninguém vai saber 🤫'],['Bia','Kkkk deixa de ser careta']],
      q:'Eles insistiram. E agora?',
      opts:[
       {t:'"Tá, se ninguém vai saber, beleza."',why:`<p>"Ninguém vai saber"… mas o seu cérebro vai: o ciclo da dopamina não liga se foi escondido. Insistência só funciona quando a gente cede.</p>`},
       {t:'Fazer uma palestra de 10 minutos sobre acroleína e metais.',why:`<p>A informação está certa! Mas sermão na hora da pressão costuma virar zoação. Guarde para uma conversa a sós, se o amigo quiser.</p>`},
       {t:'"Já falei, tô de boa 😄 E aí, o açaí vai ou não?"',ok:true},
       {t:'"Se continuarem, nunca mais falo com vocês."',why:`<p>Ultimato aumenta a tensão. Você pode simplesmente repetir o "não" e, se o lugar não respeitar, se afastar com calma.</p>`}]}
    ],
    explain:`<h3>🔓 Técnica do disco riscado!</h3><p>Repetir o "não" com calma, sem se justificar, e <b>mudar de assunto</b>. Você recusa o pod, não as pessoas.</p>`}),
   ()=>mcq({tag:'Fase 5 · Cadeado 2 de 3',title:'🤝 A amiga pede ajuda',
    intro:`<div class="npc"><div class="face">👧</div><div class="say"><small>Bia, mais tarde, em particular</small>Na real… eu queria parar e não consigo. Fico irritada sem. Não sei o que fazer.</div></div>`,
    q:'Qual a melhor forma de ajudar?',
    opts:[
     {t:'"Ué, é só parar. Frescura."',why:`<p>Dependência de nicotina é real. Ela muda o cérebro, e "é só parar" faz a pessoa se sentir julgada e desistir de pedir ajuda.</p>`},
     {t:'"Que bom que você me contou. Bora procurar ajuda juntas? Pode ser alguém da família, da escola ou a UBS. Eu vou com você."',ok:true},
     {t:'Postar no grupo da turma pra todo mundo ajudar.',why:`<p>Expor a Bia quebra a confiança que ela teve em você. Ajuda boa é com cuidado e privacidade.</p>`},
     {t:'"Se você não parar, não sou mais sua amiga."',why:`<p>Ameaça e culpa afastam. O que ajuda de verdade é acolher sem julgar e caminhar junto.</p>`}],
    explain:`<h3>🔓 Acolhimento sem julgamento!</h3><p>Escutar, não julgar e ajudar a buscar apoio. O <b>SUS oferece tratamento gratuito</b> para parar de usar nicotina, nas UBS, e o <b>Disque Saúde 136</b> orienta. Ninguém precisa sair dessa sozinho.</p>`}),
   ()=>varal({tag:'Fase 5 · Último cadeado',title:'📌 O Varal da Conscientização',
    intro:`<p>O último cadeado não pede resposta certa: pede a <b>sua voz</b>. Escreva uma mensagem curta para outros jovens, sobre o que você aprendeu ou como evitar o vape. Ela vai para o seu certificado.</p>`,
    ideas:['Vape não é vapor, é aerossol 🌫️','Meu "não" é minha escolha 💪','Seu pulmão não é descartável 💚','Pedir ajuda é coragem 🤝'],
    explain:`<h3>🔓 Mensagem pendurada!</h3><p>Leve essa mensagem também para o <b>Varal da Conscientização</b> da turma. O portão está abrindo…</p>`})
  ],
  end:{title:'CLANK! O PORTÃO ABRIU!',html:`<p>Resumo da Fase 5: autonomia é dizer "não" sem precisar se justificar, <b>acolher quem quer parar</b> e saber onde buscar ajuda.</p>`,
   reflect:{q:'Qual dessas frases combina mais com você?',chips:['"Não curto, valeu"','"Tô de boa"','"Prefiro não"','Tenho a minha'],after:'Ter a frase pronta antes do convite faz toda a diferença.'},next:'🌅 Sair da prisão'}}
];

function runStep(){firstTry=true;drawProg();PH[ph].steps[st]()}
function startPhase(i){
  ph=i;st=0;lockIdx=0;const P=PH[i];
  transition(`FASE ${i+1} DE ${PH.length}`,P.title,P.sub,()=>{renderScene(P.scene,P.label,3,P.clank||'CLANK! 🔓');runStep();say(N.phase[i])});
}
function restoreScene(){
  const P=PH[ph];renderScene(P.scene,P.label,3,P.clank||'CLANK! 🔓');
  for(let i=0;i<lockIdx;i++){const l=document.querySelectorAll('#sc .plocks span')[i];if(l){l.textContent='🔓';l.classList.add('ok')}}
}
function goNext(){
  if(pendingExtra.length){
    const xk=pendingExtra.shift(),X=EXTRA[xk];
    transition('⚠️ FASE EXTRA · CONSEQUÊNCIA',X.title,X.sub,()=>{renderScene(X.scene,X.label,0,'');X.run(goNext);say(N.extra[xk])},true);
    return;
  }
  if(ph<PH.length-1)startPhase(ph+1);else final();
}
function phaseEnd(){
  const P=PH[ph],sc=$('#sc');
  window.scrollTo({top:0,behavior:'smooth'});
  say(pick(N.gate));setTimeout(()=>{sc.classList.add('open');sfx.clank();flash('white');sparks()},300);
  setBody(`<div class="tag">✅ Fase ${ph+1} de ${PH.length} concluída</div><h2>${P.end.title}</h2>${P.end.html}${reflect(P.end.reflect)}
    ${pendingExtra.length?`<div class="conseq bad"><p>⚠️ Uma escolha sua abriu uma <b>fase extra</b> antes da próxima fase.</p></div>`:''}
    <button class="btn go" id="np">${pendingExtra.length?'⚠️ Enfrentar a consequência':P.end.next} →</button>`);
  bindReflect();
  $('#np').onclick=()=>{sfx.click();goNext()};
}


/* ================= SERVIDOR PRÓPRIO (Render) ================= */
const SERVER={on:false};
let DEVICE_ID='';
function deviceId(){
  if(DEVICE_ID)return DEVICE_ID;
  try{DEVICE_ID=localStorage.getItem('fugaDispositivo')||''}catch(e){}
  if(!/^[A-Za-z0-9_-]{8,64}$/.test(DEVICE_ID)){
    const a=new Uint8Array(12);try{crypto.getRandomValues(a)}catch(e){for(let i=0;i<12;i++)a[i]=Math.random()*256}
    DEVICE_ID='d'+[...a].map(x=>x.toString(16).padStart(2,'0')).join('');
    try{localStorage.setItem('fugaDispositivo',DEVICE_ID)}catch(e){}
  }
  return DEVICE_ID;
}
function plataforma(){
  const ua=navigator.userAgent||'';
  if(/iPad|Tablet/i.test(ua)||(/Android/i.test(ua)&&!/Mobile/i.test(ua)))return 'tablet';
  if((navigator.userAgentData&&navigator.userAgentData.mobile)||/Mobi|Android|iPhone/i.test(ua))return 'celular';
  return 'computador';
}
async function api(path,body,ms=8000){
  const ctl=new AbortController();const t=setTimeout(()=>ctl.abort(),ms);
  try{
    const r=await fetch(path,body?{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body),signal:ctl.signal}:{signal:ctl.signal,cache:'no-store'});
    const j=await r.json().catch(()=>null);
    if(!r.ok||!j||!j.ok)throw new Error((j&&j.erro)||('erro '+r.status));
    return j;
  }finally{clearTimeout(t)}
}
function pingDispositivo(){if(SERVER.on&&document.visibilityState!=='hidden')api('/api/dispositivo',{id:deviceId(),plataforma:plataforma()}).catch(()=>{})}
function initServer(){
  if(window.top!==window||!/^https?:$/.test(location.protocol))return;
  if(document.documentElement.dataset.servidor!=='nuvem-doce')return;   /* só quando o jogo vem do nosso servidor */
  api('/api/saude',null,5000).then(j=>{
    if(j.servidor!=='nuvem-doce')return;
    SERVER.on=true;pingDispositivo();
    setInterval(pingDispositivo,60000);
    document.addEventListener('visibilitychange',pingDispositivo);
  }).catch(()=>{});
}
async function loadServerRanking(){
  try{
    const j=await api('/api/ranking?limite=20');
    return (j.ranking||[]).map(r=>{const e=cleanEntry({nick:r.apelido,score:r.pontos,stars:r.estrelas,time:r.tempo,ending:r.final,av:r.avatar});if(e)e.id='s'+r.id;return e}).filter(Boolean);
  }catch(e){return null}
}
function enviarVaral(msg){
  if(SERVER.on)api('/api/varal',{dispositivo:deviceId(),apelido:CH.name,mensagem:msg}).catch(()=>{});
  else if(DB){try{DB.collection('varal').add({nick:String(CH.name).slice(0,16),msg:String(msg).slice(0,120),at:Date.now()}).catch(()=>{})}catch(e){}}
}

/* ================= RANKING ================= */
const LKEY='fugaNuvemDoceRanking';
let DB=null,dbTries=0;
function initDB(){
  try{
    if(window.claude&&typeof window.claude.use==='function'){window.claude.use('db').then(d=>{DB=d||null}).catch(()=>{DB=null});return}
  }catch(e){}
  if(++dbTries<12)setTimeout(initDB,700);
}
function localList(){try{const a=JSON.parse(localStorage.getItem(LKEY)||'[]');return Array.isArray(a)?a:[]}catch(e){return []}}
function saveLocal(e){try{const a=localList();a.push(e);a.sort((x,y)=>y.score-x.score);localStorage.setItem(LKEY,JSON.stringify(a.slice(0,30)))}catch(err){}}
function cleanEntry(raw){
  if(!raw||typeof raw!=='object')return null;
  const score=Math.round(Number(raw.score));if(!Number.isFinite(score))return null;
  return {nick:String(raw.nick||'Detento').slice(0,16),score,stars:clamp(Math.round(Number(raw.stars))||1,1,3),
    time:String(raw.time||'').slice(0,6),ending:['livre','cicatriz','corrente'].includes(raw.ending)?raw.ending:'livre',
    av:cleanChar(raw.av),at:Number(raw.at)||0,id:raw.id?String(raw.id).slice(0,40):''};
}
const ENDICON={livre:'🌅',cicatriz:'🩹',corrente:'⛓️'};
function rowsHTML(list,myId){
  if(!list.length)return `<div class="empty">Ninguém escapou ainda. Seja o primeiro! 🏃</div>`;
  return list.map((e,i)=>`<div class="rr ${e.id&&e.id===myId?'me':''}" style="animation-delay:${i*.04}s">
    <div class="pos">${['🥇','🥈','🥉'][i]||(i+1)}</div>
    <div class="av">${avatarSVG(e.av)}</div>
    <div class="who"><b>${esc(e.nick)}</b><small>${ENDICON[e.ending]} ${'⭐'.repeat(e.stars)} · ${esc(e.time)}</small></div>
    <div class="sc2">${e.score}</div></div>`).join('');
}
async function loadGlobal(){
  if(!DB)return null;
  try{
    const snap=await Promise.race([DB.collection('scores').orderBy('score','desc').limit(20).get(),new Promise((_,r)=>setTimeout(()=>r('timeout'),10000))]);
    return snap.docs.map(d=>{const e=cleanEntry(d.data());if(e)e.id=d.id;return e}).filter(Boolean);
  }catch(e){return null}
}
function rankingView(container,myId,startTab){
  container.innerHTML=`<div class="tabs"><button data-t="g">🌎 Geral</button><button data-t="l">📱 Neste aparelho</button></div><div class="rk" id="rk"></div><p class="muted" id="rknote" style="margin-top:10px"></p>`;
  const show=async t=>{
    container.querySelectorAll('.tabs button').forEach(b=>b.classList.toggle('on',b.dataset.t===t));
    const rk=$('#rk'),note=$('#rknote');
    if(t==='l'){rk.innerHTML=rowsHTML(localList().map(cleanEntry).filter(Boolean).slice(0,20),myId);note.textContent='Partidas jogadas neste celular ou computador.';return}
    if(!DB&&!SERVER.on){rk.innerHTML=`<div class="empty">O ranking geral não está disponível nesta tela.<br>Ele funciona no site do jogo (Render) ou no claude.ai com permissão de participante.<br>Veja o ranking <b>deste aparelho</b> 👆</div>`;note.textContent='';return}
    rk.innerHTML=`<div class="empty">Carregando ranking… ⏳</div>`;note.textContent='';
    const g=SERVER.on?await loadServerRanking():await loadGlobal();
    if(g===null){rk.innerHTML=`<div class="empty">Não deu para carregar o ranking geral agora. Tente de novo em instantes ou veja o ranking deste aparelho.</div>`;return}
    rk.innerHTML=rowsHTML(g,myId);note.textContent='Top 20 de todos os jogadores.';
  };
  container.querySelectorAll('.tabs button').forEach(b=>b.onclick=()=>{sfx.click();show(b.dataset.t)});
  show(startTab||(DB||SERVER.on?'g':'l'));
}
function rankingScreen(){
  renderPlain(`<div class="tag">🏆 Hall da Fuga</div><h1>Ranking</h1><p class="muted">🌅 Livre · 🩹 Livre com cicatriz · ⛓️ Saiu com a corrente</p><div id="rkv"></div><button class="btn ghost" id="back">← Voltar</button>`);
  rankingView($('#rkv'),null);
  $('#back').onclick=()=>{sfx.click();titleScreen()};
}

/* ================= TELA TÍTULO ================= */
function titleScreen(){
  $('#status').classList.add('hidden');
  renderScene('cela','BLOCO N · CELA 17 · 03:14',0);
  setBody(`<div class="titlecard"><div class="badge">🚨 ESCAPE ROOM · PREVENÇÃO AO VAPE</div>
    <h1>Fuga da Prisão<br>Nuvem Doce</h1>
    <p class="muted">Crie seu detento, atravesse 5 fases e cuidado com as escolhas: as ruins abrem fases extras de consequência.</p>
    <div class="hello"><div class="b">${BRISA}</div><div class="t">Com a narração da <b>Brisa</b>, o espírito do ar limpo. Ligue o som! 🔊 O botão 🎙️ liga e desliga a narração.<span class="novoice-note"> Neste aparelho a Brisa aparece só em legenda: para ouvir a voz dela, abra no Chrome ou no Edge do computador, pelo claude.ai.</span></div></div>
    <button class="btn" id="new">🎮 Novo jogo</button>
    <button class="btn ghost" id="voz">🎙️ Voz da Brisa e velocidade</button>
    <button class="btn ghost" id="rank">🏆 Ver ranking</button></div>`);
  $('#new').onclick=()=>{sfx.click();creator()};
  $('#voz').onclick=()=>{sfx.click();voicePanel()};
  $('#rank').onclick=()=>{sfx.click();rankingScreen()};
}

/* ================= CRIAÇÃO DE PERSONAGEM ================= */
function creator(){
  renderPlain(`<div class="creator">
    <div class="tag">📋 Ficha de entrada</div><h2>Crie seu detento</h2>
    <div class="preview"><div id="pv"></div><div class="mug" id="mug"></div></div>
    <div class="row"><div class="lbl">Nome ou apelido</div><input id="nm" maxlength="14" placeholder="Ex.: Ju, Pedrão, Kai…" autocomplete="off"></div>
    <div class="row"><div class="lbl">Pele</div><div class="sw" id="r-s">${SKINS.map((c,i)=>`<button data-v="${i}" style="background:${c}" aria-label="Tom ${i+1}"></button>`).join('')}</div></div>
    <div class="row"><div class="lbl">Cabelo</div><div class="sw tx" id="r-h">${HAIRS.map((n,i)=>`<button data-v="${i}">${n}</button>`).join('')}</div></div>
    <div class="row"><div class="lbl">Cor do cabelo</div><div class="sw" id="r-hc">${HAIRC.map((c,i)=>`<button data-v="${i}" style="background:${c}" aria-label="Cor ${i+1}"></button>`).join('')}</div></div>
    <div class="row"><div class="lbl">Uniforme</div><div class="sw" id="r-u">${SUITS.map((c,i)=>`<button data-v="${i}" style="background:${c[0]}" aria-label="Uniforme ${i+1}"></button>`).join('')}</div></div>
    <div class="row"><div class="lbl">Acessório</div><div class="sw tx" id="r-a">${ACCS.map((n,i)=>`<button data-v="${i}">${n}</button>`).join('')}</div></div>
    <div class="row"><div class="lbl">Talento</div><div class="perks" id="r-p">${PERKS.map((p,i)=>`<button class="perkc" data-v="${i}"><span class="pi">${p.i}</span><span><b>${p.n}</b><small>${p.d}</small></span></button>`).join('')}</div></div>
    <button class="btn" id="ok">✅ Confirmar ficha</button>
    <button class="btn ghost" id="back">← Voltar</button></div>`);
  const nm=$('#nm');nm.value=CH.name;
  const upd=()=>{
    $('#pv').innerHTML=avatarSVG(CH);
    $('#mug').innerHTML=`DETENTO Nº <b>017</b><br>NOME <b>${esc(nm.value.trim()||'???')}</b><br>TALENTO <b>${PERKS[CH.p].i} ${PERKS[CH.p].n}</b><br>CARCEREIRO <b>Nico</b>`;
    [['s','r-s'],['h','r-h'],['hc','r-hc'],['u','r-u'],['a','r-a'],['p','r-p']].forEach(([k,id])=>document.querySelectorAll('#'+id+' button').forEach(b=>b.classList.toggle('on',+b.dataset.v===CH[k])));
  };
  [['s','r-s'],['h','r-h'],['hc','r-hc'],['u','r-u'],['a','r-a'],['p','r-p']].forEach(([k,id])=>document.querySelectorAll('#'+id+' button').forEach(b=>b.onclick=()=>{sfx.tick();CH[k]=+b.dataset.v;upd()}));
  nm.oninput=upd;upd();say(N.creator);
  $('#ok').onclick=()=>{CH.name=(nm.value.trim()||'Detento 17').slice(0,14);sfx.ok();intro()};
  $('#back').onclick=()=>{sfx.click();titleScreen()};
}

/* ================= ABERTURA ================= */
function resetRun(){
  errors=0;score=0;done=0;ph=0;st=0;lockIdx=0;ally=false;skipNext=false;choices=[];pendingExtra=[];VARAL='';
  FMAX=CH.p===0?120:100;F=FMAX;D=0;hints=CH.p===1?2:0;
  $('#score').textContent='⭐ 0';$('#timer').textContent='0:00';t0=null;clearInterval(tick);
}
function intro(){
  resetRun();drawProg();drawStatus();
  renderScene('cela','BLOCO N · CELA 17 · 03:14',0);
  setBody(`<div class="tag">🚨 Alerta de fuga · 5 fases · 15 cadeados · ~10 min</div>
    <h2 data-say="Ei, acorda!">${esc(CH.name)}, acorde.</h2>
    <div class="story">Você acorda numa cela fria. O ar tem cheiro de <b>melancia gelada</b>, e no colchão há um pod piscando. Na outra cama, um colega de cela te observa. O alto-falante chia:<br><br><i id="voice"></i></div>
    <p>Você não é culpado de nada: essa prisão foi <b>projetada</b> para prender. Atravesse as 5 fases (cela, cofre, raio-X, pátio e portão) e saia antes do amanhecer. Escolhas ruins abrem <b>fases extras</b>.</p>
    <div class="breakdown">
      <div><span>🫁 Fôlego</span><span>sua saúde respiratória</span></div>
      <div><span>⛓️ Dependência</span><span>quanto o Nico te prende</span></div>
      <div><span>⚠️ Escolhas</span><span>mudam a história e o final</span></div>
      <div><span>⭐ Pontos</span><span>vão para o ranking</span></div>
    </div>
    <p class="muted">Erro em pergunta é aprendizado (só toca o alarme). Escolha ruim tem <b>consequência</b>.</p>
    <button class="btn" id="go">🔦 Começar a fuga</button>`);
  {const vtxt=`Bem-vindo à Nuvem Doce. Aqui quem manda é o carcereiro Nico. Ninguém entra achando que vai ficar… mas fica.`;const stE=$('#body .story');stE.dataset.say=stE.innerText+' '+vtxt}
  setTimeout(()=>typeText($('#voice'),`"Bem-vindo à Nuvem Doce, ${CH.name}. Aqui quem manda é o carcereiro Nico. Ninguém entra achando que vai ficar… mas fica."`),400);
  $('#go').onclick=()=>{sfx.click();startTimer();startPhase(0)};
}

/* ================= FINAL ================= */
async function final(){
  clearInterval(tick);const time=fmt(Date.now()-t0);
  const ending=D>=50?'corrente':D>0?'cicatriz':'livre';
  let stars=errors<=2?3:errors<=5?2:1;if(ending==='corrente')stars=Math.max(1,stars-1);
  const bonusF=F,bonusD=100-D,total=score+bonusF+bonusD;
  const rank=['','Fugitivo Persistente','Fugitivo Esperto','Mestre da Fuga'][stars];
  const E={
    livre:{t:'Você está livre!',tag:'🌅 Final: Liberdade total',p:`Você saiu sem levar o Nico junto. Nenhuma dose, nenhuma corrente. <b>A melhor fuga é nunca entrar.</b>`},
    cicatriz:{t:'Livre… com cicatriz',tag:'🩹 Final: Livre com cicatriz',p:`Você escapou, mas experimentou no caminho. A boa notícia: quanto mais cedo a gente para, mais fácil é. Se a vontade voltar, você já conhece as saídas.`},
    corrente:{t:'Você saiu… mas o Nico veio junto',tag:'⛓️ Final: A corrente invisível',p:`Você atravessou o portão, mas a dependência não fica na prisão: <b>ela vai com você</b>. Olhe para trás na imagem. Sair dessa é possível, e ninguém precisa fazer isso sozinho: fale com um adulto de confiança ou procure a UBS. O SUS oferece apoio gratuito, e o Disque Saúde atende no <b>136</b>.</p><p class="muted">Jogue de novo e veja como a história muda com outras escolhas.`}
  }[ending];
  renderScene('saida',ending==='corrente'?'LADO DE FORA · ENTARDECER':'LADO DE FORA · AMANHECER',0,'',ending);
  if(ending==='corrente')sfx.dark();else{sfx.win();confetti();setTimeout(()=>fireworks(),400)}
  say(N.end[ending](CH.name));
  const entry={nick:CH.name,score:total,stars,time,ending,av:cleanChar(CH),at:Date.now()};
  const myLocalId='L'+entry.at;entry.id=myLocalId;saveLocal(entry);
  const local=localList();const pos=local.findIndex(e=>e.id===myLocalId)+1;
  setBody(`<div class="tag" style="text-align:center">${E.tag}</div>
    <h1 style="text-align:center">${E.t}</h1>
    <div class="stars">${[1,2,3].map(i=>`<span class="${i<=stars?'':'off'}">⭐</span>`).join('')}</div>
    <div class="rank">${rank}</div>
    <p style="text-align:center">${E.p}</p>
    <div class="cert" data-say="Seu certificado de fuga está pronto! Você pode baixar e guardar."><div class="ct">CERTIFICADO DE FUGA</div><p>Certificamos que</p><div class="cn" id="certname"></div>
      <p>escapou da Prisão Nuvem Doce depois de abrir <b>${done} cadeados</b> sobre os riscos do cigarro eletrônico.</p>
      ${VARAL?'<div class="msg" id="certmsg"></div>':''}
      <div class="meta">${new Date().toLocaleDateString('pt-BR')} · ${E.tag}</div>
      <div class="meta">Ação de educação em saúde · Enfermagem UniCerrado</div><div class="seal">🏅</div></div>
    <div class="certbtns" style="${window.top===window?'':'grid-template-columns:1fr'}"><button class="btn go" id="dlcert">⬇️ Baixar certificado</button>${window.top===window?'<button class="btn ghost" id="prcert">🖨️ Imprimir</button>':''}</div>
    <div class="breakdown" data-say="Confira a sua pontuação final.">
      <div><span>Cadeados e escolhas</span><span>${score}</span></div>
      <div><span>Bônus 🫁 fôlego final</span><span>+${bonusF}</span></div>
      <div><span>Bônus ⛓️ liberdade (100 − ${D})</span><span>+${bonusD}</span></div>
      <div class="tot"><span>TOTAL</span><span>${total}</span></div>
    </div>
    <div class="stat"><div><span>${time}</span><small>TEMPO</small></div><div><span>${errors}</span><small>ALARMES</small></div><div><span>#${pos}</span><small>NESTE APARELHO</small></div></div>
    <div data-noread><h2 style="margin-top:16px">📜 Suas escolhas</h2>
    <ul class="recap">${choices.map(c=>`<li>${c.good?'✅':'⚠️'} <b>${c.ph==='Extra'?'Fase extra':'Fase '+c.ph}:</b> ${c.txt}</li>`).join('')||'<li>Nenhuma escolha registrada.</li>'}</ul>
    <h2 style="margin-top:16px">🏆 Ranking</h2><div id="sub" class="muted"></div><div id="rkv"></div>
    <h2 style="margin-top:18px">🔑 As 4 chaves da liberdade</h2>
    <div class="pillars">
      <div class="pillar"><div class="i">🌫️</div><h4>Não é vapor</h4><p>É aerossol com nicotina, solventes aquecidos, compostos irritantes e metais.</p></div>
      <div class="pillar"><div class="i">🧠</div><h4>Cérebro em obra</h4><p>Até ~25 anos. A nicotina sequestra a dopamina e vicia rápido.</p></div>
      <div class="pillar"><div class="i">📱</div><h4>Filtro ligado</h4><p>Iscas, meias-verdades e "todo mundo usa" escondem riscos.</p></div>
      <div class="pillar"><div class="i">💪</div><h4>Autonomia</h4><p>Dizer "não" é escolha sua, e não falta de coragem.</p></div>
    </div>
    <h2>🛡️ Kit anti-prisão</h2>
    <ul class="tips">
      <li>🗣️ <b>Tenha sua frase pronta</b>: "Não, valeu" basta. Insistiram? Disco riscado.</li>
      <li>🔍 <b>Cheque antes de acreditar</b>: quem disse, comparado com o quê, para quem?</li>
      <li>🧘 <b>Fissura ou ansiedade?</b> Ela passa em minutos: respire fundo, beba água, se mexa, converse com alguém.</li>
      <li>🤝 <b>Pertencer sem pagar com a saúde</b>: esporte, arte, games, grupos com interesses em comum.</li>
      <li>🆘 <b>Alguém que você conhece está preso nessa?</b> Dá para sair. Fale com um adulto de confiança ou procure a UBS: o SUS oferece apoio gratuito para parar. Disque Saúde: <b>136</b>.</li>
    </ul>
    </div><button class="btn" id="again">↺ Jogar de novo com ${esc(CH.name)}</button>
    <button class="btn ghost" id="newc">👤 Criar outro detento</button>`);
  $('#certname').textContent=CH.name;
  const certInfo={name:CH.name,locks:done,endingTxt:E.tag.replace(/^\S+\s/,''),score:total,stars,msg:VARAL,date:new Date().toLocaleDateString('pt-BR')};
  $('#dlcert').onclick=()=>{sfx.click();saveCert(certInfo)};
  if($('#prcert'))$('#prcert').onclick=()=>{sfx.click();try{window.print()}catch(e){}};if(VARAL)$('#certmsg').textContent='"'+VARAL+'"';
  $('#again').onclick=()=>{sfx.click();intro()};
  $('#newc').onclick=()=>{sfx.click();CH={name:'',s:1,h:0,hc:0,u:0,a:0,p:0};creator()};
  const sub=$('#sub');
  let gid=null;
  if(SERVER.on){
    sub.textContent='Enviando sua pontuação para o ranking geral…';
    try{
      const j=await api('/api/pontuacao',{dispositivo:deviceId(),apelido:entry.nick,pontos:entry.score,estrelas:entry.stars,tempo:entry.time,final:entry.ending,avatar:entry.av});
      gid='s'+j.id;sub.textContent=`✅ Pontuação enviada! Você está em ${j.posicao}º lugar no ranking geral.`;
    }catch(e){sub.textContent='Não deu para enviar ao ranking geral agora. Sua partida ficou salva neste aparelho.'}
  }else if(DB){
    sub.textContent='Enviando sua pontuação para o ranking geral…';
    try{
      const doc={nick:entry.nick,score:entry.score,stars:entry.stars,time:entry.time,ending:entry.ending,av:entry.av,at:entry.at};
      const ref=await Promise.race([DB.collection('scores').add(doc),new Promise((_,r)=>setTimeout(()=>r('timeout'),10000))]);
      gid=ref.id;sub.textContent='✅ Pontuação enviada para o ranking geral.';
    }catch(e){sub.textContent='Não deu para enviar ao ranking geral (é preciso ter permissão de participante). Sua partida ficou salva neste aparelho.'}
  }else sub.textContent='Sua partida ficou salva no ranking deste aparelho.';
  rankingView($('#rkv'),gid||myLocalId,gid?'g':'l');
}

/* ================= EFEITOS VISUAIS ================= */
let combo=0;
function burst(el){
  const r=(el&&el.isConnected?el:$('#body')).getBoundingClientRect();
  const x=r.left+Math.min(r.width,300)/2,y=r.top+Math.min(r.height,80)/2;
  const ring=document.createElement('div');ring.className='ring';ring.style.left=x+'px';ring.style.top=y+'px';document.body.appendChild(ring);setTimeout(()=>ring.remove(),800);
  const icons=['⭐','✨','💚','⚡','✦'];
  for(let i=0;i<16;i++){
    const s=document.createElement('div');s.className='star';s.textContent=icons[i%icons.length];
    const a=Math.random()*Math.PI*2,d=60+Math.random()*90;
    s.style.left=x+'px';s.style.top=y+'px';s.style.setProperty('--dx',Math.cos(a)*d+'px');s.style.setProperty('--dy',Math.sin(a)*d+'px');s.style.setProperty('--r',(Math.random()*360-180)+'deg');
    document.body.appendChild(s);setTimeout(()=>s.remove(),1000);
  }
}
function showCombo(n){
  const d=document.createElement('div');d.className='combo';
  d.innerHTML=`<span class="fire">🔥</span><b>COMBO x${n}</b><small>+${(n-1)*20} PONTOS EXTRAS</small>`;
  document.body.appendChild(d);setTimeout(()=>d.remove(),1900);
  tone(880,.08,'square',.05);tone(1320,.12,'square',.05,.08);tone(1760,.18,'triangle',.06,.16);
}
function glitch(){const sc=$('#sc');if(!sc)return;sc.classList.remove('glitch');void sc.offsetWidth;sc.classList.add('glitch');setTimeout(()=>sc.classList.remove('glitch'),550)}
function dustHTML(){return `<div class="dust">${Array.from({length:14},()=>`<i style="left:${Math.random()*100}%;--sx:${Math.random()*40-20}px;animation-duration:${6+Math.random()*7}s;animation-delay:${-Math.random()*10}s;width:${2+Math.random()*3}px;height:${2+Math.random()*3}px"></i>`).join('')}</div>`}
function fireworks(ms=4500){
  const c=document.createElement('canvas');c.id='fw';document.body.appendChild(c);
  const dpr=Math.min(2,window.devicePixelRatio||1);c.width=innerWidth*dpr;c.height=innerHeight*dpr;
  const x=c.getContext('2d');x.scale(dpr,dpr);
  const P=[],cols=['#ff8a1f','#f5c518','#4ade80','#5ce1ff','#ff6fd8','#fff'];
  let t0=performance.now(),last=0;
  function boom(){
    const bx=40+Math.random()*(innerWidth-80),by=80+Math.random()*innerHeight*.4,col=cols[Math.floor(Math.random()*cols.length)];
    for(let i=0;i<46;i++){const a=Math.PI*2*i/46,v=1.5+Math.random()*3.2;P.push({x:bx,y:by,vx:Math.cos(a)*v,vy:Math.sin(a)*v,l:1,c:col})}
    tone(140+Math.random()*60,.25,'sawtooth',.04,0,60);
  }
  (function f(now){
    const el=now-t0;
    if(el<ms&&now-last>420){boom();last=now}
    x.clearRect(0,0,innerWidth,innerHeight);
    for(let i=P.length-1;i>=0;i--){const p=P[i];p.x+=p.vx;p.y+=p.vy;p.vy+=.045;p.vx*=.985;p.l-=.012;
      if(p.l<=0){P.splice(i,1);continue}
      x.globalAlpha=p.l;x.fillStyle=p.c;x.beginPath();x.arc(p.x,p.y,2.2,0,7);x.fill()}
    if(el<ms+2000)requestAnimationFrame(f);else c.remove();
  })(t0);
}
function toast(t){const d=document.createElement('div');d.className='toast';d.textContent=t;document.body.appendChild(d);setTimeout(()=>d.remove(),2800)}

/* ================= CERTIFICADO EM IMAGEM ================= */
function wrapText(ctx,text,x,y,maxW,lh){
  const words=text.split(' ');let line='',yy=y;
  words.forEach(w=>{const t=line?line+' '+w:w;if(ctx.measureText(t).width>maxW&&line){ctx.fillText(line,x,yy);line=w;yy+=lh}else line=t});
  if(line)ctx.fillText(line,x,yy);return yy;
}
function svgImg(inner,vb){
  return new Promise(res=>{const im=new Image();im.onload=()=>res(im);im.onerror=()=>res(null);
    im.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}">${inner}</svg>`)});
}
async function certPNG(info){
  try{await Promise.all([document.fonts.load('48px "Black Ops One"'),document.fonts.load('28px "Space Grotesk"')])}catch(e){}
  const W=1600,H=1130,c=document.createElement('canvas');c.width=W;c.height=H;const x=c.getContext('2d');
  const g=x.createLinearGradient(0,0,W,H);g.addColorStop(0,'#fffaf0');g.addColorStop(1,'#f1e3c0');x.fillStyle=g;x.fillRect(0,0,W,H);
  x.strokeStyle='#b48a3c';x.lineWidth=14;x.strokeRect(30,30,W-60,H-60);x.lineWidth=4;x.strokeRect(58,58,W-116,H-116);
  x.fillStyle='#e9d6a8';[[58,58],[W-58,58],[58,H-58],[W-58,H-58]].forEach(([a,b])=>{x.beginPath();x.arc(a,b,22,0,7);x.fill()});
  x.textAlign='center';x.fillStyle='#7a4b12';x.font='76px "Black Ops One", Impact, sans-serif';x.fillText('CERTIFICADO DE FUGA',W/2,190);
  x.fillStyle='#5b4a2a';x.font='30px "Space Grotesk", sans-serif';x.fillText('Prisão Nuvem Doce · Escape room de prevenção ao cigarro eletrônico',W/2,240);
  x.font='34px "Space Grotesk", sans-serif';x.fillStyle='#4a412d';x.fillText('Certificamos que',W/2,330);
  x.fillStyle='#1d1a12';x.font='96px "Black Ops One", Impact, sans-serif';x.fillText(info.name,W/2,440);
  x.strokeStyle='#b48a3c';x.lineWidth=3;x.beginPath();x.moveTo(W/2-360,470);x.lineTo(W/2+360,470);x.stroke();
  x.fillStyle='#4a412d';x.font='34px "Space Grotesk", sans-serif';
  let y=wrapText(x,`escapou da Prisão Nuvem Doce depois de abrir ${info.locks} cadeados sobre a composição do aerossol, a dependência de nicotina, os riscos à saúde, a desinformação e a pressão dos amigos.`,W/2,535,1040,48);
  x.fillStyle='#7a4b12';x.font='bold 32px "Space Grotesk", sans-serif';x.fillText(`${info.endingTxt}  ·  ${info.score} pontos  ·  ${'★'.repeat(info.stars)}${'☆'.repeat(3-info.stars)}`,W/2,y+70);
  if(info.msg){
    x.fillStyle='rgba(255,255,255,.65)';const bw=820,bx=(W-bw)/2,by=y+100;x.beginPath();x.roundRect?x.roundRect(bx,by,bw,80,18):x.rect(bx,by,bw,80);x.fill();
    x.fillStyle='#3d3422';x.font='italic 32px "Space Grotesk", sans-serif';wrapText(x,'“'+info.msg+'”',W/2,by+50,760,36);
  }
  const av=await svgImg(avatar(CH),'0 0 60 80');if(av)x.drawImage(av,120,640,240,320);
  const br=await svgImg(BRISA.replace(/<svg[^>]*>|<\/svg>/g,''),'0 0 80 70');if(br)x.drawImage(br,W-370,690,240,210);
  const sg=x.createRadialGradient(W/2,H-215,10,W/2,H-215,80);sg.addColorStop(0,'#f0c055');sg.addColorStop(1,'#a8701a');
  x.fillStyle=sg;x.beginPath();x.arc(W/2,H-215,78,0,7);x.fill();x.fillStyle='#7a4b12';x.beginPath();x.arc(W/2,H-215,62,0,7);x.lineWidth=4;x.strokeStyle='#fff3c4';x.stroke();
  x.fillStyle='#fff8dc';x.font='26px "Black Ops One", Impact, sans-serif';x.fillText('AR',W/2,H-220);x.fillText('LIVRE',W/2,H-190);
  x.fillStyle='#6b5d3d';x.font='24px "Space Grotesk", sans-serif';x.fillText(`${info.date}  ·  Ação de educação em saúde · Enfermagem UniCerrado`,W/2,H-92);
  return new Promise(r=>c.toBlob(b=>r(b),'image/png'));
}
async function saveCert(info){
  const blob=await certPNG(info);if(!blob){toast('Não deu para gerar a imagem.');return}
  const fname='certificado-nuvem-doce-'+(info.name.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^\w]+/g,'-').replace(/^-|-$/g,'').toLowerCase()||'detento')+'.png';
  let dl=null;
  try{if(window.claude&&typeof window.claude.use==='function')dl=await window.claude.use('downloads')}catch(e){}
  if(dl){
    try{await dl.save({filename:fname,data:blob});toast('✅ Certificado salvo!')}
    catch(e){if(e&&e.code==='declined')return;toast(e&&e.code==='host_unavailable'?'Abra o jogo num navegador para salvar o certificado.':'Não deu para salvar agora. Tente de novo.')}
    return;
  }
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=fname;document.body.appendChild(a);a.click();
  setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},1500);toast('✅ Certificado baixado!');
}

/* ================= NARRAÇÃO: BRISA (leitora de tela) ================= */
const N={
  creator:'Oiê! Eu sou a Brisa, o espírito do ar limpo. Vou ler tudinho pra você durante o jogo, tá bom? Agora, monta o seu personagem do seu jeito. Quando terminar, é só tocar em confirmar ficha.',
  phase:['Bora lá! Fase um… a cela.','Fase dois! O cofre do diretor.','Agora, fase três: a sala de raio-x.','Fase quatro, o pátio. Fica esperto, hein?','Chegou a hora… última fase: o portão!'],
  extra:{perseguicao:'Ih, deu ruim! O guarda sentiu o cheiro do vape. Corre!',emergencia:'Opa… você passou mal. Vamos pra enfermaria.',pirata:'Hmm… de onde veio esse pod? Vamos investigar.'},
  cheer:['Mandou bem!','Isso aí! Mais um cadeado aberto!','Arrasou!','Boa! Você tá voando!','Perfeito!','Olha só, que fera!'],
  oops:['Quase! Escuta a dica comigo.','Tudo bem errar, viu? Escuta a dica e tenta de novo.','Opa! Presta atenção nessa pista.'],
  good:['Boa escolha!','Isso! Você decidiu por você.','Gostei de ver!'],
  bad:['Hmm… essa escolha vai trazer consequência.','Eita… o Nico gostou dessa.'],
  raceOk:'Uhul! Chegou sem tossir!',raceBad:'Ai… a tosse te travou.',
  gate:['Grade aberta! Mandou muito bem nessa fase!','Clank! Mais uma fase vencida!'],
  end:{livre:n=>`Você está livre! Sem corrente nenhuma. Tô muito orgulhosa de você!`,
    cicatriz:n=>`Você saiu! Experimentou no caminho, mas aprendeu muito.`,
    corrente:n=>`Você atravessou o portão… mas o Nico veio junto. Pedir ajuda não é vergonha, tá? Dá pra sair dessa.`}
};
const pick=a=>a[Math.floor(Math.random()*a.length)];
const NARR={on:true,tts:null,hideT:null,buf:[],flushT:null,seq:0,ttsItems:[],lastMicro:0,ttsFail:0};
const LISTEN='<button class="listen" type="button">🔊 Ouvir</button>';
const BRISA=`<svg viewBox="0 0 80 70" aria-hidden="true">
  <path d="M6 20 q8 -6 16 0 M2 30 q6 -4 12 0" stroke="#9fe6ff" stroke-width="2.5" fill="none" stroke-linecap="round" class="wind"/>
  <g fill="#e6f8ff"><circle cx="26" cy="40" r="17"/><circle cx="43" cy="29" r="21"/><circle cx="59" cy="41" r="15"/><rect x="14" y="40" width="58" height="18" rx="9"/></g>
  <circle cx="35" cy="35" r="3.6" fill="#13303d"/><circle cx="51" cy="35" r="3.6" fill="#13303d"/><circle cx="36.2" cy="33.8" r="1.2" fill="#fff"/><circle cx="52.2" cy="33.8" r="1.2" fill="#fff"/>
  <circle cx="28" cy="43" r="3.6" fill="#ffb3c7" opacity=".75"/><circle cx="58" cy="43" r="3.6" fill="#ffb3c7" opacity=".75"/>
  <ellipse class="mouth" cx="43" cy="45" rx="4.2" ry="3" fill="#13303d"/></svg>`;

/* ---------- Preferências de voz ---------- */
const VKEY='fugaVoz';
let VPREF={engine:'claude',claudeVoice:'airy',webName:'',rate:1};
try{const s=JSON.parse(localStorage.getItem(VKEY)||'null');if(s&&typeof s==='object')VPREF.rate=Number(s.rate)<.95?.85:1}catch(e){}
function saveVPref(){try{localStorage.setItem(VKEY,JSON.stringify(VPREF))}catch(e){}}
/* Áudios gravados da Brisa (pasta audio/, usada no site próprio/Render) */
const AUDIO={map:null,ready:false,base:'audio/',cur:null,q:[],waitT:null};
function initAudio(){
  try{
    fetch(AUDIO.base+'manifest.json',{cache:'no-cache'}).then(r=>r.ok?r.json():null).then(m=>{
      if(m&&typeof m==='object'&&!Array.isArray(m)&&Object.keys(m).length)AUDIO.map=m;
    }).catch(()=>{}).finally(()=>{AUDIO.ready=true;updVoiceUI()});
  }catch(e){AUDIO.ready=true}
}
function engine(){
  if(NARR.tts)return 'claude';            /* voz da Brisa no claude.ai (mesmo se chegar atrasada) */
  if(AUDIO.map)return 'audio';            /* áudios gravados no site próprio */
  if(!NARR.ttsReady||!AUDIO.ready)return null;
  return 'none';
}
const voiceAvail=()=>!!NARR.tts||!!AUDIO.map;
function audioSpeak(items,append,seq){
  if(!append)audioStop();
  items.forEach(it=>AUDIO.q.push({...it,seq}));
  if(!AUDIO.cur&&!AUDIO.waitT)audioNext();
}
function audioStop(){AUDIO.q=[];clearTimeout(AUDIO.waitT);AUDIO.waitT=null;if(AUDIO.cur){try{AUDIO.cur.pause()}catch(e){}AUDIO.cur=null}}
function audioNext(){
  clearTimeout(AUDIO.waitT);AUDIO.waitT=null;
  let it=AUDIO.q.shift();
  while(it&&it.seq!==NARR.seq)it=AUDIO.q.shift();
  if(!it){talking(false);clearHL();scheduleHide(1500);return}
  hl(it.el);setBubble(it.raw);
  const f=AUDIO.map[it.text];
  if(!f||typeof f!=='string'||!/^[\w.-]+$/.test(f)){talking(false);AUDIO.waitT=setTimeout(audioNext,Math.min(4000,600+it.text.length*45));return}
  const a=new Audio(AUDIO.base+f);AUDIO.cur=a;
  try{a.playbackRate=VPREF.rate}catch(e){}
  a.onplaying=()=>{if(AUDIO.cur===a)talking(true)};
  const fim=()=>{if(AUDIO.cur===a){AUDIO.cur=null;audioNext()}};
  a.onended=fim;a.onerror=fim;
  const pr=a.play();if(pr&&pr.catch)pr.catch(()=>{if(AUDIO.cur===a){AUDIO.cur=null;talking(false);AUDIO.waitT=setTimeout(audioNext,400)}});
  const nx=AUDIO.q[0];if(nx&&AUDIO.map[nx.text]){const pre=new Audio();pre.preload='auto';pre.src=AUDIO.base+AUDIO.map[nx.text]}
}
function updVoiceUI(){document.body.classList.toggle('novoice',!voiceAvail())}

/* Voz natural do Claude */
function initTTS(tries=0){
  if(window.top===window&&!window.claude){NARR.ttsReady=true;return}
  try{
    if(window.claude&&typeof window.claude.use==='function'){
      window.claude.use('tts').then(t=>{
        NARR.ttsReady=true;
        if(!t)return;NARR.tts=t;updVoiceUI();
        try{t.setRate&&t.setRate(VPREF.rate)}catch(e){}
        try{
          t.onState(({state,reason})=>{
            if(engine()!=='claude')return;
            talking(state==='speaking'||state==='starting');
            if(state==='idle'){clearHL();scheduleHide(1500)}
            if(reason==='not_granted'||reason==='unavailable'){NARR.tts=null;updVoiceUI()}
          });
          t.onLine(({id})=>{const it=NARR.ttsItems[+id];if(it){hl(it.el);setBubble(it.raw)}});
        }catch(e){}
      }).catch(()=>{NARR.ttsReady=true});
      return;
    }
  }catch(e){}
  if(tries<30)setTimeout(()=>initTTS(tries+1),700);else NARR.ttsReady=true;
}

function talking(on){$('#narr').classList.toggle('talk',on);$('#nstop').classList.toggle('hidden',!on)}
function scheduleHide(ms){clearTimeout(NARR.hideT);NARR.hideT=setTimeout(()=>$('#narr').classList.remove('show'),ms)}
function setBubble(t){$('#narr').classList.add('show');clearTimeout(NARR.hideT);$('#ntext').textContent=t}
function clearHL(){document.querySelectorAll('.reading').forEach(x=>x.classList.remove('reading'))}
function hl(el){clearHL();if(el&&el.isConnected){el.classList.add('reading');const r=el.getBoundingClientRect();if(r.top<70||r.bottom>innerHeight-120)el.scrollIntoView({behavior:'smooth',block:'center'})}}
function cleanSpeech(t){return String(t).replace(/\p{Extended_Pictographic}|️|‍|[█▌·]/gu,' ').replace(/[“”"]/g,'').replace(/(^|[^\p{L}])([A-ZÀ-ÚÇ]{3,})(?=[^\p{L}]|$)/gu,(m,a,w)=>a+(['EVALI','SUS','UBS','RDC'].includes(w)?w:w.toLowerCase())).replace(/\s+/g,' ').trim()}

/* Fala uma lista de itens, em ordem. append=true continua depois do que já está falando */
function speakItems(items,append){
  items=items.map(i=>({raw:String(i.text).trim(),text:cleanSpeech(i.text),el:i.el})).filter(i=>i.text);
  if(!NARR.on||!items.length)return;
  const eng=engine();
  if(eng===null){const w=(NARR.waitN||0);if(w<15){NARR.waitN=w+1;setTimeout(()=>speakItems(items,append),250);return}NARR.waitN=0;setBubble(items[0].raw);scheduleHide(Math.max(3000,items[0].raw.length*60));return}
  if(!append){NARR.seq++;clearHL()}
  const seq=NARR.seq;
  setBubble(items[0].raw);
  if(eng==='claude'&&!NARR.tts){scheduleHide(Math.max(3000,items[0].raw.length*60));return}
  if(eng==='claude'){
    const base=append?NARR.ttsItems.length:0;if(!append)NARR.ttsItems=[];
    items.forEach(it=>NARR.ttsItems.push(it));
    const lines=items.slice(0,100).map((it,i)=>({text:it.text.slice(0,1900),id:String(base+i),voice:'airy',language:'pt-BR'}));
    const opts={voice:VPREF.claudeVoice,language:'pt-BR',rate:VPREF.rate};
    (append?NARR.tts.add(lines,opts):NARR.tts.speak(lines,opts)).then(()=>{NARR.ttsFail=0}).catch(e=>{
      const c=e&&e.code;
      if(c==='stopped')return;
      talking(false);scheduleHide(Math.max(3000,items[0].raw.length*60));
      if(c==='rate_limited'&&seq===NARR.seq&&!append){const ms=Math.min(5000,(e&&e.retryAfterMs)||2500);setTimeout(()=>{if(seq===NARR.seq&&NARR.tts)NARR.tts.add(lines,opts).catch(()=>{})},ms)}
    });
    return;
  }
  if(eng==='audio'){audioSpeak(items,append,seq);return}
  scheduleHide(Math.max(3000,items[0].raw.length*60));
}
function stopVoice(){
  NARR.seq++;NARR.buf=[];clearTimeout(NARR.flushT);
  audioStop();
  try{if(NARR.tts&&NARR.tts.active())NARR.tts.stop().catch(()=>{})}catch(e){}
  talking(false);clearHL();
}

/* ---------- Painel de voz ---------- */
function voicePanel(){
  const old=$('#vpanel');if(old)old.remove();
  const d=document.createElement('div');d.id='vpanel';d.className='vpanel';
  d.innerHTML=`<div class="vbox"><div class="tag">🎙️ Voz da narração</div><h2>A voz da Brisa</h2>
    <div class="hello" style="justify-content:flex-start"><div class="b">${BRISA}</div><div class="t">${NARR.tts||AUDIO.map?'Voz natural e tranquila da Brisa.':'Neste aparelho a voz da Brisa não está disponível, então a narração aparece só em legenda. Para ouvir a Brisa, abra o jogo no Chrome ou no Edge do computador, pelo claude.ai.'}</div></div>
    <div class="row"><div class="lbl">Velocidade</div><div class="sw tx" id="vrate">${[[1,'Normal'],[.85,'🐢 Devagar']].map(([r,n])=>`<button data-r="${r}" class="${Math.abs(VPREF.rate-r)<.01?'on':''}">${n}</button>`).join('')}</div></div>
    <button class="btn" id="vtest">▶️ Ouvir um teste</button><button class="btn ghost" id="vclose">Pronto</button></div>`;
  document.body.appendChild(d);
  const test=()=>{stopVoice();speakItems([{text:'Oiê! Eu sou a Brisa. É assim que eu vou ler o jogo pra você.'}],false)};
  d.querySelectorAll('#vrate button').forEach(b=>b.onclick=()=>{d.querySelectorAll('#vrate button').forEach(x=>x.classList.remove('on'));b.classList.add('on');VPREF.rate=+b.dataset.r;saveVPref();try{NARR.tts&&NARR.tts.setRate&&NARR.tts.setRate(VPREF.rate)}catch(e){}test()});
  $('#vtest').onclick=test;
  $('#vclose').onclick=()=>{stopVoice();d.remove()};
  d.onclick=e=>{if(e.target===d){stopVoice();d.remove()}};
}

/* Junta falas do mesmo instante: primeiro a fala da Brisa, depois a leitura da tela */
function queue(items,pri){items.forEach(i=>NARR.buf.push({...i,pri}));clearTimeout(NARR.flushT);NARR.flushT=setTimeout(()=>{const b=NARR.buf.sort((a,c)=>a.pri-c.pri).flatMap(i=>i.lazy?i.lazy():[i]);NARR.buf=[];speakItems(b,false)},90)}
function say(text){if(text)queue([{text}],0)}

/* Monta o roteiro de leitura de uma área da tela */
function itemsFrom(root){
  if(!root)return [];
  const sel='h2,h3,h4,.story,.npc .say,.qcard,.mvfront,.mvback,.post .pb,.comment,p,li,.opt,.ch,.door,.sc,.organs button,.effects button,.bait,.chip,.slot.filled,.breakdown,.cert';
  const all=[...root.querySelectorAll(sel)].filter(el=>!el.closest('[data-noread]')&&!el.closest('.listen')&&el.offsetParent!==null);
  const picked=all.filter(el=>!all.some(o=>o!==el&&o.contains(el)));
  let chN=0,optsAnnounced=false;const out=[];
  picked.forEach(el=>{
    let t=el.dataset.say||el.innerText||'';
    if(el.matches('.opt')&&el.querySelector('.k'))t='Opção '+el.querySelector('.k').textContent+': '+[...el.children].slice(1).map(x=>x.innerText).join(' ');
    else if(el.matches('.ch'))t='Opção '+(++chN)+': '+t;
    else if(el.matches('.door'))t='Porta '+t;
    else if(el.matches('.breakdown')&&!el.dataset.say)t=[...el.children].map(r=>[...r.children].map(c=>c.innerText.trim()).join(': ')).join('. ')+'.';
    else if(el.matches('.npc .say')){const s=el.querySelector('small');t=(s?s.innerText.split(',')[0]+' fala: ':'')+t.replace(s?s.innerText:'','')}
    else if(el.matches('.mvfront'))t=t.replace('DETENTO ANTIGO DIZ:','Um detento antigo diz:').replace(/[.\s"]+$/,'')+'. É mito ou verdade?';
    if(!optsAnnounced&&el.matches('.opt,.ch')&&root.querySelectorAll('.opt,.ch').length>1){optsAnnounced=true;out.push({text:'Escolha uma opção:'})}
    if(cleanSpeech(t).length>1)out.push({text:t,el});
  });
  return out;
}
function readScreen(){queue([{lazy:()=>itemsFrom($('#body'))}],1)}
function readEl(el,pri=1){queue(itemsFrom(el).length?itemsFrom(el):[{text:el.innerText,el}],pri)}
function readNow(items){const t=Date.now();if(t-NARR.lastMicro<2500)return;NARR.lastMicro=t;speakItems(items,false)}

document.addEventListener('click',e=>{
  const adv=e.target.closest&&e.target.closest('button,.seg');
  if(adv&&!adv.closest('.narr,.vpanel')&&!adv.matches('.relisten,.listen,#narrbtn,#mute,.chip'))stopVoice();
},true);
document.addEventListener('click',e=>{
  const b=e.target.closest&&e.target.closest('.listen,.relisten');if(!b)return;
  if(b.classList.contains('relisten')){stopVoice();readScreen();return}
  stopVoice();queue(itemsFrom(b.parentElement),1);
});
$('#nclose').onclick=()=>{stopVoice();$('#narr').classList.remove('show')};
$('#nstop').onclick=()=>{stopVoice()};
$('#nset').onclick=()=>{voicePanel()};
$('#narrbtn').onclick=e=>{
  NARR.on=!NARR.on;e.currentTarget.textContent=NARR.on?'🎙️':'🤫';e.currentTarget.classList.toggle('off',!NARR.on);
  document.body.classList.toggle('narroff',!NARR.on);
  if(!NARR.on){stopVoice();$('#narr').classList.remove('show')}else say('Voltei! Vou ler tudo pra você.');
};

/* Lê automaticamente respostas e consequências que aparecem na tela */
new MutationObserver(ms=>{const seen=new Set();ms.forEach(m=>m.addedNodes.forEach(nd=>{
  if(nd.nodeType!==1||!m.target||!['fb','mvb'].includes(m.target.id))return;
  const tgt=m.target.id==='mvb'?m.target:(nd.matches('.fb,.conseq')?nd:null);
  if(!tgt||seen.has(tgt))return;seen.add(tgt);queue([{lazy:()=>itemsFrom(tgt)}],1);
}))}).observe(document.getElementById('screen'),{childList:true,subtree:true});
$('#nbrisa').innerHTML=BRISA;
/* ================= INÍCIO ================= */
$('#mute').onclick=e=>{muted=!muted;e.currentTarget.textContent=muted?'🔇':'🔊'};
initDB();initServer();initTTS();initAudio();updVoiceUI();
drawProg();
titleScreen();
