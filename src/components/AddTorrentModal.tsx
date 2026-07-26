import { useState, useEffect, useRef, type FormEvent } from "react";
import { X, Upload, Link, FileText } from "lucide-react";
import { useTorrentStore } from "@/stores/torrentStore";
import type { AddTorrentOptions } from "@/types/torrent";

export default function AddTorrentModal() {
  const [open, setOpen] = useState(false);
  const [uri, setUri] = useState("");
  const [savePath, setSavePath] = useState("");
  const [category, setCategory] = useState("");
  const [paused, setPaused] = useState(false);
  const [sequential, setSequential] = useState(false);
  const [loading, setLoading] = useState(false);

  const addTorrent = useTorrentStore((s) => s.addTorrent);
  const addTorrents = useTorrentStore((s) => s.addTorrents);
  const categories = useTorrentStore((s) => s.categories);
  const fetchCategories = useTorrentStore((s) => s.fetchCategories);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const handler = () => {
      setOpen(true);
      fetchCategories();
    };
    window.addEventListener("open-add-modal", handler);
    return () => window.removeEventListener("open-add-modal", handler);
  }, [fetchCategories]);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!uri.trim()) return;

    setLoading(true);
    try {
      const uris = uri
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);

      const options: AddTorrentOptions = {
        uri: uris[0],
        save_path: savePath || undefined,
        category: category || undefined,
        sequential,
        paused,
      };

      if (uris.length === 1) {
        await addTorrent(options);
      } else {
        const items = uris.map((u) => ({ ...options, uri: u }));
        await addTorrents(items);
      }

      setUri("");
      setOpen(false);
    } catch {
      // Error handled by store
    } finally {
      setLoading(false);
    }
  };

  const handleFileImport = async () => {
    try {
      const { open } = await import("@tauri-apps/plugin-dialog");
      const selected = await open({
        multiple: true,
        filters: [
          { name: "Torrent Files", extensions: ["torrent"] },
          { name: "All Files", extensions: ["*"] },
        ],
      });
      if (selected) {
        const files = Array.isArray(selected) ? selected : [selected];
        setUri(files.join("\n"));
      }
    } catch {
      // Fallback for browser context
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="card w-[520px] max-h-[80vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-surface-800">
          <h2 className="text-lg font-semibold text-surface-100">Add Torrent</h2>
          <button
            className="btn-ghost p-1.5"
            onClick={() => setOpen(false)}
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="space-y-2">
            <label className="label">Magnet Link or Torrent URL</label>
            <textarea
              ref={inputRef}
              className="input min-h-[80px] resize-none font-mono text-xs"
              placeholder="magnet:?xt=urn:btih:... or https://..."
              value={uri}
              onChange={(e) => setUri(e.target.value)}
            />
            <button
              type="button"
              className="btn-ghost text-xs"
              onClick={handleFileImport}
            >
              <FileText size={14} />
              Import .torrent file
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="label">Save Path</label>
              <input
                className="input"
                placeholder="Default download directory"
                value={savePath}
                onChange={(e) => setSavePath(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="label">Category</label>
              <select
                className="select"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="">None</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                className="rounded border-surface-600 bg-surface-800 text-accent focus:ring-accent"
                checked={paused}
                onChange={(e) => setPaused(e.target.checked)}
              />
              <span className="text-sm text-surface-300">Add paused</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                className="rounded border-surface-600 bg-surface-800 text-accent focus:ring-accent"
                checked={sequential}
                onChange={(e) => setSequential(e.target.checked)}
              />
              <span className="text-sm text-surface-300">Sequential download</span>
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              className="btn-ghost"
              onClick={() => setOpen(false)}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={loading || !uri.trim()}
            >
              <Link size={16} />
              {loading ? "Adding..." : "Add Torrent"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
