console.log("✅ app.js cargado correctamente");

// === Datos base ===
const organelas = [
  { nombre: "Núcleo", caracteristicas: ["Contiene ADN", "Dirige la célula", "Tiene envoltura doble"] },
  { nombre: "Mitocondria", caracteristicas: ["Produce ATP", "Respiración celular", "Tiene su propio ADN"] },
  { nombre: "Ribosoma", caracteristicas: ["Sintetiza proteínas", "Puede estar libre o en RER"] },
  { nombre: "RER", caracteristicas: ["Síntesis de proteínas de membrana", "Tiene ribosomas adheridos"] },
  { nombre: "REL", caracteristicas: ["Síntesis de lípidos", "Detoxificación"] },
  { nombre: "Aparato de Golgi", caracteristicas: ["Modifica y empaqueta proteínas", "Forma vesículas"] },
  { nombre: "Lisosoma", caracteristicas: ["Contiene enzimas digestivas", "Degradación celular"] },
  { nombre: "Centríolos", caracteristicas: ["Organizan microtúbulos", "Importantes en división celular"] }
];

let mazo = [...organelas];
let manoJugador = [];
let mesa = [];
let caracteristicaActual = "";

// === Inicializar ===
function repartirCartas() {
  manoJugador = [];
  mazo = [...organelas];
  mesa = [];
  for (let i = 0; i < 3; i++) {
    robarCarta();
  }
  caracteristicaActual = "";
  actualizarVista("Cartas repartidas. Esperando característica...");
}

function robarCarta() {
  if (mazo.length === 0) {
    actualizarVista("⚠️ No quedan cartas en el mazo.");
    return;
  }
  const carta = mazo.splice(Math.floor(Math.random() * mazo.length), 1)[0];
  manoJugador.push(carta);
  actualizarVista("Robaste una carta. Pasás turno.");
}

function darCaracteristica() {
  if (mazo.length === 0) {
    actualizarVista("⚠️ No quedan organelas en el mazo.");
    return;
  }
  const organela = mazo[Math.floor(Math.random() * mazo.length)];
  caracteristicaActual = organela.caracteristicas[Math.floor(Math.random() * organela.caracteristicas.length)];
  actualizarVista(`🔍 Característica: ${caracteristicaActual}`);
}

function jugarCarta(indice) {
  if (!caracteristicaActual) {
    alert("Primero debe darse una característica.");
    return;
  }

  const carta = manoJugador.splice(indice, 1)[0];
  mesa.push(carta);

  if (carta.caracteristicas.includes(caracteristicaActual)) {
    actualizarVista(`✅ ¡Correcto! ${carta.nombre} coincide.`);
  } else {
    actualizarVista(`❌ ${carta.nombre} no coincide. Pasás turno.`);
    robarCarta(); // reponer carta fallida
  }
}

// === Renderizar ===
function mostrarMano() {
  const manoDiv = document.getElementById("mano");
  manoDiv.innerHTML = "";
  manoJugador.forEach((carta, i) => {
    const div = document.createElement("div");
    div.className = "carta";
    div.innerText = carta.nombre;
    div.onclick = () => jugarCarta(i);
    manoDiv.appendChild(div);
  });
}

function mostrarMesa() {
  const mesaDiv = document.getElementById("mesaCartas");
  mesaDiv.innerHTML = "";
  mesa.forEach(carta => {
    const div = document.createElement("div");
    div.className = "carta mesa";
    div.innerText = carta.nombre;
    mesaDiv.appendChild(div);
  });
}

function actualizarVista(mensaje) {
  document.getElementById("estado").innerText = mensaje;
  mostrarMano();
  mostrarMesa();
}

// === Event listeners ===
document.getElementById("btnRepartir").addEventListener("click", repartirCartas);
document.getElementById("btnCaracteristica").addEventListener("click", darCaracteristica);
document.getElementById("btnRobar").addEventListener("click", robarCarta);
