
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getDatabase, ref, set, update, onValue } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";
import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyBYtgxKPGQnjlsJlr7-wAKlg44z93m1mS0",
  authDomain: "lotapatici.firebaseapp.com",
  databaseURL: "https://lotapatici-default-rtdb.firebaseio.com",
  projectId: "lotapatici",
  storageBucket: "lotapatici.appspot.com",
  messagingSenderId: "861977199404",
  appId: "1:861977199404:web:fd9ff4dde3e59616942289"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);

const roomInput = document.getElementById("roomInput");
const createBtn = document.getElementById("createBtn");
const joinBtn = document.getElementById("joinBtn");
const startBtn = document.getElementById("startBtn");
const cardsDiv = document.getElementById("cards");

let uid = null;
let roomId = null;
let isHost = false;

function renderCards(cards){
  cardsDiv.innerHTML = "";
  cards.forEach(c=>{
    const d=document.createElement("div");
    d.textContent=c;
    d.style.display="inline-block";
    d.style.border="1px solid #fff";
    d.style.margin="4px";
    d.style.padding="6px";
    cardsDiv.appendChild(d);
  });
}

signInAnonymously(auth);

onAuthStateChanged(auth, user=>{
  if(!user) return;
  uid = user.uid;
});

createBtn.onclick = ()=>{
  roomId = "LOTA-" + Math.random().toString(36).substr(2,4).toUpperCase();
  isHost = true;
  set(ref(db, "rooms/"+roomId), {
    createdAt: Date.now(),
    host: uid
  });
  set(ref(db, "rooms/"+roomId+"/players/"+uid), { joinedAt: Date.now() });
  alert("Stanza creata: "+roomId);
};

joinBtn.onclick = ()=>{
  roomId = roomInput.value.trim();
  if(!roomId) return alert("Inserisci codice");
  set(ref(db, "rooms/"+roomId+"/players/"+uid), { joinedAt: Date.now() });
};

startBtn.onclick = ()=>{
  if(!isHost || !roomId) return;
  onValue(ref(db,"rooms/"+roomId+"/players"), snap=>{
    if(!snap.exists()) return;
    const players = Object.keys(snap.val());
    const deck=[
      "1_bastoni","2_bastoni","3_bastoni","4_bastoni","5_bastoni","6_bastoni","7_bastoni","8_bastoni","9_bastoni","R_bastoni",
      "1_coppe","2_coppe","3_coppe","4_coppe","5_coppe","6_coppe","7_coppe","8_coppe","9_coppe","R_coppe",
      "1_denari","2_denari","3_denari","4_denari","5_denari","6_denari","7_denari","8_denari","9_denari","R_denari",
      "1_spade","2_spade","3_spade","4_spade","5_spade","6_spade","7_spade","8_spade","9_spade","R_spade"
    ].sort(()=>Math.random()-0.5);
    let i=0;
    players.forEach(p=>{
      set(ref(db,"rooms/"+roomId+"/hands/"+p), deck.slice(i,i+5));
      i+=5;
    });
  },{once:true});
};

onValue(ref(db,"rooms"), snap=>{
  if(!roomId || !uid) return;
  const handSnap = snap.child(roomId+"/hands/"+uid);
  if(handSnap.exists()) renderCards(Object.values(handSnap.val()));
});
