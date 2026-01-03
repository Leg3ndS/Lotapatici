
const VALUES=["1","2","3","4","5","6","7","F","C","R"];
const SUITS=["coppe","denari","bastoni","spade"];

function buildDeck(){
 let d=[];
 for(let s of SUITS){
  for(let v of VALUES){
   d.push(v+"_"+s);
  }
 }
 return d.sort(()=>Math.random()-0.5);
}

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getDatabase, ref, set, update, onValue, get } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";

const firebaseConfig={
 apiKey:"AIzaSyBYtgxKPGQnjlsJlr7-wAKlg44z93m1mS0",
 authDomain:"lotapatici.firebaseapp.com",
 databaseURL:"https://lotapatici-default-rtdb.europe-west1.firebasedatabase.app",
 projectId:"lotapatici",
 storageBucket:"lotapatici.firebasestorage.app",
 messagingSenderId:"861977199404",
 appId:"1:861977199404:web:fd9ff4dde3e59616942289"
};

const app=initializeApp(firebaseConfig);
const db=getDatabase(app);

let room=null, playerId=Date.now(), isHost=false, timerInt=null;

window.showHost=()=>{
 document.getElementById("choice").classList.add("hidden");
 document.getElementById("host").classList.remove("hidden");
};

window.showJoin=()=>{
 document.getElementById("choice").classList.add("hidden");
 document.getElementById("join").classList.remove("hidden");
};

function genCode(){
 return "LOTA-"+Math.random().toString(36).substring(2,6).toUpperCase();
}

window.createRoom=async()=>{
 const name=hostName.value;
 const credits=+document.getElementById("credits").value;
 const ante=+document.getElementById("ante").value;
 const turnTime=+document.getElementById("turnTime").value;
 if(!name||!credits||!ante||!turnTime)return alert("Compila tutto");

 room=genCode(); isHost=true;

 await set(ref(db,"rooms/"+room),{
  status:"lobby",
  host:playerId,
  settings:{credits,ante,turnTime},
  players:{}
 });

 await set(ref(db,"rooms/"+room+"/players/"+playerId),{
  name,ready:false
 });

 setupLobby();
};

window.joinRoom=async()=>{
 const name=joinName.value;
 room=code.value;
 if(!name||!room)return alert("Nome e codice");
 await set(ref(db,"rooms/"+room+"/players/"+playerId),{
  name,ready:false
 });
 setupLobby();
};

function setupLobby(){
 roomLabel.textContent="Stanza: "+room;
 readyBtn.classList.remove("hidden");

 onValue(ref(db,"rooms/"+room+"/players"),snap=>{
  players.innerHTML="";
  let allReady=true,count=0;
  snap.forEach(p=>{
   count++;
   const li=document.createElement("li");
   li.textContent=p.val().name+(p.val().ready?" ✔":"");
   if(p.val().ready)li.classList.add("ready");
   else allReady=false;
   players.appendChild(li);
  });
  if(isHost && allReady && count>=2)
   startBtn.classList.remove("hidden");
 });

 listenStatus();
}

window.ready=async()=>{
 await update(ref(db,"rooms/"+room+"/players/"+playerId),{ready:true});
};

window.startGame=async()=>{
 const snap=await get(ref(db,"rooms/"+room+"/players"));
 let order=[];
 snap.forEach(p=>order.push(p.key));

 const dealer=Math.floor(Math.random()*order.length);
 const first=order[(dealer+1)%order.length];
 const settings=(await get(ref(db,"rooms/"+room+"/settings"))).val();

 
 const deck=buildDeck();
 let hands={};
 for(let pid of order){
  hands[pid]=[deck.pop(),deck.pop(),deck.pop(),deck.pop(),deck.pop()];
 }

 await update(ref(db,"rooms/"+room),{
  deck:deck,
  hands:hands,

  status:"playing",
  playersOrder:order,
  dealerIndex:dealer,
  turn:{player:first,expires:Date.now()+settings.turnTime*1000}
 });
};

function listenStatus(){
 onValue(ref(db,"rooms/"+room+"/status"),snap=>{
  if(snap.val()==="playing"){
   document.getElementById("choice")?.classList.add("hidden");
   document.getElementById("host")?.classList.add("hidden");
   document.getElementById("join")?.classList.add("hidden");
   readyBtn.classList.add("hidden");
   startBtn.classList.add("hidden");
   game.classList.remove("hidden");
   listenTurn(); listenHand();
  }
 });
}

function listenTurn(){
 onValue(ref(db,"rooms/"+room+"/turn"),snap=>{
  if(!snap.exists())return;
  const t=snap.val();
  turnInfo.textContent=t.player==playerId?"È il TUO turno":"Turno avversario";
  startTimer(t.expires);
 });
}

function startTimer(exp){
 clearInterval(timerInt);
 timerInt=setInterval(()=>{
  const left=Math.max(0,Math.floor((exp-Date.now())/1000));
  timer.textContent="Tempo: "+left+"s";
  if(left<=0)clearInterval(timerInt);
 },500);
}

function listenHand(){
 onValue(ref(db,"rooms/"+room+"/hands/"+playerId),snap=>{
  if(!snap.exists())return;
  hand.innerHTML="";
  snap.val().forEach(c=>{
   const d=document.createElement("div");
   d.textContent=c;
   d.style.border="1px solid #fff";
   d.style.padding="6px";
   d.style.margin="4px";
   d.style.display="inline-block";
   hand.appendChild(d);
  });
 });
}


function generateHand() {
  const suits = ["coppe","spade","bastoni","denari"];
  const values = [1,2,3,4,5,6,7,8,9,10];
  const deck = [];
  suits.forEach(s => values.forEach(v => deck.push({suit:s,value:v})));
  deck.sort(()=>Math.random()-0.5);
  return deck.slice(0,5);
}
