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

firebase.initializeApp(firebaseConfig);
const database = firebase.database();
const auth = firebase.auth();
auth.signInAnonymously()
  .then(userCredential => {
    const myPlayerId = userCredential.user.uid;
    console.log("Autenticado como:", myPlayerId);
    alert("Autenticación correcta: " + myPlayerId.substring(0,6) + "...");
  })
  .catch(error => {
    console.error("Error al autenticarse:", error);
    alert("Error al autenticarse con Firebase. Revisa la consola.");
  });


// --- 2. Variables globales ---
let myPlayerId = null;
let myRoomCode = null;
let currentRoomRef = null;

// --- 3. Elementos DOM ---
const createRoomBtn = document.getElementById('createRoomBtn');
const joinRoomBtn = document.getElementById('joinRoomBtn');
const roomCodeInput = document.getElementById('roomCodeInput');
const roomCodeDisplay = document.getElementById('roomCodeDisplay');
const playerStatusDisplay = document.getElementById('playerStatus');

// --- 4. Funciones de utilidad ---
function generateRoomCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for(let i=0;i<4;i++) code += chars.charAt(Math.floor(Math.random()*chars.length));
  return code;
}

// --- 5. Autenticación anónima al cargar ---
auth.signInAnonymously()
  .then(userCredential => {
    myPlayerId = userCredential.user.uid;
    console.log("Autenticado como:", myPlayerId);
  })
  .catch(error => {
    console.error("Error autenticación anónima:", error);
    alert("No se pudo autenticar con Firebase");
  });

// --- 6. Crear Sala ---
async function createRoom() {
  if (!myPlayerId) {
    alert("Esperando autenticación de Firebase... recarga si tarda demasiado.");
    return;
  }

  myRoomCode = generateRoomCode();
  currentRoomRef = database.ref('salas/' + myRoomCode);

  currentRoomRef.once('value', async snapshot => {
    if (snapshot.exists()) {
      console.warn("Código repetido, generando otro...");
      createRoom();
      return;
    }

    await currentRoomRef.set({
      jugadores: { [myPlayerId]: { nombre: "Docente", cartas: [] } },
      mazo: ["Núcleo","Mitocondria","Ribosomas","Lisosomas"],
      mesa: [],
      turno: null,
      estado: "esperando_jugadores",
      host: myPlayerId,
      targetOrganelle: null
    });

    roomCodeDisplay.textContent = "Sala creada: " + myRoomCode;
    playerStatusDisplay.textContent = "Esperando que otro jugador se una...";
    console.log("Sala creada:", myRoomCode);
  });
}

// --- 7. Unirse a Sala ---
async function joinRoom() {
  if (!myPlayerId) {
    alert("Esperando autenticación...");
    return;
  }

  const code = roomCodeInput.value.toUpperCase();
  if (!code) {
    alert("Ingresa un código de sala.");
    return;
  }

  currentRoomRef = database.ref('salas/' + code);
  currentRoomRef.once('value', async snapshot => {
    if (!snapshot.exists()) {
      alert("La sala no existe. Verifica el código.");
      return;
    }

    const sala = snapshot.val();
    if (!sala.jugadores[myPlayerId]) {
      // Agregar jugador
      await currentRoomRef.child('jugadores/' + myPlayerId).set({ nombre: "Jugador", cartas: [] });
    }

    myRoomCode = code;
    roomCodeDisplay.textContent = "Sala unida: " + myRoomCode;
    playerStatusDisplay.textContent = "Esperando al host o jugando...";
    console.log("Unido a sala:", myRoomCode);
  });
}

// --- 8. Botones ---
createRoomBtn.addEventListener('click', createRoom);
joinRoomBtn.addEventListener('click', joinRoom);
