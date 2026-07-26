// Events module — defines event payload types for Tauri IPC
// Events are emitted from engine.rs / commands.rs via app.emit()

// Event list:
// torrent://added       -> TorrentStatus
// torrent://removed     -> String (id)
// torrent://paused      -> String (id)
// torrent://resumed     -> String (id)
// torrent://error       -> String (error message)
// torrent://done        -> String (id)
// torrent://status      -> TorrentStatus (periodic updates)
// magnet://received     -> String (magnet URI)

// All event payloads are defined as serde types in engine.rs (TorrentStatus, etc.)
