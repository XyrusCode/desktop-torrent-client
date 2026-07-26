import { useState, type FormEvent } from "react";
import { Plus, Trash2, FolderTree } from "lucide-react";
import { useTorrentStore } from "@/stores/torrentStore";

export default function Categories() {
  const [name, setName] = useState("");
  const [savePath, setSavePath] = useState("");
  const [showForm, setShowForm] = useState(false);

  const categories = useTorrentStore((s) => s.categories);
  const createCategory = useTorrentStore((s) => s.createCategory);
  const deleteCategory = useTorrentStore((s) => s.deleteCategory);

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    await createCategory(name.trim(), savePath.trim());
    setName("");
    setSavePath("");
    setShowForm(false);
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-surface-300">Categories</h2>
        <button
          className="btn-primary text-xs"
          onClick={() => setShowForm(!showForm)}
        >
          <Plus size={14} />
          Add Category
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="card p-4 space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="label">Name</label>
              <input
                className="input"
                placeholder="e.g. Movies"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
              />
            </div>
            <div className="space-y-1">
              <label className="label">Save Path</label>
              <input
                className="input"
                placeholder="C:\Downloads\Movies"
                value={savePath}
                onChange={(e) => setSavePath(e.target.value)}
              />
            </div>
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
              Create
            </button>
          </div>
        </form>
      )}

      <div className="space-y-2">
        {categories.length === 0 ? (
          <div className="card p-8 text-center">
            <FolderTree
              size={32}
              className="text-surface-600 mx-auto mb-2"
            />
            <p className="text-surface-500 text-sm">
              No categories yet. Create one to organize your torrents.
            </p>
          </div>
        ) : (
          categories.map((cat) => (
            <div key={cat} className="card-hover px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FolderTree size={16} className="text-accent" />
                <span className="text-sm text-surface-200">{cat}</span>
              </div>
              <button
                className="btn-ghost p-1.5 text-red-400"
                onClick={() => deleteCategory(cat)}
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
