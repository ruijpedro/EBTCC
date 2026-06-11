const CONFIG = {
  ROOT_FOLDER_ID: "12BvkIaHTFVpiNZ8S4GBrozTzipgZIEfm",
  ROOT_FOLDER_NAME: "EBTCC",
  MASTER_SHEET_NAME: "EBTCC_MASTER",
  CALENDAR_NAME: "EBTCC Manutenção"
};

function doGet() {
  return jsonOutput({ ok:true, app:"EBTCC", message:"Servidor EBTCC ativo" });
}

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents || "{}");
    const action = body.action || "";
    const payload = body.payload || {};
    const root = DriveApp.getFolderById(body.rootFolderId || CONFIG.ROOT_FOLDER_ID);

    if (action === "test") return jsonOutput({ ok:true, message:"Ligação ativa", date:new Date() });
    if (action === "prepareDrive") return jsonOutput(prepareDrive(root));
    if (action === "saveInspection") return jsonOutput(saveInspection(root, payload));
    if (action === "registerNCStats") return jsonOutput(registerNCStats(payload));
    if (action === "fullSync") return jsonOutput(fullSync(root, payload));
    if (action === "loadCloud") return jsonOutput(loadCloud());
    if (action === "exportCalendar") return jsonOutput(exportCalendar(payload));

    return jsonOutput({ ok:false, message:"Ação desconhecida: " + action });
  } catch (err) {
    return jsonOutput({ ok:false, message:String(err), stack:err.stack });
  }
}

function prepareDrive(root) {
  const ebtcc = getOrCreateFolder(root, "EBTCC");
  ["Inspeções","PDFs","Fotografias","NC","Relatórios","Hub","AMV","EDF_Oeste","FenceRail_RJP"].forEach(n => getOrCreateFolder(ebtcc, n));
  getMasterSheet();
  return { ok:true, message:"Estrutura criada/confirmada." };
}

function fullSync(root, payload) {
  const inspections = payload.inspections || [];
  inspections.forEach(data => {
    appendInspection(getMasterSheet(), data, "", []);
    appendNC(getMasterSheet(), data);
  });
  return { ok:true, message:"Sincronização concluída.", count:inspections.length };
}

function loadCloud() {
  const ss = getMasterSheet();
  const sh = getOrCreateSheet(ss, "Inspecoes");
  return { ok:true, rows: sh.getDataRange().getValues() };
}

function saveInspection(root, data) {
  const ebtcc = getOrCreateFolder(root, "EBTCC");
  const stationFolder = getOrCreateFolder(ebtcc, safeName(data.station || "Sem_Estacao"));
  const pdfFolder = getOrCreateFolder(stationFolder, "PDFs");
  const photosFolder = getOrCreateFolder(stationFolder, "Fotos");

  let pdfUrl = "";
  if (data.pdfBase64) {
    const blob = Utilities.newBlob(Utilities.base64Decode(data.pdfBase64), "application/pdf", makeFileName(data, "pdf"));
    pdfUrl = pdfFolder.createFile(blob).getUrl();
  }

  const photoUrls = [];
  (data.photos || []).forEach((p, i) => {
    if (p.data) {
      const base64 = String(p.data).split(",").pop();
      const blob = Utilities.newBlob(Utilities.base64Decode(base64), "image/jpeg", makePhotoName(data, i+1));
      photoUrls.push(photosFolder.createFile(blob).getUrl());
    }
  });

  const ss = getMasterSheet();
  appendInspection(ss, data, pdfUrl, photoUrls);
  appendNC(ss, data);
  return { ok:true, message:"Guardado no Drive.", pdfUrl, photoUrls };
}

function registerNCStats(data) {
  appendNC(getMasterSheet(), data);
  return { ok:true, message:"NC atualizadas." };
}

function exportCalendar(data) {
  const cal = getOrCreateCalendar(CONFIG.CALENDAR_NAME);
  const date = data.date ? new Date(data.date) : new Date();
  cal.createAllDayEvent("EBTCC - " + (data.station || "Inspeção"), date, {
    description: (data.description || "") + "\\nEstado: " + (data.status || "")
  });
  return { ok:true, message:"Evento criado no Calendar." };
}

function appendInspection(ss, data, pdfUrl, photoUrls) {
  const sh = getOrCreateSheet(ss, "Inspecoes");
  ensureHeader(sh, ["Data Registo","N.º","Estação","Data Inspeção","Inspetor","Descrição","Segmento","PK","NC Total","PDF","Fotos","Estado","Responsável"]);
  const nc = Object.values(data.results || {}).filter(v=>v==="NC").length;
  sh.appendRow([new Date(),data.number||"",data.station||"",data.date||"",data.inspector||"",data.description||"",data.segment||"",data.pk||"",nc,pdfUrl||"",photoUrls.join(" | "),data.status||"",data.responsible||""]);
}

function appendNC(ss, data) {
  const sh = getOrCreateSheet(ss, "Nao_Conformidades");
  ensureHeader(sh, ["Data Registo","N.º","Estação","Item","Capítulo","Não Conformidade","Data Inspeção","Responsável","Estado"]);
  const map = {};
  (data.checklist || []).forEach(g => (g[2] || []).forEach(i => map[i[0]] = {chapter:g[1], text:i[1]}));
  Object.entries(data.results || {}).forEach(([code,val]) => {
    if (val === "NC") sh.appendRow([new Date(),data.number||"",data.station||"",code,map[code]?.chapter||"",map[code]?.text||"",data.date||"",data.responsible||"",data.status||""]);
  });
}

function getMasterSheet() {
  const root = DriveApp.getFolderById(CONFIG.ROOT_FOLDER_ID);
  const files = root.getFilesByName(CONFIG.MASTER_SHEET_NAME);
  if (files.hasNext()) return SpreadsheetApp.open(files.next());
  const ss = SpreadsheetApp.create(CONFIG.MASTER_SHEET_NAME);
  const file = DriveApp.getFileById(ss.getId());
  root.addFile(file);
  DriveApp.getRootFolder().removeFile(file);
  return ss;
}

function getOrCreateFolder(parent, name) { const it = parent.getFoldersByName(name); return it.hasNext()?it.next():parent.createFolder(name); }
function getOrCreateSheet(ss, name) { let sh = ss.getSheetByName(name); return sh || ss.insertSheet(name); }
function ensureHeader(sh, headers) { if (sh.getLastRow() === 0) { sh.appendRow(headers); sh.setFrozenRows(1); } }
function getOrCreateCalendar(name) { const cals = CalendarApp.getCalendarsByName(name); return cals.length ? cals[0] : CalendarApp.createCalendar(name); }
function makeFileName(data, ext) { return safeName((data.number||"EBTCC")+"_"+(data.station||"Estacao")+"_"+(data.date||""))+"."+ext; }
function makePhotoName(data, i) { return safeName((data.number||"EBTCC")+"_"+(data.station||"Estacao")+"_Foto_"+i)+".jpg"; }
function safeName(name) { return String(name||"Sem_nome").replace(/[\\/:*?"<>|#%{}~&]/g,"_").replace(/\s+/g,"_"); }
function jsonOutput(obj) { return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON); }
