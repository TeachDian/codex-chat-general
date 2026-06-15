mod usage;

use tauri::Manager;
use usage::DashboardData;

#[tauri::command]
fn load_usage(app: tauri::AppHandle) -> Result<DashboardData, String> {
    let (database_path, codex_home) = usage_paths(&app)?;
    usage::load_database(&database_path, &codex_home).map_err(|error| error.to_string())
}

#[tauri::command]
fn refresh_usage(app: tauri::AppHandle) -> Result<DashboardData, String> {
    let (database_path, codex_home) = usage_paths(&app)?;
    usage::refresh_database(&database_path, &codex_home).map_err(|error| error.to_string())
}

fn usage_paths(app: &tauri::AppHandle) -> Result<(std::path::PathBuf, std::path::PathBuf), String> {
    let app_data = app
        .path()
        .app_data_dir()
        .map_err(|error| format!("Could not resolve app data directory: {error}"))?;
    let database_path = app_data.join("token-ledger.sqlite");
    let codex_home = usage::default_codex_home().map_err(|error| error.to_string())?;

    Ok((database_path, codex_home))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![load_usage, refresh_usage])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
