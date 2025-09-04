import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// Base de datos de organelas
const organelas = [
  {
    nombre: "Mitocondria",
    caracteristicas: [
      "Produce energía en forma de ATP",
      "Tiene doble membrana",
      "Realiza la respiración celular"
    ]
  },
  {
    nombre: "Núcleo",
    caracteristicas: [
      "Contiene el ADN",
      "Controla la actividad celular",
      "Tiene envoltura nuclear"
    ]
  },
  {
    nombre: "Ribosoma",
    caracteristicas: [
      "Sintetiza proteínas",
      "Está formado por ARN y proteínas",
      "Puede estar libre o en el RER"
    ]
  },
  {
    nombre: "Aparato de Golgi",
    caracteristicas: [
      "Modifica, empaqueta y distribuye proteínas",
      "Forma vesículas",
      "Relacionado con la secreción celular"
    ]
  }
];

function App() {
  const [mazo, setMazo] = useState(organelas);
  const [jugadores, setJugadores] = useState([
    { nombre: "Jugador 1", cartas: [] },
    { nombre: "Jugador 2", cartas: [] }
  ]);
  const [indiceCaracteristica, setIndiceCaracteristica] = useState(0);
  const [orgSeleccionada, setOrgSeleccionada] = useState(null);

  // repartir 3 cartas a cada jugador
  const repartir = () => {
    let nuevoMazo = [...organelas];
    let nuevosJugadores = jugadores.map(j => {
      let cartas = [];
      for (let i = 0; i < 3; i++) {
        let carta = nuevoMazo.pop();
        cartas.push({ nombre: carta.nombre });
      }
      return { ...j, cartas };
    });
    setMazo(nuevoMazo);
    setJugadores(nuevosJugadores);
    // elegir organela "correcta" al azar
    setOrgSeleccionada(
      organelas[Math.floor(Math.random() * organelas.length)]
    );
    setIndiceCaracteristica(0);
  };

  // pasar a la siguiente característica
  const siguientePista = () => {
    if (orgSeleccionada) {
      setIndiceCaracteristica(
        (prev) =>
          (prev + 1) % orgSeleccionada.caracteristicas.length
      );
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-sky-100">
      <h1 className="text-3xl font-bold mb-6">Juego de Organelas</h1>

      {!orgSeleccionada ? (
        <Button onClick={repartir}>Repartir Cartas</Button>
      ) : (
        <div className="space-y-6">
          <Card className="p-4 bg-white shadow-md">
            <CardContent>
              <h2 className="text-xl font-semibold">Pista actual:</h2>
              <p className="text-lg italic">
                {orgSeleccionada.caracteristicas[indiceCaracteristica]}
              </p>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 gap-4">
            {jugadores.map((j, idx) => (
              <Card key={idx} className="p-4 bg-white shadow-md">
                <CardContent>
                  <h3 className="font-bold mb-2">{j.nombre}</h3>
                  <div className="flex gap-2">
                    {j.cartas.map((c, i) => (
                      <div
                        key={i}
                        className="border rounded-lg p-2 bg-sky-50"
                      >
                        {c.nombre}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex gap-4">
            <Button onClick={siguientePista}>Siguiente pista</Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
