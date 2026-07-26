use rusqlite::{Connection, params};
use serde::{Deserialize, Serialize};
use std::path::Path;

use crate::engine::TorrentStatus;
use crate::settings::AppSettings;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RssFeed {
    pub id: i64,
    pub url: String,
    pub name: String,
    pub interval: i64,
    pub filters: String,
    pub last_poll: Option<i64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Category {
    pub name: String,
    pub save_path: String,
}

pub struct Database {
    conn: Connection,
}

impl Database {
    pub fn new(path: &Path) -> Result<Self, String> {
        let conn = Connection::open(path).map_err(|e| e.to_string())?;
        let db = Self { conn };
        db.migrate()?;
        Ok(db)
    }

    fn migrate(&self) -> Result<(), String> {
        self.conn.execute_batch("
            CREATE TABLE IF NOT EXISTS torrents (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                info_hash TEXT NOT NULL,
                size INTEGER NOT NULL DEFAULT 0,
                downloaded INTEGER NOT NULL DEFAULT 0,
                uploaded INTEGER NOT NULL DEFAULT 0,
                state TEXT NOT NULL DEFAULT 'Paused',
                save_path TEXT NOT NULL DEFAULT '',
                category TEXT,
                download_limit INTEGER NOT NULL DEFAULT 0,
                upload_limit INTEGER NOT NULL DEFAULT 0,
                sequential INTEGER NOT NULL DEFAULT 0,
                added_at INTEGER NOT NULL,
                completed_at INTEGER
            );
            CREATE TABLE IF NOT EXISTS categories (
                name TEXT PRIMARY KEY,
                save_path TEXT NOT NULL DEFAULT ''
            );
            CREATE TABLE IF NOT EXISTS rss_feeds (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                url TEXT NOT NULL UNIQUE,
                name TEXT NOT NULL,
                interval INTEGER NOT NULL DEFAULT 1800,
                filters TEXT NOT NULL DEFAULT '{}',
                last_poll INTEGER
            );
            CREATE TABLE IF NOT EXISTS settings (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL
            );
        ").map_err(|e| e.to_string())?;
        Ok(())
    }

    pub fn load_torrents(&self) -> Result<Vec<TorrentStatus>, String> {
        let mut stmt = self.conn.prepare(
            "SELECT id, name, info_hash, size, downloaded, uploaded, state, \
             save_path, category, download_limit, upload_limit, sequential, \
             added_at, completed_at FROM torrents"
        ).map_err(|e| e.to_string())?;

        let rows = stmt.query_map([], |row| {
            let state_str: String = row.get(6)?;

            Ok(TorrentStatus {
                id: row.get(0)?,
                name: row.get(1)?,
                info_hash: row.get(2)?,
                size: row.get(3)?,
                downloaded: row.get(4)?,
                uploaded: row.get(5)?,
                state: state_str,
                save_path: row.get(7)?,
                category: row.get(8)?,
                download_limit: row.get(9)?,
                upload_limit: row.get(10)?,
                sequential: row.get::<_, i32>(11)? != 0,
                added_at: row.get(12)?,
                completed_at: row.get(13)?,
                progress: 0.0,
                download_rate: 0,
                upload_rate: 0,
                peers_connected: 0,
                seeds_connected: 0,
                total_peers: 0,
                total_seeds: 0,
                ratio: 0.0,
                eta: 0,
                queue_position: 0,
            })
        }).map_err(|e| e.to_string())?;

        let mut torrents = Vec::new();
        for row in rows {
            torrents.push(row.map_err(|e| e.to_string())?);
        }
        Ok(torrents)
    }

    pub fn save_torrent(&self, t: &TorrentStatus) -> Result<(), String> {
        self.conn.execute(
            "INSERT OR REPLACE INTO torrents \
             (id, name, info_hash, size, downloaded, uploaded, state, save_path, \
              category, download_limit, upload_limit, sequential, added_at, completed_at) \
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14)",
            params![
                t.id, t.name, t.info_hash, t.size, t.downloaded, t.uploaded,
                t.state, t.save_path, t.category,
                t.download_limit, t.upload_limit, t.sequential as i32,
                t.added_at, t.completed_at
            ],
        ).map_err(|e| e.to_string())?;
        Ok(())
    }

    pub fn remove_torrent(&self, id: &str) -> Result<(), String> {
        self.conn.execute("DELETE FROM torrents WHERE id = ?1", params![id])
            .map_err(|e| e.to_string())?;
        Ok(())
    }

    pub fn load_settings(&self) -> Result<AppSettings, String> {
        let mut stmt = self.conn.prepare("SELECT key, value FROM settings")
            .map_err(|e| e.to_string())?;

        let mut settings = AppSettings::default();
        let rows = stmt.query_map([], |row| {
            Ok((row.get::<_, String>(0)?, row.get::<_, String>(1)?))
        }).map_err(|e| e.to_string())?;

        for row in rows {
            let (key, value) = row.map_err(|e| e.to_string())?;
            match key.as_str() {
                "download_dir" => settings.download_dir = value,
                "listen_port" => settings.listen_port = value.parse().unwrap_or(6881),
                "max_dl_speed" => settings.max_download_speed = value.parse().unwrap_or(0),
                "max_up_speed" => settings.max_upload_speed = value.parse().unwrap_or(0),
                "max_active" => settings.max_active = value.parse().unwrap_or(10),
                "theme" => settings.theme = value,
                "start_minimized" => settings.start_minimized = value == "true",
                "close_to_tray" => settings.close_to_tray = value == "true",
                _ => {}
            }
        }
        Ok(settings)
    }

    pub fn save_setting(&self, key: &str, value: &str) -> Result<(), String> {
        self.conn.execute(
            "INSERT OR REPLACE INTO settings (key, value) VALUES (?1, ?2)",
            params![key, value],
        ).map_err(|e| e.to_string())?;
        Ok(())
    }

    pub fn get_categories(&self) -> Result<Vec<Category>, String> {
        let mut stmt = self.conn.prepare("SELECT name, save_path FROM categories")
            .map_err(|e| e.to_string())?;
        let rows = stmt.query_map([], |row| {
            Ok(Category {
                name: row.get(0)?,
                save_path: row.get(1)?,
            })
        }).map_err(|e| e.to_string())?;

        let mut cats = Vec::new();
        for row in rows {
            cats.push(row.map_err(|e| e.to_string())?);
        }
        Ok(cats)
    }

    pub fn create_category(&self, name: &str, save_path: &str) -> Result<(), String> {
        self.conn.execute(
            "INSERT OR IGNORE INTO categories (name, save_path) VALUES (?1, ?2)",
            params![name, save_path],
        ).map_err(|e| e.to_string())?;
        Ok(())
    }

    pub fn delete_category(&self, name: &str) -> Result<(), String> {
        self.conn.execute("DELETE FROM categories WHERE name = ?1", params![name])
            .map_err(|e| e.to_string())?;
        Ok(())
    }

    pub fn get_rss_feeds(&self) -> Result<Vec<RssFeed>, String> {
        let mut stmt = self.conn.prepare(
            "SELECT id, url, name, interval, filters, last_poll FROM rss_feeds"
        ).map_err(|e| e.to_string())?;

        let rows = stmt.query_map([], |row| {
            Ok(RssFeed {
                id: row.get(0)?,
                url: row.get(1)?,
                name: row.get(2)?,
                interval: row.get(3)?,
                filters: row.get(4)?,
                last_poll: row.get(5)?,
            })
        }).map_err(|e| e.to_string())?;

        let mut feeds = Vec::new();
        for row in rows {
            feeds.push(row.map_err(|e| e.to_string())?);
        }
        Ok(feeds)
    }

    pub fn add_rss_feed(&self, url: &str, name: &str) -> Result<i64, String> {
        self.conn.execute(
            "INSERT OR IGNORE INTO rss_feeds (url, name) VALUES (?1, ?2)",
            params![url, name],
        ).map_err(|e| e.to_string())?;
        Ok(self.conn.last_insert_rowid())
    }

    pub fn remove_rss_feed(&self, id: i64) -> Result<(), String> {
        self.conn.execute("DELETE FROM rss_feeds WHERE id = ?1", params![id])
            .map_err(|e| e.to_string())?;
        Ok(())
    }

    pub fn update_rss_poll(&self, id: i64) -> Result<(), String> {
        self.conn.execute(
            "UPDATE rss_feeds SET last_poll = ?1 WHERE id = ?2",
            params![chrono::Utc::now().timestamp(), id],
        ).map_err(|e| e.to_string())?;
        Ok(())
    }
}
