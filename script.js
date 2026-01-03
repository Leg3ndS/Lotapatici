const VALUES=["1","2","3","4","5","6","7","F","C","R"];
const SUITS=["coppe","denari","bastoni","spade"];

function buildDeck(){
 let d=[]; for(let s of SUITS) for(let v of VALUES) d.push({v,s});
 return shuffle(d);
}
function shuffle(a){
 for(let i=a.length-1;i>0;i--){
  let j=Math.floor(Math.random()*(i+1));
  [a[i],a[j]]=[a[j],a[i]];
 }
 return a;
}
function strength(h){
 let c={}; h.forEach(x=>c[x.v]=(c[x.v]||0)+1);
 if(Object.values(c).includes(3)) return 3;
 if(Object.values(c).includes(2)) return 2;
 return 1;
}

// ===== STATE =====
let deck,player,cpu,pot;
let phase; // bet1 | change | bet2 | end
let selecting=false,selected=[];
let cpuChanged=false;

// ===== START / NUOVA PARTITA =====
function newRound(){
 deck=buildDeck();
 player={hand:deck.splice(0,5),credits:player?.credits ?? 1000};
 cpu={hand:deck.splice(0,5),credits:cpu?.credits ?? 1000};
 pot=0;
 phase="bet1";
 selecting=false; selected=[]; cpuChanged=false;
 document.getElementById("newRoundBtn").style.display="none";
 logClear();
 log("Nuova mano iniziata");
 cpuMayBet();
 render();
}

// prima partita
newRound();

// ===== RENDER =====
function render(){
 document.getElementById("credits").innerText=
  `Crediti: Tu ${player.credits} | CPU ${cpu.credits}`;
 document.getElementById("pot").innerText=`Piatto: ${pot}`;

 let ph=document.getElementById("playerHand"); ph.innerHTML="";
 player.hand.forEach((c,i)=>{
  let img=document.createElement("img");
  img.src=`cards/${c.v}_${c.s}.jpg`;
  img.className="card";
  if(selected.includes(i)) img.classList.add("selected");
  img.onclick=()=>{
   if(!selecting) return;
   selected.includes(i)
    ? selected=selected.filter(x=>x!==i)
    : selected.length<4 && selected.push(i);
   render();
  };
  ph.appendChild(img);
 });

 let ch=document.getElementById("cpuHand"); ch.innerHTML="";
 cpu.hand.forEach(c=>{
  let img=document.createElement("img");
  img.className="card";
  img.src= phase==="end" ? `cards/${c.v}_${c.s}.jpg` : `cards/back.png`;
  ch.appendChild(img);
 });
}

// ===== BETTING =====
function bet(a){
 if(phase!=="bet1" && phase!=="bet2") return;
 if(player.credits<a || cpu.credits<a) return;
 player.credits-=a; cpu.credits-=a; pot+=a*2;
 log(`Hai puntato ${a}`);
 phase==="bet1" ? phase="change" : phase="end";
 render();
}

function call(){ log("Call"); }

function allIn(){
 let a=Math.min(player.credits,cpu.credits);
 player.credits-=a; cpu.credits-=a; pot+=a*2;
 log("All-in");
 phase="end";
 render();
}

// ===== CPU BET =====
function cpuMayBet(){
 if(Math.random()<0.5){
  let a=Math.random()<0.5?50:100;
  if(cpu.credits>=a){
   cpu.credits-=a; pot+=a;
   log(`CPU punta ${a}`);
  }
 }
}

// ===== CHANGE =====
function changeCards(){
 if(phase!=="change") return;
 if(!selecting){
  selecting=true;
  log("Seleziona le carte da cambiare (max 4)");
  return;
 }
 selected.forEach(i=>player.hand[i]=deck.pop());
 selecting=false; selected=[];
 log("Hai cambiato carte");
 cpuChange();
 phase="bet2";
 render();
}

function cpuChange(){
 if(cpuChanged) return;
 if(strength(cpu.hand)===1){
  cpu.hand=deck.splice(0,5);
  log("CPU cambia carte");
 } else log("CPU tiene le carte");
 cpuChanged=true;
}

// ===== SHOWDOWN =====
function showdown(){
 if(phase!=="end") return;
 let ps=strength(player.hand), cs=strength(cpu.hand);
 phase="end";
 if(ps>cs){ player.credits+=pot; log("VINCI la mano"); }
 else { cpu.credits+=pot; log("CPU vince la mano"); }
 pot=0;
 document.getElementById("newRoundBtn").style.display="inline-block";
 render();
}

// ===== LOG =====
function log(t){document.getElementById("log").textContent+=t+"\n";}
function logClear(){document.getElementById("log").textContent="";}
