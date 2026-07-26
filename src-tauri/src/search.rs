use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SearchResult {
    pub title: String,
    pub link: String,
    pub size: i64,
    pub seeds: i32,
    pub peers: i32,
    pub source: String,
    pub category: String,
    pub magnet_uri: Option<String>,
}

pub async fn search_sites(query: &str) -> Result<Vec<SearchResult>, String> {
    let mut all_results = Vec::new();

    // Jackett API integration (configured via settings)
    if let Ok(results) = search_jackett(query).await {
        all_results.extend(results);
    }

    // Prowlarr API integration
    if let Ok(results) = search_prowlarr(query).await {
        all_results.extend(results);
    }

    // Default: return whatever we found
    if all_results.is_empty() {
        return Err("No results found. Configure a search provider in Settings.".to_string());
    }

    all_results.sort_by(|a, b| b.seeds.cmp(&a.seeds));
    Ok(all_results)
}

async fn search_jackett(query: &str) -> Result<Vec<SearchResult>, String> {
    // Jackett API: http://localhost:9117/api/v2.0/indexers/all/results
    let api_key = std::env::var("JACKETT_API_KEY").unwrap_or_default();
    if api_key.is_empty() {
        return Err("Jackett API key not configured".to_string());
    }

    let url = format!(
        "http://localhost:9117/api/v2.0/indexers/all/results?apikey={}&Query={}",
        api_key, query
    );

    let resp = reqwest::get(&url).await.map_err(|e| format!("Jackett error: {}", e))?;
    let json: serde_json::Value = resp.json().await.map_err(|e| format!("Jackett parse: {}", e))?;

    let mut results = Vec::new();
    if let Some(results_arr) = json["Results"].as_array() {
        for item in results_arr {
            if let (Some(title), Some(link)) = (
                item["Title"].as_str(),
                item["Link"].as_str(),
            ) {
                let magnet = item["MagnetUri"].as_str()
                    .or_else(|| item["magnetUri"].as_str())
                    .map(|s| s.to_string());

                results.push(SearchResult {
                    title: title.to_string(),
                    link: link.to_string(),
                    size: item["Size"].as_i64().unwrap_or(0),
                    seeds: item["Seeders"].as_i64().unwrap_or(0) as i32,
                    peers: item["Peers"].as_i64().unwrap_or(0) as i32,
                    source: item["Tracker"].as_str().unwrap_or("Jackett").to_string(),
                    category: item["Category"].as_str().unwrap_or("other").to_string(),
                    magnet_uri: magnet,
                });
            }
        }
    }

    Ok(results)
}

async fn search_prowlarr(query: &str) -> Result<Vec<SearchResult>, String> {
    // Prowlarr API: http://localhost:9696/api/v1/search
    let api_key = std::env::var("PROWLARR_API_KEY").unwrap_or_default();
    if api_key.is_empty() {
        return Err("Prowlarr API key not configured".to_string());
    }

    let client = reqwest::Client::new();
    let url = format!("http://localhost:9696/api/v1/search?query={}", query);

    let resp = client
        .get(&url)
        .header("X-Api-Key", &api_key)
        .send()
        .await
        .map_err(|e| format!("Prowlarr error: {}", e))?;

    let json: Vec<serde_json::Value> = resp.json().await.map_err(|e| format!("Prowlarr parse: {}", e))?;

    let mut results = Vec::new();
    for item in &json {
        if let Some(title) = item["title"].as_str() {
            results.push(SearchResult {
                title: title.to_string(),
                link: item["guid"].as_str().unwrap_or("").to_string(),
                size: item["size"].as_i64().unwrap_or(0),
                seeds: item["seeders"].as_i64().unwrap_or(0) as i32,
                peers: item["leechers"].as_i64().unwrap_or(0) as i32,
                source: item["indexer"].as_str().unwrap_or("Prowlarr").to_string(),
                category: item["category"].as_array()
                    .and_then(|c| c.first())
                    .and_then(|c| c.as_str())
                    .unwrap_or("other")
                    .to_string(),
                magnet_uri: item["magnetUri"].as_str().map(|s| s.to_string()),
            });
        }
    }

    Ok(results)
}
