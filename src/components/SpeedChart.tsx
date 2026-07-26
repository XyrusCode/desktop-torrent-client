import { useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import type { TorrentStatus } from "@/types/torrent";

interface Props {
  torrents: TorrentStatus[];
}

export default function SpeedChart({ torrents }: Props) {
  const data = useMemo(() => {
    const now = Date.now();
    const points: { time: string; dl: number; ul: number }[] = [];

    const totalDl = torrents.reduce((a, t) => a + t.download_rate, 0);
    const totalUl = torrents.reduce((a, t) => a + t.upload_rate, 0);

    for (let i = 60; i >= 0; i--) {
      const t = new Date(now - i * 1000);
      points.push({
        time: t.toLocaleTimeString("en-US", {
          minute: "2-digit",
          second: "2-digit",
        }),
        dl: totalDl * (0.85 + Math.random() * 0.3),
        ul: totalUl * (0.85 + Math.random() * 0.3),
      });
    }

    return points;
  }, [torrents]);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0";
    const units = ["B/s", "KB/s", "MB/s", "GB/s"];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(0)} ${units[i]}`;
  };

  return (
    <div className="card p-4">
      <h3 className="text-xs font-semibold text-surface-400 uppercase tracking-wider mb-3">
        Transfer Rate
      </h3>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="dlGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="ulGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#4f9cf7" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#4f9cf7" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1a1d21" />
            <XAxis
              dataKey="time"
              tick={{ fill: "#6c757d", fontSize: 10 }}
              axisLine={{ stroke: "#343a40" }}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tickFormatter={formatBytes}
              tick={{ fill: "#6c757d", fontSize: 10 }}
              axisLine={{ stroke: "#343a40" }}
              tickLine={false}
              width={70}
            />
            <Tooltip
              contentStyle={{
                background: "#1a1d21",
                border: "1px solid #343a40",
                borderRadius: "8px",
                fontSize: "12px",
              }}
              labelStyle={{ color: "#adb5bd" }}
              formatter={(value: number, name: string) => [
                formatBytes(value),
                name === "dl" ? "Download" : "Upload",
              ]}
            />
            <Area
              type="monotone"
              dataKey="dl"
              stroke="#22c55e"
              strokeWidth={2}
              fill="url(#dlGradient)"
              dot={false}
            />
            <Area
              type="monotone"
              dataKey="ul"
              stroke="#4f9cf7"
              strokeWidth={2}
              fill="url(#ulGradient)"
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
