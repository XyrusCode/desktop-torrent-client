import { create } from "zustand";
import { invoke } from "@tauri-apps/api/core";
import type {
  TorrentStatus,
  TorrentDetail,
  AddTorrentOptions,
  TorrentLimits,
  AppSettings,
  RssFeed,
  SearchResult,
  ViewType,
} from "@/types/torrent";

interface TorrentStore {
  torrents: TorrentStatus[];
  selectedTorrent: TorrentDetail | null;
  view: ViewType;
  settings: AppSettings | null;
  categories: string[];
  rssFeeds: RssFeed[];
  searchResults: SearchResult[];
  loading: boolean;
  error: string | null;

  setView: (view: ViewType) => void;
  clearError: () => void;
  fetchTorrents: () => Promise<void>;
  fetchDetail: (id: string) => Promise<void>;
  addTorrent: (options: AddTorrentOptions) => Promise<void>;
  addTorrents: (items: AddTorrentOptions[]) => Promise<void>;
  removeTorrent: (id: string, removeData?: boolean) => Promise<void>;
  pauseTorrent: (id: string) => Promise<void>;
  resumeTorrent: (id: string) => Promise<void>;
  recheckTorrent: (id: string) => Promise<void>;
  setLimits: (id: string, limits: TorrentLimits) => Promise<void>;
  setCategory: (id: string, category: string | null) => Promise<void>;
  setSequential: (id: string, sequential: boolean) => Promise<void>;
  addTracker: (id: string, url: string) => Promise<void>;
  fetchSettings: () => Promise<void>;
  saveSettings: (settings: AppSettings) => Promise<void>;
  fetchCategories: () => Promise<void>;
  createCategory: (name: string, path: string) => Promise<void>;
  deleteCategory: (name: string) => Promise<void>;
  addRssFeed: (url: string, name: string) => Promise<void>;
  removeRssFeed: (id: number) => Promise<void>;
  fetchRssFeeds: () => Promise<void>;
  search: (query: string) => Promise<void>;
}

export const useTorrentStore = create<TorrentStore>((set, get) => ({
  torrents: [],
  selectedTorrent: null,
  view: "dashboard",
  settings: null,
  categories: [],
  rssFeeds: [],
  searchResults: [],
  loading: false,
  error: null,

  setView: (view) => set({ view }),

  clearError: () => set({ error: null }),

  fetchTorrents: async () => {
    try {
      const torrents = await invoke<TorrentStatus[]>("get_torrents");
      set({ torrents });
    } catch (e) {
      set({ error: String(e) });
    }
  },

  fetchDetail: async (id) => {
    try {
      const detail = await invoke<TorrentDetail | null>("get_torrent_detail", { id });
      set({ selectedTorrent: detail });
    } catch (e) {
      set({ error: String(e) });
    }
  },

  addTorrent: async (options) => {
    try {
      await invoke("add_torrent", { options });
      await get().fetchTorrents();
    } catch (e) {
      set({ error: String(e) });
      throw e;
    }
  },

  addTorrents: async (items) => {
    try {
      await invoke("add_torrents", { items });
      await get().fetchTorrents();
    } catch (e) {
      set({ error: String(e) });
    }
  },

  removeTorrent: async (id, removeData = false) => {
    try {
      await invoke("remove_torrent", { id, removeData });
      await get().fetchTorrents();
    } catch (e) {
      set({ error: String(e) });
    }
  },

  pauseTorrent: async (id) => {
    try {
      await invoke("pause_torrent", { id });
      await get().fetchTorrents();
    } catch (e) {
      set({ error: String(e) });
    }
  },

  resumeTorrent: async (id) => {
    try {
      await invoke("resume_torrent", { id });
      await get().fetchTorrents();
    } catch (e) {
      set({ error: String(e) });
    }
  },

  recheckTorrent: async (id) => {
    try {
      await invoke("recheck_torrent", { id });
    } catch (e) {
      set({ error: String(e) });
    }
  },

  setLimits: async (id, limits) => {
    try {
      await invoke("set_limits", { id, limits });
    } catch (e) {
      set({ error: String(e) });
    }
  },

  setCategory: async (id, category) => {
    try {
      await invoke("set_category", { id, category });
      await get().fetchTorrents();
    } catch (e) {
      set({ error: String(e) });
    }
  },

  setSequential: async (id, sequential) => {
    try {
      await invoke("set_sequential_download", { id, sequential });
    } catch (e) {
      set({ error: String(e) });
    }
  },

  addTracker: async (id, url) => {
    try {
      await invoke("add_tracker", { id, trackerUrl: url });
    } catch (e) {
      set({ error: String(e) });
    }
  },

  fetchSettings: async () => {
    try {
      const settings = await invoke<AppSettings>("get_settings");
      set({ settings });
    } catch (e) {
      set({ error: String(e) });
    }
  },

  saveSettings: async (settings) => {
    try {
      await invoke("set_settings", { settings });
      set({ settings });
    } catch (e) {
      set({ error: String(e) });
    }
  },

  fetchCategories: async () => {
    try {
      const cats = await invoke<string[]>("list_categories");
      set({ categories: cats });
    } catch (e) {
      set({ error: String(e) });
    }
  },

  createCategory: async (name, path) => {
    try {
      await invoke("create_category", { name, savePath: path });
      await get().fetchCategories();
    } catch (e) {
      set({ error: String(e) });
    }
  },

  deleteCategory: async (name) => {
    try {
      await invoke("delete_category", { name });
      await get().fetchCategories();
    } catch (e) {
      set({ error: String(e) });
    }
  },

  addRssFeed: async (url, name) => {
    try {
      await invoke("rss_add_feed", { url, name });
      await get().fetchRssFeeds();
    } catch (e) {
      set({ error: String(e) });
    }
  },

  removeRssFeed: async (id) => {
    try {
      await invoke("rss_remove_feed", { id });
      await get().fetchRssFeeds();
    } catch (e) {
      set({ error: String(e) });
    }
  },

  fetchRssFeeds: async () => {
    try {
      const feeds = await invoke<RssFeed[]>("rss_list_feeds");
      set({ rssFeeds: feeds });
    } catch (e) {
      set({ error: String(e) });
    }
  },

  search: async (query) => {
    try {
      const results = await invoke<SearchResult[]>("search", { query });
      set({ searchResults: results });
    } catch (e) {
      set({ error: String(e) });
    }
  },
}));
