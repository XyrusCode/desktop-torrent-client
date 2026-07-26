use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppSettings {
    pub download_dir: String,
    pub listen_port: u16,
    pub max_download_speed: i64,
    pub max_upload_speed: i64,
    pub max_active: i32,
    pub max_downloading: i32,
    pub max_active_seeding: i32,
    pub theme: String,
    pub start_minimized: bool,
    pub close_to_tray: bool,
    pub notify_on_complete: bool,
    pub enable_dht: bool,
    pub enable_pex: bool,
    pub enable_lsd: bool,
    pub enable_upnp: bool,
    pub proxy_type: String,
    pub proxy_host: String,
    pub proxy_port: u16,
    pub proxy_auth: bool,
    pub proxy_username: String,
    pub proxy_password: String,
}

impl Default for AppSettings {
    fn default() -> Self {
        Self {
            download_dir: std::env::var("USERPROFILE")
                .unwrap_or_else(|_| "C:\\Downloads".to_string())
                + "\\Downloads",
            listen_port: 6881,
            max_download_speed: 0,
            max_upload_speed: 0,
            max_active: 10,
            max_downloading: 5,
            max_active_seeding: 5,
            theme: "dark".to_string(),
            start_minimized: false,
            close_to_tray: true,
            notify_on_complete: true,
            enable_dht: true,
            enable_pex: true,
            enable_lsd: true,
            enable_upnp: true,
            proxy_type: "none".to_string(),
            proxy_host: String::new(),
            proxy_port: 0,
            proxy_auth: false,
            proxy_username: String::new(),
            proxy_password: String::new(),
        }
    }
}
