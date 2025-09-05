// --- 1. Configuración de Firebase ---
const firebaseConfig = {
  apiKey: "AIzaSyAyi3xPHyGfJFvnbMbCYQhii2upkXKNR8A",
  authDomain: "organelas-bdccb.firebaseapp.com",
  databaseURL: "https://organelas-bdccb-default-rtdb.firebaseio.com",
  projectId: "organelas-bdccb",
  storageBucket: "organelas-bdccb.firebasestorage.app",
  messagingSenderId: "290015044973",
  appId: "1:290015044973:web:f12b9e3fc63e94e78e2664",
  measurementId: "G-SWWFELJKLK"
};

// Inicializa Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();
const auth = firebase.auth();

// --- 2. Variables globales ---
let currentRoomRef;
let myPlayerId;
let myRoomCode;
let isHost = false;

// --- 3. Elementos del DOM ---
const landingPage = document.getElementById('landing-page');
const gamePage = document.getElementById('game-page');
const createRoomBtn = document.getElementById('createRoomBtn');
const joinRoomBtn = document.getElementById('joinRoomBtn');
const roomCodeInput = document.getElementById('roomCodeInput');
const roomCodeDisplay = document.getElementById('roomCodeDisplay');
const playerStatusDisplay = document.getElementById('playerStatus');
const currentRoomCodeDisplay = document.getElementById('currentRoomCode');
const currentPlayerTurnDisplay = document.getElementById('currentPlayerTurn');
const myHandContainer = document.getElementById('myCardsContainer');
const tableContainer = document.getElementById('tableContainer');
const otherPlayersContainer = document.getElementById('otherPlayersContainer');
const drawCardBtn = document.getElementById('drawCardBtn');
const myPlayerIdDisplay = document.getElementById('myPlayerId');
const teacherSection = document.getElementById('teacher-section');
const targetOrganelleInput = document.getElementById('targetOrganelleInput');
const setTargetBtn = document.getElementById('setTargetBtn');

// --- 4. Datos del Juego ---
const ORGANELAS = [
  "Núcleo", "Mitocondria", "Retículo endoplasmático", "Aparato de Golgi",
  "Ribosomas", "Lisosomas", "Vacuola", "Cloroplasto", "Pared celular",
  "Membrana celular", "Citoesqueleto", "Centriolos", "Peroxisomas", "Cilios"
];

// --- 5. Funciones de utilidad ---
function generateRoomCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 4; i++) result += chars.charAt(Math.floor(Math.random() * chars.length));
  return result;
}

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

async function signInAnonymously() {
  if (myPlayerId) return; // Ya autenticado
  try {
    const userCredential = await auth.signInAnonymously();
    myPlayerId = userCredential.user.uid;
    myPlayerIdDisplay.textContent = myPlayerId.substring(0, 6) + '...';
    console.log("Autenticado como:", myPlayerId);
  } catch (error) {
    console.error("Error al autenticarse:", error);
    alert("Error al autenticarse con Firebase. Revisa la consola.");
  }
}

// --- 6. Crear sala ---
async function createRoom() {
  await signInAnonymously();
  myRoomCode = generateRoomCode();
  const roomRef = database.ref('salas/' + myRoomCode);

  roomRef.once('value', snapshot => {
    if (snapshot.exists()) {
      createRoom(); // Código duplicado
      return;
    }

    const initialDeck = shuffleArray([...ORGANELAS]);
    const hostName = "Docente " + myPlayerId.substring(0, 4);

    roomRef.set({
      mazo: initialDeck,
      jugadores: { [myPlayerId]: { nombre: hostName, cartas: [] } },
      mesa: [],
      turno: null,
      estado: 'esperando_jugadores',
      host: myPlayerId,
      targetOrganelle: null
    }).then(() => {
      isHost = true;
      roomCodeDisplay.textContent = `Sala creada: ${myRoomCode}`;
      playerStatusDisplay.textContent = `Esperando que otro jugador se una...`;
      joinRoom(myRoomCode); // El host se une automáticamente
    });
  });
}

// --- 7. Unirse a sala ---
async function joinRoom(code) {
  await signInAnonymously();
  myRoomCode = code || roomCodeInput.value.toUpperCase();
  if (!myRoomCode) return alert("Por favor, introduce un código de sala.");

  currentRoomRef = database.ref('salas/' + myRoomCode);

  currentRoomRef.on('value', async snapshot => {
    const sala = snapshot.val();
    if (!sala) return alert("La sala no existe.");

    // Añadir jugador si no estaba
    if (!sala.jugadores[myPlayerId]) {
      const playerCount = Object.keys(sala.jugadores).length;
      if (playerCount >= 2) return alert("La sala ya está llena.");
      const playerName = "Jugador " + (playerCount + 1) + ' ' + myPlayerId.substring(0,4);
      await currentRoomRef.child('jugadores/' + myPlayerId).set({
        nombre: playerName,
        cartas: []
      });
    }

    // Mostrar/ocultar sección docente
    if (sala.host === myPlayerId) {
      isHost = true;
      teacherSection.style.display = 'block';
    } else {
      isHost = false;
      teacherSection.style.display = 'none';
    }

    // Mostrar página de juego
    landingPage.style.display = 'none';
    gamePage.style.display = 'block';
    currentRoomCodeDisplay.textContent = myRoomCode;

    // Iniciar juego automáticamente si hay 2 jugadores
    const playersInRoom = Object.keys(sala.jugadores).length;
    if (isHost && sala.estado === 'esperando_jugadores' && playersInRoom >= 2) {
      startGame(sala);
    }

    // Actualizar interfaces
    updateMyHand(sala.jugadores[myPlayerId]?.cartas || []);
    updateOtherPlayersHands(sala.jugadores);
    updateTable(sala.mesa);
    updateTurnDisplay(sala.turno);
    updateTeacherSection(sala.host);
  });
}

// --- 8. Iniciar juego ---
async function startGame(sala) {
  if (!isHost) return;

  let mazoActual = [...sala.mazo];
  let jugadoresActualizados = { ...sala.jugadores };
  const playerUids = Object.keys(jugadoresActualizados);

  // Repartir 3 cartas a cada jugador
  for (const pUid of playerUids) {
    for (let i = 0; i < 3; i++) {
      if (mazoActual.length > 0) jugadoresActualizados[pUid].cartas.push(mazoActual.shift());
    }
  }

  const firstPlayer = playerUids[Math.floor(Math.random() * playerUids.length)];

  await currentRoomRef.update({
    mazo: mazoActual,
    jugadores: jugadoresActualizados,
    turno: firstPlayer,
    estado: 'jugando'
  });
  console.log("Juego iniciado y cartas repartidas.");
}

// --- 9. Actualizar interfaz ---
function updateMyHand(myCards) {
  myHandContainer.innerHTML = '';
  myCards.forEach(cardName => {
    const cardDiv = document.createElement('div');
    cardDiv.classList.add('card');
    cardDiv.textContent = cardName;
    cardDiv.onclick = () => playCard(cardName);
    myHandContainer.appendChild(cardDiv);
  });
  const currentTurnPlayer = currentPlayerTurnDisplay.textContent.split('(')[1]?.replace(')','');
  const isMyTurn = currentTurnPlayer === myPlayerId.substring(0,6)+'...';
  drawCardBtn.disabled = !isMyTurn;
  myHandContainer.querySelectorAll('.card').forEach(card => {
    card.style.pointerEvents = isMyTurn ? 'auto' : 'none';
    card.style.opacity = isMyTurn ? '1' : '0.6';
  });
}

function updateOtherPlayersHands(jugadores) {
  otherPlayersContainer.innerHTML = '';
  const otherPlayerUids = Object.keys(jugadores).filter(uid => uid !== myPlayerId);
  if (otherPlayerUids.length === 0) {
    otherPlayersContainer.innerHTML = '<p>Esperando otros jugadores...</p>';
    return;
  }
  otherPlayerUids.forEach(pUid => {
    const otherPlayer = jugadores[pUid];
    const numCards = otherPlayer.cartas?.length || 0;
    const div = document.createElement('div');
    div.classList.add('other-player');
    div.innerHTML = `<h4>${otherPlayer.nombre}</h4><p>Cartas: ${numCards}</p>`;
    otherPlayersContainer.appendChild(div);
  });
}

function updateTable(mesa) {
  tableContainer.innerHTML = '';
  if (!mesa || mesa.length === 0) {
    tableContainer.innerHTML = '<p>Nadie ha jugado una carta aún.</p>';
    return;
  }
  mesa.forEach(cardInfo => {
    const div = document.createElement('div');
    div.classList.add('card', 'played');
    div.textContent = cardInfo.organela + " (" + cardInfo.jugador.substring(0,4) + ")";
    tableContainer.appendChild(div);
  });
}

function updateTurnDisplay(currentTurnUid) {
  if (currentTurnUid) {
    currentRoomRef.child(`jugadores/${currentTurnUid}/nombre`).once('value', snapshot => {
      const turnPlayerName = snapshot.val() || currentTurnUid.substring(0,4);
      currentPlayerTurnDisplay.textContent = `Turno de: ${turnPlayerName} (${currentTurnUid === myPlayerId ? 'Tú' : currentTurnUid.substring(0,6)+'...'})`;
    });
  } else currentPlayerTurnDisplay.textContent = 'Turno de: N/A';
}

function updateTeacherSection(hostUid) {
  if (myPlayerId === hostUid) {
    isHost = true;
    teacherSection.style.display = 'block';
    currentRoomRef.child('targetOrganelle').on('value', snapshot => {
      targetOrganelleInput.value = snapshot.val() || '';
    });
  } else {
    isHost = false;
    teacherSection.style.display = 'none';
    currentRoomRef.child('targetOrganelle').off();
  }
}

// --- 10. Acciones de juego ---
async function drawCard() {
  const snapshot = await currentRoomRef.once('value');
  const sala = snapshot.val();
  if (!sala) return;

  const mazoActual = [...sala.mazo];
  if (mazoActual.length === 0) return alert("No hay más cartas en el mazo.");

  const cartaRobada = mazoActual.shift();
  const myCards = [...sala.jugadores[myPlayerId].cartas, cartaRobada];

  await currentRoomRef.update({
    mazo: mazoActual,
    [`jugadores/${myPlayerId}/cartas`]: myCards
  });
}

async function playCard(cardName) {
  const snapshot = await currentRoomRef.once('value');
  const sala = snapshot.val();
  if (!sala || sala.turno !== myPlayerId) return alert("No es tu turno.");

  const myCards = [...sala.jugadores[myPlayerId].cartas];
  const cardIndex = myCards.indexOf(cardName);
  if (cardIndex === -1) return alert("No tienes esa carta.");

  myCards.splice(cardIndex,1); // Quitar carta de la mano
  const mesa = sala.mesa || [];
  mesa.push({ jugador: myPlayerId, organela: cardName });

  // Siguiente turno
  const playerUids = Object.keys(sala.jugadores);
  const currentIndex = playerUids.indexOf(myPlayerId);
  const nextPlayer = playerUids[(currentIndex+1)%playerUids.length];

  await currentRoomRef.update({
    [`jugadores/${myPlayerId}/cartas`]: myCards,
    mesa: mesa,
    turno: nextPlayer
  });
}

// --- 11. Host establece orgánulo objetivo ---
setTargetBtn.onclick = () => {
  const target = targetOrganelleInput.value.trim();
  if (!target) return alert("Ingresa un orgánulo objetivo.");
  currentRoomRef.update({ targetOrganelle: target });
};

// --- 12. Botones ---
createRoomBtn.onclick = () => createRoom();
joinRoomBtn.onclick = () => joinRoom();
drawCardBtn.onclick = () => drawCard();
