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
// 4) Parámetros Elo
// =====================

const RATING_INICIAL = 1000;
const K = 32;

// =====================
// 5) Estado + storage
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

function loadState(){
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return defaultState();
  try { return JSON.parse(raw); }
  catch { return defaultState(); }
}

let state = loadState();

function saveState(){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

// =====================
// 6) Elo helpers
// =====================

function expectedScore(ra, rb){
  return 1 / (1 + Math.pow(10, (rb - ra) / 400));
}

function updateElo(bucket, a, b, winner){
  const ra = bucket[a];
  const rb = bucket[b];

  const ea = expectedScore(ra, rb);
  const eb = expectedScore(rb, ra);

  const sa = winner === "A" ? 1 : 0;
  const sb = winner === "B" ? 1 : 0;

  bucket[a] = ra + K * (sa - ea);
  bucket[b] = rb + K * (sb - eb);
}

// =====================
// 7) UI wiring
// =====================

const segmentSelect = document.getElementById("segmentSelect");
const contextSelect = document.getElementById("contextSelect");
const questionEl = document.getElementById("question");
const labelA = document.getElementById("labelA");
const labelB = document.getElementById("labelB");
const topBox = document.getElementById("topBox");

const btnA = document.getElementById("btnA");
const btnB = document.getElementById("btnB");
const btnNewPair = document.getElementById("btnNewPair");
const btnShowTop = document.getElementById("btnShowTop");
const btnReset = document.getElementById("btnReset");
const btnExport = document.getElementById("btnExport");

let currentA = null;
let currentB = null;

// =====================
// 8) Helpers UI
// =====================

function fillSelect(el, obj){
  el.innerHTML = "";
  for (const k in obj){
    const opt = document.createElement("option");
    opt.value = k;
    opt.textContent = obj[k];
    el.appendChild(opt);
  }
}

fillSelect(segmentSelect, segmentos);
fillSelect(contextSelect, contextos);

segmentSelect.value = "F";
contextSelect.value = "I";

function newDuel(){
  currentA = canciones[Math.floor(Math.random() * canciones.length)];
  do {
    currentB = canciones[Math.floor(Math.random() * canciones.length)];
  } while (currentA === currentB);

  labelA.textContent = currentA;
  labelB.textContent = currentB;
  questionEl.textContent = contextos[contextSelect.value];
}

function renderTop(){
  const key = `${segmentSelect.value}__${contextSelect.value}`;
  const bucket = state.buckets[key];

  const rows = Object.entries(bucket)
    .map(([song, rating]) => ({ song, rating }))
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 10);

  topBox.innerHTML = rows.map((r, i) => `
    <div class="toprow">
      <div><b>${i + 1}.</b> ${r.song}</div>
      <div>${r.rating.toFixed(1)}</div>
    </div>
  `).join("");
}

function vote(winner){
  const key = `${segmentSelect.value}__${contextSelect.value}`;
  const bucket = state.buckets[key];

  updateElo(bucket, currentA, currentB, winner);

  state.votes.push({
    ts: new Date().toISOString(),
    segmento: segmentos[segmentSelect.value],
    contexto: contextos[contextSelect.value],
    A: currentA,
    B: currentB,
    ganador: winner === "A" ? currentA : currentB,
    perdedor: winner === "A" ? currentB : currentA
  });

  saveState();
  renderTop();
  newDuel();
}

// =====================
// 9) Eventos
// =====================

btnA.addEventListener("click", () => vote("A"));
btnB.addEventListener("click", () => vote("B"));

btnNewPair.addEventListener("click", newDuel);
btnShowTop.addEventListener("click", renderTop);

segmentSelect.addEventListener("change", renderTop);
contextSelect.addEventListener("change", renderTop);

btnReset.addEventListener("click", () => {
  if (!confirm("Esto borrará todos los votos guardados. ¿Continuar?")) return;
  state = defaultState();
  saveState();
  renderTop();
  newDuel();
});

// =====================
// 10) EXPORTAR CSV
// =====================

btnExport.addEventListener("click", () => {
  if (state.votes.length === 0){
    alert("Todavía no hay votos para exportar.");
    return;
  }

  const headers = ["ts","segmento","contexto","A","B","ganador","perdedor"];
  const lines = [headers.join(",")];

  for (const v of state.votes){
    const row = headers.map(h => `"${String(v[h]).replaceAll('"','""')}"`);
    lines.push(row.join(","));
  }

  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "sodamash_votos.csv";
  document.body.appendChild(a);
  a.click();
  a.remove();

  URL.revokeObjectURL(url);
});

// =====================
// INIT
// =====================

newDuel();
renderTop();
