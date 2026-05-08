"""FFmpeg 截图模块：从视频每30秒截一帧"""
import asyncio, json, shutil, subprocess
from pathlib import Path

INTERVAL = 30

# 检测 ffmpeg/ffprobe 是否可用
FFMPEG_PATH = "C:/Users/13910/Downloads/ffmpeg-master-latest-win64-gpl-shared/ffmpeg-master-latest-win64-gpl-shared/bin"
_FFMPEG = shutil.which("ffmpeg") or f"{FFMPEG_PATH}/ffmpeg.exe"
_FFPROBE = shutil.which("ffprobe") or f"{FFMPEG_PATH}/ffprobe.exe"


def _check():
    if not _FFMPEG or not _FFPROBE:
        raise RuntimeError(
            "FFmpeg/FFprobe 未找到。请安装 FFmpeg 并添加到 PATH。"
        )


async def _ffmpeg(*a):
    p = await asyncio.create_subprocess_exec(
        _FFMPEG, *a,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )
    _, e = await p.communicate()
    return p.returncode or 0, e.decode()


def duration(path):
    result = subprocess.run(
        [
            _FFPROBE, "-v", "error", "-show_entries", "format=duration",
            "-of", "default=noprint_wrappers=1:nokey=1", str(path),
        ],
        capture_output=True, text=True,
    )
    return float(result.stdout.strip())


class Screenshotter:
    def __init__(self, video, out, interval=INTERVAL):
        self.video, self.interval = video, interval
        self.out = Path(out)
        self.thumb = self.out / "thumbnails"
        self.out.mkdir(parents=True, exist_ok=True)
        self.thumb.mkdir(parents=True, exist_ok=True)

    async def extract(self):
        _check()
        dur = duration(self.video)
        n = max(1, int(dur / self.interval))
        frames = []
        for i in range(n):
            t = i * self.interval
            f = str(self.out / f"frame_{i:04d}.jpg")
            th = str(self.thumb / f"thumb_{i:04d}.jpg")
            await _ffmpeg("-y", "-ss", str(t), "-i", self.video,
                          "-vframes", "1", "-s", "1280x720", "-q:v", "2", f)
            await _ffmpeg("-y", "-ss", str(t), "-i", self.video,
                          "-vframes", "1", "-s", "160x90", "-q:v", "5", th)
            frames.append({
                "index": i, "timestamp": t,
                "frame_path": f, "thumb_path": th,
                "prev_thumb": str(self.thumb / f"thumb_{i-1:04d}.jpg") if i > 0 else None,
                "next_thumb": str(self.thumb / f"thumb_{i+1:04d}.jpg") if i < n - 1 else None,
            })
        with open(self.out / "frames.json", "w", encoding="utf-8") as f:
            json.dump(frames, f, ensure_ascii=False, indent=2)
        return frames
