use irontide::client::ClientBuilder;
use irontide::core::{Id20, Magnet};
use irontide::session::{SessionAddTorrentParams, SessionHandle, TorrentStats};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use tauri::Emitter;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TorrentStatus {
    pub id: String,
    pub name: String,
    pub info_hash: String,
    pub size: u64,
    pub downloaded: u64,
    pub uploaded: u64,
    pub progress: f64,
    pub download_rate: u64,
    pub upload_rate: u64,
    pub state: String,
    pub peers_connected: u32,
    pub seeds_connected: u32,
    pub total_peers: u32,
    pub total_seeds: u32,
    pub ratio: f64,
    pub eta: u64,
    pub added_at: i64,
    pub completed_at: Option<i64>,
    pub category: Option<String>,
    pub save_path: String,
    pub download_limit: u64,
    pub upload_limit: u64,
    pub sequential: bool,
    pub queue_position: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TorrentDetail {
    pub info: TorrentStatus,
    pub trackers: Vec<TrackerStatus>,
    pub files: Vec<FileInfo>,
    pub peers: Vec<PeerInfo>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TrackerStatus {
    pub url: String,
    pub status: String,
    pub peers: u32,
    pub seeds: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileInfo {
    pub path: String,
    pub size: u64,
    pub downloaded: u64,
    pub priority: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PeerInfo {
    pub ip: String,
    pub port: u16,
    pub client: String,
    pub download_rate: u64,
    pub upload_rate: u64,
    pub progress: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AddTorrentOptions {
    pub uri: String,
    pub save_path: Option<String>,
    pub category: Option<String>,
    pub sequential: Option<bool>,
    pub paused: Option<bool>,
    pub download_limit: Option<u64>,
    pub upload_limit: Option<u64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TorrentLimits {
    pub download_limit: Option<u64>,
    pub upload_limit: Option<u64>,
    pub ratio_limit: Option<f64>,
    pub seeding_time_limit: Option<i64>,
}

pub struct TorrentEngine {
    session: Option<SessionHandle>,
    statuses: HashMap<String, TorrentStatus>,
    download_dir: String,
    listen_port: u16,
}

impl TorrentEngine {
    pub fn new(download_dir: String, listen_port: u16) -> Self {
        Self {
            session: None,
            statuses: HashMap::new(),
            download_dir,
            listen_port,
        }
    }

    pub async fn start(&mut self, _app: &tauri::AppHandle) {
        let session = ClientBuilder::new()
            .download_dir(&self.download_dir)
            .listen_port(self.listen_port)
            .enable_dht(true)
            .enable_pex(true)
            .enable_lsd(true)
            .enable_upnp(true)
            .enable_utp(true)
            .start()
            .await
            .expect("Failed to create IronTide session");

        self.session = Some(session);
        tracing::info!("Torrent engine started on port {}", self.listen_port);
    }

    pub async fn stop(&mut self) {
        if let Some(session) = self.session.take() {
            let _ = session.shutdown().await;
        }
    }

    fn session(&self) -> std::result::Result<&SessionHandle, String> {
        self.session.as_ref().ok_or_else(|| "Engine not started".to_string())
    }

    pub async fn add_torrent(
        &mut self,
        app: &tauri::AppHandle,
        options: AddTorrentOptions,
    ) -> std::result::Result<TorrentStatus, String> {
        let session = self.session()?;
        let id = uuid::Uuid::new_v4().to_string();

        let _magnet = Magnet::parse(&options.uri)
            .map_err(|e| format!("Invalid magnet URI: {}", e))?;

        let mut params = SessionAddTorrentParams::magnet(&options.uri);
        if let Some(dir) = &options.save_path {
            params = params.with_download_dir(dir);
        }
        if let Some(seq) = options.sequential {
            params = params.sequential_download(seq);
        }
        if let Some(paused) = options.paused {
            params = params.paused(paused);
        }

        let info_hash = session.add_torrent(params).await
            .map_err(|e| format!("Failed to add torrent: {}", e))?;

        let stats = session.torrent_stats(info_hash).await
            .map_err(|e| format!("Failed to get stats: {}", e))?;

        let status = self.build_status(&id, &stats, &options.category);
        self.statuses.insert(id.clone(), status.clone());

        let _ = app.emit("torrent://added", &status);
        Ok(status)
    }

    pub async fn remove_torrent(
        &mut self,
        app: &tauri::AppHandle,
        id: String,
        remove_data: bool,
    ) -> std::result::Result<(), String> {
        let session = self.session()?;
        let info_hash = self.find_info_hash(&id)?;

        let result = if remove_data {
            session.remove_torrent_with_files(info_hash).await
        } else {
            session.remove_torrent(info_hash).await
        };
        result.map_err(|e| format!("Failed to remove torrent: {}", e))?;

        self.statuses.remove(&id);
        let _ = app.emit("torrent://removed", &id);
        Ok(())
    }

    pub async fn pause_torrent(
        &mut self, app: &tauri::AppHandle, id: String
    ) -> std::result::Result<(), String> {
        let session = self.session()?;
        let info_hash = self.find_info_hash(&id)?;
        session.pause_torrent(info_hash).await
            .map_err(|e| format!("Failed to pause: {}", e))?;
        let _ = app.emit("torrent://paused", &id);
        Ok(())
    }

    pub async fn resume_torrent(
        &mut self, app: &tauri::AppHandle, id: String
    ) -> std::result::Result<(), String> {
        let session = self.session()?;
        let info_hash = self.find_info_hash(&id)?;
        session.resume_torrent(info_hash).await
            .map_err(|e| format!("Failed to resume: {}", e))?;
        let _ = app.emit("torrent://resumed", &id);
        Ok(())
    }

    pub async fn recheck_torrent(&mut self, id: String) -> std::result::Result<(), String> {
        let session = self.session()?;
        let info_hash = self.find_info_hash(&id)?;
        session.force_recheck(info_hash).await
            .map_err(|e| format!("Failed to recheck: {}", e))?;
        Ok(())
    }

    pub async fn set_limits(
        &mut self, id: String, limits: TorrentLimits
    ) -> std::result::Result<(), String> {
        let session = self.session()?;
        let info_hash = self.find_info_hash(&id)?;

        if let Some(dl) = limits.download_limit {
            session.set_download_limit(info_hash, dl).await
                .map_err(|e| e.to_string())?;
        }
        if let Some(ul) = limits.upload_limit {
            session.set_upload_limit(info_hash, ul).await
                .map_err(|e| e.to_string())?;
        }
        if let Some(ratio) = limits.ratio_limit {
            session.set_torrent_seed_ratio(info_hash, Some(ratio)).await
                .map_err(|e| e.to_string())?;
        }
        Ok(())
    }

    pub async fn set_category(
        &mut self, id: String, category: Option<String>
    ) -> std::result::Result<(), String> {
        if let Some(status) = self.statuses.get_mut(&id) {
            status.category = category;
        }
        Ok(())
    }

    pub async fn set_sequential(
        &mut self, id: String, sequential: bool
    ) -> std::result::Result<(), String> {
        let session = self.session()?;
        let info_hash = self.find_info_hash(&id)?;
        session.set_sequential_download(info_hash, sequential).await
            .map_err(|e| format!("Failed to set sequential: {}", e))?;
        if let Some(status) = self.statuses.get_mut(&id) {
            status.sequential = sequential;
        }
        Ok(())
    }

    pub async fn add_tracker(
        &mut self, id: String, tracker_url: String
    ) -> std::result::Result<(), String> {
        let session = self.session()?;
        let info_hash = self.find_info_hash(&id)?;
        session.add_tracker(info_hash, tracker_url).await
            .map_err(|e| format!("Failed to add tracker: {}", e))?;
        Ok(())
    }

    pub fn get_torrents(&self) -> Vec<TorrentStatus> {
        self.statuses.values().cloned().collect()
    }

    pub fn get_torrent_detail(&self, id: &str) -> Option<TorrentDetail> {
        self.statuses.get(id).map(|status| TorrentDetail {
            info: status.clone(),
            trackers: vec![],
            files: vec![],
            peers: vec![],
        })
    }

    pub async fn restore_torrent(&mut self, app: &tauri::AppHandle, status: TorrentStatus) {
        let options = AddTorrentOptions {
            uri: format!("magnet:?xt=urn:btih:{}", status.info_hash),
            save_path: Some(status.save_path.clone()),
            category: status.category.clone(),
            sequential: Some(status.sequential),
            paused: Some(true),
            download_limit: Some(if status.download_limit > 0 { status.download_limit } else { 0 }),
            upload_limit: Some(if status.upload_limit > 0 { status.upload_limit } else { 0 }),
        };

        if let Ok(new_status) = self.add_torrent(app, options).await {
            if status.state == "Downloading" || status.state == "Seeding" {
                let _ = self.resume_torrent(app, new_status.id).await;
            }
        }
    }

    pub async fn resume_all(&mut self, app: &tauri::AppHandle) {
        let ids: Vec<String> = self.statuses.keys().cloned().collect();
        for id in ids {
            if let Some(status) = self.statuses.get(&id) {
                if status.state == "Paused" {
                    let _ = self.resume_torrent(app, id).await;
                }
            }
        }
    }

    pub async fn pause_all(&mut self, app: &tauri::AppHandle) {
        let ids: Vec<String> = self.statuses.keys().cloned().collect();
        for id in ids {
            if let Some(status) = self.statuses.get(&id) {
                if status.state == "Downloading" || status.state == "Seeding" {
                    let _ = self.pause_torrent(app, id).await;
                }
            }
        }
    }

    pub async fn refresh_stats(&mut self) {
        let summaries = match &self.session {
            Some(s) => s.list_torrent_summaries().await.unwrap_or_default(),
            None => return,
        };

        for summary in &summaries {
            for (_id, status) in &mut self.statuses {
                if status.info_hash == summary.info_hash {
                    status.progress = summary.progress;
                    status.download_rate = summary.download_rate;
                    status.upload_rate = summary.upload_rate;
                    status.peers_connected = summary.num_peers as u32;
                    status.seeds_connected = summary.num_seeds as u32;
                    status.uploaded = summary.all_time_upload;
                    status.downloaded = summary.all_time_download;
                    status.size = summary.total_size;

                    status.state = match summary.state {
                        irontide::session::TorrentState::Downloading => "Downloading",
                        irontide::session::TorrentState::Seeding => "Seeding",
                        irontide::session::TorrentState::Paused => "Paused",
                        irontide::session::TorrentState::Checking => "Checking",
                        irontide::session::TorrentState::Queued => "Queued",
                        irontide::session::TorrentState::Complete => "Done",
                        _ => "Unknown",
                    }.to_string();

                    if status.downloaded > 0 {
                        status.ratio = status.uploaded as f64 / status.downloaded as f64;
                    }
                    if status.download_rate > 0 {
                        status.eta = (status.size.saturating_sub(status.downloaded)) / status.download_rate;
                    }
                }
            }
        }
    }

    fn find_info_hash(&self, id: &str) -> std::result::Result<Id20, String> {
        self.statuses.get(id)
            .and_then(|s| Id20::from_hex(&s.info_hash).ok())
            .ok_or_else(|| "Torrent not found".to_string())
    }

    fn build_status(&self, id: &str, stats: &TorrentStats, category: &Option<String>) -> TorrentStatus {
        let download_rate = stats.download_payload_rate;
        let upload_rate = stats.upload_payload_rate;
        let downloaded = stats.total_payload_download;
        let uploaded = stats.total_payload_upload;

        let state = if stats.is_paused {
            "Paused"
        } else if stats.is_seeding {
            "Seeding"
        } else if stats.is_finished {
            "Done"
        } else {
            match stats.state {
                irontide::session::TorrentState::Downloading => "Downloading",
                irontide::session::TorrentState::Checking => "Checking",
                irontide::session::TorrentState::Queued => "Queued",
                _ => "Downloading",
            }
        };

        TorrentStatus {
            id: id.to_string(),
            name: stats.name.clone(),
            info_hash: stats.info_hashes.best_v1().to_hex(),
            size: stats.total,
            downloaded,
            uploaded,
            progress: stats.progress as f64,
            download_rate,
            upload_rate,
            state: state.to_string(),
            peers_connected: stats.num_peers as u32,
            seeds_connected: stats.num_seeds as u32,
            total_peers: stats.num_peers as u32,
            total_seeds: stats.num_seeds as u32,
            ratio: if downloaded > 0 { uploaded as f64 / downloaded as f64 } else { 0.0 },
            eta: if download_rate > 0 {
                (stats.total.saturating_sub(downloaded)) / download_rate
            } else { 0 },
            added_at: stats.added_time,
            completed_at: if stats.completed_time > 0 { Some(stats.completed_time) } else { None },
            category: category.clone(),
            save_path: self.download_dir.clone(),
            download_limit: 0,
            upload_limit: 0,
            sequential: stats.sequential_download,
            queue_position: stats.queue_position,
        }
    }
}
