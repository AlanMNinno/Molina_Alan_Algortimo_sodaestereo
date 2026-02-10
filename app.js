// =====================
// 1) Canciones
// =====================

const canciones = [
  "De Música Ligera",
  "Persiana Americana",
  "Cuando Pase el Temblor",
  "En la Ciudad de la Furia",
  "Trátame Suavemente",
  "Nada Personal",
  "Signos",
  "Prófugos",
  "Zoom",
  "Juegos de Seducción",
  "Sobredosis de TV",
  "Un Millón de Años Luz",
  "Canción Animal",
  "Primavera 0"
];

// =====================
// 2) Segmentos
// =====================

const segmentos = {
  F: "Fan histórico",
  C: "Oyente casual",
  J: "Público joven",
  M: "Músico / productor"
};

// =====================
// 3) Contextos
// =====================

const contextos = {
  I: "¿Cuál canción recomendarías para empezar a escuchar Soda Stereo?",
  V: "¿Cuál funciona mejor en vivo?",
  L: "¿Cuál tiene mejor letra?",
  H: "¿Cuál representa mejor su legado histórico?"
};

// =====================
// Elo
// =====================

const RATING_INICIAL = 1000;
const K = 32;

// =====================
// Estado
// =====================

const STORAGE_KEY = "sodamash_state_v1";

function defaultState(){
  const buckets = {};
  for (const s in segmentos){
    for (const c in contextos){
      const key = `${s}__${c}`;
      buckets[key] = {};
      canciones.forEach(song => buckets[key][song] = RATING_INICIAL);
    }
  }
  return { buckets, votes: [] };
}

let state = JSON.parse(localStorage.getItem(STORAGE_KEY)) || defaultState();

function saveState(){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

// =====================
// Elo helpers
// =====================

function expected(ra, rb){
  return 1 / (1 + Math.pow(10, (rb - ra) / 400));
}

function updateElo(bucket, a, b, winner){
  const ra = bucket[a], rb = bucket[b];
  const ea = expected(ra, rb);
  const eb = expected(rb, ra);

  bucket[a] = ra + K * ((winner === "A" ? 1 : 0) - ea);
  bucket[b] = rb + K * ((winner === "B" ? 1 : 0) - eb);
}

// =====================
// UI
// =====================

const segmentSelect = document.getElementById("segmentSelect");
const contextSelect = document.getElementById("contextSelect");
const labelA = document.getElementById("labelA");
const labelB = document.getElementById("labelB");
const questionEl = document.getElementById("question");
const topBox = document.getElementById("topBox");

let A, B;

function fillSelect(el, obj){
  el.innerHTML = "";
  for (const k in obj){
    const o = document.createElement("option");
    o.value = k;
    o.textContent = obj[k];
    el.appendChild(o);
  }
}

fillSelect(segmentSelect, segmentos);
fillSelect(contextSelect, contextos);

function newDuel(){
  A = canciones[Math.floor(Math.random()*canciones.length)];
  do {
    B = canciones[Math.floor(Math.random()*canciones.length)];
  } while (A === B);

  labelA.textContent = A;
  labelB.textContent = B;
  questionEl.textContent = contextos[contextSelect.value];
}

function vote(w){
  const key = `${segmentSelect.value}__${contextSelect.value}`;
  updateElo(state.buckets[key], A, B, w);
  saveState();
  renderTop();
  newDuel();
}

function renderTop(){
  const key = `${segmentSelect.value}__${contextSelect.value}`;
  const arr = Object.entries(state.buckets[key])
    .map(([song, rating]) => ({ song, rating }))
    .sort((a,b) => b.rating - a.rating)
    .slice(0,10);

  topBox.innerHTML = arr.map((r,i)=>`
    <div class="toprow">
      <div><b>${i+1}.</b> ${r.song}</div>
      <div>${r.rating.toFixed(1)}</div>
    </div>
  `).join("");
}

document.getElementById("btnA").onclick = () => vote("A");
document.getElementById("btnB").onclick = () => vote("B");
document.getElementById("btnNewPair").onclick = newDuel;
document.getElementById("btnShowTop").onclick = renderTop;

document.getElementById("btnReset").onclick = () => {
  if(confirm("¿Reiniciar todo el ranking?")){
    state = defaultState();
    saveState();
    renderTop();
    newDuel();
  }
};

newDuel();
renderTop();
