import { useState, useEffect, type FormEvent } from "react";
import { useTorrentStore } from "@/stores/torrentStore";
import type { AppSettings } from "@/types/torrent";
import { Sun, Moon, FolderOpen, Wifi, Sliders, AlertTriangle } from "lucide-react";

export default function SettingsPage() {
  const settings = useTorrentStore((s) => s.settings);
  const saveSettings = useTorrentStore((s) => s.saveSettings);
  const [local, setLocal] = useState<AppSettings | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (settings) setLocal({ ...settings });
  }, [settings]);

  const update = <K extends keyof AppSettings>(
    key: K,
    value: AppSettings[K]
  ) => {
    if (!local) return;
    setLocal({ ...local, [key]: value });
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!local) return;
    setSaving(true);
    await saveSettings(local);
    setSaving(false);
  };

  if (!local) {
    return (
      <div className="card p-8 text-center">
        <p className="text-surface-500">Loading settings...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="space-y-6 max-w-3xl">
      <section className="card p-5 space-y-4">
        <div className="flex items-center gap-2 text-surface-300">
          <FolderOpen size={16} />
          <h3 className="text-sm font-semibold">Downloads</h3>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="label">Download Directory</label>
            <input
              className="input"
              value={local.download_dir}
              onChange={(e) => update("download_dir", e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label className="label">Listen Port</label>
            <input
              className="input"
              type="number"
              min={1024}
              max={65535}
              value={local.listen_port}
              onChange={(e) => update("listen_port", parseInt(e.target.value) || 6881)}
            />
          </div>
        </div>
      </section>

      <section className="card p-5 space-y-4">
        <div className="flex items-center gap-2 text-surface-300">
          <Sliders size={16} />
          <h3 className="text-sm font-semibold">Speed Limits</h3>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="label">
              Max Download Speed (KB/s, 0 = unlimited)
            </label>
            <input
              className="input"
              type="number"
              min={0}
              value={local.max_download_speed}
              onChange={(e) => update("max_download_speed", parseInt(e.target.value) || 0)}
            />
          </div>
          <div className="space-y-1">
            <label className="label">
              Max Upload Speed (KB/s, 0 = unlimited)
            </label>
            <input
              className="input"
              type="number"
              min={0}
              value={local.max_upload_speed}
              onChange={(e) => update("max_upload_speed", parseInt(e.target.value) || 0)}
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-1">
            <label className="label">Max Active Torrents</label>
            <input
              className="input"
              type="number"
              min={1}
              value={local.max_active}
              onChange={(e) => update("max_active", parseInt(e.target.value) || 10)}
            />
          </div>
          <div className="space-y-1">
            <label className="label">Max Downloading</label>
            <input
              className="input"
              type="number"
              min={1}
              value={local.max_downloading}
              onChange={(e) => update("max_downloading", parseInt(e.target.value) || 5)}
            />
          </div>
          <div className="space-y-1">
            <label className="label">Max Active Seeding</label>
            <input
              className="input"
              type="number"
              min={1}
              value={local.max_active_seeding}
              onChange={(e) => update("max_active_seeding", parseInt(e.target.value) || 5)}
            />
          </div>
        </div>
      </section>

      <section className="card p-5 space-y-4">
        <div className="flex items-center gap-2 text-surface-300">
          <Wifi size={16} />
          <h3 className="text-sm font-semibold">Network</h3>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {(["enable_dht", "enable_pex", "enable_lsd", "enable_upnp"] as const).map(
            (key) => (
              <label
                key={key}
                className="flex items-center gap-2 cursor-pointer"
              >
                <input
                  type="checkbox"
                  className="rounded border-surface-600 bg-surface-800 text-accent focus:ring-accent"
                  checked={local[key]}
                  onChange={(e) => update(key, e.target.checked)}
                />
                <span className="text-sm text-surface-300">
                  {key === "enable_dht"
                    ? "DHT"
                    : key === "enable_pex"
                      ? "PEX"
                      : key === "enable_lsd"
                        ? "Local Service Discovery"
                        : "UPnP"}
                </span>
              </label>
            )
          )}
        </div>
      </section>

      <section className="card p-5 space-y-4">
        <div className="flex items-center gap-2 text-surface-300">
          {local.theme === "dark" ? <Moon size={16} /> : <Sun size={16} />}
          <h3 className="text-sm font-semibold">Appearance</h3>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="label">Theme</label>
            <select
              className="select"
              value={local.theme}
              onChange={(e) => update("theme", e.target.value)}
            >
              <option value="dark">Dark</option>
              <option value="light">Light</option>
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              className="rounded border-surface-600 bg-surface-800 text-accent focus:ring-accent"
              checked={local.start_minimized}
              onChange={(e) => update("start_minimized", e.target.checked)}
            />
            <span className="text-sm text-surface-300">Start minimized</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              className="rounded border-surface-600 bg-surface-800 text-accent focus:ring-accent"
              checked={local.close_to_tray}
              onChange={(e) => update("close_to_tray", e.target.checked)}
            />
            <span className="text-sm text-surface-300">Close to tray</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              className="rounded border-surface-600 bg-surface-800 text-accent focus:ring-accent"
              checked={local.notify_on_complete}
              onChange={(e) => update("notify_on_complete", e.target.checked)}
            />
            <span className="text-sm text-surface-300">
              Notify on download complete
            </span>
          </label>
        </div>
      </section>

      <section className="card p-5 space-y-4">
        <div className="flex items-center gap-2 text-surface-300">
          <AlertTriangle size={16} />
          <h3 className="text-sm font-semibold">Proxy</h3>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-1">
            <label className="label">Type</label>
            <select
              className="select"
              value={local.proxy_type}
              onChange={(e) => update("proxy_type", e.target.value)}
            >
              <option value="none">None</option>
              <option value="socks4">SOCKS4</option>
              <option value="socks5">SOCKS5</option>
              <option value="http">HTTP</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="label">Host</label>
            <input
              className="input"
              value={local.proxy_host}
              onChange={(e) => update("proxy_host", e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label className="label">Port</label>
            <input
              className="input"
              type="number"
              min={0}
              max={65535}
              value={local.proxy_port}
              onChange={(e) => update("proxy_port", parseInt(e.target.value) || 0)}
            />
          </div>
        </div>
      </section>

      <div className="flex justify-end">
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? "Saving..." : "Save Settings"}
        </button>
      </div>
    </form>
  );
}
