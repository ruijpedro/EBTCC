import { stations, railwayLines } from "./data/stations.js";
import { checklist } from "./data/checklist.js";
import { printFicha, buildPdfBlobForGoogle } from "./pdf/printFicha.js";
import {
  saveAppsScriptUrl,
  testConnection,
  prepareDrive,
  saveInspectionToDrive,
  registerNCStats,
  fullSync,
  loadCloud,
  exportCalendar,
  googleConfigured
} from "./google/googleSync.js";

const $ = (id) => document.getElementById(id);

let currentLine = "Linha do Oeste";
let currentStations = railwayLines[currentLine] || stations;

const state = {
  results: {},
  photos: []
};

function setView(name){
  document.querySelectorAll(".view").forEach(v => v.classList.remove("active"));
  document.querySelectorAll(".nav").forEach(v => v.classList.remove("active"));
  $(name)?.classList.add("active");
  document.querySelector(`[data-view="${name}"]`)?.classList.add("active");
  const titles = {
    dashboard:"Dashboard",
    stations:"Estações",
    inspection:"Nova Inspeção",
    reports:"Relatórios",
    map:"Mapa Linha",
    googleDrive:"Google Drive / Apps Script"
  };
  if($("viewTitle")) $("viewTitle").textContent = titles[name] || "EBTCC";
}

function updateSyncUi(message){
  const now = new Date().toLocaleString("pt-PT");
  const status = message || (googleConfigured() ? "Online" : "Por configurar");
  ["syncStatus","syncStatusTop"].forEach(id => { if($(id)) $(id).textContent = status; });
  if($("lastSync")) $("lastSync").textContent = now;
  if($("lastSyncSmall")) $("lastSyncSmall").textContent = now;
  if($("googleState")) $("googleState").textContent = googleConfigured() ? "Configurado" : "Por configurar";
  localStorage.setItem("ebtcc_last_sync", now);
}

function initStations(){
  initLineSelectors();
  refreshStationUi();
}

function initLineSelectors(){
  const lines = Object.keys(railwayLines);
  ["lineSelectDashboard","lineSelectStations","lineSelectInspection"].forEach(id => {
    const el = $(id);
    if(!el) return;
    el.innerHTML = lines.map(l => `<option value="${l}">${l}</option>`).join("");
    el.value = currentLine;
    el.addEventListener("change", () => {
      currentLine = el.value;
      currentStations = railwayLines[currentLine] || [];
      syncLineSelectors();
      refreshStationUi();
    });
  });
}

function syncLineSelectors(){
  ["lineSelectDashboard","lineSelectStations","lineSelectInspection"].forEach(id => {
    const el = $(id);
    if(el && el.value !== currentLine) el.value = currentLine;
  });
}

function refreshStationUi(){
  if($("totalStations")) $("totalStations").textContent = currentStations.length;
  const routeText = currentLine === "Linha do Oeste" ? "Sabugo → Carriço" : currentLine;
  document.querySelectorAll(".card span").forEach(span => {
    if(span.textContent.includes("Seleciona") || span.textContent.includes("Sabugo") || span.textContent.includes("Carriço")) {
      span.textContent = routeText;
    }
  });
  if($("stationChips")) $("stationChips").innerHTML = currentStations.map(s => `<span class="chip">${s}</span>`).join("");
  if($("stationSelect")) $("stationSelect").innerHTML = `<option value="">Selecionar estação</option>` + currentStations.map(s => `<option>${s}</option>`).join("");
  renderStationList(currentStations);
  renderMap();
}

function stationStatus(station){
  const list = JSON.parse(localStorage.getItem("ebtcc_saved") || "[]").filter(r => r.station === station);
  const last = list[0];
  if(!last) return {label:"Sem inspeção", cls:""};
  const nc = Object.values(last.results || {}).filter(v => v === "NC").length;
  if(nc >= 3) return {label:`${nc} NC abertas`, cls:"bad"};
  if(nc > 0) return {label:`${nc} NC`, cls:"warn"};
  return {label:"OK", cls:""};
}

function openInspectionForStation(station){
  $("stationSelect").value = station;
  setView("inspection");
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
    row.addEventListener("click", () => openInspectionForStation(row.dataset.station));
  });
}

function renderMap(){
  const el = $("lineMap");
  if(!el) return;
  el.innerHTML = stations.map((s, i) => {
    const st = stationStatus(s);
    return `<div class="map-row" data-map-station="${s}">
      <span class="map-node ${st.cls}">${String(i+1).padStart(2,"0")}</span>
      <span><span class="map-name">${s}</span><br><span class="map-meta">${currentLine}</span></span>
      <span class="map-badge">${st.label}</span>
    </div>`;
  }).join("");
  document.querySelectorAll("[data-map-station]").forEach(row => {
    row.addEventListener("click", () => openInspectionForStation(row.dataset.mapStation));
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
      localStorage.removeItem("ebtcc_results");
      updateStats();
    });
  });
}

function nextInspectionNumber(){
  const list = JSON.parse(localStorage.getItem("ebtcc_saved") || "[]");
  const year = new Date().getFullYear();
  return `EBTCC-${year}-${String(list.length + 1).padStart(5,"0")}`;
}

function getInspectionData(){
  return {
    number: $("inspectionNumberInput").value || nextInspectionNumber(),
    line: currentLine,
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
    photos: state.photos,
    checklist
  };
}


function clearInspectionForm(){
  [
    "inspectorInput","networkUserInput","descriptionInput","subDescriptionInput",
    "segmentInput","pkInput","observationsInput","executedByInput",
    "statusInput","responsibleInput","dateInput"
  ].forEach(id => { if($(id)) $(id).value = ""; });
  if($("stationSelect")) $("stationSelect").value = "";
  state.results = {};
  state.photos = [];
  localStorage.removeItem("ebtcc_results");
  initChecklist();
  renderPhotos();
}

function saveInspection(){
  const data = getInspectionData();
  const list = JSON.parse(localStorage.getItem("ebtcc_saved") || "[]");
  list.unshift({ ...data, savedAt: new Date().toISOString() });
  localStorage.setItem("ebtcc_saved", JSON.stringify(list));
  localStorage.removeItem("ebtcc_results");
  clearInspectionForm();
  $("inspectionNumberInput").value = nextInspectionNumber();
  renderReports();
  renderStationList(currentStations);
  renderMap();
  updateStats();
  alert("Inspeção guardada.");
}

function renderReports(){
  const list = JSON.parse(localStorage.getItem("ebtcc_saved") || "[]");
  $("reportsList").innerHTML = list.length ? list.map((r,i) => {
    const nc = Object.values(r.results || {}).filter(v => v === "NC").length;
    return `<div class="station-row">
      <span><strong>${r.number || "EBTCC"} — ${r.station}</strong><br><small>${new Date(r.savedAt).toLocaleString("pt-PT")} · ${nc} NC · ${r.photos?.length || 0} fotos</small></span>
      <button class="btn secondary" data-report="${i}">Gerar / Partilhar PDF</button>
    </div>`;
  }).join("") : "<p>Ainda não existem relatórios guardados.</p>";
  document.querySelectorAll("[data-report]").forEach(btn => {
    btn.addEventListener("click", () => {
      const idx = Number(btn.dataset.report);
      const list = JSON.parse(localStorage.getItem("ebtcc_saved") || "[]");
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
        resolve(canvas.toDataURL("image/jpeg", 0.76));
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

async function saveToGoogleDrive(){
  const data = getInspectionData();
  const blob = await buildPdfBlobForGoogle(data, checklist);
  data.pdfBase64 = await blobToBase64(blob);
  const res = await saveInspectionToDrive(data);
  updateSyncUi(res.ok ? "Sincronizado" : "Erro");
  alert(res.ok ? "PDF, fotos e estatísticas guardados no Google Drive." : "Erro Google Drive: " + (res.message || "sem detalhe"));
}

async function exportNCStats(){
  const data = getInspectionData();
  const res = await registerNCStats(data);
  updateSyncUi(res.ok ? "Sincronizado" : "Erro");
  alert(res.ok ? "Estatísticas NC atualizadas." : "Erro: " + res.message);
}

async function syncAll(){
  const payload = {
    inspections: JSON.parse(localStorage.getItem("ebtcc_saved") || "[]"),
    current: getInspectionData(),
    lastSync: localStorage.getItem("ebtcc_last_sync") || ""
  };
  const res = await fullSync(payload);
  updateSyncUi(res.ok ? "Sincronizado" : "Erro");
  alert(res.ok ? "Sincronização concluída." : "Erro: " + (res.message || "sem detalhe"));
}

async function loadFromCloud(){
  const res = await loadCloud();
  updateSyncUi(res.ok ? "Sincronizado" : "Erro");
  alert(res.ok ? "Dados carregados da Cloud." : "Erro: " + (res.message || "sem detalhe"));
}

async function exportToCalendar(){
  const res = await exportCalendar(getInspectionData());
  updateSyncUi(res.ok ? "Sincronizado" : "Erro");
  alert(res.ok ? "Calendar atualizado." : "Erro: " + (res.message || "sem detalhe"));
}

function blobToBase64(blob){
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(String(reader.result).split(",").pop());
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function updateStats(){
  const list = JSON.parse(localStorage.getItem("ebtcc_saved") || "[]");
  $("totalInspections").textContent = list.length;
  const ncTotal = list.reduce((acc, r) => acc + Object.values(r.results || {}).filter(v => v === "NC").length, 0);
  $("totalNC").textContent = ncTotal;
  $("lastStation").textContent = list[0]?.station || "—";
}

function initGooglePage(){
  if($("appsScriptUrlInput")) $("appsScriptUrlInput").value = localStorage.getItem("EBTCC_APPS_SCRIPT_URL") || "";
  updateSyncUi(googleConfigured() ? "Online" : "Por configurar");
}

function escapeAttr(value){ return String(value || "").replace(/"/g, "&quot;"); }

function bindEvents(){
  document.querySelectorAll(".nav").forEach(btn => btn.addEventListener("click", () => setView(btn.dataset.view)));
  $("menuBtn")?.addEventListener("click", () => document.querySelector(".sidebar")?.classList.toggle("open"));
  $("stationSearch")?.addEventListener("input", e => renderStationList(currentStations.filter(s => s.toLowerCase().includes(e.target.value.toLowerCase()))));
  $("saveInspection")?.addEventListener("click", saveInspection);
  $("generatePdf")?.addEventListener("click", () => printFicha(getInspectionData(), checklist));
  $("photoInput")?.addEventListener("change", e => handlePhotos(e.target.files));

  $("saveDrive")?.addEventListener("click", () => saveToGoogleDrive().catch(e => alert(e.message)));
  $("exportStats")?.addEventListener("click", () => exportNCStats().catch(e => alert(e.message)));
  $("syncNow")?.addEventListener("click", () => syncAll().catch(e => alert(e.message)));
  $("sideSyncBtn")?.addEventListener("click", () => syncAll().catch(e => alert(e.message)));

  $("saveAppsScriptUrl")?.addEventListener("click", () => {
    saveAppsScriptUrl($("appsScriptUrlInput").value.trim());
    initGooglePage();
    alert("Ligação Google guardada.");
  });
  $("testGoogleConnection")?.addEventListener("click", async () => {
    const res = await testConnection();
    alert(res.ok ? "Ligação ativa." : "Erro: " + res.message);
  });
  $("prepareDrive")?.addEventListener("click", async () => {
    const res = await prepareDrive();
    alert(res.ok ? "Drive/Sheets preparado." : "Erro: " + res.message);
  });
  $("syncDriveBtn")?.addEventListener("click", () => syncAll().catch(e => alert(e.message)));
  $("saveAllCloud")?.addEventListener("click", () => saveToGoogleDrive().catch(e => alert(e.message)));
  $("loadCloud")?.addEventListener("click", () => loadFromCloud().catch(e => alert(e.message)));
  $("syncAllCloud")?.addEventListener("click", () => syncAll().catch(e => alert(e.message)));
  $("exportCalendar")?.addEventListener("click", () => exportToCalendar().catch(e => alert(e.message)));
}

// Data em branco por defeito.
$("inspectionNumberInput").value = nextInspectionNumber();
initStations();
initChecklist();
renderReports();
updateStats();
initGooglePage();
bindEvents();

if ("serviceWorker" in navigator) navigator.serviceWorker.register("./service-worker.js").catch(()=>{});
