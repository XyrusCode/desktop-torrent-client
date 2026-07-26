use tauri::{
    AppHandle, Manager,
    menu::{MenuBuilder, MenuItemBuilder},
    tray::TrayIconBuilder,
};

pub fn create_tray(app: AppHandle<tauri::Wry>) -> Result<(), tauri::Error> {
    let show = MenuItemBuilder::with_id("show", "Show Window").build(&app)?;
    let pause_all = MenuItemBuilder::with_id("pause_all", "Pause All").build(&app)?;
    let resume_all = MenuItemBuilder::with_id("resume_all", "Resume All").build(&app)?;
    let separator = tauri::menu::PredefinedMenuItem::separator(&app)?;
    let quit = MenuItemBuilder::with_id("quit", "Quit").build(&app)?;

    let menu = MenuBuilder::new(&app)
        .item(&show)
        .item(&pause_all)
        .item(&resume_all)
        .item(&separator)
        .item(&quit)
        .build()?;

    let icon = tauri::image::Image::from_bytes(include_bytes!("../icons/32x32.png"))
        .unwrap_or_else(|_| tauri::image::Image::new(&[], 0, 0));

    TrayIconBuilder::new()
        .icon(icon)
        .menu(&menu)
        .tooltip("Torrent Client")
        .on_menu_event(|app, event| {
            match event.id().as_ref() {
                "show" => {
                    if let Some(window) = app.get_webview_window("main") {
                        let _ = window.show();
                        let _ = window.set_focus();
                    }
                }
                "quit" => {
                    app.exit(0);
                }
                "pause_all" => {
                    let app = app.clone();
                    tauri::async_runtime::spawn(async move {
                        let state = app.state::<crate::AppState>();
                        let mut engine = state.engine.lock().await;
                        engine.pause_all(&app).await;
                    });
                }
                "resume_all" => {
                    let app = app.clone();
                    tauri::async_runtime::spawn(async move {
                        let state = app.state::<crate::AppState>();
                        let mut engine = state.engine.lock().await;
                        engine.resume_all(&app).await;
                    });
                }
                _ => {}
            }
        })
        .build(&app)?;

    Ok(())
}
