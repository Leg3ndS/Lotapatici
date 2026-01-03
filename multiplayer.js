// SAFE INIT
let playerId = localStorage.getItem("playerId");
if (!playerId) {
  playerId = Date.now().toString();
  localStorage.setItem("playerId", playerId);
}

const createBtn = document.getElementById("createBtn");
const joinBtn = document.getElementById("joinBtn");
const startBtn = document.getElementById("startBtn");
const statusEl = document.getElementById("status");
const handEl = document.getElementById("hand");

// UI ALWAYS ACTIVE
createBtn.disabled = false;
joinBtn.disabled = false;
startBtn.disabled = false;

createBtn.onclick = () => {
  statusEl.textContent = "Stanza creata (mock)";
};

joinBtn.onclick = () => {
  statusEl.textContent = "Entrato in stanza (mock)";
};

startBtn.onclick = () => {
  document.getElementById("lobby").style.display = "none";
  document.getElementById("game").style.display = "block";
  statusEl.textContent = "È il TUO turno";
  renderHand(["1_bastoni","5_denari","C_spade","7_bastoni","R_coppe"]);
};

function renderHand(cards){
  handEl.innerHTML = "";
  cards.forEach(c=>{
    const b = document.createElement("button");
    b.textContent = c;
    b.onclick = ()=>alert("Hai cliccato "+c);
    handEl.appendChild(b);
  });
}
