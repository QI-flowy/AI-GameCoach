"use client";
import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { useDotaAnalysis } from "@/hooks/useDotaAnalysis";
import { useGame } from "@/context/GameContext";
import VideoPlayer from "@/components/dashboard/VideoPlayer";
import TimelineSidebar from "@/components/dashboard/TimelineSidebar";
import AnalysisPanel from "@/components/dashboard/AnalysisPanel";
import LineupCard from "@/components/dashboard/LineupCard";
import DotaMetaPanel from "@/components/dashboard/DotaMetaPanel";
import { updateHeroes } from "@/lib/api-client";
import { Clock, Loader2 } from "lucide-react";

export default function AnalysisPage() {
  var params = useParams();
  var { selectedGame } = useGame();
  var { status, report, loading, error, refreshReport } = useDotaAnalysis(params.id as string);
  var [clipTimestamps, setClipTimestamps] = useState<number[]>([]);
  var [activeClipIdx, setActiveClipIdx] = useState(0);
  var isDota2 = selectedGame === "dota2";

  useEffect(function () {
    if (report && report.timeline.length > 0) {
      setClipTimestamps(report.timeline.map(function (c) { return c.timestamp; }));
    }
  }, [report]);

  var handleClipClick = useCallback(function (idx: number) {
    setActiveClipIdx(idx);
  }, []);

  if (loading) {
    var st = status || { status: "preparing", progress: 0, frames_done: 0, total_frames: 0 };
    return (
      <div className="text-center py-20 space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-400 mx-auto" />
        <p className="text-lg text-zinc-200">
          {st.status === "screenshotting" && "📸 正在截图..."}
          {st.status === "analyzing" && "🧠 AI 分析中..."}
          {st.status === "summarizing" && "📝 生成报告..."}
          {st.status === "done" && "✅ 分析完成！"}
        </p>
        <p className="text-sm text-zinc-500">
          {st.frames_done} / {st.total_frames} 帧 · {st.progress}%
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20 space-y-4">
        <p className="text-lg text-red-400">分析失败</p>
        <p className="text-sm text-zinc-500">{error}</p>
      </div>
    );
  }

  if (!report) return null;

  var activeClip = report.timeline.length > 0 ? report.timeline[activeClipIdx] : null;

  return (
    <div className="flex flex-col h-screen bg-zinc-950">
      {/* 顶部栏 */}
      <div className="flex-shrink-0 border-b border-zinc-800 bg-zinc-900/80 px-4 py-2.5">
        <div className="flex items-center justify-between max-w-screen-xl mx-auto">
          <div className="flex items-center gap-3">
            <span className="text-xl">{isDota2 ? "⚔️" : "🔫"}</span>
            <div>
              <h1 className="text-base font-bold text-zinc-100">{params.id as string}</h1>
              <p className="text-xs text-zinc-500">
                {Math.round(report.video_duration)}s · {report.total_frames} 帧 · {report.timeline.length} 个关键切片
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 主内容区 */}
      <div className="flex-1 overflow-hidden">
        <div className="flex h-full max-w-screen-xl mx-auto">
          {/* 左侧：主内容 */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {/* 视频播放器 */}
            <div className="flex-shrink-0">
              <VideoPlayer
                clipTimestamps={clipTimestamps}
                activeClipIndex={activeClipIdx}
                onClipTime={function (t: number) {
                  var idx = clipTimestamps.indexOf(t);
                  if (idx >= 0) handleClipClick(idx);
                }}
              />
            </div>

            {/* AI 总结 + 教练建议 */}
            {(report.summary || report.coach_advice.length > 0 || activeClip) && (
              <div className="bg-zinc-900/50 rounded-lg border border-zinc-800 p-3 space-y-3">
                {report.summary && (
                  <div>
                    <p className="text-xs text-emerald-400 font-medium mb-1.5">📝 AI 教练总结</p>
                    <p className="text-sm text-zinc-200 leading-relaxed">{report.summary}</p>
                  </div>
                )}
                {activeClip && (function () {
                  var frame = report.frames[activeClip.frame_index];
                  if (!frame) return null;
                  var dims = Object.entries(frame.dimensions);
                  if (dims.length === 0) return null;
                  var advice = [];
                  if (frame.type === "mistake") advice.push("⚠️ " + (dims.find(function (d) { return d[0] === "teamfight"; }) ? dims.find(function (d) { return d[0] === "teamfight"; })![1] : ""));
                  if (frame.type === "highlight") advice.push("⭐ " + (dims.find(function (d) { return d[0] === "teamfight"; }) ? dims.find(function (d) { return d[0] === "teamfight"; })![1] : ""));
                  var info = dims.filter(function (d) { return d[1]; }).map(function (d) { return d[0] === "items" ? "🛠️ " + d[1] : d[1]; });
                  info.slice(0, 2).forEach(function (a) { advice.push(a); });
                  if (advice.length === 0) return null;
                  return (
                    <div>
                      <p className="text-xs text-amber-400 font-medium mb-1.5">💡 当前切片建议</p>
                      <div className="space-y-1">
                        {advice.filter(Boolean).map(function (a, i) {
                          return (
                            <p key={i} className="text-xs text-zinc-300 pl-2.5 border-l-2 border-amber-700 leading-relaxed">
                              {a}
                            </p>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}
                {!activeClip && report.coach_advice.length > 0 && (
                  <div>
                    <p className="text-xs text-amber-400 font-medium mb-1.5">💡 教练建议</p>
                    <div className="space-y-1">
                      {report.coach_advice.map(function (a, i) {
                        return (
                          <p key={i} className="text-xs text-zinc-300 pl-2.5 border-l-2 border-zinc-700 leading-relaxed">
                            {a}
                          </p>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 阵容卡片 */}
            <LineupCard
              radiantHeroes={report.radiant_heroes}
              direHeroes={report.dire_heroes}
              lineupAnalysis={report.lineup_analysis}
              onSave={async function (r, d) {
                try {
                  await updateHeroes(params.id as string, r, d);
                  await refreshReport();
                } catch (e) {
                  console.error("保存失败:", e);
                }
              }}
            />

            {/* 6维度分析 */}
            <div className="pb-4">
              <AnalysisPanel report={report} activeClip={activeClip} />
            </div>
          </div>

          {/* 右侧：版本信息 + 时间轴切片 */}
          <div className="w-64 flex-shrink-0 border-l border-zinc-800 bg-zinc-900/30 overflow-y-auto">
            <div className="p-3 space-y-3">
              {isDota2 && <DotaMetaPanel />}
              <TimelineSidebar
                clips={report.timeline}
                currentTime={activeClip ? activeClip.timestamp : 0}
                onSeekTo={function (t: number) {
                  if (!report) return;
                  var idx = report.timeline.findIndex(function (c) { return c.timestamp === t; });
                  if (idx >= 0) handleClipClick(idx);
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
