import type { SummaryStats } from "@/lib/types";
import { ThumbsUp, ThumbsDown, TrendingUp, BarChart3 } from "lucide-react";

interface Props { summary: SummaryStats; }

export default function SummaryCards({ summary }: Props) {
  const ratio = summary.totalKills / Math.max(summary.totalDeaths, 1);
  return (<div className="grid grid-cols-4 gap-4">
    {[
      { icon: <ThumbsUp className="h-5 w-5" />, label: "高光次数", value: summary.totalHighlights, color: "text-emerald-400", bg: "bg-emerald-400/10" },
      { icon: <ThumbsDown className="h-5 w-5" />, label: "失误次数", value: summary.totalMistakes, color: "text-red-400", bg: "bg-red-400/10" },
      { icon: <TrendingUp className="h-5 w-5" />, label: "K/D Ratio", value: ratio.toFixed(2), color: "text-blue-400", bg: "bg-blue-400/10" },
      { icon: <BarChart3 className="h-5 w-5" />, label: "主要问题", value: summary.topMistakeCategory.split("·").pop() ?? "-", color: "text-amber-400", bg: "bg-amber-400/10" },
    ].map(c => <div key={c.label} className={`${c.bg} rounded-xl border border-zinc-800 p-4`}>
      <div className={`${c.color} mb-2`}>{c.icon}</div>
      <p className="text-2xl font-bold text-zinc-100">{c.value}</p>
      <p className="text-xs text-zinc-500 mt-1">{c.label}</p>
    </div>)}
  </div>);
}
