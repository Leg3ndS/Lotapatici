/* script.js - Lotapatici CPU mode
   - Usa cartelle: cards/{cardname}.jpg (es. 1_bastoni.jpg)
   - Dorso: cards/back.png
*/

(() => {
  // --- CONFIG ---
  const START_CREDITS = 1000;
  const MAX_CHANGE = 4;
  const VALUES_ORDER = ["1","2","3","4","5","6","7","F","C","R"]; // "1" = asso (alto)
  const SUITS = ["coppe","denari","bastoni","spade"];
  // ----------------

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

  // GAME STATE
  let state = {
    deck: [],
    player: { credits: START_CREDITS, hand: [], bet: 0, changed: false, selected: [] },
    cpu: { credits: START_CREDITS, hand: [], bet: 0, changed: false, folded: false },
    pot: 0,
    phase: 'idle', // idle | betting | changing | showdown | ended
    playerCanChange: true,
    cpuCanChange: true,
    allowSelection: false
  };

  // UTILITIES
  function shuffle(a){
    for(let i=a.length-1;i>0;i--){
      const j=Math.floor(Math.random()*(i+1));
      [a[i],a[j]]=[a[j],a[i]];
    }
    return a;
  }
  function buildDeck(){
    const d=[];
    for(const s of SUITS){
      for(const v of VALUES_ORDER){
        d.push(`${v}_${s}`);
      }
    }
    return shuffle(d);
  }
  function idxValue(v){
    // higher index => stronger except we want "1" highest => reorder
    const order = [...VALUES_ORDER];
    // treat "1" as highest: move it to the end
    // but VALUES_ORDER already has "1" first—make mapping: position where larger means stronger
    // We'll map "1" -> 100 to ensure highest; else use index
    if(v==="1") return 100;
    return VALUES_ORDER.indexOf(v);
  }
  function handStrength(hand){
    // hand: array of cardName like "5_denari"
    const vals = hand.map(c => c.split('_')[0]);
    const counts = {};
    vals.forEach(v=>counts[v]=(counts[v]||0)+1);
    let rank=1, main= -1; // 1 high card, 2 pair, 3 tris
    for(const k in counts){
      if(counts[k]===3){ rank=3; main = Math.max(main, idxValue(k)); }
      if(counts[k]===2 && rank<3){ rank=2; main = Math.max(main, idxValue(k)); }
      // for high card, compute highest value
    }
    if(rank===1) main = Math.max(...vals.map(v=>idxValue(v)));
    return {rank, main};
  }

  function log(msg){
    logEl.textContent += msg + '\n';
    logEl.scrollTop = logEl.scrollHeight;
  }

  function renderCredits(){
    creditsText.textContent = `Crediti: Tu ${state.player.credits} | CPU ${state.cpu.credits===Infinity ? '∞' : state.cpu.credits}`;
    potText.textContent = `Piatto: ${state.pot}`;
  }

  function renderHands(reveal=false){
    // player
    playerCardsEl.innerHTML = '';
    state.player.hand.forEach((c,i)=>{
      const card = document.createElement('div');
      card.className = 'card' + (state.player.selected.includes(i) ? ' selected' : '');
      const img = document.createElement('img');
      img.src = `cards/${c}.jpg`;
      card.appendChild(img);
      if(state.allowSelection){
        card.onclick = ()=> toggleSelect(i, card);
      } else {
        card.onclick = null;
      }
      playerCardsEl.appendChild(card);
    });

    // CPU
    cpuCardsEl.innerHTML = '';
    state.cpu.hand.forEach((c,i)=>{
      const card = document.createElement('div');
      card.className = 'card';
      const img = document.createElement('img');
      // show back unless reveal or game ended
      if(reveal || state.phase==='ended' || state.cpu.revealed){
        img.src = `cards/${c}.jpg`;
      } else {
        img.src = `cards/back.png`;
      }
      card.appendChild(img);
      cpuCardsEl.appendChild(card);
    });
  }

  function toggleSelect(i, el){
    if(!state.allowSelection) return;
    const sel = state.player.selected;
    if(sel.includes(i)){
      state.player.selected = sel.filter(x=>x!==i);
    } else {
      if(sel.length >= MAX_CHANGE) return;
      state.player.selected.push(i);
    }
    renderHands();
  }

  // DEAL / NEW HAND
  function dealNewHand(){
    state.deck = buildDeck();
    state.player.hand = state.deck.splice(0,5);
    state.cpu.hand = state.deck.splice(0,5);
    state.player.bet = 0; state.cpu.bet = 0;
    state.player.selected = [];
    state.player.changed = false; state.cpu.changed = false; state.cpu.folded = false;
    state.pot = 0;
    state.phase = 'betting';
    state.playerCanChange = true; state.cpuCanChange = true;
    state.allowSelection = false;
    renderCredits();
    renderHands(false);
    log('Nuova mano iniziata');
    updateButtons();
  }

  // BUTTON VISIBILITY / ENABLE
  function updateButtons(){
    // show/hide new hand only when ended
    newHandBtn.classList.toggle('hidden', state.phase !== 'ended');
    rechargeBtn.classList.toggle('hidden', state.player.credits > 0);
    // change selection allowed only in 'changing' and if player hasn't changed yet
    changeBtn.disabled = !(state.phase === 'changing' && state.playerCanChange && state.player.credits >= 0);
    chip50.disabled = !(state.phase === 'betting');
    chip100.disabled = !(state.phase === 'betting');
    allinBtn.disabled = !(state.phase === 'betting' && state.player.credits > 0);
    revealBtn.disabled = !(state.phase === 'showdown' || state.phase === 'ended');
    // allow selection flag controls card click
    state.allowSelection = (state.phase === 'changing' && state.playerCanChange);
  }

  // BET ACTIONS
  function placeChip(amount){
    if(state.player.credits < amount) {
      alert('Non hai abbastanza crediti');
      return;
    }
    state.player.credits -= amount;
    state.player.bet += amount;
    state.pot += amount;
    log(`Hai puntato ${amount} (totale puntato questo giro: ${state.player.bet})`);
    renderCredits();
    updateButtons();
    // CPU decision immediate: decide to follow or fold or raise
    setTimeout(cpuRespondToBet, 450);
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

  // CPU LOGIC FOR RESPONDING TO A BET
  function cpuRespondToBet(){
    // simple CPU: evaluate its current hand (if hasn't changed yet, consider it may change later)
    // We'll make CPU decision to follow based on expected strength.
    // If CPU has already changed or not doesn't matter here: use handStrength.
    const s = handStrength(state.cpu.hand);
    // if CPU folded already, ignore
    if(state.cpu.folded) return;

    // if player bet 0, CPU might open bet itself: small chance
    if(state.player.bet > state.cpu.bet){
      const toCall = state.player.bet - state.cpu.bet;
      // CPU decision: follow if pair/tris OR high card >= threshold OR random small chance
      const follow = (s.rank >= 2) || (s.main >= 4) || (Math.random() < 0.15);
      if(follow){
        // CPU follows
        state.cpu.bet += toCall;
        // CPU has "infinite" credits? we track credits but can set high number; check enough credits
        if(state.cpu.credits !== Infinity) state.cpu.credits = Math.max(0, state.cpu.credits - toCall);
        state.pot += toCall;
        log(`CPU segue ${toCall}`);
        renderCredits();
        // after both have bet, move to change phase if it's first betting round
        // If both have had opportunity and haven't changed -> go to changing
        // We'll assume one betting round then change
        if(state.phase === 'betting'){
          state.phase = 'changing';
          log('Seleziona fino a 4 carte e premi di nuovo \'Cambia carte\'');
        }
        updateButtons();
      } else {
        // CPU folds
        state.cpu.folded = true;
        log('CPU esce');
        // assign pot to player immediately
        awardPotToPlayer();
      }
    } else {
      // player didn't bet, CPU may decide to open:
      const open = (Math.random() < 0.12 && s.rank >= 2) || (Math.random() < 0.06);
      if(open){
        const betAmount = (s.rank >= 2) ? 100 : 50;
        state.cpu.bet += betAmount;
        state.pot += betAmount;
        if(state.cpu.credits !== Infinity) state.cpu.credits = Math.max(0, state.cpu.credits - betAmount);
        log(`CPU punta ${betAmount}`);
        renderCredits();
        // now the player must decide: follow (we show Segui/Esi) - in our UI player uses chip buttons or All-in; to make it explicit, we log and expect player to follow via buttons
        // But to make it explicit we add a short note
        log('CPU ha puntato: puoi seguire con Fiche o All-in o lasciare uscire');
        updateButtons();
      }
    }
  }

  // CPU CHANGE CARDS LOGIC (called when entering changing phase or when player confirms change)
  function cpuChangeLogic(){
    if(!state.cpuCanChange || state.cpu.changed) return;
    // simple rule: remove cards that don't help pair/tris
    const counts = {};
    state.cpu.hand.forEach(c=>{
      const v = c.split('_')[0];
      counts[v]=(counts[v]||0)+1;
    });
    // try to keep pairs/tris
    const keepVals = Object.keys(counts).filter(k=>counts[k] >= 2);
    let changed = false;
    for(let i=0;i<state.cpu.hand.length;i++){
      const v = state.cpu.hand[i].split('_')[0];
      if(keepVals.length === 0){
        // if no pair, replace low-value cards (value < 4)
        if(idxValue(v) < 4){
          state.cpu.hand[i] = state.deck.pop();
          changed = true;
        }
      } else {
        // keep the keepVals, replace others
        if(!keepVals.includes(v)){
          state.cpu.hand[i] = state.deck.pop();
          changed = true;
        }
      }
    }
    state.cpu.changed = true;
    log(`CPU cambia carte${changed ? '' : ' (tiene le carte)'}`);
    renderHands(false);
  }

  // PLAYER CHANGE ACTION: first press enables selection, second press confirms
  function changeCardsHandler(){
    if(state.phase !== 'changing' && state.phase !== 'betting') {
      // allow also if in betting and moving to changing
      // but normally should be in 'changing'
    }

    if(!state.playerCanChange) {
      alert('Hai già cambiato le carte questa mano');
      return;
    }

    // if selection not active yet: enable selection
    if(!state.allowSelection){
      state.phase = 'changing';
      state.allowSelection = true;
      state.player.selected = [];
      log('Seleziona fino a 4 carte e premi di nuovo \'Cambia carte\' per confermare');
      updateButtons();
      renderHands(false);
      return;
    }

    // second press: confirm change
    const sel = state.player.selected.slice();
    if(sel.length === 0){
      // player pressed without selecting -> assumes keeps cards
      state.player.changed = true;
      state.playerCanChange = false;
      state.allowSelection = false;
      log('Hai mantenuto le carte');
      // CPU still can change
      cpuChangeLogic();
      // proceed to showdown phase
      state.phase = 'showdown';
      setTimeout(() => showdown(), 600);
      updateButtons();
      renderHands(false);
      return;
    }
    // replace selected indices with top deck cards
    sel.sort((a,b)=>b-a); // replace from highest index to avoid reindexing
    sel.forEach(i=>{
      state.player.hand[i] = state.deck.pop();
    });
    state.player.changed = true;
    state.playerCanChange = false;
    state.allowSelection = false;
    renderHands(false);
    log(`Hai cambiato carte (${sel.length})`);
    // CPU now performs its change (with logic)
    cpuChangeLogic();
    // move to showdown
    state.phase = 'showdown';
    updateButtons();
    setTimeout(() => showdown(), 700);
  }

  // SHOWDOWN: evaluate hands and assign pot
  function showdown(){
    // reveal CPU cards
    renderHands(true);
    // if someone folded earlier, award already done
    if(state.cpu.folded){
      awardPotToPlayer(); return;
    }
    if(state.player.folded){
      awardPotToCPU(); return;
    }
    const p = handStrength(state.player.hand);
    const c = handStrength(state.cpu.hand);
    // compare rank then main
    let winner = null;
    if(p.rank > c.rank) winner = 'player';
    else if(p.rank < c.rank) winner = 'cpu';
    else {
      if(p.main > c.main) winner = 'player';
      else if(p.main < c.main) winner = 'cpu';
      else winner = 'player'; // tie-break: favor player
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
    updateButtons();
    renderCredits();
    renderHands(true);
  }

  function awardPotToPlayer(){
    state.player.credits += state.pot;
    log(`Hai vinto il piatto (${state.pot})`);
    state.pot = 0;
    state.phase = 'ended';
    renderCredits();
    renderHands(true);
    updateButtons();
  }
  function awardPotToCPU(){
    state.cpu.credits = (state.cpu.credits===Infinity)? Infinity : state.cpu.credits + state.pot;
    log(`CPU vince il piatto (${state.pot})`);
    state.pot = 0;
    state.phase = 'ended';
    renderCredits();
    renderHands(true);
    updateButtons();
  }

  // NEW HAND preserved credits
  function newHand(){
    // If player's credits are 0, show recharge suggestion
    if(state.player.credits <= 0){
      rechargeBtn.classList.remove('hidden');
    }
    // Reset small things and deal
    dealNewHand();
  }

  // RECHARGE
  rechargeBtn.onclick = ()=>{
    state.player.credits += 1000;
    renderCredits();
    rechargeBtn.classList.add('hidden');
    log('Hai ricaricato 1000 crediti');
  };

  // EVENT BINDINGS
  chip50.onclick = ()=> placeChip(50);
  chip100.onclick = ()=> placeChip(100);
  allinBtn.onclick = ()=> {
    if(confirm('Vuoi andare ALL-IN con tutti i tuoi crediti?')) allIn();
  };
  changeBtn.onclick = ()=> changeCardsHandler();
  revealBtn.onclick = ()=> {
    state.phase = 'showdown';
    showdown();
  };
  newHandBtn.onclick = ()=> {
    newHandBtn.classList.add('hidden');
    newHand();
  };
  lobbyBtn.onclick = ()=> {
    alert('Torna alla lobby (qui puoi impostare il redirect reale)');
  };

  // INIT
  function init(){
    // CPU credits infinite? set to Infinity or fixed
    // state.cpu.credits = Infinity; // optional
    dealNewHand();
  }

  // start
  init();

  // Expose for debugging
  window.LOTA_STATE = state;

})();
