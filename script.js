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

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();
const auth = firebase.auth();

// Variables globales
let currentRoomRef, myPlayerId, myRoomCode, isHost = false;

// --- Elementos DOM ---
const createRoomBtn = document.getElementById('createRoomBtn');
const joinRoomBtn = document.getElementById('joinRoomBtn');
const roomCodeInput = document.getElementById('roomCodeInput');
const roomCodeDisplay = document.getElementById('roomCodeDisplay');
const playerStatusDisplay = document.getElementById('playerStatus');
const landingPage = document.getElementById('landing-page');
const gamePage = document.getElementById('game-page');
const myPlayerIdDisplay = document.getElementById('myPlayerId');
const currentRoomCodeDisplay = document.getElementById('currentRoomCode');
const teacherSection = document.getElementById('teacher-section');
const targetOrganelleInput = document.getElementById('targetOrganelleInput');
const setTargetBtn = document.getElementById('setTargetBtn');
const myCardsContainer = document.getElementById('myCardsContainer');
const tableContainer = document.getElementById('tableContainer');
const otherPlayersContainer = document.getElementById('otherPlayersContainer');
const drawCardBtn = document.getElementById('drawCardBtn');

// --- Utils ---
function generateRoomCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for(let i=0;i<4;i++) code += chars.charAt(Math.floor(Math.random()*chars.length));
  return code;
}

function shuffleArray(arr) {
  for(let i=arr.length-1;i>0;i--){
    const j = Math.floor(Math.random()*(i+1));
    [arr[i],arr[j]] = [arr[j],arr[i]];
  }
  return arr;
}

// Autenticación anónima
async function signInAnonymously(){
  try{
    const userCredential = await auth.signInAnonymously();
    myPlayerId = userCredential.user.uid;
    myPlayerIdDisplay.textContent = myPlayerId.substring(0,6)+'...';
    console.log("Autenticado como:", myPlayerId);
  } catch(e){ console.error(e); }
}

// --- Función Crear Sala ---
async function createRoom(){
  await signInAnonymously();
  myRoomCode = generateRoomCode();
  currentRoomRef = database.ref('salas/'+myRoomCode);

  currentRoomRef.once('value', async snapshot => {
    if(snapshot.exists()){
      console.warn("Código repetido, generando otro...");
      createRoom();
      return;
    }
    await currentRoomRef.set({
      jugadores: {[myPlayerId]: {nombre: "Docente", cartas: []}},
      mazo: shuffleArray(["Núcleo","Mitocondria","Ribosomas","Lisosomas"]),
      mesa: [],
      turno: null,
      estado: 'esperando_jugadores',
      host: myPlayerId,
      targetOrganelle: null
    });
    isHost = true;
    roomCodeDisplay.textContent = "Sala creada: "+myRoomCode;
    playerStatusDisplay.textContent = "Esperando jugadores...";
    joinRoom(myRoomCode);
  });
}

// --- Función Unirse a Sala ---
async function joinRoom(code){
  await signInAnonymously();
  myRoomCode = code || roomCodeInput.value.toUpperCase();
  if(!myRoomCode){ alert("Introduce código"); return; }
  currentRoomRef = database.ref('salas/'+myRoomCode);

  currentRoomRef.once('value', snapshot=>{
    if(!snapshot.exists()){ alert("Sala no existe"); return; }
    landingPage.style.display='none';
    gamePage.style.display='block';
    currentRoomCodeDisplay.textContent=myRoomCode;
    console.log("Unido a sala:",myRoomCode);
  });
}

// --- Event Listeners ---
createRoomBtn.addEventListener('click',createRoom);
joinRoomBtn.addEventListener('click',()=>joinRoom());
signInAnonymously();
