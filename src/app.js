import { stations } from "./data/stations.js";
import { checklist } from "./data/checklist.js";
import { printFicha } from "./pdf/printFicha.js";

const $ = (id) => document.getElementById(id);
const state = {
  results: JSON.parse(localStorage.getItem("inspecoes_rjp_results") || "{}"),
  photos: []
};

function setView(name){
  document.querySelectorAll(".view").forEach(v => v.classList.remove("active"));
  document.querySelectorAll(".nav").forEach(v => v.classList.remove("active"));
  $(name).classList.add("active");
  document.querySelector(`[data-view="${name}"]`)?.classList.add("active");
  $("viewTitle").textContent = {dashboard:"Dashboard",stations:"Estações",inspection:"Nova Inspeção",reports:"Relatórios",map:"Mapa Linha"}[name] || "Inspeções_RJP";
}

function initStations(){
  $("totalStations").textContent = stations.length;
  $("stationChips").innerHTML = stations.map(s => `<span class="chip">${s}</span>`).join("");
  $("stationSelect").innerHTML = stations.map(s => `<option>${s}</option>`).join("");
  renderStationList(stations);
}

function stationStatus(station){
  const list = JSON.parse(localStorage.getItem("inspecoes_rjp_saved") || "[]").filter(r => r.station === station);
  const last = list[0];
  if(!last) return {label:"Sem inspeção", cls:""};
  const nc = Object.values(last.results || {}).filter(v => v === "NC").length;
  if(nc >= 3) return {label:`${nc} NC abertas`, cls:"bad"};
  if(nc > 0) return {label:`${nc} NC`, cls:"warn"};
  return {label:"OK", cls:""};
}

function renderStationList(list){
  $("stationList").innerHTML = list.map(s => {
    const st = stationStatus(s);
    return `<div class="station-row" data-station="${s}">
      <span><i class="dot ${st.cls}"></i><strong>${s}</strong><br><small>${st.label}</small></span>
      <span>›</span>
    </div>`;
  }).join("");
  document.querySelectorAll(".station-row").forEach(row => {
    row.addEventListener("click", () => {
      $("stationSelect").value = row.dataset.station;
      $("descriptionInput").value = `LO_MPS_BT_CC_${row.dataset.station} (S)`;
      setView("inspection");
    });
  });
}


function renderMap(){
  const el = $("lineMap");
  if(!el) return;
  el.innerHTML = stations.map((s, i) => {
    const st = stationStatus(s);
    const num = String(i + 1).padStart(2, "0");
    return `<div class="map-row" data-map-station="${s}">
      <span class="map-node ${st.cls}">${num}</span>
      <span><span class="map-name">${s}</span><br><span class="map-meta">Linha do Oeste · Sabugo → Carriço</span></span>
      <span class="map-badge">${st.label}</span>
    </div>`;
  }).join("");
  document.querySelectorAll("[data-map-station]").forEach(row => {
    row.addEventListener("click", () => {
      $("stationSelect").value = row.dataset.mapStation;
      $("descriptionInput").value = `LO_MPS_BT_CC_${row.dataset.mapStation} (S)`;
      setView("inspection");
    });
  });
}

function initChecklist(){
  const saved = state.results;
  $("checklist").innerHTML = checklist.map(([num, title, items]) => `
    <div class="group">
      <div class="group-title">${num}. ${title}</div>
      ${items.map(([code, text]) => `
        <div class="item">
          <strong>${code}</strong>
          <span>${text}</span>
          <div class="state" data-code="${code}">
            <button class="c ${saved[code]==='C'?'active':''}" data-value="C">C</button>
            <button class="nc ${saved[code]==='NC'?'active':''}" data-value="NC">NC</button>
            <button class="na ${saved[code]==='NA'?'active':''}" data-value="NA">NA</button>
          </div>
        </div>`).join("")}
    </div>`).join("");

  document.querySelectorAll(".state button").forEach(btn => {
    btn.addEventListener("click", () => {
      const box = btn.closest(".state");
      box.querySelectorAll("button").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      state.results[box.dataset.code] = btn.dataset.value;
      updateStats();
    });
  });
}

function nextInspectionNumber(){
  const list = JSON.parse(localStorage.getItem("inspecoes_rjp_saved") || "[]");
  const year = new Date().getFullYear();
  return `CC-${year}-${String(list.length + 1).padStart(5,"0")}`;
}

function getInspectionData(){
  return {
    number: $("inspectionNumberInput").value || nextInspectionNumber(),
    station: $("stationSelect").value,
    date: $("dateInput").value,
    inspector: $("inspectorInput").value,
    networkUser: $("networkUserInput").value,
    description: $("descriptionInput").value,
    subDescription: $("subDescriptionInput").value,
    segment: $("segmentInput").value,
    pk: $("pkInput").value,
    observations: $("observationsInput").value,
    executedBy: $("executedByInput").value,
    status: $("statusInput").value,
    responsible: $("responsibleInput").value,
    results: state.results,
    photos: state.photos
  };
}

function saveInspection(){
  const data = getInspectionData();
  const list = JSON.parse(localStorage.getItem("inspecoes_rjp_saved") || "[]");
  list.unshift({ ...data, savedAt: new Date().toISOString() });
  localStorage.setItem("inspecoes_rjp_saved", JSON.stringify(list));
  localStorage.setItem("inspecoes_rjp_results", JSON.stringify(state.results));
  state.photos = [];
  renderPhotos();
  $("inspectionNumberInput").value = nextInspectionNumber();
  renderReports();
  renderStationList(stations);
  renderMap();
  updateStats();
  alert("Inspeção guardada.");
}

function renderReports(){
  const list = JSON.parse(localStorage.getItem("inspecoes_rjp_saved") || "[]");
  $("reportsList").innerHTML = list.length ? list.map((r,i) => {
    const nc = Object.values(r.results || {}).filter(v => v === "NC").length;
    return `<div class="station-row">
      <span><strong>${r.number || "CC"} — ${r.station}</strong><br><small>${new Date(r.savedAt).toLocaleString("pt-PT")} · ${nc} NC · ${r.photos?.length || 0} fotos</small></span>
      <button class="btn secondary" data-report="${i}">Gerar PDF</button>
    </div>`;
  }).join("") : "<p>Ainda não existem relatórios guardados.</p>";
  document.querySelectorAll("[data-report]").forEach(btn => {
    btn.addEventListener("click", () => {
      const idx = Number(btn.dataset.report);
      const list = JSON.parse(localStorage.getItem("inspecoes_rjp_saved") || "[]");
      printFicha(list[idx], checklist);
    });
  });
}

function renderPhotos(){
  $("photoGrid").innerHTML = state.photos.map((p, i) => `
    <div class="photo-card">
      <img src="${p.data}" alt="Fotografia ${i+1}">
      <button data-remove-photo="${i}">×</button>
      <input data-caption="${i}" value="${escapeAttr(p.caption || "")}" placeholder="Legenda da fotografia">
    </div>`).join("");
  document.querySelectorAll("[data-remove-photo]").forEach(btn => {
    btn.addEventListener("click", () => {
      state.photos.splice(Number(btn.dataset.removePhoto), 1);
      renderPhotos();
    });
  });
  document.querySelectorAll("[data-caption]").forEach(input => {
    input.addEventListener("input", () => {
      state.photos[Number(input.dataset.caption)].caption = input.value;
    });
  });
}

function compressImage(file){
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const max = 1200;
        let { width, height } = img;
        if(width > height && width > max){ height *= max / width; width = max; }
        if(height >= width && height > max){ width *= max / height; height = max; }
        canvas.width = Math.round(width);
        canvas.height = Math.round(height);
        canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.72));
      };
      img.onerror = reject;
      img.src = reader.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function handlePhotos(files){
  for(const file of files){
    const data = await compressImage(file);
    state.photos.push({ data, caption: "" });
  }
  renderPhotos();
}

function updateStats(){
  const list = JSON.parse(localStorage.getItem("inspecoes_rjp_saved") || "[]");
  $("totalInspections").textContent = list.length;
  const ncTotal = list.reduce((acc, r) => acc + Object.values(r.results || {}).filter(v => v === "NC").length, 0);
  $("totalNC").textContent = ncTotal;
  $("lastStation").textContent = list[0]?.station || "—";
}

function escapeAttr(value){ return String(value || "").replace(/"/g, "&quot;"); }

document.querySelectorAll(".nav").forEach(btn => btn.addEventListener("click", () => setView(btn.dataset.view)));
$("stationSearch").addEventListener("input", e => renderStationList(stations.filter(s => s.toLowerCase().includes(e.target.value.toLowerCase()))));
$("saveInspection").addEventListener("click", saveInspection);
$("generatePdf").addEventListener("click", () => printFicha(getInspectionData(), checklist));
$("photoInput").addEventListener("change", e => handlePhotos(e.target.files));

$("dateInput").valueAsDate = new Date();
$("inspectionNumberInput").value = nextInspectionNumber();
initStations();
initChecklist();
renderReports();
renderMap();
updateStats();

if ("serviceWorker" in navigator) navigator.serviceWorker.register("./service-worker.js").catch(()=>{});
