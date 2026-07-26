import { Search, Plus, Download } from "lucide-react";
import { useState } from "react";
import { useTorrentStore } from "@/stores/torrentStore";

export default function TopBar() {
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const search = useTorrentStore((s) => s.search);
  const setView = useTorrentStore((s) => s.setView);
  const setModalOpen = useTorrentStore((s) => {
    // Use a hack to trigger modal: we'll store in a module-level state
    return () => {
      const event = new CustomEvent("open-add-modal");
      window.dispatchEvent(event);
    };
  });

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setView("dashboard");
    await search(searchQuery.trim());
  };

  return (
    <header className="h-14 border-b border-surface-800 flex items-center justify-between px-6 glass">
      <div className="flex items-center gap-3">
        {showSearch ? (
          <div className="flex items-center gap-2">
            <input
              className="input w-80"
              placeholder="Search torrents via Jackett/Prowlarr..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              autoFocus
            />
            <button
              className="btn-primary text-xs px-3 py-1.5"
              onClick={handleSearch}
            >
              <Search size={14} />
              Search
            </button>
            <button
              className="btn-ghost text-xs px-3 py-1.5"
              onClick={() => setShowSearch(false)}
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            className="btn-ghost text-xs"
            onClick={() => setShowSearch(true)}
          >
            <Search size={16} />
            Search
          </button>
        )}
      </div>

      <button
        className="btn-primary text-xs"
        onClick={() => {
          const event = new CustomEvent("open-add-modal");
          window.dispatchEvent(event);
        }}
      >
        <Plus size={16} />
        Add Torrent
      </button>
    </header>
  );
}
