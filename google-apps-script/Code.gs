const CONFIG = {
  ROOT_FOLDER_ID: "12BvkIaHTFVpiNZ8S4GBrozTzipgZIEfm",
  ROOT_FOLDER_NAME: "EBTCC",
  MASTER_SHEET_NAME: "MANUTENCAO_RJP_MASTER",
  APPS: ["Inspeções_RJP", "EBTCC", "EDF_Oeste", "AMV", "FenceRail_RJP"]
};

function doGet() {
  return jsonOutput({
    ok: true,
    app: "Inspeções_RJP Google Bridge",
    rootFolderId: CONFIG.ROOT_FOLDER_ID,
    message: "Ponte Google ativa."
  });
}

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents || "{}");
    const action = body.action;
    const payload = body.payload || {};
    const root = DriveApp.getFolderById(body.rootFolderId || CONFIG.ROOT_FOLDER_ID);

    if (action === "saveInspection") {
      return jsonOutput(saveInspection(root, body, payload));
    }

    if (action === "registerNCStats") {
      return jsonOutput(registerNCStats(body, payload));
    }

    if (action === "syncMaintenanceHub") {
      return jsonOutput(syncMaintenanceHub(body, payload));
    }

    return jsonOutput({ ok: false, message: "Ação desconhecida: " + action });
  } catch (err) {
    return jsonOutput({ ok: false, message: String(err), stack: err.stack });
  }
}

function saveInspection(root, body, data) {
  const appFolder = getOrCreateFolder(root, "Inspeções_RJP");
  const stationFolder = getOrCreateFolder(appFolder, safeName(data.station || "Sem_Estacao"));
  const pdfFolder = getOrCreateFolder(stationFolder, "PDFs");
  const photosFolder = getOrCreateFolder(stationFolder, "Fotos");

  let pdfUrl = "";
  if (data.pdfBase64) {
    const pdfBlob = Utilities.newBlob(
      Utilities.base64Decode(data.pdfBase64),
      "application/pdf",
      makeFileName(data, "pdf")
    );
    const pdfFile = pdfFolder.createFile(pdfBlob);
    pdfUrl = pdfFile.getUrl();
  }

  const photoUrls = [];
  const photos = data.photos || [];
  photos.forEach((p, index) => {
    if (p.data) {
      const base64 = String(p.data).split(",").pop();
      const blob = Utilities.newBlob(
        Utilities.base64Decode(base64),
        "image/jpeg",
        makePhotoName(data, index + 1)
      );
      const f = photosFolder.createFile(blob);
      photoUrls.push(f.getUrl());
    }
  });

  const sheet = getMasterSheet();
  appendInspection(sheet, data, pdfUrl, photoUrls);
  appendNC(sheet, data);

  return {
    ok: true,
    message: "Inspeção guardada no Google Drive.",
    pdfUrl,
    photoUrls,
    station: data.station
  };
}

function registerNCStats(body, data) {
  const sheet = getMasterSheet();
  appendNC(sheet, data);
  return { ok: true, message: "Estatísticas NC atualizadas." };
}

function syncMaintenanceHub(body, data) {
  const sheet = getMasterSheet();
  const sh = getOrCreateSheet(sheet, "Hub_Manutencao");
  ensureHeader(sh, [
    "Data", "App", "Origem", "Estação", "Tipo", "Descrição", "Estado", "Prioridade", "Responsável", "Link"
  ]);

  sh.appendRow([
    new Date(),
    body.app || "",
    data.origin || "Inspeções_RJP",
    data.station || "",
    data.type || "",
    data.description || "",
    data.status || "",
    data.priority || "",
    data.responsible || "",
    data.link || ""
  ]);

  return { ok: true, message: "Hub de manutenção atualizado." };
}

function appendInspection(ss, data, pdfUrl, photoUrls) {
  const sh = getOrCreateSheet(ss, "Inspecoes");
  ensureHeader(sh, [
    "Data Registo", "N.º Inspeção", "Estação", "Data Inspeção", "Inspetor",
    "Descrição", "Segmento", "PK", "NC Total", "PDF", "Fotos", "Estado", "Responsável"
  ]);

  const ncTotal = Object.values(data.results || {}).filter(v => v === "NC").length;

  sh.appendRow([
    new Date(),
    data.number || "",
    data.station || "",
    data.date || "",
    data.inspector || "",
    data.description || "",
    data.segment || "",
    data.pk || "",
    ncTotal,
    pdfUrl || "",
    photoUrls.join(" | "),
    data.status || "",
    data.responsible || ""
  ]);
}

function appendNC(ss, data) {
  const sh = getOrCreateSheet(ss, "Nao_Conformidades");
  ensureHeader(sh, [
    "Data Registo", "N.º Inspeção", "Estação", "Item", "Capítulo",
    "Não Conformidade", "Data Inspeção", "Responsável", "Estado"
  ]);

  const checklist = data.checklist || [];
  const itemMap = {};
  checklist.forEach(group => {
    const chapter = group[1];
    (group[2] || []).forEach(item => {
      itemMap[item[0]] = { chapter, text: item[1] };
    });
  });

  const results = data.results || {};
  Object.keys(results).forEach(code => {
    if (results[code] === "NC") {
      sh.appendRow([
        new Date(),
        data.number || "",
        data.station || "",
        code,
        itemMap[code] ? itemMap[code].chapter : "",
        itemMap[code] ? itemMap[code].text : "",
        data.date || "",
        data.responsible || "",
        data.status || ""
      ]);
    }
  });
}

function getMasterSheet() {
  const root = DriveApp.getFolderById(CONFIG.ROOT_FOLDER_ID);
  const files = root.getFilesByName(CONFIG.MASTER_SHEET_NAME);
  if (files.hasNext()) {
    return SpreadsheetApp.open(files.next());
  }

  const ss = SpreadsheetApp.create(CONFIG.MASTER_SHEET_NAME);
  const file = DriveApp.getFileById(ss.getId());
  root.addFile(file);
  DriveApp.getRootFolder().removeFile(file);

  getOrCreateSheet(ss, "Inspecoes");
  getOrCreateSheet(ss, "Nao_Conformidades");
  getOrCreateSheet(ss, "Hub_Manutencao");
  getOrCreateSheet(ss, "Apps");

  return ss;
}

function getOrCreateFolder(parent, name) {
  const folders = parent.getFoldersByName(name);
  if (folders.hasNext()) return folders.next();
  return parent.createFolder(name);
}

function getOrCreateSheet(ss, name) {
  let sh = ss.getSheetByName(name);
  if (!sh) sh = ss.insertSheet(name);
  return sh;
}

function ensureHeader(sh, headers) {
  if (sh.getLastRow() === 0) {
    sh.appendRow(headers);
    sh.setFrozenRows(1);
  }
}

function makeFileName(data, ext) {
  return safeName((data.number || "Inspecao") + "_" + (data.station || "Estacao") + "_" + (data.date || "")) + "." + ext;
}

function makePhotoName(data, i) {
  return safeName((data.number || "Inspecao") + "_" + (data.station || "Estacao") + "_Foto_" + i) + ".jpg";
}

function safeName(name) {
  return String(name || "Sem_nome").replace(/[\\/:*?"<>|#%{}~&]/g, "_").replace(/\s+/g, "_");
}

function jsonOutput(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
