import { useEffect } from "react";
import { useTorrentStore } from "@/stores/torrentStore";

export function useSettings() {
  const settings = useTorrentStore((s) => s.settings);
  const fetchSettings = useTorrentStore((s) => s.fetchSettings);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  useEffect(() => {
    if (settings?.theme === "light") {
      document.documentElement.classList.remove("dark");
    } else {
      document.documentElement.classList.add("dark");
    }
  }, [settings?.theme]);

  return settings;
}
