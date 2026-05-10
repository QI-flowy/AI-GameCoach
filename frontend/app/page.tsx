"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import DropZone from "@/components/upload/DropZone";
import UploadProgress from "@/components/upload/UploadProgress";
import { mockTask, mockDota2Task } from "@/lib/mock-data";
import { saveVideo } from "@/lib/video-storage";
import { startAnalysis, ANALYSIS_DEFAULTS } from "@/lib/api-client";
import { useGame } from "@/context/GameContext";
import type { AnalysisTask, TaskStatus } from "@/lib/types";

const GAME_INFO = {
  cs2: {
    title: "AI 电竞教练",
    subtitle: "上传你的 CS2 比赛录像，AI 智能分析每一回合的高光与失误",
    demo: mockTask,
  },
  dota2: {
    title: "AI DOTA 2 教练",
    subtitle: "上传你的 DOTA 2 比赛录像，AI 智能分析每一次团战与决策",
    demo: mockDota2Task,
  },
};

export default function HomePage() {
  const router = useRouter();
  const { selectedGame } = useGame();
  const [cfgInterval, setCfgInterval] = useState(ANALYSIS_DEFAULTS.interval);
  const [cfgBatchSize, setCfgBatchSize] = useState(ANALYSIS_DEFAULTS.batch_size);
  const [showConfig, setShowConfig] = useState(false);
  const [task, setTask] = useState<AnalysisTask | null>(null);
  const info = GAME_INFO[selectedGame];

  const handleFileDrop = async (file: File) => {
    setTask({ ...info.demo, demoFileName: file.name, status: "uploading", progress: 0 });

    // 1. 存 IndexedDB
    try { await saveVideo("current", file); } catch (e) { console.error(e); }

    // 2. 上传后端启动分析（携带可配置参数）
    try {
      var { task_id } = await startAnalysis(file, cfgInterval, cfgBatchSize);

      // 3. 模拟进度 + 跳转
      var progress = 0;
      var statuses: TaskStatus[] = ["parsing", "analyzing", "done"];
      var interval = setInterval(function () {
        progress += Math.random() * 10 + 3;
        if (progress >= 100) {
          clearInterval(interval);
          setTask({ ...info.demo, demoFileName: file.name, status: "done", progress: 100 });
          setTimeout(function () { router.push("/analysis/" + task_id); }, 600);
        } else {
          var si = progress > 30 && progress < 70 ? 1 : 0;
          setTask({ ...info.demo, demoFileName: file.name, status: statuses[si], progress: Math.min(100, progress) });
        }
      }, 400);
    } catch (e) {
      setTask(null);
      alert("上传失败: " + String(e));
    }
  };

  return (
    <div className="max-w-2xl mx-auto pt-12 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">{info.title}</h1>
        <p className="text-zinc-400">{info.subtitle}</p>
      </div>

      <DropZone onFileDrop={handleFileDrop} disabled={!!task} />

      {task && <UploadProgress fileName={task.demoFileName} status={task.status} progress={task.progress} />}

      {/* 分析参数配置 */}
      <div className="text-center">
        <button onClick={() => setShowConfig(!showConfig)} className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
          {showConfig ? "▲ 收起" : "▼ 分析参数配置"}
        </button>
        {showConfig && (
          <div className="mt-2 flex items-center justify-center gap-4 text-xs text-zinc-400">
            <label>
              截图间隔:
              <input type="number" min={5} max={120} value={cfgInterval}
                onChange={e => setCfgInterval(Number(e.target.value))}
                className="ml-1 w-14 px-1 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-200 text-center" />
              秒
            </label>
            <label>
              每批帧数:
              <input type="number" min={1} max={32} value={cfgBatchSize}
                onChange={e => setCfgBatchSize(Number(e.target.value))}
                className="ml-1 w-12 px-1 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-200 text-center" />
              张
            </label>
          </div>
        )}
      </div>

      <p className="text-xs text-zinc-600 text-center">
        上传 MP4 比赛录像 · 仅用于本地分析 · 不会公开分享
      </p>
    </div>
  );
}
