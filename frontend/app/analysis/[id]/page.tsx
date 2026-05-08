"use client";
import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { useDotaAnalysis } from "@/hooks/useDotaAnalysis";
import { useGame } from "@/context/GameContext";
import VideoPlayer from "@/components/dashboard/VideoPlayer";
import TimelineSidebar from "@/components/dashboard/TimelineSidebar";
import AnalysisPanel from "@/components/dashboard/AnalysisPanel";
import { Clock, Loader2 } from "lucide-react";

export default function AnalysisPage() {
  var params = useParams();
  var { selectedGame } = useGame();
  var { status, report, loading, error } = useDotaAnalysis(params.id as string);
  var [selectedId, setSelectedId] = useState<number | null>(null);
  var [clipTimestamps, setClipTimestamps] = useState<number[]>([]);
  var [activeClipIdx, setActiveClipIdx] = useState(0);
  var isDota2 = selectedGame === "dota2";

  // 必须所有 hook 在任何 return 之前
  useEffect(function () {
    if (report && report.timeline.length > 0) {
      setClipTimestamps(report.timeline.map(function (c) { return c.timestamp; }));
    }
  }, [report]);

  var handleClipClick = useCallback(function (idx: number) {
    setActiveClipIdx(idx);
  }, []);

  // 加载状态
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
    <div className="space-y-4">
      {/* 顶部标题 */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-lg">{isDota2 ? "⚔️" : "🔫"}</span>
            <h1 className="text-2xl font-bold">{params.id as string}</h1>
          </div>
          <p className="text-sm text-zinc-500 flex items-center gap-2 mt-1">
            <Clock className="h-4 w-4" /> {Math.round(report.video_duration)}s · {report.total_frames} 帧
          </p>
        </div>
      </div>

      {/* 主内容区 */}
      <div className="grid grid-cols-2 gap-4">
        {/* 左侧：视频播放器 */}
        <VideoPlayer
          clipTimestamps={clipTimestamps}
          activeClipIndex={activeClipIdx}
          onClipTime={function (t: number) {
            var idx = clipTimestamps.indexOf(t);
            if (idx >= 0) handleClipClick(idx);
          }}
        />

        {/* 右侧：切片列表 + AI分析 */}
        <div className="space-y-3">
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

      {/* AI 详细分析面板 */}
      <AnalysisPanel report={report} activeClip={activeClip} />
    </div>
  );
}
