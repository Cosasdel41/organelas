(() => {
  'use strict';

  // Datos base
  const ORGANELAS = [
    { nombre: "Mitocondria", caracteristicas: ["Produce ATP", "Doble membrana", "Respiración celular"] },
    { nombre: "Núcleo", caracteristicas: ["Contiene ADN", "Controla la célula", "Envoltura nuclear"] },
    { nombre: "Ribosoma", caracteristicas: ["Sintetiza proteínas", "ARN + proteínas", "Libre o en RER"] },
    { nombre: "Aparato de Golgi", caracteristicas: ["Modifica y empaqueta proteínas", "Forma vesículas", "Secreción celular"] }
  ];

  // Estado
  let jugadores = [
    { nombre: "Jugador 1", cartas: [] },
    { nombre: "Jugador 2", cartas: [] }
  ];
  let mazo = [];
  let cartaRespuesta = null;
  let indiceCaracteristica = 0;

  // Utilidades
  function shuffle(array) {
    const a = array.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  // Repartir: baraja, separa carta-respuesta y da 3 cartas a cada jugador
  function repartir() {
    console.log('Acción: repartir');
    const copia = ORGANELAS.map(o => ({ ...o })); // copia para no mutar constante
    mazo = shuffle(copia);

    if (mazo.length === 0) {
      console.error('Mazo vacío: revisá ORGANELAS');
      return;
    }

    // Saco la carta-respuesta del mazo
    cartaRespuesta = mazo.pop();
    console.log('Carta-respuesta elegida:', cartaRespuesta.nombre);

    // Repartir 3 cartas por jugador (si no hay suficientes, repartir lo que queda)
    jugadores = jugadores.map(j => {
      const cartas = [];
      for (let i = 0; i < 3; i++) {
        if (mazo.length > 0) {
          cartas.push(mazo.pop());
        }
      }
      return { ...j, cartas };
    });

    indiceCaracteristica = 0;
    render();
  }

  function siguientePista() {
    if (!cartaRespuesta) return;
    indiceCaracteristica = (indiceCaracteristica + 1) % cartaRespuesta.caracteristicas.length;
    console.log('Siguiente pista (índice):', indiceCaracteristica, '-', cartaRespuesta.caracteristicas[indiceCaracteristica]);
    render();
  }

  function reiniciar() {
    console.log('Reiniciar partida');
    // vaciar manos y estado
    jugadores = jugadores.map(j => ({ nombre: j.nombre, cartas: [] }));
    mazo = [];
    cartaRespuesta = null;
    indiceCaracteristica = 0;
    render();
  }

  // Renderiza la UI y engancha eventos
  function render() {
    const app = document.getElementById('app');
    if (!app) {
      console.error('#app no encontrado en el DOM');
      return;
    }

    // Si no hay partida iniciada, mostrar botón repartir
    if (!cartaRespuesta) {
      app.innerHTML = `
        <h1>Juego de Organelas</h1>
        <p>Presioná <strong>Repartir</strong> para comenzar una partida (se asignan 3 cartas por jugador).</p>
        <div style="display:flex; gap:8px; margin-top:12px;">
          <button id="btnRepartir">Repartir Cartas</button>
          <button id="btnReiniciar" style="background:#ef4444">Reiniciar</button>
        </div>
      `;
      document.getElementById('btnRepartir').addEventListener('click', repartir);
      document.getElementById('btnReiniciar').addEventListener('click', reiniciar);
      return;
    }

    // Partida en curso
    const pistaActual = cartaRespuesta.caracteristicas[indiceCaracteristica] || '—';

    app.innerHTML = `
      <h1>Juego de Organelas</h1>
      <div>
        <h2>Pista actual:</h2>
        <p><em id="pistaText">${pistaActual}</em></p>
        <div style="display:flex; gap:8px; margin-bottom:8px;">
          <button id="btnSiguiente">Siguiente pista</button>
          <button id="btnReiniciar2" style="background:#ef4444">Reiniciar</button>
        </div>
      </div>
      <hr>
      <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top:20px;">
        ${jugadores.map(j => `
          <div>
            <h3>${j.nombre}</h3>
            <div>${j.cartas.length === 0 ? '<em>Sin cartas</em>' : j.cartas.map(c => `<div class="card">${c.nombre}</div>`).join("")}</div>
          </div>
        `).join("")}
      </div>
      <div style="margin-top:12px; font-size:0.9em; color:#555;">
        <strong>DEBUG:</strong> cartas restantes en mazo: <span id="mazoCount">${mazo.length}</span>
        &nbsp;|&nbsp; carta-respuesta: <span id="respuestaNombre">${cartaRespuesta.nombre}</span>
      </div>
    `;

    // Eventos
    document.getElementById('btnSiguiente').addEventListener('click', siguientePista);
    document.getElementById('btnReiniciar2').addEventListener('click', reiniciar);
  }

  // Start when DOM is ready
  document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM cargado — inicializando juego');
    render();
  });

  // Exponer funciones a consola para depuración (opcional)
  window.__organelasDebug = {
    repartir,
    siguientePista,
    reiniciar,
    getState: () => ({ jugadores, mazo, cartaRespuesta, indiceCaracteristica })
  };

})();
