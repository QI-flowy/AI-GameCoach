"use client";
import { Zap, AlertTriangle } from "lucide-react";
import type { KeyClip } from "@/lib/api-client";

function fmt(s: number) {
  var m = Math.floor(s / 60), se = Math.floor(s % 60);
  return String(m).padStart(2, "0") + ":" + String(se).padStart(2, "0");
}

interface Props {
  clips: KeyClip[];
  currentTime: number;
  onSeekTo: (t: number) => void;
}

export default function TimelineSidebar({ clips, currentTime, onSeekTo }: Props) {
  return (
    <div className="space-y-1.5">
      <h3 className="text-xs font-medium text-zinc-400 uppercase tracking-wider px-1">
        关键切片 ({clips.length})
      </h3>
      {clips.length === 0 ? (
        <div className="bg-zinc-900/50 rounded-lg border border-zinc-800 p-4">
          <p className="text-xs text-zinc-500 text-center">分析完成后将显示关键切片</p>
        </div>
      ) : (
        <div className="max-h-[60vh] overflow-y-auto space-y-1">
          {clips.map(function (c, i) {
            var active = Math.abs(currentTime - c.timestamp) < 2;
            var hi = c.clip_type === "highlight";
            var activeBg = hi ? "bg-emerald-500/10 border border-emerald-500/30" : "bg-red-500/10 border border-red-500/30";
            return (
              <button
                key={i}
                onClick={function () { onSeekTo(c.timestamp); }}
                className={"w-full text-left px-3 py-2 rounded-lg transition-colors " +
                  (active ? activeBg : "hover:bg-zinc-800 border border-transparent")}
              >
                <div className="flex items-center gap-2">
                  <span className="flex-shrink-0">
                    {hi
                      ? <Zap className="h-3.5 w-3.5 text-emerald-400" />
                      : <AlertTriangle className="h-3.5 w-3.5 text-red-400" />}
                  </span>
                  <span className="text-xs text-zinc-500 tabular-nums">{fmt(c.timestamp)}</span>
                  <span className="text-xs text-zinc-300 truncate">{c.label}</span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
