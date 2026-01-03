
/* STEP 7 – AUTH ANON FIX
   firebaseConfig integrato
*/

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getDatabase, ref, onValue, set } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";
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

const cardsDiv = document.getElementById("cards");

function renderCards(cards){
  cardsDiv.innerHTML = "";
  cards.forEach(c=>{
    const el = document.createElement("div");
    el.textContent = c;
    el.style.display = "inline-block";
    el.style.border = "1px solid #fff";
    el.style.padding = "6px";
    el.style.margin = "4px";
    cardsDiv.appendChild(el);
  });
}

signInAnonymously(auth);

onAuthStateChanged(auth, user => {
  if(!user) return;

  const playerId = user.uid;
  const roomId = localStorage.getItem("roomId");
  const isHost = localStorage.getItem("isHost") === "true";

  if(!roomId) return;

  set(ref(db, `rooms/${roomId}/players/${playerId}`), {
    joinedAt: Date.now()
  });

  onValue(ref(db, `rooms/${roomId}/hands/${playerId}`), snap=>{
    if(!snap.exists()) return;
    renderCards(Object.values(snap.val()));
  });

  if(isHost){
    const deck = [
      "1_bastoni","2_bastoni","3_bastoni","4_bastoni","5_bastoni","6_bastoni","7_bastoni","8_bastoni","9_bastoni","R_bastoni",
      "1_coppe","2_coppe","3_coppe","4_coppe","5_coppe","6_coppe","7_coppe","8_coppe","9_coppe","R_coppe",
      "1_denari","2_denari","3_denari","4_denari","5_denari","6_denari","7_denari","8_denari","9_denari","R_denari",
      "1_spade","2_spade","3_spade","4_spade","5_spade","6_spade","7_spade","8_spade","9_spade","R_spade"
    ].sort(()=>Math.random()-0.5);

    onValue(ref(db, `rooms/${roomId}/players`), snap=>{
      if(!snap.exists()) return;
      const players = Object.keys(snap.val());
      let i = 0;
      players.forEach(pid=>{
        const hand = deck.slice(i, i+5);
        i += 5;
        set(ref(db, `rooms/${roomId}/hands/${pid}`), hand);
      });
    }, { once:true });
  }
});
