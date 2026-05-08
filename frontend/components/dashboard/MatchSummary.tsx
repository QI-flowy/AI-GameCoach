import type { SummaryStats } from "@/lib/types";
import { Sparkles, AlertTriangle, Crosshair, Sword } from "lucide-react";

interface Props { summary: SummaryStats; }

export default function MatchSummary({ summary }: Props) {
  const cards = [
    { icon: <Sparkles className="h-4 w-4 text-emerald-400" />, label: "高光时刻", value: summary.totalHighlights, bg: "bg-emerald-400/10 border-emerald-400/20" },
    { icon: <AlertTriangle className="h-4 w-4 text-red-400" />, label: "失误次数", value: summary.totalMistakes, bg: "bg-red-400/10 border-red-400/20" },
    { icon: <Crosshair className="h-4 w-4 text-blue-400" />, label: "K/D", value: `${summary.totalKills}/${summary.totalDeaths}`, bg: "bg-blue-400/10 border-blue-400/20" },
    { icon: <Sword className="h-4 w-4 text-amber-400" />, label: "主要问题", value: summary.topMistakeCategory.split("·").pop() ?? "", bg: "bg-amber-400/10 border-amber-400/20" },
  ];
  return (<div className="grid grid-cols-4 gap-3">
    {cards.map(c => <div key={c.label} className={`rounded-lg border p-3 ${c.bg}`}>
      <div className="flex items-center gap-1.5 mb-1">{c.icon}<span className="text-xs text-zinc-400">{c.label}</span></div>
      <p className="text-lg font-bold text-zinc-100">{c.value}</p>
    </div>)}
  </div>);
}
