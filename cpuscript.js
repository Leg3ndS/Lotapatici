let deck, playerHand, cpuHand;
let credits = 1000;
let pot = 0;
let selected = [];
let changePhase = false;

const playerDiv = document.getElementById("playerHand");
const cpuDiv = document.getElementById("cpuHand");
const logEl = document.getElementById("log");
const info = document.getElementById("info");

document.getElementById("bet50").onclick = () => bet(50);
document.getElementById("bet100").onclick = () => bet(100);
document.getElementById("allin").onclick = () => bet(credits);
document.getElementById("change").onclick = toggleChange;
document.getElementById("show").onclick = showdown;
document.getElementById("newHand").onclick = newHand;

newHand();

function log(msg){
  logEl.textContent += msg + "\n";
}

function updateInfo(){
  info.textContent = `Crediti: Tu ${credits} | CPU ∞ — Piatto ${pot}`;
}

function newHand(){
  logEl.textContent = "";
  selected = [];
  changePhase = false;
  pot = 0;

  deck = buildDeck();
  playerHand = deck.splice(0,5);
  cpuHand = deck.splice(0,5);

  log("Nuova mano iniziata");
  render(false);
}

function render(showCpu){
  updateInfo();
  playerDiv.innerHTML = "";
  cpuDiv.innerHTML = "";

  playerHand.forEach((c,i)=>{
    const img = document.createElement("img");
    img.src = `cards/${c.v}_${c.s}.jpg`;
    img.onclick = () => selectCard(i,img);
    playerDiv.appendChild(img);
  });

  cpuHand.forEach(c=>{
    const img = document.createElement("img");
    img.src = showCpu ? `cards/${c.v}_${c.s}.jpg` : "cards/back.png";
    cpuDiv.appendChild(img);
  });
}

function selectCard(i,img){
  if(!changePhase) return;

  if(selected.includes(i)){
    selected = selected.filter(x=>x!==i);
    img.classList.remove("selected");
  }else if(selected.length < 4){
    selected.push(i);
    img.classList.add("selected");
  }
}

function toggleChange(){
  if(!changePhase){
    changePhase = true;
    log("Seleziona fino a 4 carte");
    return;
  }

  selected.forEach(i=>{
    playerHand[i] = deck.pop();
  });

  selected = [];
  changePhase = false;
  log("Hai cambiato carte");

  render(false);
}

function bet(amount){
  if(amount > credits) return;
  credits -= amount;
  pot += amount * 2;
  log(`Hai puntato ${amount}`);
  log(`CPU segue ${amount}`);
  render(false);
}

function showdown(){
  render(true);

  const p = evaluateHand(playerHand);
  const c = evaluateHand(cpuHand);

  if(p.rank > c.rank || (p.rank === c.rank && p.main > c.main)){
    credits += pot;
    log("VINCI la mano");
  }else{
    log("CPU vince la mano");
  }
  pot = 0;
}
