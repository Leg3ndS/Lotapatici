// Lotapatici - CPU (JS)
// NON usare type="module" in index.html.
// Questo file definisce le funzioni globali e poi associa i listener al DOM.

const VALUES = ["1","2","3","4","5","6","7","F","C","R"];
const SUITS  = ["coppe","denari","bastoni","spade"];

let deck = [], pot = 0, currentBet = 0;
let player = { hand: [], credits: 1000, changed: false };
let cpu    = { hand: [], credits: 1000, changed: false };
let selecting = false; // se true, il giocatore sta selezionando carte per cambiarle

/* ------------------ utility deck / engine minimale ------------------ */
function shuffle(a){ for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]];} return a; }
function buildDeck(){ let d=[]; SUITS.forEach(s=> VALUES.forEach(v=> d.push({v,s}))); return shuffle(d); }

function log(text){
  const el = document.getElementById('log');
  el.innerHTML += `${text}<br>`;
  el.scrollTop = el.scrollHeight;
}

/* ------------------ render UI ------------------ */
function render(){
  const ph = document.getElementById('player-hand');
  const ch = document.getElementById('cpu-hand');
  ph.innerHTML = '';
  ch.innerHTML = '';

  player.hand.forEach((c,i)=>{
    const img = document.createElement('img');
    img.src = `cards/${c.v}_${c.s}.jpg`;
    img.alt = `${c.v}_${c.s}`;
    img.style.width = '80px';
    img.style.margin = '6px';
    img.style.cursor = 'pointer';
    img.onclick = () => {
      if (selecting && !player.changed) img.classList.toggle('sel');
    };
    ph.appendChild(img);
  });

  // CPU: durante la mano mostra retro; dopo showdown mostra carte vere (hidden class toggled)
  cpu.hand.forEach(()=> {
    const img = document.createElement('img');
    img.src = `cards/back.jpg`;
    img.alt = 'back';
    img.style.width = '80px';
    img.style.margin = '6px';
    ch.appendChild(img);
  });

  document.getElementById('pot').innerText = `Piatto: ${pot}`;
  document.getElementById('credits').innerText = `Crediti: Tu ${player.credits} | CPU ${cpu.credits}`;
}

/* ------------------ core game actions ------------------ */
function startGame(){
  document.getElementById('lobby').style.display = 'none';
  document.getElementById('game').style.display = 'block';
  newRound();
}

function newRound(){
  deck = buildDeck();
  player.hand = deck.splice(0,5);
  cpu.hand = deck.splice(0,5);
  player.changed = false;
  cpu.changed = false;
  pot = 0;
  currentBet = 0;
  selecting = false;
  document.getElementById('cpu-title').style.display = 'none';
  document.getElementById('cpu-hand').classList.add('hidden');
  document.getElementById('endActions').style.display = 'none';
  document.getElementById('log').innerHTML = '';
  render();
  log("Nuova mano iniziata");
}

/* ---------- betting (fiche 50 / 100), call, all-in ---------- */
function bet(amount){
  if (player.credits < amount) { log("Non hai crediti sufficienti per quella fiche"); return; }
  currentBet += amount;
  player.credits -= amount;
  pot += amount;
  log(`Hai puntato ${amount} (totale puntato questo giro: ${currentBet})`);
  // CPU è obbligata a rispondere: chiama (o all-in se non basta)
  cpuRespondToBet(currentBet);
  render();
}

function cpuRespondToBet(betAmount){
  // CPU simple logic: se ha abbastanza crediti chiama, altrimenti all-in
  const callAmt = Math.min(betAmount, cpu.credits);
  cpu.credits -= callAmt;
  pot += callAmt;
  log(`CPU chiama ${callAmt}`);
  // non modifichiamo currentBet: rimane la puntata di riferimento
}

function call(){
  if (currentBet === 0) { log("Nessuna puntata da chiamare"); return; }
  const amt = Math.min(currentBet, player.credits);
  player.credits -= amt;
  pot += amt;
  log(`Chiami ${amt}`);
  render();
}

function allIn(){
  if (player.credits <= 0) return;
  const amt = player.credits;
  pot += amt;
  log(`All-in ${amt}`);
  player.credits = 0;
  // CPU deve reagire: se può eguagliare lo fa, altrimenti all-in
  const cpuCallAmt = Math.min(currentBet, cpu.credits);
  // If currentBet is 0, cpu should call the all-in amount (to match)
  const toMatch = currentBet > 0 ? currentBet : amt;
  const cpuMatch = Math.min(toMatch, cpu.credits);
  cpu.credits -= cpuMatch;
  pot += cpuMatch;
  log(`CPU risponde con ${cpuMatch}`);
  render();
}

/* ------------------ cambio carte (selezione + conferma una volta) ------------------ */
function toggleChange(){
  if (player.changed) { log("Hai già cambiato in questo round"); return; }
  const changeBtn = document.getElementById('changeBtn');
  if (!selecting){
    selecting = true;
    log("Seleziona fino a 4 carte e premi di nuovo 'Cambia carte' per confermare");
    changeBtn.innerText = "Conferma cambio";
  } else {
    confirmChange();
    changeBtn.innerText = "Cambia carte";
  }
}

function confirmChange(){
  if (player.changed) return;
  const imgs = [...document.querySelectorAll('#player-hand img.sel')].slice(0,4);
  imgs.forEach(img => {
    const i = [...img.parentNode.children].indexOf(img);
    player.hand[i] = deck.pop();
  });
  player.changed = true;
  selecting = false;
  log("Hai cambiato carte");
  // CPU cambia con logica propria (una sola volta)
  cpuChangeLogic();
  render();
}

function cpuChangeLogic(){
  if (cpu.changed) return;
  const s = handStrength(cpu.hand);
  // se ha coppia o tris mantiene, altrimenti cambia 3 carte più basse (se possibile)
  if (s >= 2) {
    cpu.changed = true;
    log("CPU tiene le carte");
    return;
  }
  // cambia fino a 3 carte più deboli
  let indices = cpu.hand
    .map((c,i) => ({i, val: VALUES.indexOf(c.v)}))
    .sort((a,b) => a.val - b.val)
    .slice(0,3)
    .map(x => x.i);
  indices.forEach(i => cpu.hand[i] = deck.pop());
  cpu.changed = true;
  log("CPU cambia carte");
}

/* ------------------ showdown / valutazione mano ------------------ */
function handStrength(hand){
  // restituisce rank: 3=tris,2=coppia,1=carta alta; in questo engine semplificato
  const cnt = {};
  const vals = [];
  hand.forEach(c => { cnt[c.v] = (cnt[c.v]||0) + 1; vals.push(VALUES.indexOf(c.v)); });
  let pair = false, tris = false;
  for (let k in cnt) {
    if (cnt[k] === 3) tris = true;
    if (cnt[k] === 2) pair = true;
  }
  if (tris) return 3;
  if (pair) return 2;
  return 1;
}

function showdown(){
  // mostra le carte CPU
  document.getElementById('cpu-title').style.display = 'block';
  const ch = document.getElementById('cpu-hand');
  ch.classList.remove('hidden');
  ch.innerHTML = '';
  cpu.hand.forEach(c => {
    const img = document.createElement('img');
    img.src = `cards/${c.v}_${c.s}.jpg`;
    img.style.width = '80px';
    img.style.margin = '6px';
    ch.appendChild(img);
  });

  const ps = handStrength(player.hand);
  const cs = handStrength(cpu.hand);
  if (ps > cs){
    player.credits += pot;
    log("VINCI la mano");
  } else {
    cpu.credits += pot;
    log("CPU vince la mano");
  }
  pot = 0;
  render();
  document.getElementById('endActions').style.display = 'block';
}

/* ------------------ utils interfaccia ------------------ */
function backToLobby(){
  document.getElementById('game').style.display = 'none';
  document.getElementById('lobby').style.display = 'block';
}

function initBindings(){
  // Associa listener ai bottoni (assicurati che il DOM sia pronto)
  document.getElementById('startBtn').addEventListener('click', startGame);
  document.getElementById('bet50').addEventListener('click', () => bet(50));
  document.getElementById('bet100').addEventListener('click', () => bet(100));
  document.getElementById('callBtn').addEventListener('click', call);
  document.getElementById('allinBtn').addEventListener('click', allIn);
  document.getElementById('changeBtn').addEventListener('click', toggleChange);
  document.getElementById('scopriBtn').addEventListener('click', showdown);
  document.getElementById('newRoundBtn').addEventListener('click', newRound);
  document.getElementById('backBtn').addEventListener('click', backToLobby);
}

/* ------------------ start: attendi DOM e poi bind ------------------ */
document.addEventListener('DOMContentLoaded', () => {
  initBindings();
  // mostriamo la lobby di default
  document.getElementById('lobby').style.display = 'block';
  document.getElementById('game').style.display = 'none';
});
