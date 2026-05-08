import { useState, useEffect } from "react";
import type { AnalysisTask, TaskStatus } from "@/lib/types";
import { mockMatchReport, mockDota2Report } from "@/lib/mock-data";
import { useGame } from "@/context/GameContext";

export function useAnalysisTask(taskId: string) {
  const { selectedGame } = useGame();
  const report = selectedGame === "dota2" ? mockDota2Report : mockMatchReport;
  const defaultName = selectedGame === "dota2" ? "dota_match.mp4" : "cs2_match.mp4";

  const [task, setTask] = useState<AnalysisTask>({
    id: taskId, demoFileName: defaultName, status: "done" as TaskStatus,
    progress: 100, game: selectedGame, createdAt: new Date().toISOString(),
    result: report,
  });

  // 客户端挂载后从 sessionStorage 读取真实文件名
  useEffect(function () {
    try {
      var stored = sessionStorage.getItem("ai-coach-filename");
      if (stored) {
        setTask(function (prev) { return { ...prev, demoFileName: stored as string }; });
      }
    } catch (_e) {}
  }, []);

  return { task, isLoading: false, error: null };
}
