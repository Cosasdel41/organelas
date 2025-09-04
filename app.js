// Cartas base
const organelas = [
  {
    nombre: "Mitocondria",
    caracteristicas: ["Produce ATP", "Doble membrana", "Respiración celular"]
  },
  {
    nombre: "Núcleo",
    caracteristicas: ["Contiene ADN", "Controla la célula", "Envoltura nuclear"]
  },
  {
    nombre: "Ribosoma",
    caracteristicas: ["Sintetiza proteínas", "ARN + proteínas", "Libre o en RER"]
  },
  {
    nombre: "Aparato de Golgi",
    caracteristicas: ["Modifica y empaqueta proteínas", "Forma vesículas", "Secreción celular"]
  }
];

// Estado del juego
let jugadores = [
  { nombre: "Jugador 1", cartas: [] },
  { nombre: "Jugador 2", cartas: [] }
];
let orgSeleccionada = null;
let indiceCaracteristica = 0;

function repartir() {
  // Copia del mazo
  let mazo = [...organelas];
  
  // Repartir 3 cartas a cada jugador
  jugadores = jugadores.map(j => {
    let cartas = [];
    for (let i = 0; i < 3; i++) {
      if (mazo.length > 0) {
        cartas.push(mazo.pop());
      }
    }
    return { ...j, cartas };
  });

  // Seleccionar organela correcta
  orgSeleccionada = organelas[Math.floor(Math.random() * organelas.length)];
  indiceCaracteristica = 0;

  render();
}

function siguientePista() {
  if (orgSeleccionada) {
    indiceCaracteristica = (indiceCaracteristica + 1) % orgSeleccionada.caracteristicas.length;
    render();
  }
}

function render() {
  const app = document.getElementById("app");

  if (!orgSeleccionada) {
    app.innerHTML = `
      <h1>Juego de Organelas</h1>
      <button id="btnRepartir">Repartir Cartas</button>
    `;
    // Agregar evento después de inyectar el HTML
    document.getElementById("btnRepartir").addEventListener("click", repartir);
    return;
  }

  app.innerHTML = `
    <h1>Juego de Organelas</h1>
    <div>
      <h2>Pista actual:</h2>
      <p><em>${orgSeleccionada.caracteristicas[indiceCaracteristica]}</em></p>
      <button id="btnSiguiente">Siguiente pista</button>
    </div>
    <hr>
    <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top:20px;">
      ${jugadores.map(j => `
        <div>
          <h3>${j.nombre}</h3>
          <div>
            ${j.cartas.map(c => `<div class="card">${c.nombre}</div>`).join("")}
          </div>
        </div>
      `).join("")}
    </div>
  `;

  // Agregar evento al botón de siguiente pista
  document.getElementById("btnSiguiente").addEventListener("click", siguientePista);
}

// Render inicial
render();
