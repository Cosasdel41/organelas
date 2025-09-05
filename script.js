// --- 1. Configuración de Firebase ---
// Aquí es donde debes pegar tu objeto de configuración de Firebase.
// Lo encuentras en la Consola de Firebase:
// 1. Ve a "Project settings" (el ícono de la rueda dentada).
// 2. En la sección "Your apps", selecciona la web app (</>).
// 3. Copia el objeto `firebaseConfig`.
const firebaseConfig = {
   // For Firebase JS SDK v7.20.0 and later, measurementId is optional
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

let currentRoomRef; // Referencia a la sala actual en la DB
let myPlayerId; // UID del jugador actual
let myRoomCode; // Código de la sala actual
let isHost = false; // Indica si el jugador actual es el host (docente)

// --- 2. Elementos del DOM ---
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

// --- 3. Datos del Juego ---
const ORGANELAS = [
    "Núcleo", "Mitocondria", "Retículo endoplasmático", "Aparato de Golgi",
    "Ribosomas", "Lisosomas", "Vacuola", "Cloroplasto", "Pared celular",
    "Membrana celular", "Citoesqueleto", "Centriolos", "Peroxisomas", "Cilios"
];

// --- 4. Funciones de Utilidad ---

// Genera un código de 4 dígitos (letras y números)
function generateRoomCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 4; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

// Baraja un array (algoritmo Fisher-Yates)
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// Autenticación anónima para obtener un UID de jugador
function signInAnonymously() {
    return auth.signInAnonymously().then(userCredential => {
        myPlayerId = userCredential.user.uid;
        console.log("Autenticado como:", myPlayerId);
        myPlayerIdDisplay.textContent = myPlayerId.substring(0, 6) + '...'; // Mostrar parte del UID
    }).catch(error => {
        console.error("Error al autenticarse anónimamente:", error);
    });
}

// --- 5. Lógica de Creación/Unión a Sala ---

async function createRoom() {
    await signInAnonymously();
    myRoomCode = generateRoomCode();
    const roomRef = database.ref('salas/' + myRoomCode);

    // Verificar si la sala ya existe (poco probable con código aleatorio)
    roomRef.once('value', async (snapshot) => {
        if (snapshot.exists()) {
            // Regenerar código si por alguna razón ya existe
            console.warn("Código de sala duplicado, generando uno nuevo.");
            createRoom();
            return;
        }

        const initialDeck = shuffleArray([...ORGANELAS]); // Copia y baraja
        const hostName = "Docente " + myPlayerId.substring(0, 4);

        await roomRef.set({
            mazo: initialDeck,
            jugadores: {
                [myPlayerId]: {
                    nombre: hostName,
                    cartas: [] // Inicialmente sin cartas, se reparten al iniciar juego
                }
            },
            mesa: [],
            turno: null, // Se establece cuando hay suficientes jugadores
            estado: 'esperando_jugadores',
            host: myPlayerId,
            targetOrganelle: null // Para que el docente establezca la organela objetivo
        });

        isHost = true;
        roomCodeDisplay.textContent = `Sala creada: ${myRoomCode}`;
        playerStatusDisplay.textContent = `Esperando que otro jugador se una...`;
        joinRoom(myRoomCode); // El creador se une automáticamente a su sala
    });
}

async function joinRoom(code) {
    if (!myPlayerId) {
        await signInAnonymously();
    }
    myRoomCode = code || roomCodeInput.value.toUpperCase();
    if (!myRoomCode) {
        alert("Por favor, introduce un código de sala.");
        return;
    }

    currentRoomRef = database.ref('salas/' + myRoomCode);

    currentRoomRef.once('value', async (snapshot) => {
        if (!snapshot.exists()) {
            alert("La sala no existe. Verifica el código.");
            return;
        }

        const salaData = snapshot.val();
        if (salaData.host === myPlayerId) {
            isHost = true; // Confirmar que soy el host si me re-uno
            teacherSection.style.display = 'block'; // Mostrar sección docente
        } else {
            teacherSection.style.display = 'none'; // Ocultar si no soy el host
        }

        if (!salaData.jugadores || !salaData.jugadores[myPlayerId]) {
            // Si el jugador no está en la sala, añadirlo
            if (Object.keys(salaData.jugadores).length >= 2) {
                alert("La sala ya está llena (máximo 2 jugadores).");
                return;
            }
            const playerName = "Jugador " + (Object.keys(salaData.jugadores).length + 1) + ' ' + myPlayerId.substring(0,4);
            await currentRoomRef.child('jugadores/' + myPlayerId).set({
                nombre: playerName,
                cartas: []
            });
            console.log(`Jugador ${myPlayerId} unido a la sala ${myRoomCode}`);
        }

        // Transición a la página del juego
        landingPage.style.display = 'none';
        gamePage.style.display = 'block';
        currentRoomCodeDisplay.textContent = myRoomCode;

        // Iniciar listeners de la sala
        listenToRoomChanges();
    });
}

// --- 6. Listeners de la Sala (Realtime) ---
function listenToRoomChanges() {
    currentRoomRef.on('value', (snapshot) => {
        const sala = snapshot.val();
        if (!sala) return; // Sala eliminada o no válida

        console.log("Estado de la sala actualizado:", sala);

        // Actualizar mazo y manos de jugadores (solo las tuyas)
        updateMyHand(sala.jugadores[myPlayerId]?.cartas || []);
        updateOtherPlayersHands(sala.jugadores);
        updateTable(sala.mesa);
        updateTurnDisplay(sala.turno);
        updateTeacherSection(sala.host);

        const playersInRoom = Object.keys(sala.jugadores).length;

        // Lógica de inicio de juego (reparto inicial)
        if (isHost && sala.estado === 'esperando_jugadores' && playersInRoom >= 2) {
            console.log("Dos jugadores. Iniciando reparto...");
            startGame(sala);
        }
    });
}

async function startGame(sala) {
    // Solo el host inicia el juego y reparte las cartas
    if (!isHost) return;

    let mazoActual = [...sala.mazo];
    let jugadoresActualizados = { ...sala.jugadores };
    const playerUids = Object.keys(jugadoresActualizados);

    if (playerUids.length < 2) return; // Asegurarse de que haya 2 jugadores

    // Repartir 3 cartas a cada jugador
    for (const pUid of playerUids) {
        for (let i = 0; i < 3; i++) {
            if (mazoActual.length > 0) {
                const card = mazoActual.shift();
                jugadoresActualizados[pUid].cartas.push(card);
            }
        }
    }

    const firstPlayer = playerUids[Math.floor(Math.random() * playerUids.length)]; // Turno aleatorio

    await currentRoomRef.update({
        mazo: mazoActual,
        jugadores: jugadoresActualizados,
        turno: firstPlayer,
        estado: 'jugando'
    });
    console.log("Juego iniciado y cartas repartidas.");
}

function updateMyHand(myCards) {
    myHandContainer.innerHTML = '';
    myCards.forEach(cardName => {
        const cardDiv = document.createElement('div');
        cardDiv.classList.add('card');
        cardDiv.textContent = cardName;
        cardDiv.onclick = () => playCard(cardName); // Permite jugar la carta al hacer click
        myHandContainer.appendChild(cardDiv);
    });
    // Deshabilitar botones si no es mi turno
    const currentTurnPlayer = currentPlayerTurnDisplay.textContent.split('(')[1]?.replace(')', '');
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
        const playerDiv = document.createElement('div');
        playerDiv.classList.add('other-player');
        const numCards = otherPlayer.cartas ? otherPlayer.cartas.length : 0;
        playerDiv.innerHTML = `<h4>${otherPlayer.nombre}</h4><p>Cartas: ${numCards}</p>`;
        otherPlayersContainer.appendChild(playerDiv);
    });
}

function updateTable(mesa) {
    tableContainer.innerHTML = '';
    if (mesa.length === 0) {
        tableContainer.innerHTML = '<p>Nadie ha jugado una carta aún.</p>';
        return;
    }
    mesa.forEach(cardInfo => {
        const cardDiv = document.createElement('div');
        cardDiv.classList.add('card', 'played');
        const playerName = currentRoomRef.child(`jugadores/${cardInfo.jugador}/nombre`); // Fetch player name
        playerName.once('value', (snapshot) => {
            cardDiv.innerHTML = `<strong>${cardInfo.organela}</strong><br><small>(${snapshot.val() || cardInfo.jugador.substring(0,4)})</small>`;
        });
        tableContainer.appendChild(cardDiv);
    });
}

function updateTurnDisplay(currentTurnUid) {
    if (currentTurnUid) {
        currentRoomRef.child(`jugadores/${currentTurnUid}/nombre`).once('value', (snapshot) => {
            const turnPlayerName = snapshot.val() || currentTurnUid.substring(0, 4);
            currentPlayerTurnDisplay.textContent = `Turno de: ${turnPlayerName} (${currentTurnUid === myPlayerId ? 'Tú' : currentTurnUid.substring(0, 6) + '...'})`;
        });
    } else {
        currentPlayerTurnDisplay.textContent = 'Turno de: N/A';
    }
}

function updateTeacherSection(hostUid) {
    if (myPlayerId === hostUid) {
        isHost = true;
        teacherSection.style.display = 'block';
    } else {
        isHost = false;
        teacherSection.style.display = 'none';
    }
    // Sincronizar el input de la organela objetivo si soy el host
    if (isHost) {
        currentRoomRef.child('targetOrganelle').on('value', (snapshot) => {
            targetOrganelleInput.value = snapshot.val() || '';
        });
    } else {
        currentRoomRef.child('targetOrganelle').off(); // Quitar listener si no soy host
    }
}


// --- 7. Acciones del Juego ---

async function drawCard() {
    const snapshot = await currentRoomRef.once('value');
    const sala = snapshot.val();

    if (sala.turno !== myPlayerId) {
        alert("No es tu turno para robar carta.");
        return;
    }
    if (sala.mazo.length === 0) {
        alert("El mazo está vacío.");
        return;
    }

    let mazoActual = [...sala.mazo];
    let myCards = [...(sala.jugadores[myPlayerId]?.cartas || [])];
    const newCard = mazoActual.shift();
    myCards.push(newCard);

    // Determinar siguiente turno
    const playerUids = Object.keys(sala.jugadores);
    const myIndex = playerUids.indexOf(myPlayerId);
    const nextPlayerIndex = (myIndex + 1) % playerUids.length;
    const nextPlayerUid = playerUids[nextPlayerIndex];

    await currentRoomRef.update({
        mazo: mazoActual,
        [`jugadores/${myPlayerId}/cartas`]: myCards,
        turno: nextPlayerUid
    });
    console.log(`Jugador ${myPlayerId} robó ${newCard} y pasó el turno a ${nextPlayerUid}.`);
}

async function playCard(cardName) {
    const snapshot = await currentRoomRef.once('value');
    const sala = snapshot.val();

    if (sala.turno !== myPlayerId) {
        alert("No es tu turno para jugar carta.");
        return;
    }

    let myCards = [...(sala.jugadores[myPlayerId]?.cartas || [])];
    const cardIndex = myCards.indexOf(cardName);
    if (cardIndex === -1) {
        alert("No tienes esa carta en tu mano.");
        return;
    }

    myCards.splice(cardIndex, 1); // Remover carta de la mano
    let mesaActual = [...(sala.mesa || [])];
    mesaActual.push({ organela: cardName, jugador: myPlayerId });

    let newTurn = sala.turno; // Por defecto el mismo turno
    let message = '';
    let shouldDrawPenaltyCard = false;

    // Lógica de "incorrecta" si hay una organela objetivo definida
    if (sala.targetOrganelle) {
        if (cardName.toLowerCase() === sala.targetOrganelle.toLowerCase()) {
            message = `¡${cardName} es la respuesta CORRECTA!`;
            // Si es correcta, el turno pasa al siguiente jugador
            const playerUids = Object.keys(sala.jugadores);
            const myIndex = playerUids.indexOf(myPlayerId);
            newTurn = playerUids[(myIndex + 1) % playerUids.length];
        } else {
            message = `¡${cardName} es INCORRECTA! Debes robar otra carta.`;
            shouldDrawPenaltyCard = true; // Activar el robo de penalización
            newTurn = myPlayerId; // El turno sigue siendo del jugador actual para robar penalización
        }
    } else {
        message = `Jugaste ${cardName}. (Docente no ha establecido organela objetivo.)`;
        // Si no hay objetivo, simplemente pasar el turno
        const playerUids = Object.keys(sala.jugadores);
        const myIndex = playerUids.indexOf(myPlayerId);
        newTurn = playerUids[(myIndex + 1) % playerUids.length];
    }

    await currentRoomRef.update({
        [`jugadores/${myPlayerId}/cartas`]: myCards,
        mesa: mesaActual,
        turno: newTurn // Actualizar turno
    });

    alert(message); // Notificar al jugador

    // Si la carta fue incorrecta y debe robar penalización
    if (shouldDrawPenaltyCard && sala.mazo.length > 0) {
        const mazoActual = [...sala.mazo];
        const penaltyCard = mazoActual.shift();
        myCards.push(penaltyCard); // Añadir la carta de penalización a la mano
        await currentRoomRef.update({
            mazo: mazoActual,
            [`jugadores/${myPlayerId}/cartas`]: myCards,
            turno: newTurn // Asegurar que el turno se mantiene para el mismo jugador
        });
        alert(`Has robado ${penaltyCard} como penalización.`);
        // El turno ahora sí pasa al siguiente jugador después de la penalización
        const playerUids = Object.keys(sala.jugadores);
        const myIndex = playerUids.indexOf(myPlayerId);
        newTurn = playerUids[(myIndex + 1) % playerUids.length];
        await currentRoomRef.update({ turno: newTurn });
    }
    console.log(`Jugador ${myPlayerId} jugó ${cardName}.`);
}

async function setTargetOrganelle() {
    if (!isHost) {
        alert("Solo el Docente (Host) puede establecer la organela objetivo.");
        return;
    }
    const target = targetOrganelleInput.value.trim();
    if (target) {
        await currentRoomRef.child('targetOrganelle').set(target);
        alert(`Organela objetivo establecida: ${target}`);
    } else {
        await currentRoomRef.child('targetOrganelle').set(null);
        alert("Organela objetivo eliminada.");
    }
}


// --- 8. Event Listeners de Botones ---
createRoomBtn.addEventListener('click', createRoom);
joinRoomBtn.addEventListener('click', () => joinRoom()); // Sin argumento, toma del input
drawCardBtn.addEventListener('click', drawCard);
setTargetBtn.addEventListener('click', setTargetOrganelle);

// Inicializar la autenticación anónima al cargar la página
signInAnonymously();
