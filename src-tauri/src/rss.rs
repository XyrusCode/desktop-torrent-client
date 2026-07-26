use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Manager};

use crate::AppState;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RssItem {
    pub title: String,
    pub link: String,
    pub size: Option<i64>,
    pub pub_date: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RssFilter {
    pub name: String,
    pub pattern: String,
    pub match_type: String,
    pub category: Option<String>,
    pub save_path: Option<String>,
    pub paused: bool,
    pub sequential: bool,
}

#[allow(dead_code)]
pub async fn poll_feed(app: AppHandle, _feed_id: i64, url: &str, filters_json: &str) -> Result<Vec<RssItem>, String> {
    let resp = reqwest::get(url).await.map_err(|e| format!("RSS fetch error: {}", e))?;
    let text = resp.text().await.map_err(|e| format!("RSS read error: {}", e))?;
    let items = parse_rss(&text)?;

    let filters: Vec<RssFilter> = serde_json::from_str(filters_json).unwrap_or_default();

    let state = app.state::<AppState>();
    let mut engine = state.engine.lock().await;
    let db = state.db.lock().await;

    for item in &items {
        for filter in &filters {
            if matches_filter(&item.title, filter) {
                // extract magnet link or info_hash from RSS item description
                if let Some(uri) = extract_uri(&item.link) {
                    let options = crate::engine::AddTorrentOptions {
                        uri,
                        save_path: filter.save_path.clone().or_else(|| {
                            filter.category.as_ref().and_then(|c| {
                                db.get_categories().ok()?.into_iter()
                                    .find(|cat| &cat.name == c)
                                    .map(|cat| cat.save_path)
                            })
                        }),
                        category: filter.category.clone(),
                        sequential: Some(filter.sequential),
                        paused: Some(filter.paused),
                        download_limit: None,
                        upload_limit: None,
                    };

                    if let Ok(status) = engine.add_torrent(&app, options).await {
                        let _ = db.save_torrent(&status);
                    }
                }
            }
        }
    }

    Ok(items)
}

fn parse_rss(xml: &str) -> Result<Vec<RssItem>, String> {
    let mut items = Vec::new();
    let mut current: Option<RssItem> = None;

    // Simple XML tag extraction
    for line in xml.lines() {
        let line = line.trim();
        if line.starts_with("<item>") {
            current = Some(RssItem {
                title: String::new(),
                link: String::new(),
                size: None,
                pub_date: None,
            });
        } else if line.starts_with("</item>") {
            if let Some(item) = current.take() {
                if !item.title.is_empty() {
                    items.push(item);
                }
            }
        } else if let Some(ref mut item) = current {
            if let Some(content) = extract_tag(line, "title") {
                item.title = content;
            } else if let Some(content) = extract_tag(line, "link") {
                item.link = content;
            } else if let Some(content) = extract_tag(line, "pubDate") {
                item.pub_date = Some(content);
            }
        }
    }

    Ok(items)
}

fn extract_tag(line: &str, tag: &str) -> Option<String> {
    let open = format!("<{}>", tag);
    let close = format!("</{}>", tag);
    let open_close = format!("<{}/>", tag);

    if line.contains(&open_close) {
        return None;
    }

    if let Some(start) = line.find(&open) {
        let content_start = start + open.len();
        if let Some(end) = line[content_start..].find(&close) {
            return Some(line[content_start..content_start + end].trim().to_string());
        }
    }
    None
}

fn matches_filter(title: &str, filter: &RssFilter) -> bool {
    match filter.match_type.as_str() {
        "contains" => title.to_lowercase().contains(&filter.pattern.to_lowercase()),
        "regex" => {
            regex_match(title, &filter.pattern)
        }
        "starts_with" => title.to_lowercase().starts_with(&filter.pattern.to_lowercase()),
        "ends_with" => title.to_lowercase().ends_with(&filter.pattern.to_lowercase()),
        _ => false,
    }
}

fn regex_match(text: &str, pattern: &str) -> bool {
    let text = text.to_lowercase();
    let pattern = pattern.to_lowercase();
    simple_wildcard_match(&text, &pattern)
}

fn simple_wildcard_match(text: &str, pattern: &str) -> bool {
    let text_chars: Vec<char> = text.chars().collect();
    let pattern_chars: Vec<char> = pattern.chars().collect();
    let (mut ti, mut pi) = (0, 0);
    let (mut star_ti, mut star_pi) = (0usize, None);

    while ti < text_chars.len() {
        if pi < pattern_chars.len() && (pattern_chars[pi] == '?' || pattern_chars[pi] == text_chars[ti]) {
            ti += 1;
            pi += 1;
        } else if pi < pattern_chars.len() && pattern_chars[pi] == '*' {
            star_ti = ti;
            star_pi = Some(pi);
            pi += 1;
        } else if let Some(sp) = star_pi {
            pi = sp + 1;
            star_ti += 1;
            ti = star_ti;
        } else {
            return false;
        }
    }

    while pi < pattern_chars.len() && pattern_chars[pi] == '*' {
        pi += 1;
    }

    pi == pattern_chars.len()
}

fn extract_uri(link: &str) -> Option<String> {
    if link.starts_with("magnet:") {
        Some(link.to_string())
    } else if link.ends_with(".torrent") {
        Some(link.to_string())
    } else {
        None
    }
}
