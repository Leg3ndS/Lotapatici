// engine.js
export const VALUES = ["1","2","3","4","5","6","7","F","C","R"];
export const SUITS = ["coppe","denari","bastoni","spade"];

function shuffle(a){
  for(let i=a.length-1;i>0;i--){
    const j=Math.floor(Math.random()*(i+1));
    [a[i],a[j]]=[a[j],a[i]];
  }
  return a;
}

export function buildDeck(){
  const deck=[];
  for(const s of SUITS){
    for(const v of VALUES){
      deck.push({v,s});
    }
  }
  return shuffle(deck);
}

export function evaluateHand(hand){
  let counts={}, values=[];
  hand.forEach(c=>{
    const idx = VALUES.indexOf(c.v);
    counts[c.v]=(counts[c.v]||0)+1;
    values.push(idx);
  });
  values.sort((a,b)=>b-a);

  let pairs=[], tris=null;
  for(let v in counts){
    if(counts[v]===3) tris=VALUES.indexOf(v);
    if(counts[v]===2) pairs.push(VALUES.indexOf(v));
  }

  if(tris!==null){
    return {rank:3, name:"Tris", tiebreakers:[tris]};
  }
  if(pairs.length){
    const p=Math.max(...pairs);
    return {rank:2, name:"Coppia", tiebreakers:[p,...values.filter(x=>x!==p)]};
  }
  return {rank:1, name:"Carta Alta", tiebreakers:values};
}

export function renderHand(hand, container, hidden=false){
  container.innerHTML="";
  hand.forEach((c,i)=>{
    const img=document.createElement("img");
    img.src = hidden ? "cards/back.png" : `cards/${c.v}_${c.s}.jpg`;
    img.dataset.index=i;
    img.className="card";
    container.appendChild(img);
  });
}
