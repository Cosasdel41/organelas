# Juego de Organelas — Versión Multiplayer (React + Firebase Realtime DB)

Este repositorio contiene una **MVP** para un juego didáctico de cartas (organelas) con soporte multiusuario en tiempo real usando **Firebase Realtime Database**. Está pensado para que lo copies/pegues y lo subas a GitHub.

---

## Estructura del proyecto (archivos principales)

```
organelas-game-multiplayer/
├─ package.json
├─ vite.config.js
├─ tailwind.config.cjs
├─ postcss.config.cjs
├─ src/
│  ├─ main.jsx
│  ├─ App.jsx
│  ├─ firebase.js
│  ├─ components/
│  │  ├─ Lobby.jsx
│  │  ├─ Game.jsx
│  │  └─ CardView.jsx
│  └─ styles.css
└─ .env
```

---

## Pasos previos (resumen)

1. Crear un proyecto en Firebase: https://console.firebase.google.com/
   - Habilitar **Realtime Database** en modo de prueba (luego ajustar reglas).
   - Crear credenciales de configuración (apiKey, authDomain, databaseURL, projectId, ...)
2. Copiar las variables de Firebase en `.env` (ejemplo abajo).
3. `npm install` y `npm run dev`.

---

## Variables de entorno (.env)

Crea un archivo `.env` en la raíz (no subirlo a GitHub). Vite usa `VITE_` prefijo:

```
VITE_FIREBASE_API_KEY=tu_api_key
VITE_FIREBASE_AUTH_DOMAIN=tu_auth_domain
VITE_FIREBASE_DATABASE_URL=https://tu-proyecto-default-rtdb.firebaseio.com
VITE_FIREBASE_PROJECT_ID=tu_project_id
VITE_FIREBASE_STORAGE_BUCKET=tu_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=tu_sender_id
VITE_FIREBASE_APP_ID=tu_app_id
```

---

## Reglas recomendadas (Realtime Database) — Modo educativo

**IMPORTANTE:** Estas reglas son para pruebas y clases pequeñas. Ajustá autenticación para producción.

```json
{
  "rules": {
    "rooms": {
      "$roomId": {
        ".read": "true",
        ".write": "true"
      }
    }
  }
}
```

---

## `package.json`

```json
{
  "name": "organelas-game-multiplayer",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "firebase": "^10.0.0",
    "react": "^18.0.0",
    "react-dom": "^18.0.0"
  },
  "devDependencies": {
    "vite": "^5.0.0",
    "tailwindcss": "^3.0.0",
    "postcss": "^8.0.0",
    "autoprefixer": "^10.0.0"
  }
}
```

---

## `src/firebase.js`

```js
import { initializeApp } from "firebase/app";
import { getDatabase, ref, push, set, onValue, update, remove } from "firebase/database";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

export { db, ref, push, set, onValue, update, remove };
```

---

## `src/main.jsx`

```jsx
import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './styles.css'

createRoot(document.getElementById('root')).render(<App />)
```

---

## `src/styles.css` (Tailwind minimal)

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

body { @apply bg-gray-50; }
```

---

## `src/App.jsx`

```jsx
import React, { useEffect, useState } from 'react'
import Lobby from './components/Lobby'
import Game from './components/Game'

export default function App(){
  const [roomId, setRoomId] = useState(null)
  const [playerName, setPlayerName] = useState('')

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      {!roomId ? (
        <Lobby onJoin={(r, name) => { setRoomId(r); setPlayerName(name); }} />
      ) : (
        <Game roomId={roomId} playerName={playerName} />
      )}
    </div>
  )
}
```

---

## `src/components/Lobby.jsx`

```jsx
import React, { useState } from 'react'
import { db, ref, push, set } from '../firebase'

// Crea una sala nueva o une a una sala existente
export default function Lobby({ onJoin }){
  const [name, setName] = useState('')
  const [roomInput, setRoomInput] = useState('')

  const createRoom = async () => {
    const roomRef = ref(db, `rooms`)
    const newRoomRef = push(roomRef)
    const roomId = newRoomRef.key

    // estado inicial de la sala
    const initial = {
      host: name || 'Docente',
      players: {},
      state: 'waiting',
      deck: [],
      turnIndex: 0,
      clueIndex: 0
    }

    await set(newRoomRef, initial)
    onJoin(roomId, name || 'Jugador')
  }

  const joinRoom = () => {
    const rid = roomInput.trim()
    if(!rid) return
    onJoin(rid, name || 'Jugador')
  }

  return (
    <div className="w-full max-w-md bg-white p-6 rounded shadow">
      <h2 className="text-2xl mb-4">Entrar a sala — Juego de Organelas</h2>
      <label className="block mb-2">Tu nombre</label>
      <input className="w-full mb-4 p-2 border" value={name} onChange={(e)=>setName(e.target.value)} />

      <button className="w-full bg-blue-600 text-white p-2 rounded mb-2" onClick={createRoom}>Crear sala (docente)</button>

      <div className="my-2 text-center">o</div>

      <label className="block mb-2">ID de sala</label>
      <input className="w-full mb-2 p-2 border" value={roomInput} onChange={(e)=>setRoomInput(e.target.value)} />
      <button className="w-full bg-green-600 text-white p-2 rounded" onClick={joinRoom}>Unirse</button>
    </div>
  )
}
```

---

## `src/components/Game.jsx`

```jsx
import React, { useEffect, useState, useRef } from 'react'
import { db, ref, set, onValue, push, update } from '../firebase'
import CardView from './CardView'

// Plantilla de organelas - aquí están las cartas con sus características
const ORGANELAS_TEMPLATE = [
  { nombre: 'Mitocondria', caracteristicas: ['Produce ATP','Doble membrana','Respiración celular'] },
  { nombre: 'Núcleo', caracteristicas: ['Contiene ADN','Envoltura nuclear','Controla la célula'] },
  { nombre: 'Ribosoma', caracteristicas: ['Sintetiza proteínas','ARN + proteínas','Libre o en RER'] },
  { nombre: 'Aparato de Golgi', caracteristicas: ['Modifica y empaqueta proteínas','Forma vesículas','Secreción celular'] },
  { nombre: 'Lisosoma', caracteristicas: ['Digestión intracelular','Contiene enzimas hidrolíticas','Reciclaje celular'] }
]

function shuffle(arr){
  const a = [...arr]
  for(let i = a.length -1; i>0; i--){
    const j = Math.floor(Math.random()*(i+1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export default function Game({ roomId, playerName }){
  const [roomData, setRoomData] = useState(null)
  const [myHand, setMyHand] = useState([])
  const [isHost, setIsHost] = useState(false)
  const [selectedMatch, setSelectedMatch] = useState(null)
  const playerKeyRef = useRef(null)

  useEffect(()=>{
    const rRef = ref(db, `rooms/${roomId}`)
    const unsub = onValue(rRef, (snap)=>{
      const val = snap.val()
      if(!val) return
      setRoomData(val)
    })
    return ()=> unsub()
  },[roomId])

  // cuando entra por primera vez: registrarse como jugador si no está en la sala
  useEffect(()=>{
    if(!roomData) return
    // buscar si ya existe player con este nombre en la sala
    const players = roomData.players || {}
    const existingKey = Object.keys(players).find(k=>players[k].name === playerName)
    if(existingKey){
      playerKeyRef.current = existingKey
      setMyHand(players[existingKey].hand || [])
      setIsHost(roomData.host === playerName)
      return
    }

    // si no existe, crear nuevo player
    const newPlayerRef = push(ref(db, `rooms/${roomId}/players`))
    const key = newPlayerRef.key
    playerKeyRef.current = key
    set(newPlayerRef, { name: playerName, hand: [] })
  },[roomData, playerName])

  // Host inicia juego: crea mazo, reparte 3 cartas por jugador y elige carta objetivo (la "carta del docente")
  const startGame = async ()=>{
    if(!roomData) return
    const playersKeys = Object.keys(roomData.players || {})
    if(playersKeys.length === 0) return

    const deck = shuffle(ORGANELAS_TEMPLATE)
    const hands = {}
    playersKeys.forEach((k)=>{
      hands[k] = { hand: deck.splice(0,3) }
    })
    // carta oculta del docente
    const answerCard = deck.splice(0,1)[0]

    await update(ref(db, `rooms/${roomId}`), {
      deck: deck,
      players: Object.fromEntries(playersKeys.map(k=>[k, { ...roomData.players[k], hand: hands[k].hand }])),
      state: 'playing',
      answer: answerCard,
      clueIndex: 0,
      turnIndex: 0
    })
  }

  // Robar carta (si un jugador elige robar)
  const drawCard = async ()=>{
    const deckRef = ref(db, `rooms/${roomId}/deck`)
    const snap = await new Promise(res=> onValue(deckRef, s=>{ res(s); }, { onlyOnce: true }))
    const currentDeck = snap.val() || []
    if(currentDeck.length === 0) return
    const drawn = currentDeck[0]
    const newDeck = currentDeck.slice(1)

    // agregar carta a la mano del jugador
    const playerRef = ref(db, `rooms/${roomId}/players/${playerKeyRef.current}/hand`)
    const playerSnap = await new Promise(res=> onValue(playerRef, s=>{ res(s); }, { onlyOnce: true }))
    const currentHand = playerSnap.val() || []
    await set(playerRef, [...currentHand, drawn])

    // actualizar deck
    await set(deckRef, newDeck)

    // avanzar turno
    await update(ref(db, `rooms/${roomId}`), { turnIndex: ((roomData.turnIndex || 0) + 1) % Object.keys(roomData.players).length })
  }

  // El docente da la pista (siguiente característica)
  const nextClue = async ()=>{
    if(!roomData || !roomData.answer) return
    const nextIdx = (roomData.clueIndex || 0) + 1
    await update(ref(db, `rooms/${roomId}`), { clueIndex: nextIdx })
  }

  // Un jugador declara coincidencia: envía su carta candidata para que el docente verifique
  const declareMatch = async (cardIndex)=>{
    const playerKey = playerKeyRef.current
    if(!playerKey) return
    const playerHand = roomData.players[playerKey].hand
    const candidate = playerHand[cardIndex]

    // publicar intento en la sala
    await update(ref(db, `rooms/${roomId}`), { lastAttempt: { by: playerKey, card: candidate } })
  }

  // Docente evalúa intento
  const evaluateAttempt = async (isCorrect)=>{
    if(!roomData || !roomData.lastAttempt) return
    const attempt = roomData.lastAttempt
    if(isCorrect){
      // mover carta a "table" y marcar punto
      const playerKey = attempt.by
      // quitar carta de la mano del jugador
      const playerHand = roomData.players[playerKey].hand.filter(h=>h.nombre !== attempt.card.nombre)
      await update(ref(db, `rooms/${roomId}/players/${playerKey}`), { hand: playerHand })

      // anotar acierto (simple contador)
      const scores = roomData.scores || {}
      scores[playerKey] = (scores[playerKey] || 0) + 1
      await update(ref(db, `rooms/${roomId}`), { scores, lastAttempt: null })
    } else {
      // fallo: eliminar intento y avanzar turno
      await update(ref(db, `rooms/${roomId}`), { lastAttempt: null, turnIndex: ((roomData.turnIndex || 0) + 1) % Object.keys(roomData.players).length })
    }
  }

  if(!roomData) return <div>Cargando sala...</div>

  const playersArray = Object.entries(roomData.players || {}).map(([k,v], idx)=>({ key: k, name: v.name, hand: v.hand || [] }))
  const myKey = playerKeyRef.current
  const myPlayer = playersArray.find(p=>p.key === myKey) || { hand: [] }

  return (
    <div className="w-full max-w-4xl bg-white p-4 rounded shadow">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl">Sala: {roomId}</h3>
        <div>Usuario: {playerName} {isHost ? '(Docente)' : ''}</div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2">
          <div className="mb-3">Pista actual: {roomData.answer ? (roomData.answer.caracteristicas[roomData.clueIndex] || '—') : '—'}</div>

          <div className="mb-2">Jugadores:</div>
          {playersArray.map((p, idx)=> (
            <div key={p.key} className="p-2 border rounded mb-1">
              <strong>{p.name}</strong>
              <div>Cartas en mano: {p.hand.length}</div>
              <div>Puntos: {(roomData.scores && roomData.scores[p.key]) || 0}</div>
            </div>
          ))}

          <div className="mt-4">
            {isHost && roomData.state === 'waiting' && (
              <button className="px-3 py-1 bg-blue-600 text-white rounded" onClick={startGame}>Iniciar partida</button>
            )}

            {isHost && roomData.state === 'playing' && (
              <button className="px-3 py-1 bg-indigo-600 text-white rounded ml-2" onClick={nextClue}>Dar siguiente pista</button>
            )}
          </div>

        </div>

        <div>
          <div className="mb-2">Tu mano:</div>
          <div className="space-y-2">
            {myPlayer.hand.map((c, i)=> (
              <div key={i} className="p-2 border rounded flex justify-between items-center">
                <div>{c.nombre}</div>
                <div className="flex gap-2">
                  <button className="px-2 py-1 bg-green-500 text-white rounded" onClick={()=>declareMatch(i)}>Declarar</button>
                </div>
              </div>
            ))}

            <button className="mt-2 px-2 py-1 bg-gray-200 rounded" onClick={drawCard}>Robar carta</button>
          </div>

          <div className="mt-4">
            <div>Último intento: {roomData.lastAttempt ? `${(roomData.players && roomData.players[roomData.lastAttempt.by] && roomData.players[roomData.lastAttempt.by].name) || roomData.lastAttempt.by} propuso ${roomData.lastAttempt.card.nombre}` : '—'}</div>
            {isHost && roomData.lastAttempt && (
              <div className="mt-2 flex gap-2">
                <button className="px-2 py-1 bg-green-600 text-white rounded" onClick={()=>evaluateAttempt(true)}>Correcto</button>
                <button className="px-2 py-1 bg-red-600 text-white rounded" onClick={()=>evaluateAttempt(false)}>Incorrecto</button>
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  )
}
```

---

## `src/components/CardView.jsx` (opcional visual)

```jsx
import React from 'react'

export default function CardView({ carta, oculto }){
  return (
    <div className="border rounded p-3 w-40 h-24 flex flex-col justify-center items-center bg-white">
      {oculto ? <div className="italic text-sm">Organelas</div> : <div className="text-center">{carta.nombre}</div>}
    </div>
  )
}
```

---

## Notas de diseño y consideraciones (explicación breve y científica)

- El juego usa un **servidor de estado central** (Realtime DB). Cada sala es un nodo `rooms/{roomId}` que contiene: `players`, `deck`, `answer`, `clueIndex`, `turnIndex`, `scores`.
- El docente (host) crea la sala y **no** comparte su carta `answer` con los demás; sólo avanza `clueIndex` para exponer características sucesivas.
- Cada jugador tiene `hand` con objetos `{ nombre, caracteristicas? }`. En la práctica educativa conviene que los jugadores **no** vean las características, sólo el nombre.
- Cuando un jugador declara, se escribe `lastAttempt` y el docente valida. Esto permite control pedagógico del docente.
- Seguridad: para prácticas pequeñas puede dejarse lectura/escritura abiertas, pero en producción hay que requerir autenticación (Firebase Auth) y reglas que permitan escribir sólo su propio nodo de jugador.

---

## Siguientes mejoras recomendadas (si querés lo hago):

1. Integrar Firebase Auth (Google Sign-In) para identificar usuarios.
2. Mejores reglas de seguridad.
3. Añadir chat de sala y temporizador por turno.
4. Interfaz más cuidada con Tailwind/shadcn.
5. Estadísticas por partida y posibilidad de exportarlas para evaluación.

---

### Licencia

Código educativo — úsalo libremente y adaptalo a tu curso. Si lo subís a GitHub, recordá no subir tu `.env`.

---

Fin del archivo: copia esto en tu repo y ejecuta `npm install` seguido de `npm run dev`. ¡Si querés, te paso el `tailwind.config.cjs` y el `vite.config.js` también!
