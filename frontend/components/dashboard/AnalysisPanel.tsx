"use client";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";
import type { DotaAnalysisReport, KeyClip } from "@/lib/api-client";

const DIMS: Record<string, string> = {
  laning: "对线期", teamfight: "团战决策", items: "装备路线",
  map_control: "地图控制", roshan: "Roshan", economy: "经济效率",
};

interface Props {
  report: DotaAnalysisReport | null;
  activeClip: KeyClip | null;
}

export default function AnalysisPanel({ report, activeClip }: Props) {
  var [expanded, setExpanded] = useState<Record<string, boolean>>({});

  if (!report) {
    return (
      <div className="bg-zinc-900/50 rounded-lg border border-zinc-800 p-4">
        <p className="text-xs text-zinc-500 text-center">等待分析完成...</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* AI 总结 */}
      {report.summary && (
        <div className="bg-emerald-500/5 rounded-lg border border-emerald-500/20 p-3">
          <p className="text-xs text-emerald-300 font-medium mb-1">AI 教练总结</p>
          <p className="text-sm text-zinc-200">{report.summary}</p>
        </div>
      )}

      {/* 教练建议 */}
      {report.coach_advice.length > 0 && (
        <div>
          <p className="text-xs text-zinc-400 font-medium mb-1.5">教练建议</p>
          {report.coach_advice.map(function (a, i) {
            return (
              <p key={i} className="text-xs text-zinc-300 mb-1 pl-2 border-l-2 border-zinc-700">
                {a}
              </p>
            );
          })}
        </div>
      )}

      {/* 当前切片详情 */}
      {activeClip && (
        <div className={
          "p-3 rounded-lg " +
          (activeClip.clip_type === "highlight"
            ? "bg-emerald-500/5 border border-emerald-500/20"
            : "bg-red-500/5 border border-red-500/20")
        }>
          <p
            className="text-xs font-medium mb-1"
            style={{ color: activeClip.clip_type === "highlight" ? "#6ee7b7" : "#fca5a5" }}
          >
            {activeClip.label}
          </p>
          <p className="text-xs text-zinc-400">{activeClip.analysis}</p>
        </div>
      )}

      {/* 6维度折叠 */}
      <div className="space-y-1">
        <p className="text-xs text-zinc-400 font-medium">6维度分析</p>
        {Object.entries(DIMS).map(function ([k, label]) {
          var open = expanded[k];
          return (
            <div key={k} className="border border-zinc-800 rounded-md">
              <button
                onClick={function () { setExpanded(function (e) { return { ...e, [k]: !open }; }); }}
                className="w-full flex items-center gap-1.5 px-2.5 py-1.5 text-left hover:bg-zinc-800/50 rounded-md"
              >
                {open
                  ? <ChevronDown className="h-3 w-3 text-zinc-500" />
                  : <ChevronRight className="h-3 w-3 text-zinc-500" />}
                <span className="text-xs text-zinc-300">{label}</span>
              </button>
              {open && (
                <p className="text-xs text-zinc-500 px-2.5 pb-1.5">
                  {(activeClip && report.frames[activeClip.frame_index])
                    ? report.frames[activeClip.frame_index].dimensions[k] || "无数据"
                    : "选择一个切片查看分析"}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
