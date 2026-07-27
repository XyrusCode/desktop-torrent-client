use tauri::{Emitter, State};
use crate::engine::{
    AddTorrentOptions, TorrentLimits, TorrentStatus, TorrentDetail,
};
use crate::settings::AppSettings;
use crate::AppState;

#[tauri::command]
pub async fn add_torrent(
    app: tauri::AppHandle,
    state: State<'_, AppState>,
    options: AddTorrentOptions,
) -> Result<TorrentStatus, String> {
    let mut engine = state.engine.lock().await;
    let status = engine.add_torrent(&app, options).await?;
    state.db.lock().await.save_torrent(&status)?;
    Ok(status)
}

#[tauri::command]
pub async fn add_torrents(
    app: tauri::AppHandle,
    state: State<'_, AppState>,
    items: Vec<AddTorrentOptions>,
) -> Result<Vec<TorrentStatus>, String> {
    let mut results = Vec::new();

    for options in items {
        let status = {
            let mut engine = state.engine.lock().await;
            engine.add_torrent(&app, options).await?
        };
        state.db.lock().await.save_torrent(&status)?;
        results.push(status);
    }
    Ok(results)
}

#[tauri::command]
pub async fn remove_torrent(
    app: tauri::AppHandle,
    state: State<'_, AppState>,
    id: String,
    remove_data: bool,
) -> Result<(), String> {
    let mut engine = state.engine.lock().await;
    engine.remove_torrent(&app, id.clone(), remove_data).await?;
    state.db.lock().await.remove_torrent(&id)?;
    Ok(())
}

#[tauri::command]
pub async fn pause_torrent(
    app: tauri::AppHandle,
    state: State<'_, AppState>,
    id: String,
) -> Result<(), String> {
    state.engine.lock().await.pause_torrent(&app, id).await
}

#[tauri::command]
pub async fn resume_torrent(
    app: tauri::AppHandle,
    state: State<'_, AppState>,
    id: String,
) -> Result<(), String> {
    state.engine.lock().await.resume_torrent(&app, id).await
}

#[tauri::command]
pub async fn recheck_torrent(
    state: State<'_, AppState>,
    id: String,
) -> Result<(), String> {
    state.engine.lock().await.recheck_torrent(id).await
}

#[tauri::command]
pub async fn get_torrents(
    state: State<'_, AppState>,
) -> Result<Vec<TorrentStatus>, String> {
    let engine = state.engine.lock().await;
    Ok(engine.get_torrents())
}

#[tauri::command]
pub async fn get_torrent_detail(
    state: State<'_, AppState>,
    id: String,
) -> Result<Option<TorrentDetail>, String> {
    let engine = state.engine.lock().await;
    Ok(engine.get_torrent_detail(&id))
}

#[tauri::command]
pub async fn set_limits(
    state: State<'_, AppState>,
    id: String,
    limits: TorrentLimits,
) -> Result<(), String> {
    state.engine.lock().await.set_limits(id, limits).await
}

#[tauri::command]
pub async fn set_category(
    state: State<'_, AppState>,
    id: String,
    category: Option<String>,
) -> Result<(), String> {
    state.engine.lock().await.set_category(id, category).await
}

#[tauri::command]
pub async fn add_tracker(
    state: State<'_, AppState>,
    id: String,
    tracker_url: String,
) -> Result<(), String> {
    state.engine.lock().await.add_tracker(id, tracker_url).await
}

#[tauri::command]
pub async fn set_sequential_download(
    state: State<'_, AppState>,
    id: String,
    sequential: bool,
) -> Result<(), String> {
    state.engine.lock().await.set_sequential(id, sequential).await
}

#[tauri::command]
pub async fn list_categories(
    state: State<'_, AppState>,
) -> Result<Vec<String>, String> {
    let db = state.db.lock().await;
    let cats = db.get_categories()?;
    Ok(cats.into_iter().map(|c| c.name).collect())
}

#[tauri::command]
pub async fn create_category(
    state: State<'_, AppState>,
    name: String,
    save_path: String,
) -> Result<(), String> {
    state.db.lock().await.create_category(&name, &save_path)
}

#[tauri::command]
pub async fn delete_category(
    state: State<'_, AppState>,
    name: String,
) -> Result<(), String> {
    state.db.lock().await.delete_category(&name)
}

#[tauri::command]
pub async fn get_settings(
    state: State<'_, AppState>,
) -> Result<AppSettings, String> {
    let db = state.db.lock().await;
    db.load_settings()
}

#[tauri::command]
pub async fn set_settings(
    app: tauri::AppHandle,
    state: State<'_, AppState>,
    settings: AppSettings,
) -> Result<(), String> {
    let db = state.db.lock().await;
    db.save_setting("download_dir", &settings.download_dir)?;
    db.save_setting("listen_port", &settings.listen_port.to_string())?;
    db.save_setting("max_dl_speed", &settings.max_download_speed.to_string())?;
    db.save_setting("max_up_speed", &settings.max_upload_speed.to_string())?;
    db.save_setting("max_active", &settings.max_active.to_string())?;
    db.save_setting("theme", &settings.theme)?;
    db.save_setting("start_minimized", &settings.start_minimized.to_string())?;
    db.save_setting("close_to_tray", &settings.close_to_tray.to_string())?;

    drop(db);
    let mut engine = state.engine.lock().await;
    let _ = engine.pause_all(&app).await;

    Ok(())
}

#[tauri::command]
pub async fn rss_add_feed(
    state: State<'_, AppState>,
    url: String,
    name: String,
) -> Result<i64, String> {
    state.db.lock().await.add_rss_feed(&url, &name)
}

#[tauri::command]
pub async fn rss_remove_feed(
    state: State<'_, AppState>,
    id: i64,
) -> Result<(), String> {
    state.db.lock().await.remove_rss_feed(id)
}

#[tauri::command]
pub async fn rss_list_feeds(
    state: State<'_, AppState>,
) -> Result<Vec<crate::db::RssFeed>, String> {
    state.db.lock().await.get_rss_feeds()
}

#[tauri::command]
pub async fn search(
    query: String,
    _category: Option<String>,
) -> Result<Vec<serde_json::Value>, String> {
    let url = format!(
        "https://api.{}/search?q={}&cat={}",
        "jackett.example.com",
        urlencoding(&query),
        _category.unwrap_or_default()
    );
    let resp = reqwest::get(&url).await.map_err(|e| format!("Search error: {}", e))?;
    let results: Vec<serde_json::Value> = resp.json().await.map_err(|e| format!("Parse error: {}", e))?;
    Ok(results)
}

#[tauri::command]
pub async fn get_queue(
    state: State<'_, AppState>,
) -> Result<Vec<TorrentStatus>, String> {
    let engine = state.engine.lock().await;
    let mut torrents = engine.get_torrents();
    torrents.sort_by(|a, b| b.added_at.cmp(&a.added_at));
    Ok(torrents)
}

#[tauri::command]
pub async fn set_queue_position(
    _state: State<'_, AppState>,
    id: String,
    position: i32,
) -> Result<(), String> {
    tracing::info!("Set queue position {} for torrent {}", position, id);
    Ok(())
}

fn urlencoding(s: &str) -> String {
    s.chars().map(|c| match c {
        'A'..='Z' | 'a'..='z' | '0'..='9' | '-' | '_' | '.' | '~' => c.to_string(),
        _ => format!("%{:02X}", c as u8),
    }).collect()
}
