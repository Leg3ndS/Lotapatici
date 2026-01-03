
import { buildDeck, renderHand, handStrength } from "./gameEngine.js";

let deck = buildDeck();
let playerHand = deck.splice(0,5);
let cpuHand = deck.splice(0,5);

const playerDiv = document.getElementById("playerHand");
const cpuDiv = document.getElementById("cpuHand");
const resultDiv = document.getElementById("result");

renderHand(playerHand, playerDiv);
renderHand(cpuHand, cpuDiv);

document.getElementById("showdown").onclick = ()=>{
  const p = handStrength(playerHand);
  const c = handStrength(cpuHand);
  if(p.rank>c.rank || (p.rank===c.rank && p.main>c.main)){
    resultDiv.textContent="Hai vinto con "+p.name;
  }else{
    resultDiv.textContent="CPU vince con "+c.name;
  }
};
