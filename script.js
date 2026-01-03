const VALUES = ["1","2","3","4","5","6","7","F","C","R"];
const SUITS = ["coppe","denari","bastoni","spade"];

let deck = [];
let player = [];
let cpu = [];

let pot = 0;
let playerCredits = 1000;

let selected = [];
let playerChanged = false;
let cpuChanged = false;
let bettingLocked = false;
let cpuOpened = false;

function buildDeck(){
  deck = [];
  for(const s of SUITS)
    for(const v of VALUES)
      deck.push({v,s});
  shuffle(deck);
}

function shuffle(a){
  for(let i=a.length-1;i>0;i--){
    const j=Math.floor(Math.random()*(i+1));
    [a[i],a[j]]=[a[j],a[i]];
  }
}

function newGame(){
  buildDeck();
  player = deck.splice(0,5);
  cpu = deck.splice(0,5);

  pot = 0;
  selected = [];
  playerChanged = false;
  cpuChanged = false;
  bettingLocked = false;
  cpuOpened = false;

  render();
  logMsg("Nuova mano iniziata");
}

function render(){
  document.getElementById("pCredits").innerText = playerCredits;
  document.getElementById("pot").innerText = pot;

  renderHand(player,"playerHand",true);
  renderHand(cpu,"cpuHand",cpuOpened);
}

function renderHand(hand,id,open){
  const el = document.getElementById(id);
  el.innerHTML = "";
  hand.forEach((c,i)=>{
    const img=document.createElement("img");
    img.src = open ? `cards/${c.v}_${c.s}.jpg` : "cards/back.png";
    if(id==="playerHand"){
      img.onclick = ()=>selectCard(i,img);
    }
    el.appendChild(img);
  });
}

function selectCard(i,img){
  if(playerChanged) return;
  if(selected.includes(i)){
    selected=selected.filter(x=>x!==i);
    img.classList.remove("sel");
  }else if(selected.length<4){
    selected.push(i);
    img.classList.add("sel");
  }
}

function changeCards(){
  if(!playerChanged){
    logMsg("Seleziona fino a 4 carte e premi di nuovo 'Cambia carte'");
    playerChanged = true;
    return;
  }

  selected.forEach(i=>{
    player[i]=deck.pop();
  });
  selected=[];
  playerChanged=true;

  cpuLogicChange();
  render();
  logMsg("Hai cambiato carte");
}

function cpuLogicChange(){
  if(cpuChanged) return;

  const strength = evalHand(cpu);
  let change = [];

  cpu.forEach((c,i)=>{
    if(strength.rank===1 && VALUES.indexOf(c.v)<VALUES.indexOf("C"))
      change.push(i);
  });

  change.slice(0,3).forEach(i=>{
    cpu[i]=deck.pop();
  });

  cpuChanged=true;
  logMsg("CPU cambia carte");
}

function bet(x){
  if(bettingLocked) return;
  playerCredits -= x;
  pot += x;
  logMsg(`Hai puntato ${x}`);
  cpuDecision(x);
}

function allIn(){
  bet(playerCredits);
}

function cpuDecision(x){
  bettingLocked = true;

  const s = evalHand(cpu);
  let call = false;

  if(s.rank===2){
    call = s.main>=VALUES.indexOf("7") || x<=50;
  }else{
    call = s.main>=VALUES.indexOf("C") && x<=50;
  }

  if(call){
    pot += x;
    logMsg(`CPU segue ${x}`);
  }else{
    logMsg("CPU esce");
    pot=0;
    newGame();
  }
}

function showdown(){
  cpuOpened = true;
  render();

  const p = evalHand(player);
  const c = evalHand(cpu);

  let win =
    p.rank>c.rank ||
    (p.rank===c.rank && p.main>c.main);

  if(win){
    playerCredits+=pot;
    logMsg("VINCI la mano");
  }else{
    logMsg("CPU vince la mano");
  }
  pot=0;
}

function evalHand(hand){
  let counts={}, vals=[];
  hand.forEach(c=>{
    counts[c.v]=(counts[c.v]||0)+1;
    vals.push(VALUES.indexOf(c.v));
  });

  let pair=null;
  for(let v in counts)
    if(counts[v]===2)
      pair=VALUES.indexOf(v);

  if(pair!==null) return {rank:2, main:pair};
  return {rank:1, main:Math.max(...vals)};
}

function logMsg(t){
  const l=document.getElementById("log");
  l.innerHTML+=t+"<br>";
}

newGame();
