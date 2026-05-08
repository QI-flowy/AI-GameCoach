"use client";
import { useState, useCallback, useRef, DragEvent } from "react";
import { Upload } from "lucide-react";

interface DropZoneProps { onFileDrop: (file: File) => void; disabled?: boolean; }

const VIDEO_ACCEPT = "video/mp4,video/webm,video/quicktime,video/x-matroska,.mp4,.webm,.mov,.mkv";

export default function DropZone({ onFileDrop, disabled }: DropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrag = useCallback((e: DragEvent, entering: boolean) => {
    e.preventDefault(); e.stopPropagation();
    if (!disabled) setIsDragging(entering);
  }, [disabled]);

  const handleDrop = useCallback((e: DragEvent) => {
    e.preventDefault(); e.stopPropagation(); setIsDragging(false);
    if (disabled) return;
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("video/")) onFileDrop(file);
  }, [disabled, onFileDrop]);

  const handleClick = () => {
    if (disabled) return;
    inputRef.current?.click();
  };

  return (
    <div onDragEnter={(e) => handleDrag(e, true)} onDragLeave={(e) => handleDrag(e, false)}
      onDragOver={(e) => e.preventDefault()} onDrop={handleDrop} onClick={handleClick}
      className={`border-2 border-dashed rounded-xl p-16 text-center cursor-pointer transition-all duration-200 ${
        isDragging ? "border-emerald-400 bg-emerald-400/10" : "border-zinc-700 hover:border-zinc-500 bg-zinc-900/50"
      } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}>
      <input
        ref={inputRef}
        type="file"
        accept={VIDEO_ACCEPT}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFileDrop(file);
        }}
      />
      <Upload className="mx-auto h-12 w-12 text-zinc-400 mb-4" />
      <p className="text-lg font-medium text-zinc-300">拖放 MP4 视频到此处</p>
      <p className="text-sm text-zinc-500 mt-2">或点击选择文件 · 支持 MP4 / WebM / MOV</p>
    </div>
  );
}
