mod commands;
mod models;
mod screening;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            commands::screen_cvs,
            commands::export_csv,
            commands::fetch_provider_models,
            commands::open_cv_file,
            commands::reveal_cv_file
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
