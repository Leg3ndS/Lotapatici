/* script.js - Lotapatici CPU mode (FIX selezione & reset log)
   - Metti immagini in cards/ con nomi tipo "1_bastoni.jpg", "5_denari.jpg", ecc.
   - Dorso: cards/back.png
*/

(() => {
  // CONFIG
  const START_CREDITS = 1000;
  const MAX_CHANGE = 4;
  const VALUES_ORDER = ["1","2","3","4","5","6","7","F","C","R"];
  const SUITS = ["coppe","denari","bastoni","spade"];

  // DOM
  const playerCardsEl = document.getElementById('playerCards');
  const cpuCardsEl = document.getElementById('cpuCards');
  const chip50 = document.getElementById('chip50');
  const chip100 = document.getElementById('chip100');
  const allinBtn = document.getElementById('allin');
  const changeBtn = document.getElementById('changeBtn');
  const revealBtn = document.getElementById('revealBtn');
  const newHandBtn = document.getElementById('newHandBtn');
  const lobbyBtn = document.getElementById('lobbyBtn');
  const potText = document.getElementById('potText');
  const creditsText = document.getElementById('creditsText');
  const logEl = document.getElementById('log');
  const rechargeBtn = document.getElementById('rechargeBtn');

  // STATE
  let state = {
    deck: [],
    player: { credits: START_CREDITS, hand: [], bet: 0, changed: false, selected: [] },
    cpu: { credits: START_CREDITS, hand: [], bet: 0, changed: false, folded: false, revealed: false },
    pot: 0,
    phase: 'idle', // idle | betting | changing | showdown | ended
    allowSelection: false,
    playerCanChange: true,
    cpuCanChange: true
  };

  // UTILS
  function shuffle(a){ for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]] } return a; }
  function buildDeck(){ const d=[]; for(const s of SUITS){ for(const v of VALUES_ORDER){ d.push(`${v}_${s}`); } } return shuffle(d); }
  function idxValue(v){ if(v==="1") return 100; return VALUES_ORDER.indexOf(v); }
  function handStrength(hand){ const vals = hand.map(c=>c.split('_')[0]); const counts={}; vals.forEach(v=>counts[v]=(counts[v]||0)+1); let rank=1, main=-1; for(const k in counts){ if(counts[k]===3){ rank=3; main = Math.max(main, idxValue(k)); } if(counts[k]===2 && rank<3){ rank=2; main = Math.max(main, idxValue(k)); } } if(rank===1) main = Math.max(...vals.map(v=>idxValue(v))); return {rank, main}; }
  function log(msg){ logEl.textContent += msg + '\n'; logEl.scrollTop = logEl.scrollHeight; }

  // RENDER
  function renderCredits(){ creditsText.textContent = `Crediti: Tu ${state.player.credits} | CPU ${state.cpu.credits===Infinity ? '∞' : state.cpu.credits}`; potText.textContent = `Piatto: ${state.pot}`; }
  function renderHands(reveal=false){
    // player
    playerCardsEl.innerHTML = '';
    state.player.hand.forEach((c,i)=>{
      const card = document.createElement('div');
      card.className = 'card' + (state.player.selected.includes(i) ? ' selected' : '');
      const img = document.createElement('img');
      img.src = `cards/${c}.jpg`;
      card.appendChild(img);
      // attach listener for selection always, but check allowSelection inside
      card.addEventListener('click', ()=> {
        if(!state.allowSelection) return;
        toggleSelect(i);
      });
      playerCardsEl.appendChild(card);
    });
    // CPU
    cpuCardsEl.innerHTML = '';
    state.cpu.hand.forEach((c,i)=>{
      const card = document.createElement('div');
      card.className = 'card';
      const img = document.createElement('img');
      if(reveal || state.phase==='ended' || state.cpu.revealed){
        img.src = `cards/${c}.jpg`;
      } else {
        img.src = `cards/back.png`;
      }
      card.appendChild(img);
      cpuCardsEl.appendChild(card);
    });
  }

  // SELECTION
  function toggleSelect(i){
    const sel = state.player.selected;
    if(sel.includes(i)) state.player.selected = sel.filter(x=>x!==i);
    else {
      if(sel.length >= MAX_CHANGE) return;
      state.player.selected.push(i);
    }
    renderHands(false);
  }

  // DEAL / NEW HAND
  function dealNewHand(){
    // reset log
    logEl.textContent = '';
    state.deck = buildDeck();
    state.player.hand = state.deck.splice(0,5);
    state.cpu.hand = state.deck.splice(0,5);
    state.player.bet = 0; state.cpu.bet = 0;
    state.player.selected = []; state.player.changed = false;
    state.cpu.changed = false; state.cpu.folded = false; state.cpu.revealed = false;
    state.pot = 0;
    state.phase = 'betting';
    state.allowSelection = false;
    state.playerCanChange = true; state.cpuCanChange = true;
    renderCredits();
    renderHands(false);
    log('Nuova mano iniziata');
    updateButtons();
  }

  // UPDATE UI BUTTONS
  function updateButtons(){
    // new hand shows only when ended
    newHandBtn.classList.toggle('hidden', state.phase !== 'ended');
    rechargeBtn.classList.toggle('hidden', state.player.credits > 0);
    // change button enabled when player can change and not ended
    changeBtn.disabled = !(state.playerCanChange && state.phase !== 'ended');
    // change button text depends on selection mode
    changeBtn.textContent = state.allowSelection ? 'Conferma cambio' : 'Cambia carte';
    chip50.disabled = !(state.phase === 'betting');
    chip100.disabled = !(state.phase === 'betting');
    allinBtn.disabled = !(state.phase === 'betting' && state.player.credits > 0);
    revealBtn.disabled = !(state.phase === 'showdown' || state.phase === 'ended');
    // allowSelection controls selection clicks (already checked in listener)
  }

  // BET logic
  function placeChip(amount){
    if(state.player.credits < amount) { alert('Non hai abbastanza crediti'); return; }
    state.player.credits -= amount;
    state.player.bet += amount;
    state.pot += amount;
    log(`Hai puntato ${amount} (totale puntato questo giro: ${state.player.bet})`);
    renderCredits();
    updateButtons();
    setTimeout(cpuRespondToBet, 350);
  }
  function allIn(){
    const amount = state.player.credits;
    state.player.bet += amount;
    state.pot += amount;
    state.player.credits = 0;
    log(`Hai fatto ALL-IN (${amount})`);
    renderCredits();
    setTimeout(cpuRespondToBet, 500);
  }

  // CPU reacts to player bet or opens
  function cpuRespondToBet(){
    if(state.cpu.folded) return;
    const toCall = state.player.bet - state.cpu.bet;
    const s = handStrength(state.cpu.hand);
    if(toCall > 0){
      const follow = (s.rank >= 2) || (s.main >= 4) || (Math.random() < 0.15);
      if(follow){
        state.cpu.bet += toCall;
        if(state.cpu.credits !== Infinity) state.cpu.credits = Math.max(0, state.cpu.credits - toCall);
        state.pot += toCall;
        log(`CPU segue ${toCall}`);
        renderCredits();
        // after follow we allow moving to change phase
        if(state.phase === 'betting'){
          state.phase = 'changing';
          log('Seleziona fino a 4 carte e premi di nuovo \'Cambia carte\'');
        }
      } else {
        state.cpu.folded = true;
        log('CPU esce');
        awardPotToPlayer();
      }
    } else {
      // CPU may open
      const open = (Math.random() < 0.12 && s.rank >= 2) || (Math.random() < 0.06);
      if(open){
        const betAmount = (s.rank >= 2) ? 100 : 50;
        state.cpu.bet += betAmount;
        state.pot += betAmount;
        if(state.cpu.credits !== Infinity) state.cpu.credits = Math.max(0, state.cpu.credits - betAmount);
        log(`CPU punta ${betAmount}`);
        log('CPU ha puntato: rispondi con Fiche o All-in o lasciare uscire');
        renderCredits();
      }
    }
    updateButtons();
  }

  // CPU change logic
  function cpuChangeLogic(){
    if(!state.cpuCanChange || state.cpu.changed) return;
    const counts = {};
    state.cpu.hand.forEach(c=>{ const v = c.split('_')[0]; counts[v]=(counts[v]||0)+1; });
    const keepVals = Object.keys(counts).filter(k=>counts[k] >= 2);
    let changed=false;
    for(let i=0;i<state.cpu.hand.length;i++){
      const v = state.cpu.hand[i].split('_')[0];
      if(keepVals.length === 0){
        if(idxValue(v) < 4){ state.cpu.hand[i] = state.deck.pop(); changed=true; }
      } else {
        if(!keepVals.includes(v)){ state.cpu.hand[i] = state.deck.pop(); changed=true; }
      }
    }
    state.cpu.changed = true;
    log(`CPU cambia carte${changed ? '' : ' (tiene le carte)'}`);
    renderHands(false);
  }

  // Change button handler
  function changeCardsHandler(){
    if(!state.playerCanChange){ alert('Hai già cambiato le carte questa mano'); return; }
    if(!state.allowSelection){
      // enable selection mode
      state.phase = 'changing';
      state.allowSelection = true;
      state.player.selected = [];
      log('Seleziona fino a 4 carte e premi di nuovo \'Cambia carte\' per confermare');
      updateButtons();
      renderHands(false);
      return;
    }
    // confirmation: perform changes
    const sel = state.player.selected.slice();
    // if no selection -> keep cards
    if(sel.length === 0){
      state.player.changed = true;
      state.playerCanChange = false;
      state.allowSelection = false;
      state.player.selected = [];
      log('Hai mantenuto le carte');
      cpuChangeLogic();
      state.phase = 'showdown';
      renderHands(true);
      setTimeout(() => showdown(), 600);
      updateButtons();
      return;
    }
    // replace selected indices
    sel.sort((a,b)=>b-a);
    sel.forEach(i=>{ state.player.hand[i] = state.deck.pop(); });
    // clear selection and flags
    state.player.changed = true;
    state.playerCanChange = false;
    state.allowSelection = false;
    state.player.selected = [];
    renderHands(false);
    log(`Hai cambiato carte (${sel.length})`);
    // cpu change and showdown
    cpuChangeLogic();
    state.phase = 'showdown';
    updateButtons();
    setTimeout(()=> showdown(), 700);
  }

  // SHOWDOWN
  function showdown(){
    renderHands(true);
    if(state.cpu.folded){ awardPotToPlayer(); return; }
    if(state.player.folded){ awardPotToCPU(); return; }
    const p = handStrength(state.player.hand);
    const c = handStrength(state.cpu.hand);
    let winner = null;
    if(p.rank > c.rank) winner = 'player';
    else if(p.rank < c.rank) winner = 'cpu';
    else {
      if(p.main > c.main) winner = 'player';
      else if(p.main < c.main) winner = 'cpu';
      else winner = 'player';
    }
    if(winner === 'player'){
      state.player.credits += state.pot;
      log('VINCI la mano');
    } else {
      state.cpu.credits = (state.cpu.credits===Infinity)? Infinity : state.cpu.credits + state.pot;
      log('CPU vince la mano');
    }
    state.pot = 0;
    state.phase = 'ended';
    state.cpu.revealed = true;
    renderCredits();
    renderHands(true);
    updateButtons();
  }

  function awardPotToPlayer(){
    state.player.credits += state.pot;
    log(`Hai vinto il piatto (${state.pot})`);
    state.pot = 0;
    state.phase = 'ended';
    state.cpu.revealed = true;
    renderCredits();
    renderHands(true);
    updateButtons();
  }
  function awardPotToCPU(){
    state.cpu.credits = (state.cpu.credits===Infinity)? Infinity : state.cpu.credits + state.pot;
    log(`CPU vince il piatto (${state.pot})`);
    state.pot = 0;
    state.phase = 'ended';
    state.cpu.revealed = true;
    renderCredits();
    renderHands(true);
    updateButtons();
  }

  // NEW HAND (preserves credits)
  function newHand(){
    dealNewHand();
  }

  // RECHARGE
  rechargeBtn.onclick = ()=>{
    state.player.credits += 1000;
    renderCredits();
    rechargeBtn.classList.add('hidden');
    log('Hai ricaricato 1000 crediti');
  };

  // EVENTS
  chip50.onclick = ()=> placeChip(50);
  chip100.onclick = ()=> placeChip(100);
  allinBtn.onclick = ()=> { if(confirm('Vuoi andare ALL-IN con tutti i tuoi crediti?')) allIn(); };
  changeBtn.onclick = ()=> changeCardsHandler();
  revealBtn.onclick = ()=> { state.phase = 'showdown'; showdown(); };
  newHandBtn.onclick = ()=> { newHandBtn.classList.add('hidden'); newHand(); };
  lobbyBtn.onclick = ()=> { alert('Torna alla lobby (qui puoi mettere redirect)'); };

  // INIT
  function init(){ dealNewHand(); updateButtons(); }
  init();

  // EXPOSE for debugging
  window.LOTA_STATE = state;

})();
