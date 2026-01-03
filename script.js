const VALUES=["1","2","3","4","5","6","7","F","C","R"];
const SUITS=["coppe","denari","bastoni","spade"];

let deck=[], pot=0;
let player={hand:[],credits:1000};
let cpu={hand:[],credits:1000};

function shuffle(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}

function buildDeck(){
 let d=[];
 SUITS.forEach(s=>VALUES.forEach(v=>d.push({v,s})));
 return shuffle(d);
}

function deal(){
 deck=buildDeck();
 player.hand=deck.splice(0,5);
 cpu.hand=deck.splice(0,5);
 render();
 log('Nuova mano');
}

function render(){
 const ph=document.getElementById('player-hand');
 const ch=document.getElementById('cpu-hand');
 ph.innerHTML=''; ch.innerHTML='';
 player.hand.forEach(c=>{
  const img=document.createElement('img');
  img.src=`cards/${c.v}_${c.s}.jpg`;
  img.onclick=()=>img.classList.toggle('sel');
  ph.appendChild(img);
 });
 cpu.hand.forEach(()=>{
  const img=document.createElement('img');
  img.src='cards/back.jpg';
  ch.appendChild(img);
 });
 document.getElementById('pot').innerText='Piatto: '+pot;
}

function handStrength(hand){
 let counts={},vals=[];
 hand.forEach(c=>{counts[c.v]=(counts[c.v]||0)+1;vals.push(VALUES.indexOf(c.v));});
 let pair=false,tris=false;
 for(let v in counts){if(counts[v]==3)tris=true;if(counts[v]==2)pair=true;}
 if(tris) return 3;
 if(pair) return 2;
 return 1;
}

function cpuTurn(){
 const s=handStrength(cpu.hand);
 let bet = s>=2 ? 100 : 20;
 bet=Math.min(bet,cpu.credits);
 cpu.credits-=bet; pot+=bet;
 log('CPU punta '+bet);
}

function playerAction(type){
 if(type==='allin'){
  pot+=player.credits; log('All‑in '+player.credits); player.credits=0;
 }else if(type==='call'){
  pot+=50; player.credits-=50; log('Call 50');
 }else log('Check');
 cpuTurn(); render();
}

function changeCards(){
 const imgs=[...document.querySelectorAll('#player-hand img.sel')];
 imgs.forEach(img=>{
  const i=[...img.parentNode.children].indexOf(img);
  player.hand[i]=deck.pop();
 });
 render(); log('Carte cambiate');
}

function showdown(){
 const ps=handStrength(player.hand);
 const cs=handStrength(cpu.hand);
 if(ps>=cs){player.credits+=pot;log('VINCI')}
 else{cpu.credits+=pot;log('CPU vince')}
 pot=0; deal();
}

function log(t){
 document.getElementById('log').innerHTML+=t+'<br>';
}

deal();
