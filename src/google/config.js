export const GOOGLE_CONFIG = {
  APP_NAME: "EBTCC",
  APP_GROUP: "Manutenção Ferroviária RJP",
  DRIVE_ROOT_FOLDER_ID: "12BvkIaHTFVpiNZ8S4GBrozTzipgZIEfm",
  DRIVE_ROOT_FOLDER_NAME: "EBTCC",
  APPS_SCRIPT_URL: localStorage.getItem("EBTCC_APPS_SCRIPT_URL") || ""
};

export function setAppsScriptUrl(url){
  localStorage.setItem("EBTCC_APPS_SCRIPT_URL", url || "");
}
