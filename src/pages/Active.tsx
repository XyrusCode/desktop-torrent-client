import { useTorrentStore } from "@/stores/torrentStore";
import TorrentRow from "@/components/TorrentRow";

export default function Active() {
  const torrents = useTorrentStore((s) => s.torrents);

  const active = torrents.filter(
    (t) =>
      t.state === "Downloading" ||
      t.state === "Seeding" ||
      t.state === "Checking" ||
      t.state === "Queued"
  );

  const downloading = active.filter((t) => t.state === "Downloading");
  const seeding = active.filter((t) => t.state === "Seeding");

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h2 className="text-sm font-semibold text-surface-300 mb-3">
          Downloading ({downloading.length})
        </h2>
        <div className="space-y-2">
          {downloading.length === 0 ? (
            <p className="text-surface-500 text-sm p-4">No active downloads</p>
          ) : (
            downloading.map((t) => <TorrentRow key={t.id} torrent={t} />)
          )}
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-surface-300 mb-3">
          Seeding ({seeding.length})
        </h2>
        <div className="space-y-2">
          {seeding.length === 0 ? (
            <p className="text-surface-500 text-sm p-4">Nothing seeding</p>
          ) : (
            seeding.map((t) => <TorrentRow key={t.id} torrent={t} />)
          )}
        </div>
      </div>
    </div>
  );
}
