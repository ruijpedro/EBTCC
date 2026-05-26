import { stations } from "./data/stations.js";
import { checklist } from "./data/checklist.js";
import { printFicha } from "./pdf/printFicha.js";

const $ = (id) => document.getElementById(id);
const state = {
  results: JSON.parse(localStorage.getItem("inspecoes_rjp_results") || "{}")
};

function setView(name){
  document.querySelectorAll(".view").forEach(v => v.classList.remove("active"));
  document.querySelectorAll(".nav").forEach(v => v.classList.remove("active"));
  $(name).classList.add("active");
  document.querySelector(`[data-view="${name}"]`)?.classList.add("active");
  $("viewTitle").textContent = {dashboard:"Dashboard",stations:"Estações",inspection:"Nova Inspeção",reports:"Relatórios"}[name] || "Inspeções_RJP";
}

function initStations(){
  $("totalStations").textContent = stations.length;
  $("stationChips").innerHTML = stations.map(s => `<span class="chip">${s}</span>`).join("");
  $("stationSelect").innerHTML = stations.map(s => `<option>${s}</option>`).join("");
  renderStationList(stations);
}

function renderStationList(list){
  $("stationList").innerHTML = list.map(s => `
    <div class="station-row" data-station="${s}">
      <span><i class="dot"></i><strong>${s}</strong><br><small>OK</small></span>
      <span>›</span>
    </div>`).join("");
  document.querySelectorAll(".station-row").forEach(row => {
    row.addEventListener("click", () => {
      $("stationSelect").value = row.dataset.station;
      $("descriptionInput").value = `LO_MPS_BT_CC_${row.dataset.station} (S)`;
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

function getInspectionData(){
  return {
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
    results: state.results
  };
}

function saveInspection(){
  const data = getInspectionData();
  const list = JSON.parse(localStorage.getItem("inspecoes_rjp_saved") || "[]");
  list.unshift({ ...data, savedAt: new Date().toISOString() });
  localStorage.setItem("inspecoes_rjp_saved", JSON.stringify(list));
  localStorage.setItem("inspecoes_rjp_results", JSON.stringify(state.results));
  renderReports();
  updateStats();
  alert("Inspeção guardada.");
}

function renderReports(){
  const list = JSON.parse(localStorage.getItem("inspecoes_rjp_saved") || "[]");
  $("reportsList").innerHTML = list.length ? list.map((r,i) => `
    <div class="station-row">
      <span><strong>${r.station}</strong><br><small>${new Date(r.savedAt).toLocaleString("pt-PT")}</small></span>
      <button class="btn secondary" data-report="${i}">Gerar PDF</button>
    </div>`).join("") : "<p>Ainda não existem relatórios guardados.</p>";
  document.querySelectorAll("[data-report]").forEach(btn => {
    btn.addEventListener("click", () => {
      const idx = Number(btn.dataset.report);
      const list = JSON.parse(localStorage.getItem("inspecoes_rjp_saved") || "[]");
      printFicha(list[idx], checklist);
    });
  });
}

function updateStats(){
  const list = JSON.parse(localStorage.getItem("inspecoes_rjp_saved") || "[]");
  $("totalInspections").textContent = list.length;
  $("totalNC").textContent = Object.values(state.results).filter(v => v === "NC").length;
  $("lastStation").textContent = list[0]?.station || "—";
}

document.querySelectorAll(".nav").forEach(btn => btn.addEventListener("click", () => setView(btn.dataset.view)));
$("stationSearch").addEventListener("input", e => renderStationList(stations.filter(s => s.toLowerCase().includes(e.target.value.toLowerCase()))));
$("saveInspection").addEventListener("click", saveInspection);
$("generatePdf").addEventListener("click", () => printFicha(getInspectionData(), checklist));

$("dateInput").valueAsDate = new Date();
initStations();
initChecklist();
renderReports();
updateStats();

if ("serviceWorker" in navigator) navigator.serviceWorker.register("./service-worker.js").catch(()=>{});
