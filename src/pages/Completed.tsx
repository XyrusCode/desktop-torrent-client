import { useTorrentStore } from "@/stores/torrentStore";
import TorrentRow from "@/components/TorrentRow";

export default function Completed() {
  const torrents = useTorrentStore((s) => s.torrents);

  const completed = torrents.filter(
    (t) => t.state === "Done" || t.state === "Paused"
  );

  return (
    <div className="space-y-4 max-w-5xl">
      <h2 className="text-sm font-semibold text-surface-300">
        Completed ({completed.length})
      </h2>
      <div className="space-y-2">
        {completed.length === 0 ? (
          <div className="card p-8 text-center">
            <p className="text-surface-500 text-sm">No completed torrents</p>
          </div>
        ) : (
          completed.map((t) => <TorrentRow key={t.id} torrent={t} />)
        )}
      </div>
    </div>
  );
}
