(() => {
  'use strict';
  console.log('✅ app.js cargado (versión: mazo + descartar + jugar + mesa + turnos)');

  // ===== Datos (organelas y sus características) =====
  const ORGANELAS = [
    { nombre: "Núcleo", caracteristicas: ["Contiene ADN", "Dirige la célula", "Tiene envoltura doble"] },
    { nombre: "Mitocondria", caracteristicas: ["Produce ATP", "Respiración celular", "Tiene su propio ADN"] },
    { nombre: "Ribosoma", caracteristicas: ["Sintetiza proteínas", "Puede estar libre o en RER"] },
    { nombre: "RER", caracteristicas: ["Síntesis de proteínas de membrana", "Tiene ribosomas adheridos"] },
    { nombre: "REL", caracteristicas: ["Síntesis de lípidos", "Detoxificación"] },
    { nombre: "Aparato de Golgi", caracteristicas: ["Modifica y empaqueta proteínas", "Forma vesículas"] },
    { nombre: "Lisosoma", caracteristicas: ["Contiene enzimas digestivas", "Degradación celular"] },
    { nombre: "Centríolos", caracteristicas: ["Organizan microtúbulos", "Importantes en división celular"] }
  ];

  // ===== Estado del juego =====
  let deck = [];               // mazo (cartas que quedan)
  let discardPile = [];        // descarte
  let players = [];            // { name, hand:[], score: 0 }
  let table = [];              // cartas jugadas en la mesa: { playerIndex, card, correct: true/false }
  let secretCard = null;       // carta elegida por docente (oculta)
  let clueIndex = 0;           // índice de pista actual dentro de secretCard
  let currentPlayer = 0;       // índice del jugador que tiene el turno
  let gameStarted = false;

  // ===== utilidades =====
  const $ = id => document.getElementById(id);
  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  // ===== UI helpers =====
  function setStatus(txt) {
    $('status').innerText = txt;
  }

  function renderPlayersList() {
    const list = $('playersList');
    list.innerHTML = '';
    players.forEach((p, i) => {
      const div = document.createElement('div');
      div.className = 'playerBadge';
      div.innerText = `${p.name} (${p.hand.length} cartas)`;
      if (i === currentPlayer && gameStarted) div.style.boxShadow = 'inset 0 0 0 2px #0ea5e9';
      list.appendChild(div);
    });
  }

  function renderDeckInfo() {
    $('deckCount').innerText = deck.length;
    $('discardCount').innerText = discardPile.length;
    $('currentPlayerName').innerText = players[currentPlayer] ? players[currentPlayer].name : '—';
  }

  function renderHand() {
    const handDiv = $('hand');
    handDiv.innerHTML = '';
    if (!gameStarted) {
      handDiv.innerHTML = '<em>Inicia la partida para ver tu mano (hotseat).</em>';
      return;
    }
    const player = players[currentPlayer];
    if (!player) return;
    player.hand.forEach((card, idx) => {
      const row = document.createElement('div');
      row.className = 'card';
      row.innerHTML = `
        <div class="name">${card.nombre}</div>
        <div style="display:flex; gap:6px;">
          <button class="discardBtn">Descartar</button>
          <button class="playBtn">Jugar</button>
        </div>
      `;
      // descartar (voluntario)
      row.querySelector('.discardBtn').addEventListener('click', () => {
        confirmDiscard(currentPlayer, idx);
      });
      // jugar (intento)
      row.querySelector('.playBtn').addEventListener('click', () => {
        playCardAsGuess(currentPlayer, idx);
      });
      handDiv.appendChild(row);
    });
  }

  function renderTable() {
    const t = $('table');
    t.innerHTML = '';
    if (table.length === 0) {
      t.innerHTML = '<em>Aún no se jugaron cartas en la mesa.</em>';
      return;
    }
    table.forEach(entry => {
      const div = document.createElement('div');
      div.className = 'card';
      div.innerHTML = `<div><strong>${players[entry.playerIndex].name}</strong> — ${entry.card.nombre}</div>
                       <div>${entry.correct ? '✅ correcto' : '❌ incorrecto'}</div>`;
      div.style.background = entry.correct ? '#d1fae5' : '#fff7ed';
      t.appendChild(div);
    });
  }

  function renderScores() {
    const s = $('scores');
    s.innerHTML = '';
    players.forEach((p, i) => {
      const r = document.createElement('div');
      r.className = 'scoreRow';
      r.innerHTML = `<div>${p.name}</div><div>${p.score} pts</div>`;
      s.appendChild(r);
    });
  }

  function renderAll() {
    renderPlayersList();
    renderDeckInfo();
    renderHand();
    renderTable();
    renderScores();
    $('clueBox').innerHTML = `Pista actual: <em>${secretCard && secretCard.caracteristicas[clueIndex] ? secretCard.caracteristicas[clueIndex] : '—'}</em>`;
  }

  // ===== mecánicas del juego =====
  function resetGameState() {
    deck = [];
    discardPile = [];
    table = [];
    secretCard = null;
    clueIndex = 0;
    currentPlayer = 0;
    gameStarted = false;
    players.forEach(p => { p.hand = []; p.score = 0; });
    setStatus('Partida reiniciada. Agregá jugadores y presioná Iniciar partida.');
    renderAll();
  }

  function addPlayer(name) {
    if (!name || name.trim() === '') return;
    players.push({ name: name.trim(), hand: [], score: 0 });
    $('playerNameInput').value = '';
    renderAll();
  }

  function startGame() {
    if (players.length === 0) { setStatus('Agregá al menos 1 jugador.'); return; }
    // construir mazo desde la constante
    deck = shuffle(ORGANELAS.map(o => ({ ...o })));
    discardPile = [];
    table = [];
    secretCard = null;
    clueIndex = 0;
    currentPlayer = 0;
    gameStarted = true;
    // repartir 3 cartas a cada jugador (si faltan cartas no hay problema)
    players.forEach(p => { p.hand = []; p.score = 0; });
    for (let r = 0; r < 3; r++) {
      players.forEach((p) => {
        if (deck.length > 0) {
          p.hand.push(deck.pop());
        }
      });
    }
    setStatus('Partida iniciada. El docente debe elegir la carta secreta y dar pistas.');
    renderAll();
  }

  function chooseSecretFromDeck() {
    if (!gameStarted) { setStatus('Iniciá la partida primero.'); return; }
    if (deck.length === 0) { setStatus('No quedan cartas para elegir como secreto.'); return; }
    // tomar una carta aleatoria del mazo como secreta (se quita del mazo)
    const idx = Math.floor(Math.random() * deck.length);
    secretCard = deck.splice(idx, 1)[0];
    clueIndex = 0;
    setStatus('Carta secreta elegida (oculta). Podés dar pistas con "Dar siguiente pista".');
    console.log('DEBUG — Carta secreta (NO mostrar en pantalla):', secretCard); // consola solo para docente
    renderAll();
  }

  function revealSecretToConsole() {
    if (!secretCard) { setStatus('No hay carta secreta elegida.'); return; }
    console.log('REVELACIÓN (solo consola):', secretCard);
    setStatus('Secreto mostrado en consola (solo debug).');
  }

  function giveNextClue() {
    if (!secretCard) { setStatus('Primero el docente debe elegir la carta secreta.'); return; }
    clueIndex = (clueIndex + 1) % secretCard.caracteristicas.length;
    setStatus(`Pista dada: "${secretCard.caracteristicas[clueIndex]}"`);
    renderAll();
  }

  function drawForPlayer(playerIndex) {
    if (!gameStarted) { setStatus('La partida no empezó.'); return null; }
    if (deck.length === 0) { setStatus('Mazo vacío: no se puede robar.'); return null; }
    const card = deck.pop();
    players[playerIndex].hand.push(card);
    console.log(`${players[playerIndex].name} robó ${card.nombre}`);
    return card;
  }

  // Acción: robar y pasar turno (botón)
  function actionDrawAndPass() {
    if (!gameStarted) { setStatus('La partida no empezó.'); return; }
    drawForPlayer(currentPlayer);
    setStatus(`${players[currentPlayer].name} robó del mazo y pasó el turno.`);
    endTurn();
  }

  // Acción: descartar voluntario (quita de la mano, lo pone en descarte, repone si puede, y pasa turno)
  function confirmDiscard(playerIndex, cardIndex) {
    if (playerIndex !== currentPlayer) {
      setStatus('No es tu turno.');
      return;
    }
    const card = players[playerIndex].hand[cardIndex];
    if (!card) return;
    // confirmar
    const ok = confirm(`${players[playerIndex].name}, confirmarás DESCARTAR "${card.nombre}" (se robará una carta y pasarás el turno).`);
    if (!ok) return;
    // descartar
    players[playerIndex].hand.splice(cardIndex, 1);
    discardPile.push(card);
    // robar una carta si hay
    if (deck.length > 0) {
      const drawn = drawForPlayer(playerIndex);
      setStatus(`${players[playerIndex].name} descartó ${card.nombre} y robó ${drawn.nombre}. Pasás el turno.`);
    } else {
      setStatus(`${players[playerIndex].name} descartó ${card.nombre}. El mazo está vacío. Pasás el turno.`);
    }
    endTurn();
  }

  // Acción: jugar (intentar adivinar)
  function playCardAsGuess(playerIndex, cardIndex) {
    if (playerIndex !== currentPlayer) {
      setStatus('No es tu turno.');
      return;
    }
    if (!secretCard) {
      alert('Esperá: el docente aún no eligió la carta secreta.');
      return;
    }
    const card = players[playerIndex].hand.splice(cardIndex, 1)[0];
    if (!card) return;
    // evaluar en base a la pista actual (si coincide la característica)
    const pista = secretCard.caracteristicas[clueIndex];
    const esCoincidente = card.caracteristicas.includes(pista);
    if (esCoincidente) {
      // correcto
      table.push({ playerIndex, card, correct: true });
      players[playerIndex].score += 1;
      setStatus(`✅ ${players[playerIndex].name} jugó ${card.nombre} — ¡Correcto! +1 punto.`);
      // NO robar en caso correcto (según regla pedida)
    } else {
      // incorrecto
      table.push({ playerIndex, card, correct: false });
      discardPile.push(card);
      // robar reemplazo si hay
      if (deck.length > 0) {
        const drawn = drawForPlayer(playerIndex);
        setStatus(`❌ ${players[playerIndex].name} jugó ${card.nombre} — Incorrecto. Robó ${drawn.nombre} y pasa el turno.`);
      } else {
        setStatus(`❌ ${players[playerIndex].name} jugó ${card.nombre} — Incorrecto. Mazo vacío; pasa el turno.`);
      }
    }
    // si la carta jugada fue correcta, puede seguir la lógica que prefieras (no robar)
    endTurn();
  }

  function endTurn() {
    // pasar al siguiente jugador con mano (o al siguiente índice)
    currentPlayer = (currentPlayer + 1) % players.length;
    renderAll();
  }

  // ===== handlers y enlazado DOM =====
  function wireUp() {
    $('btnAddPlayer').addEventListener('click', () => {
      const name = $('playerNameInput').value || `Jugador ${players.length + 1}`;
      addPlayer(name);
      setStatus(`Jugador agregado: ${name}`);
    });
    $('btnResetPlayers').addEventListener('click', () => {
      if (!confirm('¿Reiniciar lista de jugadores?')) return;
      players = [];
      resetGameState();
    });
    $('btnStartGame').addEventListener('click', startGame);
    $('btnChooseSecret').addEventListener('click', chooseSecretFromDeck);
    $('btnGiveClue').addEventListener('click', giveNextClue);
    $('btnDraw').addEventListener('click', actionDrawAndPass);
    $('btnRevealSecret').addEventListener('click', revealSecretToConsole);
  }

  // iniciar
  document.addEventListener('DOMContentLoaded', () => {
    wireUp();
    resetGameState();
    renderAll();
  });

  // Export debug helper (opcional)
  window.__organelasLocal = {
    getState: () => ({ deck, discardPile, players, table, secretCard, clueIndex, currentPlayer }),
    forceChooseSecret: chooseSecretFromDeck
  };
})();
