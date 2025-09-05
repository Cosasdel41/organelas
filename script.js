import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getDatabase, ref, set, push, onValue, update } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-database.js";

// ⚡ Configura con tus credenciales de Firebase
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

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const pantallaInicio = document.getElementById("pantalla-inicio");
const pantallaJuego = document.getElementById("pantalla-juego");
const crearSalaBtn = document.getElementById("crear-sala");
const unirseSalaBtn = document.getElementById("unirse-sala");
const codigoSalaInput = document.getElementById("codigo-sala-input");
const tituloSala = document.getElementById("titulo-sala");
const turnoActual = document.getElementById("turno-actual");
const cartasJugadorDiv = document.getElementById("cartas-jugador");
const cartasMesaDiv = document.getElementById("cartas-mesa");
const robarBtn = document.getElementById("robar-carta");

let codigoSala = "";
let jugadorId = "";
let salaRef;
let turnoLocal = "";

// Lista de organelas
const mazoInicial = [
  "Núcleo",
  "Mitocondria",
  "Cloroplasto",
  "Retículo endoplasmático",
  "Ribosoma",
  "Aparato de Golgi",
  "Lisosoma",
  "Peroxisoma",
  "Vacuola"
];

// 💡 Funciones
function generarCodigoSala() {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

// Crear sala
crearSalaBtn.addEventListener("click", () => {
  codigoSala = generarCodigoSala();
  jugadorId = "jugador1";
  salaRef = ref(db, "salas/" + codigoSala);

  const cartas = [...mazoInicial].sort(() => Math.random() - 0.5);
  const jugadorCartas = cartas.splice(0, 3);

  set(salaRef, {
    mazo: cartas,
    jugadores: {
      [jugadorId]: { cartas: jugadorCartas }
    },
    mesa: [],
    turno: jugadorId
  }).then(() => {
    iniciarJuego();
  });
});

// Unirse a sala
unirseSalaBtn.addEventListener("click", () => {
  codigoSala = codigoSalaInput.value;
  if (!codigoSala) return alert("Ingresa un código de sala");
  jugadorId = "jugador2";
  salaRef = ref(db, "salas/" + codigoSala);

  onValue(salaRef, (snapshot) => {
    const data = snapshot.val();
    if (!data) return alert("Sala no encontrada");

    if (!data.jugadores[jugadorId]) {
      const jugadorCartas = data.mazo.splice(0,3);
      update(salaRef, {
        mazo: data.mazo,
        [`jugadores/${jugadorId}`]: { cartas: jugadorCartas }
      });
    }
    iniciarJuego();
  }, { onlyOnce: true });
});

function iniciarJuego() {
  pantallaInicio.style.display = "none";
  pantallaJuego.style.display = "block";
  tituloSala.textContent = "Sala: " + codigoSala;

  // Escuchar cambios en la sala
  onValue(salaRef, (snapshot) => {
    const data = snapshot.val();
    if (!data) return;

    turnoLocal = data.turno;
    turnoActual.textContent = turnoLocal;
    actualizarMesa(data.mesa);
    actualizarMano(data.jugadores[jugadorId].cartas);
  });
}

// Actualizar mesa
function actualizarMesa(mesa) {
  cartasMesaDiv.innerHTML = "";
  mesa.forEach(item => {
    const div = document.createElement("div");
    div.classList.add("carta");
    div.textContent = item.nombre + " (" + item.jugador + ")";
    cartasMesaDiv.appendChild(div);
  });
}

// Actualizar mano del jugador
function actualizarMano(cartas) {
  cartasJugadorDiv.innerHTML = "";
  cartas.forEach((nombre, index) => {
    const div = document.createElement("div");
    div.classList.add("carta");
    div.textContent = nombre;
    div.addEventListener("click", () => jugarCarta(index, nombre));
    cartasJugadorDiv.appendChild(div);
  });
}

// Robar carta
robarBtn.addEventListener("click", async () => {
  const snapshot = await ref(db, "salas/" + codigoSala).get();
  const data = snapshot.val();
  if (turnoLocal !== jugadorId) return alert("No es tu turno");
  if (!data.mazo.length) return alert("Mazo vacío");

  const carta = data.mazo.shift();
  data.jugadores[jugadorId].cartas.push(carta);

  await update(salaRef, {
    mazo: data.mazo,
    [`jugadores/${jugadorId}/cartas`]: data.jugadores[jugadorId].cartas
  });

  cambiarTurno(data);
});

// Jugar carta
async function jugarCarta(index, nombre) {
  const snapshot = await ref(db, "salas/" + codigoSala).get();
  const data = snapshot.val();
  if (turnoLocal !== jugadorId) return alert("No es tu turno");

  // Para este ejemplo, asumimos que el docente define "Núcleo" como respuesta correcta
  const respuestaCorrecta = "Núcleo";

  const carta = data.jugadores[jugadorId].cartas.splice(index, 1)[0];

  if (carta === respuestaCorrecta) {
    data.mesa.push({ nombre: carta, jugador: jugadorId });
    await update(salaRef, {
      mesa: data.mesa,
      [`jugadores/${jugadorId}/cartas`]: data.jugadores[jugadorId].cartas
    });
    alert("¡Correcto!");
  } else {
    alert("Incorrecto, robas otra carta");
    if (data.mazo.length) {
      const nuevaCarta = data.mazo.shift();
      data.jugadores[jugadorId].cartas.push(nuevaCarta);
      await update(salaRef, {
        mazo: data.mazo,
        [`jugadores/${jugadorId}/cartas`]: data.jugadores[jugadorId].cartas
      });
    }
  }

  cambiarTurno(data);
}

// Cambiar turno
async function cambiarTurno(data) {
  const siguiente = Object.keys(data.jugadores).find(j => j !== jugadorId);
  await update(salaRef, { turno: siguiente });
}
