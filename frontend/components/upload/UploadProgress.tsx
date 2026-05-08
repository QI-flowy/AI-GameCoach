"use client";
import * as Progress from "@radix-ui/react-progress";
import { FileText, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import type { TaskStatus } from "@/lib/types";

interface Props { fileName: string; status: TaskStatus; progress: number; }

const labels: Record<TaskStatus, string> = {
  uploading: "正在上传…", parsing: "解析 demo 文件中…",
  analyzing: "AI 分析回合中…", done: "分析完成", error: "分析失败",
};
const icons: Record<TaskStatus, React.ReactNode> = {
  uploading: <Loader2 className="h-5 w-5 animate-spin text-blue-400" />,
  parsing: <Loader2 className="h-5 w-5 animate-spin text-amber-400" />,
  analyzing: <Loader2 className="h-5 w-5 animate-spin text-emerald-400" />,
  done: <CheckCircle2 className="h-5 w-5 text-emerald-400" />,
  error: <AlertCircle className="h-5 w-5 text-red-400" />,
};

export default function UploadProgress({ fileName, status, progress }: Props) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-4">
      <div className="flex items-center gap-3">
        <FileText className="h-5 w-5 text-zinc-400" />
        <span className="text-sm font-medium text-zinc-200">{fileName}</span>
        <span className="ml-auto">{icons[status]}</span>
      </div>
      <Progress.Root className="h-2 bg-zinc-800 rounded-full overflow-hidden" value={progress}>
        <Progress.Indicator className="h-full bg-emerald-500 rounded-full transition-all duration-500"
          style={{ width: `${progress}%` }} />
      </Progress.Root>
      <p className="text-xs text-zinc-500 text-right">{labels[status]}</p>
    </div>
  );
}
