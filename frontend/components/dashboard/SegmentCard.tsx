"use client";
import type { Segment } from "@/lib/types";
import PolarityBadge from "@/components/shared/PolarityBadge";
import SeverityIcon from "@/components/shared/SeverityIcon";

interface Props { segment: Segment; isSelected: boolean; onClick: () => void; }

export default function SegmentCard({ segment, isSelected, onClick }: Props) {
  return (<div onClick={onClick}
    className={`rounded-lg border p-3 cursor-pointer transition-all ${isSelected ? "border-emerald-500/50 bg-zinc-800/80" : "border-zinc-800 hover:border-zinc-700 bg-zinc-900"}`}>
    <div className="flex items-center gap-2 mb-1">
      <PolarityBadge polarity={segment.polarity} />
      {segment.polarity === "NEGATIVE" && <SeverityIcon severity={segment.severity} />}
      <span className="text-xs text-zinc-500 ml-auto">Round {segment.roundNumber}</span>
    </div>
    <p className="text-sm font-medium text-zinc-200 mb-1">{segment.label}</p>
    <p className="text-xs text-zinc-400 line-clamp-2">{segment.analysis}</p>
    <span className="text-[10px] text-zinc-600 mt-1 inline-block">{segment.category}</span>
  </div>);
}
