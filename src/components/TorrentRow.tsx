import { useState } from "react";
import {
  Play,
  Pause,
  Trash2,
  FileDown,
  FileUp,
  ArrowUpFromLine,
  SkipForward,
  FolderOpen,
} from "lucide-react";
import { useTorrentStore } from "@/stores/torrentStore";
import type { TorrentStatus } from "@/types/torrent";

interface Props {
  torrent: TorrentStatus;
  compact?: boolean;
}

const stateColors: Record<string, string> = {
  Downloading: "bg-green-500",
  Seeding: "bg-accent",
  Paused: "bg-yellow-500",
  Checking: "bg-orange-500",
  Queued: "bg-surface-500",
  Done: "bg-green-400",
  Error: "bg-red-500",
};

export default function TorrentRow({ torrent, compact }: Props) {
  const [showConfirm, setShowConfirm] = useState(false);
  const pauseTorrent = useTorrentStore((s) => s.pauseTorrent);
  const resumeTorrent = useTorrentStore((s) => s.resumeTorrent);
  const removeTorrent = useTorrentStore((s) => s.removeTorrent);
  const setSequential = useTorrentStore((s) => s.setSequential);

  const isActive =
    torrent.state === "Downloading" || torrent.state === "Seeding";

  return (
    <div className="card-hover px-4 py-3">
      <div className="flex items-center gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${stateColors[torrent.state] || "bg-surface-500"} ${
                torrent.state === "Downloading" ? "animate-pulse" : ""
              }`}
            />
            <span className="text-sm font-medium text-surface-100 truncate">
              {torrent.name}
            </span>
            {torrent.category && (
              <span className="badge-blue text-[10px]">{torrent.category}</span>
            )}
          </div>

          <div className="mt-2 space-y-1">
            <div className="progress-bar">
              <div
                className={`progress-fill ${
                  torrent.state === "Seeding"
                    ? "bg-accent"
                    : torrent.state === "Paused"
                      ? "bg-yellow-500"
                      : "bg-green-500"
                }`}
                style={{ width: `${Math.round(torrent.progress * 100)}%` }}
              />
            </div>

            <div className="flex items-center gap-4 text-xs text-surface-500">
              <span className="font-mono">
                {formatSize(torrent.downloaded)} / {formatSize(torrent.size)}
              </span>
              <span className="font-mono text-green-400">
                ↓ {formatSpeed(torrent.download_rate)}
              </span>
              <span className="font-mono text-accent">
                ↑ {formatSpeed(torrent.upload_rate)}
              </span>
              <span>Ratio: {torrent.ratio.toFixed(2)}</span>
              {torrent.state === "Downloading" && torrent.eta > 0 && (
                <span>ETA: {formatEta(torrent.eta)}</span>
              )}
              <span className="text-surface-600">
                S: {torrent.seeds_connected} P: {torrent.peers_connected}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          <span className="badge-gray text-[10px] mr-2">{torrent.state}</span>

          {torrent.state === "Paused" ? (
            <button
              className="btn-ghost p-1.5"
              title="Resume"
              onClick={() => resumeTorrent(torrent.id)}
            >
              <Play size={14} />
            </button>
          ) : (
            <button
              className="btn-ghost p-1.5"
              title="Pause"
              onClick={() => pauseTorrent(torrent.id)}
            >
              <Pause size={14} />
            </button>
          )}

          <button
            className="btn-ghost p-1.5"
            title="Toggle sequential"
            onClick={() => setSequential(torrent.id, !torrent.sequential)}
          >
            <SkipForward size={14} />
          </button>

          {showConfirm ? (
            <div className="flex items-center gap-1">
              <button
                className="btn-danger p-1.5 text-xs"
                onClick={() => {
                  removeTorrent(torrent.id, false);
                  setShowConfirm(false);
                }}
              >
                Confirm
              </button>
              <button
                className="btn-ghost p-1.5 text-xs"
                onClick={() => setShowConfirm(false)}
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              className="btn-ghost p-1.5 text-red-400 hover:text-red-300"
              title="Remove"
              onClick={() => setShowConfirm(true)}
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function formatSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

export function formatSpeed(bytes: number): string {
  if (bytes === 0) return "0 B/s";
  const units = ["B/s", "KB/s", "MB/s", "GB/s"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

export function formatEta(seconds: number): string {
  if (seconds === 0) return "∞";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}
