import { GOOGLE_CONFIG } from "./config.js";

export function googleConfigured(){
  return Boolean(GOOGLE_CONFIG.APPS_SCRIPT_URL);
}

export async function sendToGoogle(action, payload){
  if(!GOOGLE_CONFIG.APPS_SCRIPT_URL){
    alert("Falta configurar o APPS_SCRIPT_URL em src/google/config.js");
    return { ok:false, message:"APPS_SCRIPT_URL não configurado" };
  }
  const response = await fetch(GOOGLE_CONFIG.APPS_SCRIPT_URL, {
    method: "POST",
    mode: "cors",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({
      action,
      app: GOOGLE_CONFIG.APP_NAME,
      group: GOOGLE_CONFIG.APP_GROUP,
      rootFolderId: GOOGLE_CONFIG.DRIVE_ROOT_FOLDER_ID,
      rootFolderName: GOOGLE_CONFIG.DRIVE_ROOT_FOLDER_NAME,
      payload
    })
  });
  return await response.json();
}

export async function saveInspectionToDrive(data){ return await sendToGoogle("saveInspection", data); }
export async function registerNCStats(data){ return await sendToGoogle("registerNCStats", data); }
export async function syncMaintenanceHub(data){ return await sendToGoogle("syncMaintenanceHub", data); }
export async function fullSync(data){ return await sendToGoogle("fullSync", data); }
