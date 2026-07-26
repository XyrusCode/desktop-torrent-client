use tauri::{AppHandle, Emitter, Listener, Manager};
use crate::engine::AddTorrentOptions;
use crate::AppState;

pub fn setup(app: AppHandle) {
    let handle = app.clone();

    app.listen("magnet://received", move |event| {
        let url = event.payload().trim_matches('"').to_string();
        if !url.starts_with("magnet:") {
            return;
        }

        let app = handle.clone();
        tauri::async_runtime::spawn(async move {
            let state = app.state::<AppState>();
            let mut engine = state.engine.lock().await;

            let options = AddTorrentOptions {
                uri: url,
                save_path: None,
                category: None,
                sequential: None,
                paused: None,
                download_limit: None,
                upload_limit: None,
            };

            if let Ok(status) = engine.add_torrent(&app, options).await {
                let _ = state.db.lock().await.save_torrent(&status);
            }
        });
    });
}

pub fn process_url(app: &AppHandle, url: &str) {
    let _ = app.emit("magnet://received", url);
}
