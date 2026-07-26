import {
  LayoutDashboard,
  ArrowDownCircle,
  CheckCircle2,
  FolderTree,
  Rss,
  Settings,
} from "lucide-react";
import { useTorrentStore } from "@/stores/torrentStore";
import type { ViewType } from "@/types/torrent";

const navItems: { view: ViewType; label: string; icon: typeof LayoutDashboard }[] = [
  { view: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { view: "active", label: "Active", icon: ArrowDownCircle },
  { view: "completed", label: "Completed", icon: CheckCircle2 },
  { view: "categories", label: "Categories", icon: FolderTree },
  { view: "rss", label: "RSS", icon: Rss },
  { view: "settings", label: "Settings", icon: Settings },
];

export default function Sidebar() {
  const view = useTorrentStore((s) => s.view);
  const setView = useTorrentStore((s) => s.setView);
  const torrents = useTorrentStore((s) => s.torrents);

  const activeCount = torrents.filter(
    (t) => t.state === "Downloading" || t.state === "Seeding"
  ).length;

  return (
    <aside className="w-56 bg-surface-900 border-r border-surface-800 flex flex-col">
      <div className="p-5 border-b border-surface-800">
        <h1 className="text-lg font-bold text-gradient tracking-tight">
          Torrent
        </h1>
        <p className="text-xs text-surface-500 mt-0.5">Desktop Client</p>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = view === item.view;
          return (
            <button
              key={item.view}
              onClick={() => setView(item.view)}
              className={
                isActive ? "sidebar-item-active w-full" : "sidebar-item w-full"
              }
            >
              <Icon size={18} />
              <span className="flex-1 text-left">{item.label}</span>
              {item.view === "active" && activeCount > 0 && (
                <span className="badge-blue min-w-[20px] text-center">
                  {activeCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-surface-800">
        <div className="text-xs text-surface-500 space-y-1">
          <div className="flex justify-between">
            <span>DL speed</span>
            <span className="text-green-400 font-mono">
              {formatSpeed(
                torrents.reduce((a, t) => a + t.download_rate, 0)
              )}
            </span>
          </div>
          <div className="flex justify-between">
            <span>UL speed</span>
            <span className="text-accent font-mono">
              {formatSpeed(
                torrents.reduce((a, t) => a + t.upload_rate, 0)
              )}
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}

function formatSpeed(bytes: number): string {
  if (bytes === 0) return "0 B/s";
  const units = ["B/s", "KB/s", "MB/s", "GB/s"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}
