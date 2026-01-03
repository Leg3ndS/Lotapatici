
// ENGINE ESTRATTO – comportamento identico alla CPU originale

const VALUES = ["1","2","3","4","5","6","7","F","C","R"];
const SUITS = ["coppe","denari","bastoni","spade"];

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
    counts[c.v]=(counts[c.v]||0)+1;
    values.push(VALUES.indexOf(c.v));
  });
  let pairs=[], tris=null;
  for(let v in counts){
    if(counts[v]==3) tris=VALUES.indexOf(v);
    if(counts[v]==2) pairs.push(VALUES.indexOf(v));
  }
  if(tris!==null) return {rank:3, main:tris, name:"Tris"};
  if(pairs.length) return {rank:2, main:Math.max(...pairs), name:"Coppia"};
  return {rank:1, main:Math.max(...values), name:"Carta Alta"};
}

export function renderHand(hand, container){
  container.innerHTML="";
  hand.forEach(c=>{
    const img=document.createElement("img");
    img.src=`cards/${c.v}_${c.s}.jpg`;
    img.style.width="80px";
    img.style.margin="4px";
    container.appendChild(img);
  });
}
