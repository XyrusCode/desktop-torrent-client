import { useEffect, useRef } from "react";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";
import { useTorrentStore } from "@/stores/torrentStore";

export function useTorrentEvents() {
  const fetchTorrents = useTorrentStore((s) => s.fetchTorrents);
  const unlisteners = useRef<UnlistenFn[]>([]);

  useEffect(() => {
    const setup = async () => {
      const events = [
        "torrent://added",
        "torrent://removed",
        "torrent://paused",
        "torrent://resumed",
        "torrent://status",
        "torrent://done",
        "torrent://error",
      ];

      for (const event of events) {
        const unlisten = await listen(event, () => {
          fetchTorrents();
        });
        unlisteners.current.push(unlisten);
      }

      // Initial fetch
      fetchTorrents();
    };

    setup();

    return () => {
      unlisteners.current.forEach((fn) => fn());
      unlisteners.current = [];
    };
  }, [fetchTorrents]);
}
