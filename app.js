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

// === Funciones ===
function repartirCartas() {
  manoJugador = [];
  mazo = [...organelas]; // reinicia mazo
  for (let i = 0; i < 3; i++) {
    const carta = mazo.splice(Math.floor(Math.random() * mazo.length), 1)[0];
    manoJugador.push(carta);
  }
  mostrarMano();
  document.getElementById("estado").innerText = "Cartas repartidas.";
  console.log("👉 Mano actual:", manoJugador);
}

function darCaracteristica() {
  if (mazo.length === 0) {
    document.getElementById("estado").innerText = "No quedan organelas en el mazo.";
    return;
  }
  const organela = mazo[Math.floor(Math.random() * mazo.length)];
  caracteristicaActual = organela.caracteristicas[Math.floor(Math.random() * organela.caracteristicas.length)];
  document.getElementById("estado").innerText = `Característica: ${caracteristicaActual}`;
  console.log("👉 Característica actual:", caracteristicaActual, "de", organela.nombre);
}

function mostrarMano() {
  const manoDiv = document.getElementById("mano");
  manoDiv.innerHTML = "";
  manoJugador.forEach(carta => {
    const div = document.createElement("div");
    div.className = "carta";
    div.innerText = carta.nombre;
    manoDiv.appendChild(div);
  });
}

// === Event listeners ===
document.getElementById("btnRepartir").addEventListener("click", repartirCartas);
document.getElementById("btnCaracteristica").addEventListener("click", darCaracteristica);
