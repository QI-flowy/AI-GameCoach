"use client";
import { useRef, useState, useEffect, useCallback } from "react";
import { Play, Pause, Volume2, VolumeX, Maximize2, SkipBack, SkipForward } from "lucide-react";
import { loadVideo } from "@/lib/video-storage";

interface Props { segmentLabel?: string; roundNumber?: number; clipTimestamps?: number[]; activeClipIndex?: number; onClipTime?: (t: number) => void; }

function fmtTime(seconds: number): string {
  var m = Math.floor(seconds / 60), s = Math.floor(seconds % 60);
  return String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0");
}

export default function VideoPlayer({ segmentLabel, roundNumber, clipTimestamps, activeClipIndex, onClipTime }: Props) {
  var videoRef = useRef<HTMLVideoElement>(null);
  var containerRef = useRef<HTMLDivElement>(null);
  var canvasRef = useRef<HTMLCanvasElement>(null);
  var [playing, setPlaying] = useState(false);
  var [muted, setMuted] = useState(false);
  var [currentTime, setCurrentTime] = useState(0);
  var [duration, setDuration] = useState(0);
  var [videoSrc, setVideoSrc] = useState<string | null>(null);
  var [videoError, setVideoError] = useState(false);
  var [loaded, setLoaded] = useState(false);
  var blobUrlRef = useRef<string | null>(null);

  // 从 IndexedDB 加载视频
  useEffect(function () {
    var cancelled = false;
    (async function () {
      try {
        var blob = await loadVideo("current");
        if (cancelled) return;
        if (blob) {
          var url = URL.createObjectURL(blob);
          blobUrlRef.current = url;
          setVideoSrc(url);
        }
      } catch (e) {
        console.error("加载视频失败:", e);
      }
      setLoaded(true);
    })();
    return function () { cancelled = true; };
  }, []);

  // 清理 blob URL
  useEffect(function () {
    return function () {
      if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
    };
  }, []);

  // 点击时间轴切片时跳转视频
  useEffect(function () {
    if (clipTimestamps && clipTimestamps.length > 0 &&
        activeClipIndex !== undefined && activeClipIndex >= 0 &&
        activeClipIndex < clipTimestamps.length) {
      var v = videoRef.current;
      if (v && v.readyState >= 2) {
        v.currentTime = clipTimestamps[activeClipIndex];
      }
    }
  }, [activeClipIndex, clipTimestamps, videoSrc]);

  var togglePlay = useCallback(function () {
    if (videoError) {
      setPlaying(function (p) { return !p; });
      return;
    }
    var v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      v.play().then(function () { setPlaying(true); }).catch(function () { setVideoError(true); });
    } else {
      v.pause();
      setPlaying(false);
    }
  }, [videoError]);

  var handleSeek = useCallback(function (e: React.MouseEvent<HTMLDivElement>) {
    var v = videoRef.current;
    if (!v || !duration || videoError) return;
    var rect = e.currentTarget.getBoundingClientRect();
    v.currentTime = Math.max(0, Math.min(duration, ((e.clientX - rect.left) / rect.width) * duration));
  }, [duration, videoError]);

  var jump = useCallback(function (sec: number) {
    if (videoError) return;
    var v = videoRef.current;
    if (!v) return;
    v.currentTime = Math.max(0, Math.min(v.duration || 0, v.currentTime + sec));
  }, [videoError]);

  var toggleMute = useCallback(function () {
    var v = videoRef.current;
    if (v) { v.muted = !muted; setMuted(!muted); }
  }, [muted]);

  // Canvas 动画（视频无法解码时的 fallback）
  useEffect(function () {
    if (!videoError) return;
    var canvas = canvasRef.current;
    if (!canvas) return;
    var ctx = canvas.getContext("2d");
    if (!ctx) return;
    var w = canvas.clientWidth, h = canvas.clientHeight;
    if (w === 0 || h === 0) return;
    canvas.width = w; canvas.height = h;
    var color = "#10b981";
    var start = Date.now();
    var rid = 0;
    function draw() {
      var t = ((Date.now() - start) / 1000) % 5;
      ctx!.fillStyle = "#0a0a0f";
      ctx!.fillRect(0, 0, w, h);
      ctx!.font = "bold 36px sans-serif";
      ctx!.textAlign = "center";
      ctx!.fillStyle = "rgba(255,255,255,0.12)";
      ctx!.fillText("🎮", w / 2, h / 2 - 16);
      ctx!.font = "13px monospace";
      ctx!.fillStyle = "rgba(255,255,255,0.3)";
      ctx!.fillText("MP4 视频回放", w / 2, h / 2 + 14);
      for (var i = 0; i < 3; i++) {
        var yb = h * 0.7 + i * 18;
        var a = Math.floor((0.4 - i * 0.1) * 255).toString(16).padStart(2, "0");
        ctx!.strokeStyle = color + a;
        ctx!.lineWidth = 2;
        ctx!.beginPath();
        for (var x = 0; x <= w; x += 3) {
          var amp = Math.sin((x / w) * Math.PI * 4.5 + (t + i * 0.6) % 5 * 3) * 6;
          var y = yb + amp * (1 - i * 0.3);
          if (x === 0) ctx!.moveTo(x, y); else ctx!.lineTo(x, y);
        }
        ctx!.stroke();
      }
      var ha = (0.25 + Math.sin(t * 2) * 0.1).toFixed(2);
      ctx!.font = "12px sans-serif";
      ctx!.fillStyle = "rgba(255,255,255," + ha + ")";
      ctx!.fillText(playing ? "▶ 播放中" : "⏸ 已暂停", w / 2, h - 12);
      rid = requestAnimationFrame(draw);
    }
    draw();
    return function () { cancelAnimationFrame(rid); };
  }, [videoError, playing]);

  if (!loaded) {
    return (
      <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
        <div className="aspect-video bg-zinc-800 flex items-center justify-center">
          <p className="text-sm text-zinc-500">加载视频中...</p>
        </div>
      </div>
    );
  }

  if (!videoSrc) {
    return (
      <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
        <div className="aspect-video bg-zinc-800 flex items-center justify-center">
          <div className="text-center">
            <p className="text-sm text-zinc-500">请上传 MP4 视频</p>
          </div>
        </div>
        <div className="flex items-center gap-3 px-4 py-2.5 border-t border-zinc-800">
          <Play className="h-4 w-4 text-zinc-600" />
          <Pause className="h-4 w-4 text-zinc-600" />
          <span className="text-xs text-zinc-600 ml-auto">00:00 / 00:00</span>
        </div>
      </div>
    );
  }

  var isVideo = !videoError;
  var trackBg = isVideo ? "#10b981" : "#7c3aed";

  return (
    <div ref={containerRef} className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
      <div className={"relative aspect-video group " + (isVideo ? "bg-black" : "bg-zinc-800")}>
        {videoError && (
          <canvas ref={canvasRef} className="w-full h-full" />
        )}
        {isVideo && (
          <video
            ref={videoRef}
            src={videoSrc}
            className="w-full h-full object-contain"
            onTimeUpdate={function () { setCurrentTime(videoRef.current ? videoRef.current.currentTime : 0); }}
            onDurationChange={function () { setDuration(videoRef.current ? videoRef.current.duration : 0); }}
            onPlay={function () { setPlaying(true); }}
            onPause={function () { setPlaying(false); }}
            onEnded={function () { setPlaying(false); }}
            onError={function () { setVideoError(true); }}
            playsInline
          />
        )}
        {!playing && isVideo && (
          <button
            onClick={togglePlay}
            className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Play className="h-14 w-14 text-white/80" />
          </button>
        )}
        {segmentLabel && (
          <div className="absolute top-3 left-3 bg-black/60 px-2 py-1 rounded text-xs text-zinc-300">
            R{roundNumber} · {segmentLabel}
          </div>
        )}
      </div>

      <div className="h-1 bg-zinc-700 cursor-pointer relative" onClick={handleSeek}>
        <div
          className="h-full transition-all duration-100"
          style={{
            width: (isVideo && duration > 0 ? (currentTime / duration) * 100 : 0) + "%",
            background: trackBg,
          }}
        />
        {clipTimestamps && duration > 0 &&
          clipTimestamps.map(function (t, i) {
            var left = (t / duration) * 100;
            return (
              <div
                key={i}
                title={"切片 " + (i + 1)}
                onClick={function (e: React.MouseEvent) { e.stopPropagation(); if (onClipTime) onClipTime(t); }}
                className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full cursor-pointer hover:scale-125 transition-transform"
                style={{ left: left + "%", background: i === activeClipIndex ? "#fff" : "#7c3aed" }}
              />
            );
          })}
      </div>

      <div className="flex items-center gap-2 px-3 py-2">
        <button onClick={function () { jump(-5); }} className="text-zinc-400 hover:text-white p-0.5">
          <SkipBack className="h-3.5 w-3.5" />
        </button>
        <button onClick={togglePlay} className="text-zinc-400 hover:text-white p-0.5">
          {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </button>
        <button onClick={function () { jump(5); }} className="text-zinc-400 hover:text-white p-0.5">
          <SkipForward className="h-3.5 w-3.5" />
        </button>
        <button onClick={toggleMute} className="text-zinc-400 hover:text-white p-0.5 ml-1">
          {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
        </button>
        <span className="text-xs text-zinc-500 ml-auto tabular-nums">
          {fmtTime(currentTime)} / {fmtTime(duration)}
        </span>
        <button
          onClick={function () { containerRef.current?.requestFullscreen(); }}
          className="text-zinc-400 hover:text-white p-0.5 ml-1"
        >
          <Maximize2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
