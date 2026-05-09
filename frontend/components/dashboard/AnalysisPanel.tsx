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
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-zinc-100">📊 6维度战术分析</h3>
      <div className="space-y-1.5">
        {Object.entries(DIMS).map(function ([k, label]) {
          var open = expanded[k];
          var dimData = (activeClip && report.frames[activeClip.frame_index])
            ? report.frames[activeClip.frame_index].dimensions[k]
            : null;
          var preview = dimData ? dimData.substring(0, 40) + (dimData.length > 40 ? "..." : "") : null;
          return (
            <div key={k} className="border border-zinc-800 rounded-lg overflow-hidden bg-zinc-900/30">
              <button
                onClick={function () { setExpanded(function (e) { return { ...e, [k]: !open }; }); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-zinc-800/50 transition-colors"
              >
                {open
                  ? <ChevronDown className="h-3.5 w-3.5 text-zinc-400 flex-shrink-0" />
                  : <ChevronRight className="h-3.5 w-3.5 text-zinc-400 flex-shrink-0" />}
                <span className="text-sm text-zinc-200 font-medium flex-shrink-0 w-20">{label}</span>
                {preview && !open && (
                  <span className="text-xs text-zinc-500 truncate">{preview}</span>
                )}
                {!preview && !open && (
                  <span className="text-xs text-zinc-600">{activeClip ? "无数据" : "选择一个切片查看"}</span>
                )}
              </button>
              {open && (
                <div className="px-3 pb-3 pt-1">
                  <p className="text-sm text-zinc-300 leading-relaxed">
                    {dimData || (activeClip ? "该维度暂无可分析数据" : "选择一个切片查看分析")}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}