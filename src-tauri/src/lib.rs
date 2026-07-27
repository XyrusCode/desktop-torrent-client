mod commands;
mod db;
mod engine;
mod events;
mod magnet_handler;
mod rss;
mod search;
mod settings;
mod tray;

use std::sync::Arc;
use tauri::{Emitter, Manager};
use tokio::sync::Mutex;
use engine::TorrentEngine;

pub struct AppState {
    pub engine: Arc<Mutex<TorrentEngine>>,
    pub db: Arc<Mutex<db::Database>>,
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tracing_subscriber::fmt::init();

    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(tauri_plugin_single_instance::init(|app, argv, _cwd| {
            if let Some(url) = argv.get(1) {
                let _ = app.emit("magnet://received", url.clone());
            }
        }))
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_deep_link::init())
        .setup(|app| {
            let app_handle = app.handle().clone();

            let db_path = app
                .path()
                .app_data_dir()
                .unwrap_or_default()
                .join("torrents.db");
            std::fs::create_dir_all(db_path.parent().unwrap()).ok();

            let db = db::Database::new(&db_path).expect("Failed to init database");
            let settings = db.load_settings().unwrap_or_default();

            let engine = TorrentEngine::new(
                settings.download_dir.clone(),
                settings.listen_port,
            );

            let state = AppState {
                engine: Arc::new(Mutex::new(engine)),
                db: Arc::new(Mutex::new(db)),
            };
            app.manage(state);

            tray::create_tray(app_handle.clone())?;
            magnet_handler::setup(app_handle.clone());

            let handle = app.handle().clone();
            tauri::async_runtime::spawn(async move {
                let state = handle.state::<AppState>();
                let mut engine = state.engine.lock().await;
                engine.start(&handle).await;

                // Stats refresh loop
                let handle_clone = handle.clone();
                loop {
                    tokio::time::sleep(tokio::time::Duration::from_secs(1)).await;
                    let state = handle_clone.state::<AppState>();
                    let mut engine = state.engine.lock().await;
                    engine.refresh_stats().await;
                    for t in engine.get_torrents() {
                        let _ = handle_clone.emit("torrent://status", &t);
                    }
                }
            });

            Ok(())
        })
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::CloseRequested { .. } = event {
                let _ = window.hide();
            }
        })
        .invoke_handler(tauri::generate_handler![
            commands::add_torrent,
            commands::add_torrents,
            commands::remove_torrent,
            commands::pause_torrent,
            commands::resume_torrent,
            commands::recheck_torrent,
            commands::get_torrents,
            commands::get_torrent_detail,
            commands::set_limits,
            commands::set_category,
            commands::add_tracker,
            commands::list_categories,
            commands::create_category,
            commands::delete_category,
            commands::get_settings,
            commands::set_settings,
            commands::rss_add_feed,
            commands::rss_remove_feed,
            commands::rss_list_feeds,
            commands::search,
            commands::get_queue,
            commands::set_queue_position,
            commands::set_sequential_download,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
