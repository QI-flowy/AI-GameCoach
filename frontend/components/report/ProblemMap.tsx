"use client";
import type { ProblemItem } from "@/lib/types";

interface Props { problemMap: ProblemItem[]; }

export default function ProblemMap({ problemMap }: Props) {
  const maxTotal = Math.max(...problemMap.map(p => p.positive + p.negative), 1);

  return (<div className="space-y-3">
    {problemMap.map(item => {
      const positivePct = (item.positive / maxTotal) * 100;
      const negativePct = (item.negative / maxTotal) * 100;

      return (<div key={item.category} className="bg-zinc-900 rounded-xl border border-zinc-800 p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-zinc-200">{item.category}</h3>
          <span className="text-xs text-zinc-500">{item.positive} 高光 · {item.negative} 失误</span>
        </div>
        <div className="h-4 bg-zinc-800 rounded-full overflow-hidden flex mb-2">
          <div className="bg-emerald-500 h-full transition-all" style={{ width: `${positivePct}%` }} />
          <div className="bg-red-500 h-full transition-all" style={{ width: `${negativePct}%` }} />
        </div>
        <p className="text-xs text-zinc-400">{item.summary}</p>
      </div>);
    })}
  </div>);
}
