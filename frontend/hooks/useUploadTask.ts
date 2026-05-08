import { useState, useCallback } from "react";
import type { AnalysisTask, TaskStatus } from "@/lib/types";
import { mockMatchReport } from "@/lib/mock-data";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface UseUploadOptions {
  /** 是否使用 Mock 数据（无后端时使用） */
  useMock?: boolean;
}

export function useUploadTask({ useMock = true }: UseUploadOptions = {}) {
  const [task, setTask] = useState<AnalysisTask | null>(null);
  const [uploading, setUploading] = useState(false);

  const uploadFile = useCallback(async (file: File) => {
    setUploading(true);

    if (useMock) {
      // Mock 模式：模拟上传进度
      setTask({
        ...mockMatchReport,
        demoFileName: file.name,
        status: "parsing" as TaskStatus,
        progress: 0,
        game: "cs2",
        createdAt: new Date().toISOString(),
        result: { ...mockMatchReport, matchId: "mock-001" },
      } as unknown as AnalysisTask);

      let progress = 0;
      const statuses: TaskStatus[] = ["parsing", "analyzing", "done"];
      let statusIndex = 0;

      const interval = setInterval(() => {
        progress += Math.random() * 15 + 5;
        if (progress >= 100) {
          clearInterval(interval);
          setTask(prev => prev ? {
            ...prev, status: "done" as TaskStatus, progress: 100,
            result: { ...mockMatchReport },
          } : prev);
          setUploading(false);
        } else {
          const si = progress > 40 && progress < 80 ? 1 : 0;
          setTask(prev => prev ? {
            ...prev, status: statuses[si], progress: Math.min(100, progress),
          } : prev);
        }
      }, 400);
      return "mock-001";
    }

    // 真实 API 模式
    try {
      const formData = new FormData();
      formData.append("file", file);

      const uploadResp = await fetch(`${API_BASE}/api/upload`, {
        method: "POST", body: formData,
      });
      if (!uploadResp.ok) throw new Error("Upload failed");
      const { task_id } = await uploadResp.json();

      // 轮询任务进度
      const pollInterval = setInterval(async () => {
        const resp = await fetch(`${API_BASE}/api/tasks/${task_id}`);
        if (!resp.ok) return;
        const data = await resp.json();

        setTask({
          id: data.id,
          demoFileName: data.demo_file_name,
          status: data.status.toLowerCase() as TaskStatus,
          progress: data.progress,
          game: "cs2",
          createdAt: data.created_at,
          result: data.result ? convertReport(data.result) : undefined,
        });

        if (data.status === "DONE" || data.status === "ERROR") {
          clearInterval(pollInterval);
          setUploading(false);
        }
      }, 2000);

      return task_id;
    } catch (err) {
      console.error("Upload error:", err);
      setUploading(false);
      throw err;
    }
  }, [useMock]);

  return { task, uploading, uploadFile };
}

/** 转换后端报告格式为前端类型 */
function convertReport(data: any) {
  return {
    ...data,
    summary: {
      totalHighlights: data.summary.total_highlights,
      totalMistakes: data.summary.total_mistakes,
      topMistakeCategory: data.summary.top_mistake_category,
      avgKdRatio: data.summary.avg_kd_ratio,
      totalKills: data.summary.total_kills,
      totalDeaths: data.summary.total_deaths,
    },
    problemMap: data.problem_map.map((p: any) => ({
      category: p.category, positive: p.positive,
      negative: p.negative, summary: p.summary,
    })),
    segments: data.segments.map((s: any) => ({
      id: s.id, tickStart: s.tick_start, tickEnd: s.tick_end,
      roundNumber: s.round_number, type: s.type, severity: s.severity,
      label: s.label, analysis: s.analysis, category: s.category,
      polarity: s.polarity, subType: s.sub_type,
    })),
  };
}
