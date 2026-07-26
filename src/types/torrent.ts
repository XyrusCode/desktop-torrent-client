export interface TorrentStatus {
  id: string;
  name: string;
  info_hash: string;
  size: number;
  downloaded: number;
  uploaded: number;
  progress: number;
  download_rate: number;
  upload_rate: number;
  state: TorrentState;
  peers_connected: number;
  seeds_connected: number;
  total_peers: number;
  total_seeds: number;
  ratio: number;
  eta: number;
  added_at: number;
  completed_at: number | null;
  category: string | null;
  save_path: string;
  download_limit: number;
  upload_limit: number;
  sequential: boolean;
}

export type TorrentState =
  | "Queued"
  | "Checking"
  | "Downloading"
  | "Seeding"
  | "Paused"
  | "Error"
  | "Done";

export interface TorrentDetail {
  info: TorrentStatus;
  trackers: TrackerStatus[];
  files: FileInfo[];
  peers: PeerInfo[];
}

export interface TrackerStatus {
  url: string;
  status: string;
  peers: number;
  seeds: number;
}

export interface FileInfo {
  path: string;
  size: number;
  downloaded: number;
  priority: number;
}

export interface PeerInfo {
  ip: string;
  port: number;
  client: string;
  download_rate: number;
  upload_rate: number;
  progress: number;
  flags: string;
}

export interface AddTorrentOptions {
  uri: string;
  save_path?: string;
  category?: string;
  sequential?: boolean;
  paused?: boolean;
  download_limit?: number;
  upload_limit?: number;
}

export interface TorrentLimits {
  download_limit?: number;
  upload_limit?: number;
  ratio_limit?: number;
  seeding_time_limit?: number;
}

export interface AppSettings {
  download_dir: string;
  listen_port: number;
  max_download_speed: number;
  max_upload_speed: number;
  max_active: number;
  max_downloading: number;
  max_active_seeding: number;
  theme: string;
  start_minimized: boolean;
  close_to_tray: boolean;
  notify_on_complete: boolean;
  enable_dht: boolean;
  enable_pex: boolean;
  enable_lsd: boolean;
  enable_upnp: boolean;
  proxy_type: string;
  proxy_host: string;
  proxy_port: number;
  proxy_auth: boolean;
  proxy_username: string;
  proxy_password: string;
}

export interface RssFeed {
  id: number;
  url: string;
  name: string;
  interval: number;
  filters: string;
  last_poll: number | null;
}

export interface RssFilter {
  name: string;
  pattern: string;
  match_type: string;
  category?: string;
  save_path?: string;
  paused: boolean;
  sequential: boolean;
}

export interface SearchResult {
  title: string;
  link: string;
  size: number;
  seeds: number;
  peers: number;
  source: string;
  category: string;
  magnet_uri: string | null;
}

export type ViewType =
  | "dashboard"
  | "active"
  | "completed"
  | "categories"
  | "rss"
  | "settings";
