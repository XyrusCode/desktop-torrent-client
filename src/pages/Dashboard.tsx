import { useTorrentStore } from "@/stores/torrentStore";
import TorrentRow from "@/components/TorrentRow";
import SpeedChart from "@/components/SpeedChart";
import { BarChart3, Activity, HardDrive } from "lucide-react";

export default function Dashboard() {
  const torrents = useTorrentStore((s) => s.torrents);

  const totalDl = torrents.reduce((a, t) => a + t.download_rate, 0);
  const totalUl = torrents.reduce((a, t) => a + t.upload_rate, 0);
  const activeCount = torrents.filter(
    (t) => t.state === "Downloading"
  ).length;
  const seedingCount = torrents.filter((t) => t.state === "Seeding").length;

  const stats = [
    {
      label: "Downloading",
      value: activeCount,
      icon: ArrowUpFromLine,
      color: "text-green-400",
      bg: "bg-green-500/10",
    },
    {
      label: "Seeding",
      value: seedingCount,
      icon: Activity,
      color: "text-accent",
      bg: "bg-accent/10",
    },
    {
      label: "DL Speed",
      value: formatSpeed(totalDl),
      icon: BarChart3,
      color: "text-green-400",
      bg: "bg-green-500/10",
    },
    {
      label: "UL Speed",
      value: formatSpeed(totalUl),
      icon: HardDrive,
      color: "text-accent",
      bg: "bg-accent/10",
    },
  ];

  const sorted = [...torrents].sort(
    (a, b) => b.added_at - a.added_at
  );

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="grid grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className={`card p-4 ${stat.bg}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-surface-500 font-medium uppercase tracking-wider">
                    {stat.label}
                  </p>
                  <p className={`text-2xl font-bold mt-1 font-mono ${stat.color}`}>
                    {stat.value}
                  </p>
                </div>
                <Icon size={24} className={stat.color} />
              </div>
            </div>
          );
        })}
      </div>

      <SpeedChart torrents={torrents} />

      <div>
        <h2 className="text-sm font-semibold text-surface-300 mb-3">
          Torrents
        </h2>
        <div className="space-y-2">
          {sorted.length === 0 ? (
            <div className="card p-8 text-center">
              <p className="text-surface-500 text-sm">
                No torrents yet. Click "Add Torrent" to get started.
              </p>
            </div>
          ) : (
            sorted.map((t) => <TorrentRow key={t.id} torrent={t} />)
          )}
        </div>
      </div>
    </div>
  );
}

function formatSpeed(bytes: number): string {
  if (bytes === 0) return "0 B/s";
  const units = ["B/s", "KB/s", "MB/s", "GB/s"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}
