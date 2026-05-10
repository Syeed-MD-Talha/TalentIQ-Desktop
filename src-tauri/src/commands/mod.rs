use crate::models::{ProviderModelList, ScreeningProvider, ScreeningResult};
use crate::screening;
use std::fs;
use std::path::PathBuf;
use tauri_plugin_opener::OpenerExt;

#[tauri::command]
pub(crate) async fn screen_cvs(
    app: tauri::AppHandle,
    input_dir: String,
    instruction: String,
    provider: ScreeningProvider,
) -> Result<ScreeningResult, String> {
    screening::run_screening(app, input_dir, instruction, provider).await
}

#[tauri::command]
pub(crate) fn export_csv(file_path: String, csv_content: String) -> Result<(), String> {
    let normalized_path = if file_path.to_ascii_lowercase().ends_with(".csv") {
        file_path
    } else {
        format!("{file_path}.csv")
    };

    fs::write(&normalized_path, csv_content)
        .map_err(|e| format!("Failed to save CSV to {}: {}", normalized_path, e))
}

#[tauri::command]
pub(crate) fn open_cv_file(app: tauri::AppHandle, file_path: String) -> Result<(), String> {
    let path = PathBuf::from(&file_path);

    if !path.exists() {
        return Err(format!("File not found: {}", file_path));
    }

    if !path.is_file() {
        return Err(format!("Not a file: {}", file_path));
    }

    app.opener()
        .open_path(&file_path, None::<&str>)
        .map_err(|e| format!("Could not open file {}: {}", file_path, e))
}

#[tauri::command]
pub(crate) fn reveal_cv_file(app: tauri::AppHandle, file_path: String) -> Result<(), String> {
    let path = PathBuf::from(&file_path);

    if !path.exists() {
        return Err(format!("File not found: {}", file_path));
    }

    app.opener()
        .reveal_item_in_dir(&file_path)
        .map_err(|e| format!("Could not reveal file {}: {}", file_path, e))
}

#[tauri::command]
pub(crate) async fn fetch_provider_models(provider: ScreeningProvider) -> Result<ProviderModelList, String> {
    let models = screening::fetch_provider_models(provider).await?;
    Ok(ProviderModelList { models })
}
