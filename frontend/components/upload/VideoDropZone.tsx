"use client";
import { useState, useCallback, useRef, DragEvent } from "react";
import { Video, CheckCircle } from "lucide-react";

interface Props { onFileDrop: (file: File) => void; disabled?: boolean; label?: string; }

const VIDEO_ACCEPT = "video/mp4,video/webm,video/quicktime,video/x-matroska,.mp4,.webm,.mov,.mkv";

export default function VideoDropZone({ onFileDrop, disabled, label }: Props) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const process = useCallback((file: File) => {
    if (file && file.type.startsWith("video/")) onFileDrop(file);
  }, [onFileDrop]);

  const handleDrag = useCallback((e: DragEvent, entering: boolean) => {
    e.preventDefault(); e.stopPropagation();
    if (!disabled) setIsDragging(entering);
  }, [disabled]);

  const handleDrop = useCallback((e: DragEvent) => {
    e.preventDefault(); e.stopPropagation(); setIsDragging(false);
    if (disabled) return;
    const file = e.dataTransfer.files[0];
    process(file);
  }, [disabled, process]);

  const handleClick = () => {
    if (disabled) return;
    inputRef.current?.click();
  };

  return (
    <div
      onDragEnter={(e) => handleDrag(e, true)}
      onDragLeave={(e) => handleDrag(e, false)}
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
      onClick={handleClick}
      className={`border-2 border-dashed rounded-xl px-8 py-4 text-center cursor-pointer transition-all duration-200 ${
        isDragging
          ? "border-purple-400 bg-purple-400/10"
          : label
            ? "border-emerald-600 bg-emerald-500/5"
            : "border-zinc-700 hover:border-zinc-500 bg-zinc-900/50"
      } ${disabled ? "opacity-40 pointer-events-none" : ""}`}
    >
      <input
        ref={inputRef}
        type="file"
        accept={VIDEO_ACCEPT}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) process(file);
        }}
      />
      <div className="flex items-center justify-center gap-3">
        {label ? (
          <CheckCircle className="h-5 w-5 text-emerald-400" />
        ) : (
          <Video className="h-5 w-5 text-zinc-500" />
        )}
        <div className="text-left">
          <p className="text-sm font-medium text-zinc-300">
            {label ? label : "点击或拖放 MP4 视频回放"}
          </p>
          <p className="text-xs text-zinc-500 mt-0.5">
            {label ? "✅ 已上传，分析页可直接播放" : "可选 · 支持 MP4 / WebM / MOV"}
          </p>
        </div>
      </div>
    </div>
  );
}
