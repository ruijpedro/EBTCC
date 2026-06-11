import { GOOGLE_CONFIG, setAppsScriptUrl } from "./config.js";

export function googleConfigured(){ return Boolean(localStorage.getItem("EBTCC_APPS_SCRIPT_URL") || GOOGLE_CONFIG.APPS_SCRIPT_URL); }
export function saveAppsScriptUrl(url){ setAppsScriptUrl(url); }
function getScriptUrl(){ return localStorage.getItem("EBTCC_APPS_SCRIPT_URL") || GOOGLE_CONFIG.APPS_SCRIPT_URL; }

export async function sendToGoogle(action, payload){
  const url = getScriptUrl();
  if(!url) return { ok:false, message:"URL Apps Script não configurado" };
  const response = await fetch(url, {
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

export async function testConnection(){ return await sendToGoogle("test", {}); }
export async function prepareDrive(){ return await sendToGoogle("prepareDrive", {}); }
export async function saveInspectionToDrive(data){ return await sendToGoogle("saveInspection", data); }
export async function registerNCStats(data){ return await sendToGoogle("registerNCStats", data); }
export async function fullSync(data){ return await sendToGoogle("fullSync", data); }
export async function loadCloud(){ return await sendToGoogle("loadCloud", {}); }
export async function exportCalendar(data){ return await sendToGoogle("exportCalendar", data); }
