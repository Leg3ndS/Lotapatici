
import { buildDeck, renderHand } from './gameEngine.js';
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getDatabase, ref, set, onValue } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";

const firebaseConfig={
 apiKey:"AIzaSyBYtgxKPGQnjlsJlr7-wAKlg44z93m1mS0",
 authDomain:"lotapatici.firebaseapp.com",
 databaseURL:"https://lotapatici-default-rtdb.europe-west1.firebasedatabase.app",
 projectId:"lotapatici"
};

const app=initializeApp(firebaseConfig);
const db=getDatabase(app);
const pid=Date.now();

window.join=async()=>{
 const r=room.value;
 await set(ref(db,`rooms/${r}/players/${pid}`),{hand:[]});
 const deck=buildDeck();
 await set(ref(db,`rooms/${r}/deck`),deck);
 await set(ref(db,`rooms/${r}/players/${pid}/hand`),deck.splice(0,5));
 game.classList.remove("hidden");
 listen(r);
};

function listen(r){
 onValue(ref(db,`rooms/${r}/players/${pid}/hand`),snap=>{
  if(!snap.exists())return;
  renderHand(snap.val(),document.getElementById("hand"));
 });
}
