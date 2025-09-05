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

// --- Variables de juego ---
let currentRoomRef;
let myPlayerId;
let myRoomCode;
let isHost = false;

// --- Elementos del DOM ---
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

// --- Datos del juego ---
const ORGANELAS = [
    "Núcleo", "Mitocondria", "Retículo endoplasmático", "Aparato de Golgi",
    "Ribosomas", "Lisosomas", "Vacuola", "Cloroplasto", "Pared celular",
    "Membrana celular", "Citoesqueleto", "Centriolos", "Peroxisomas", "Cilios"
];

// --- Funciones de utilidad ---
function generateRoomCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 4; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function signInAnonymously() {
    return auth.signInAnonymously().then(userCredential => {
        myPlayerId = userCredential.user.uid;
        myPlayerIdDisplay.textContent = myPlayerId.substring(0, 6) + '...';
        console.log("Autenticado como:", myPlayerId);
    }).catch(error => {
        console.error("Error al autenticarse:", error);
    });
}

// --- Crear Sala ---
async function createRoom() {
    await signInAnonymously();
    myRoomCode = generateRoomCode();
    const roomRef = database.ref('salas/' + myRoomCode);

    roomRef.once('value', snapshot => {
        if (snapshot.exists()) {
            console.warn("Código duplicado, generando uno nuevo...");
            createRoom();
            return;
        }

        const initialDeck = shuffleArray([...ORGANELAS]);
        const hostName = "Docente " + myPlayerId.substring(0, 4);

        roomRef.set({
            mazo: initialDeck,
            jugadores: {
                [myPlayerId]: { nombre: hostName, cartas: [] }
            },
            mesa: [],
            turno: null,
            estado: 'esperando_jugadores',
            host: myPlayerId,
            targetOrganelle: null
        });

        isHost = true;
        roomCodeDisplay.textContent = `Sala creada: ${myRoomCode}`;
        playerStatusDisplay.textContent = `Esperando que otro jugador se una...`;
        joinRoom(myRoomCode);
    });
}

// --- Unirse a Sala ---
async function joinRoom(code) {
    if (!myPlayerId) await signInAnonymously();
    myRoomCode = code || roomCodeInput.value.toUpperCase();
    if (!myRoomCode) {
        alert("Introduce un código de sala.");
        return;
    }

    currentRoomRef = database.ref('salas/' + myRoomCode);
    currentRoomRef.once('value', async snapshot => {
        if (!snapshot.exists()) { alert("Sala no existe."); return; }
        const salaData = snapshot.val();

        if (!salaData.jugadores[myPlayerId]) {
            const playerName = "Jugador " + (Object.keys(salaData.jugadores).length + 1);
            await currentRoomRef.child('jugadores/' + myPlayerId).set({ nombre: playerName, cartas: [] });
        }

        isHost = salaData.host === myPlayerId;
        teacherSection.style.display = isHost ? 'block' : 'none';
        landingPage.style.display = 'none';
        gamePage.style.display = 'block';
        currentRoomCodeDisplay.textContent = myRoomCode;

        listenToRoomChanges();
    });
}

// --- Listeners ---
function listenToRoomChanges() {
    currentRoomRef.on('value', snapshot => {
        const sala = snapshot.val();
        if (!sala) return;

        updateMyHand(sala.jugadores[myPlayerId]?.cartas || []);
        updateOtherPlayersHands(sala.jugadores);
        updateTable(sala.mesa);
        updateTurnDisplay(sala.turno);
        updateTeacherSection(sala.host);

        if (isHost && sala.estado === 'esperando_jugadores' && Object.keys(sala.jugadores).length >= 2) {
            startGame(sala);
        }
    });
}

// --- Funciones de actualización ---
function updateMyHand(myCards) { /* ... tu código de actualización de mano ... */ }
function updateOtherPlayersHands(jugadores) { /* ... */ }
function updateTable(mesa) { /* ... */ }
function updateTurnDisplay(currentTurnUid) { /* ... */ }
function updateTeacherSection(hostUid) { /* ... */ }

// --- Juego ---
async function startGame(sala) {
    if (!isHost) return;
    let mazoActual = [...sala.mazo];
    let jugadoresActualizados = { ...sala.jugadores };
    const playerUids = Object.keys(jugadoresActualizados);

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

// --- Acciones del juego ---
async function drawCard() { /* ... */ }
async function playCard(cardName) { /* ... */ }
async function setTargetOrganelle() { /* ... */ }

// --- Event Listeners ---
createRoomBtn.addEventListener('click', createRoom);
joinRoomBtn.addEventListener('click', () => joinRoom());
drawCardBtn.addEventListener('click', drawCard);
setTargetBtn.addEventListener('click', setTargetOrganelle);

// Inicializar autenticación
signInAnonymously();
