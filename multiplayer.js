
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getDatabase, ref, get, set, update, onValue } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";
import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { buildDeck, renderHand } from "./gameEngine.js";

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

let uid=null, room=null;

const cardsDiv=document.getElementById("cards");

signInAnonymously(auth);
onAuthStateChanged(auth,u=>{ if(u) uid=u.uid; });

document.getElementById("create").onclick=async()=>{
  room="LOTA-"+Math.random().toString(36).slice(2,6).toUpperCase();
  await set(ref(db,`rooms/${room}/players/${uid}`),{credits:1000});
  alert("Stanza: "+room);
};

document.getElementById("join").onclick=async()=>{
  room=document.getElementById("room").value;
  await set(ref(db,`rooms/${room}/players/${uid}`),{credits:1000});
};

document.getElementById("start").onclick=async()=>{
  const snap=await get(ref(db,`rooms/${room}/players`));
  const players=Object.keys(snap.val());
  const deck=buildDeck();
  let ps={};
  players.forEach(p=>ps[p]={hand:deck.splice(0,5),credits:1000,bet:0});
  await update(ref(db,`rooms/${room}`),{gameState:{deck,players:ps,turn:{playerId:players[0]}}});
};

onValue(ref(db,`rooms`),snap=>{
  if(!room||!uid) return;
  const gs=snap.child(`${room}/gameState`).val();
  if(gs&&gs.players&&gs.players[uid]){
    renderHand(gs.players[uid].hand,cardsDiv);
  }
});
