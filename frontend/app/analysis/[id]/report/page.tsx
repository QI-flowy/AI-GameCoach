"use client";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useAnalysisTask } from "@/hooks/useAnalysisTask";
import { useGame } from "@/context/GameContext";
import SummaryCards from "@/components/report/SummaryCards";
import ProblemMap from "@/components/report/ProblemMap";
import { ArrowLeft, Lightbulb } from "lucide-react";

export default function ReportPage() {
  const params = useParams();
  const { selectedGame } = useGame();
  const { task } = useAnalysisTask(params.id as string);
  const report = task.result;
  if (!report) return <div className="text-center py-20 text-zinc-500">报告不可用</div>;

  const isDota2 = selectedGame === "dota2";

  return (<div className="space-y-6 max-w-4xl mx-auto">
    <div className="flex items-center gap-2">
      <Link href={`/analysis/${params.id}`} className="inline-flex items-center gap-1 text-sm text-zinc-400 hover:text-zinc-300">
        <ArrowLeft className="h-4 w-4" /> 返回分析看板
      </Link>
      <span className="text-lg">{isDota2 ? "⚔️" : "🔫"}</span>
    </div>
    <h1 className="text-2xl font-bold">{isDota2 ? "DOTA 2" : "CS2"} 复盘报告</h1>
    <SummaryCards summary={report.summary} />

    <div>
      <h2 className="text-lg font-semibold mb-4">问题图谱</h2>
      <ProblemMap problemMap={report.problemMap} />
    </div>

    <div className="bg-zinc-900 rounded-xl border border-emerald-500/20 p-5 space-y-3">
      <div className="flex items-center gap-2">
        <Lightbulb className="h-5 w-5 text-emerald-400" />
        <h2 className="font-semibold text-emerald-400">总体建议</h2>
      </div>
      <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-line">{report.overallAdvice}</p>
    </div>
  </div>);
}
