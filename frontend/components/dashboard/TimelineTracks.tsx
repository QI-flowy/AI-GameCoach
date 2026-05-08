"use client";
import type { Segment, Polarity } from "@/lib/types";

interface Props {
  segments: Segment[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  /** 时间轴轨道名称，默认 CS2 轨道 */
  tracks?: string[];
}
const DEFAULT_TRACKS = ["击杀", "道具", "身位", "决策"];
const polarityColors: Record<Polarity, string> = { POSITIVE: "bg-emerald-500", NEGATIVE: "bg-red-500" };

export default function TimelineTracks({ segments, selectedId, onSelect, tracks = DEFAULT_TRACKS }: Props) {
  const totalTicks = segments.length > 0 ? Math.max(...segments.map(s => s.tickEnd)) : 1;
  const primaryTrack = tracks[tracks.length - 1]; // 最后一条轨道显示色块

  return (<div className="space-y-1">
    {tracks.map(track => <div key={track} className="flex items-center gap-2 h-7">
      <span className="text-xs text-zinc-500 w-8 shrink-0">{track}</span>
      {track === primaryTrack ? (
        <div className="flex-1 h-full bg-zinc-800/50 rounded relative overflow-hidden">
          {segments.map(seg => {
            const left = (seg.tickStart / totalTicks) * 100;
            const width = Math.max(((seg.tickEnd - seg.tickStart) / totalTicks) * 100, 1);
            return <div key={seg.id} className={`absolute top-0.5 bottom-0.5 rounded cursor-pointer hover:opacity-80 ${polarityColors[seg.polarity]} ${selectedId === seg.id ? 'ring-2 ring-white/30 z-10' : ''}`}
              style={{ left: `${left}%`, width: `${width}%` }} onClick={() => onSelect(seg.id)} />;
          })}
        </div>
      ) : (
        <div className="flex-1 h-full bg-zinc-800/50 rounded flex items-center justify-center">
          <span className="text-[10px] text-zinc-600">后端接入后显示{track}数据</span>
        </div>
      )}
    </div>)}
    <div className="flex items-center gap-2 h-5">
      <span className="text-xs text-zinc-600 w-8 shrink-0">回合</span>
      <div className="flex-1 flex relative">
        {segments.map(seg => <span key={seg.id} className={`absolute text-[10px] ${selectedId === seg.id ? "text-zinc-300" : "text-zinc-600"}`}
          style={{ left: `${(seg.tickStart / totalTicks) * 100}%` }}>{seg.roundNumber}</span>)}
      </div>
    </div>
  </div>);
}
