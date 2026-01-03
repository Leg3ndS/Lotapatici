
export const VALUES=["1","2","3","4","5","6","7","F","C","R"];
export const SUITS=["coppe","denari","bastoni","spade"];

export function buildDeck(){
 let d=[];
 for(let s of SUITS)for(let v of VALUES)d.push({v,s});
 return d.sort(()=>Math.random()-0.5);
}

export function renderHand(hand,el){
 el.innerHTML="";
 hand.forEach(c=>{
  const img=document.createElement("img");
  img.src=`cards/${c.v}_${c.s}.jpg`;
  el.appendChild(img);
 });
}
