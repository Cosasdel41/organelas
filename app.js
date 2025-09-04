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
let caracteristicaActual = "";
let descartadas = [];

// === Funciones ===
function repartirCartas() {
  manoJugador = [];
  mazo = [...organelas]; // reinicia mazo
  descartadas = [];
  for (let i = 0; i < 3; i++) {
    robarCarta();
  }
  mostrarMano();
  document.getElementById("estado").innerText = "Cartas repartidas.";
}

function robarCarta() {
  if (mazo.length === 0) return;
  const carta = mazo.splice(Math.floor(Math.random() * mazo.length), 1)[0];
  manoJugador.push(carta);
}

function darCaracteristica() {
  if (mazo.length === 0 && caracteristicaActual === "") {
    document.getElementById("estado").innerText = "No quedan organelas en el mazo.";
    return;
  }
  const organela = mazo[Math.floor(Math.random() * mazo.length)];
  caracteristicaActual = organela.caracteristicas[Math.floor(Math.random() * organela.caracteristicas.length)];
  document.getElementById("estado").innerText = `Característica: ${caracteristicaActual}`;
  mostrarMano();
}

function descartarCarta(indice) {
  if (!caracteristicaActual) {
    alert("Primero el docente debe dar una característica.");
    return;
  }

  const carta = manoJugador.splice(indice, 1)[0];
  let mensaje = "";

  // Chequeo de coincidencia
  if (carta.caracteristicas.includes(caracteristicaActual)) {
    mensaje = `✅ ¡Correcto! ${carta.nombre} coincide con la característica.`;
  } else {
    descartadas.push(carta);
    mensaje = `❌ ${carta.nombre} no coincide. Robás otra carta.`;
    robarCarta();
  }

  document.getElementById("estado").innerText = mensaje;
  mostrarMano();
}

// === Renderizar la mano ===
function mostrarMano() {
  const manoDiv = document.getElementById("mano");
  manoDiv.innerHTML = "";
  manoJugador.forEach((carta, i) => {
    const div = document.createElement("div");
    div.className = "carta";
    div.innerText = carta.nombre;
    div.onclick = () => descartarCarta(i);
    manoDiv.appendChild(div);
  });
}

// === Event listeners ===
document.getElementById("btnRepartir").addEventListener("click", repartirCartas);
document.getElementById("btnCaracteristica").addEventListener("click", darCaracteristica);
