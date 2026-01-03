
const VALUES=["1","2","3","4","5","6","7","F","C","R"];
const SUITS=["coppe","denari","bastoni","spade"];

let deck=[], pot=0, currentBet=0;
let player={hand:[],credits:1000,changed:false};
let cpu={hand:[],credits:1000,changed:false};
let selecting=false;

function shuffle(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
function buildDeck(){let d=[];SUITS.forEach(s=>VALUES.forEach(v=>d.push({v,s})));return shuffle(d);}
function log(t){document.getElementById("log").innerHTML+=t+"<br>";}

function startGame(){
 document.getElementById("lobby").style.display="none";
 document.getElementById("game").style.display="block";
 newRound();
}

function newRound(){
 deck=buildDeck();
 player.hand=deck.splice(0,5);
 cpu.hand=deck.splice(0,5);
 player.changed=false;
 cpu.changed=false;
 pot=0; currentBet=0; selecting=false;
 document.getElementById("cpu-title").style.display="none";
 document.getElementById("cpu-hand").classList.add("hidden");
 document.getElementById("endActions").style.display="none";
 document.getElementById("log").innerHTML="";
 render();
 log("Nuova mano iniziata");
}

function render(){
 const ph=document.getElementById("player-hand");
 const ch=document.getElementById("cpu-hand");
 ph.innerHTML=""; ch.innerHTML="";
 player.hand.forEach((c,i)=>{
   const img=document.createElement("img");
   img.src=`cards/${c.v}_${c.s}.jpg`;
   img.onclick=()=>{
     if(selecting && !player.changed) img.classList.toggle("sel");
   };
   ph.appendChild(img);
 });
 cpu.hand.forEach(()=>{
   const img=document.createElement("img");
   img.src="cards/back.jpg";
   ch.appendChild(img);
 });
 document.getElementById("pot").innerText="Piatto: "+pot;
 document.getElementById("credits").innerText=`Crediti: Tu ${player.credits} | CPU ${cpu.credits}`;
}

function bet(amount){
 if(player.credits<amount) return;
 currentBet+=amount;
 player.credits-=amount;
 pot+=amount;
 log("Punti "+amount);
 cpuCall();
 render();
}

function cpuCall(){
 let callAmt=Math.min(currentBet,cpu.credits);
 cpu.credits-=callAmt;
 pot+=callAmt;
 log("CPU chiama "+callAmt);
}

function call(){
 if(currentBet===0) return;
 let amt=Math.min(currentBet,player.credits);
 player.credits-=amt;
 pot+=amt;
 log("Chiami "+amt);
 render();
}

function allIn(){
 pot+=player.credits;
 log("All-in "+player.credits);
 player.credits=0;
 cpuCall();
 render();
}

function toggleChange(){
 if(player.changed) return;
 if(!selecting){
   selecting=true;
   log("Seleziona fino a 4 carte e premi di nuovo Cambia carte");
 }else{
   confirmChange();
 }
}

function confirmChange(){
 const imgs=[...document.querySelectorAll("#player-hand img.sel")].slice(0,4);
 imgs.forEach(img=>{
   const i=[...img.parentNode.children].indexOf(img);
   player.hand[i]=deck.pop();
 });
 player.changed=true;
 selecting=false;
 log("Carte cambiate");
 cpuChangeLogic();
 render();
}

function cpuChangeLogic(){
 if(cpu.changed) return;
 const strength = handStrength(cpu.hand);
 if(strength>=2){ cpu.changed=true; log("CPU tiene le carte"); return; }
 // carta alta: cambia 3 carte più basse
 let idx = cpu.hand
   .map((c,i)=>({i,val:VALUES.indexOf(c.v)}))
   .sort((a,b)=>a.val-b.val)
   .slice(0,3)
   .map(x=>x.i);
 idx.forEach(i=> cpu.hand[i]=deck.pop());
 cpu.changed=true;
 log("CPU cambia carte");
}

function handStrength(hand){
 let c={},v=[];
 hand.forEach(x=>{c[x.v]=(c[x.v]||0)+1;v.push(VALUES.indexOf(x.v));});
 let pair=false,tris=false;
 for(let k in c){if(c[k]==3)tris=true;if(c[k]==2)pair=true;}
 if(tris) return 3;
 if(pair) return 2;
 return 1;
}

function showdown(){
 document.getElementById("cpu-title").style.display="block";
 document.getElementById("cpu-hand").classList.remove("hidden");
 const ch=document.getElementById("cpu-hand");
 ch.innerHTML="";
 cpu.hand.forEach(c=>{
   const img=document.createElement("img");
   img.src=`cards/${c.v}_${c.s}.jpg`;
   ch.appendChild(img);
 });
 const ps=handStrength(player.hand);
 const cs=handStrength(cpu.hand);
 if(ps>cs){player.credits+=pot;log("VINCI la mano");}
 else{cpu.credits+=pot;log("CPU vince la mano");}
 pot=0;
 render();
 document.getElementById("endActions").style.display="block";
}

function backToLobby(){
 document.getElementById("game").style.display="none";
 document.getElementById("lobby").style.display="block";
}
