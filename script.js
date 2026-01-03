// ===== ENGINE =====
const VALUES = ["1","2","3","4","5","6","7","F","C","R"];
const SUITS = ["coppe","denari","bastoni","spade"];

function buildDeck(){
  let d=[];
  for(let s of SUITS) for(let v of VALUES) d.push({v,s});
  return shuffle(d);
}
function shuffle(a){
  for(let i=a.length-1;i>0;i--){
    const j=Math.floor(Math.random()*(i+1));
    [a[i],a[j]]=[a[j],a[i]];
  }
  return a;
}
function handStrength(hand){
  let c={}, v=[];
  hand.forEach(x=>{
    c[x.v]=(c[x.v]||0)+1;
    v.push(VALUES.indexOf(x.v));
  });
  if(Object.values(c).includes(3)) return 3;
  if(Object.values(c).includes(2)) return 2;
  return 1;
}

// ===== STATE =====
let deck, player, cpu, pot;
let revealed=false;
let selecting=false;
let selected=[];
let playerChanged=false;
let cpuChanged=false;

// ===== START =====
newRound();

function newRound(){
  deck=buildDeck();
  player={hand:deck.splice(0,5),credits:1000,bet:0};
  cpu={hand:deck.splice(0,5),credits:1000,bet:0};
  pot=0;
  revealed=false;
  selecting=false;
  selected=[];
  playerChanged=false;
  cpuChanged=false;
  document.getElementById("newRoundBtn").style.display="none";
  logClear();
  log("Nuova mano iniziata");
  render();
}

// ===== RENDER =====
function render(){
  document.getElementById("credits").innerText =
    `Crediti: Tu ${player.credits} | CPU ${cpu.credits}`;
  document.getElementById("pot").innerText = `Piatto: ${pot}`;

  const ph=document.getElementById("playerHand");
  ph.innerHTML="";
  player.hand.forEach((c,i)=>{
    const img=document.createElement("img");
    img.src=`cards/${c.v}_${c.s}.jpg`;
    img.className="card";
    if(selected.includes(i)) img.classList.add("selected");
    img.onclick=()=>{
      if(!selecting) return;
      if(selected.includes(i)) selected=selected.filter(x=>x!==i);
      else if(selected.length<4) selected.push(i);
      render();
    };
    ph.appendChild(img);
  });

  const ch=document.getElementById("cpuHand");
  ch.innerHTML="";
  cpu.hand.forEach(c=>{
    const img=document.createElement("img");
    img.className="card";
    img.src = revealed ? `cards/${c.v}_${c.s}.jpg` : `cards/back.png`;
    ch.appendChild(img);
  });
}

// ===== BETTING =====
function bet(amount){
  if(player.credits<amount) return;
  player.credits-=amount;
  cpu.credits-=Math.min(amount,cpu.credits);
  pot+=amount*2;
  log(`Hai puntato ${amount}`);
  render();
}
function call(){ log("Call"); }
function allIn(){
  let a=Math.min(player.credits,cpu.credits);
  player.credits-=a;
  cpu.credits-=a;
  pot+=a*2;
  log("All-in");
  render();
}

// ===== CHANGE CARDS =====
function changeCards(){
  if(playerChanged) return;
  if(!selecting){
    selecting=true;
    log("Seleziona fino a 4 carte e premi di nuovo");
    return;
  }
  selected.forEach(i=>player.hand[i]=deck.pop());
  selecting=false;
  playerChanged=true;
  log("Hai cambiato carte");
  cpuChangeLogic();
  render();
}

function cpuChangeLogic(){
  if(cpuChanged) return;
  if(handStrength(cpu.hand)===1){
    cpu.hand=[deck.pop(),deck.pop(),deck.pop(),deck.pop(),deck.pop()];
    log("CPU cambia carte");
  }else{
    log("CPU tiene le carte");
  }
  cpuChanged=true;
}

// ===== SHOWDOWN =====
function showdown(){
  revealed=true;
  let ps=handStrength(player.hand);
  let cs=handStrength(cpu.hand);
  if(ps>cs){
    player.credits+=pot;
    log("VINCI la mano");
  }else{
    cpu.credits+=pot;
    log("CPU vince la mano");
  }
  pot=0;
  document.getElementById("newRoundBtn").style.display="block";
  render();
}

// ===== LOG =====
function log(m){document.getElementById("log").textContent+=m+"\n";}
function logClear(){document.getElementById("log").textContent="";}
