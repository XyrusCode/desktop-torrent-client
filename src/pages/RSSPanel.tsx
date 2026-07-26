import { useState, type FormEvent } from "react";
import { Plus, Trash2, Rss } from "lucide-react";
import { useTorrentStore } from "@/stores/torrentStore";

export default function RSSPanel() {
  const [url, setName] = useState("");
  const [showForm, setShowForm] = useState(false);

  const rssFeeds = useTorrentStore((s) => s.rssFeeds);
  const addRssFeed = useTorrentStore((s) => s.addRssFeed);
  const removeRssFeed = useTorrentStore((s) => s.removeRssFeed);

  const handleAdd = async (e: FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    const feedName = url
      .replace(/https?:\/\//, "")
      .split("/")[0]
      .split(".")[0];
    await addRssFeed(url.trim(), feedName);
    setName("");
    setShowForm(false);
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-surface-300">RSS Feeds</h2>
        <button
          className="btn-primary text-xs"
          onClick={() => setShowForm(!showForm)}
        >
          <Plus size={14} />
          Add Feed
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleAdd} className="card p-4 space-y-3">
          <div className="space-y-1">
            <label className="label">Feed URL</label>
            <input
              className="input"
              placeholder="https://example.com/rss"
              value={url}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              className="btn-ghost text-xs"
              onClick={() => setShowForm(false)}
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary text-xs">
              Add Feed
            </button>
          </div>
        </form>
      )}

      <div className="space-y-2">
        {rssFeeds.length === 0 ? (
          <div className="card p-8 text-center">
            <Rss size={32} className="text-surface-600 mx-auto mb-2" />
            <p className="text-surface-500 text-sm">
              No RSS feeds configured. Add a feed to auto-download torrents.
            </p>
          </div>
        ) : (
          rssFeeds.map((feed) => (
            <div
              key={feed.id}
              className="card-hover px-4 py-3 flex items-center justify-between"
            >
              <div className="flex items-center gap-3 min-w-0">
                <Rss size={16} className="text-orange-400 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm text-surface-200 truncate">
                    {feed.name}
                  </p>
                  <p className="text-xs text-surface-500 truncate">
                    {feed.url}
                  </p>
                </div>
              </div>
              <button
                className="btn-ghost p-1.5 text-red-400 flex-shrink-0"
                onClick={() => removeRssFeed(feed.id)}
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
