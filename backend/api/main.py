"""AI 电竞教练 API（Dota 2）"""
import os, asyncio, time
from datetime import datetime
from fastapi import FastAPI, UploadFile, File, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager

from models.report import DotaAnalysisReport, AnalysisStatus
from llm.qwen_client import QwenClient
from pipeline.analyzer import DotaAnalyzer, STATUSES

# ─── 路径（D 盘，空间充裕） ───
BASE = os.path.dirname(os.path.dirname(__file__))
UPLOAD_DIR = r"D:\dota-coach\uploads"
SCREENSHOT_DIR = r"D:\dota-coach\screenshots"
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(SCREENSHOT_DIR, exist_ok=True)

# ─── 全局分析器 ───
qwen = QwenClient()
dota_analyzer = DotaAnalyzer(qwen, SCREENSHOT_DIR)
reports: dict[str, DotaAnalysisReport] = {}


async def _cb(tid, p):
    """进度回调（前端显示用）"""
    if tid in STATUSES:
        STATUSES[tid].progress = int(p * 100)


async def _run(tid, vp):
    """后台分析任务"""
    try:
        reports[tid] = await dota_analyzer.analyze_full(tid, vp, _cb)
    except Exception as e:
        if tid in STATUSES:
            STATUSES[tid].status = "error"
            STATUSES[tid].error = str(e)
        print(f"[Error] {tid}: {e}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield


app = FastAPI(title="AI 电竞教练 API", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health():
    return {"status": "ok", "llm_configured": True}


@app.post("/api/analysis/start")
async def start_analysis(
    file: UploadFile = File(...),
    game: str = Form("dota2"),
):
    if not file.filename or not file.filename.lower().endswith(
        (".mp4", ".webm", ".mov", ".avi", ".mkv")
    ):
        raise HTTPException(400, "不支持的文件格式，仅支持 MP4/WebM/MOV/AVI/MKV")

    tid = f"dota_{int(time.time())}_{file.filename[:12]}"
    vp = os.path.join(UPLOAD_DIR, f"{tid}_{file.filename}")

    # 流式写入磁盘，避免大文件撑爆内存
    CHUNK = 1024 * 1024  # 1MB 一块
    MAX = 20 * 1024 * 1024 * 1024  # 20GB 硬限制
    try:
        with open(vp, "wb") as f:
            total = 0
            while True:
                chunk = await file.read(CHUNK)
                if not chunk:
                    break
                f.write(chunk)
                total += len(chunk)
                if total > MAX:
                    os.remove(vp)
                    raise HTTPException(400, "文件超过 20GB 限制")
    except HTTPException:
        raise
    except Exception as e:
        if os.path.exists(vp):
            os.remove(vp)
        raise HTTPException(400, f"上传失败: {e}")

    asyncio.create_task(_run(tid, vp))
    return {"task_id": tid, "status": "started"}


@app.get("/api/analysis/{tid}/status")
async def analysis_status(tid: str):
    if tid not in STATUSES:
        raise HTTPException(404, "任务不存在")
    return STATUSES[tid].model_dump()


@app.get("/api/analysis/{tid}/report")
async def analysis_report(tid: str):
    if tid not in reports:
        raise HTTPException(404, "报告不存在或分析未完成")
    return reports[tid].model_dump()


# ─── 静态文件 ───
try:
    app.mount("/screenshots", StaticFiles(directory=SCREENSHOT_DIR), name="screenshots")
except Exception:
    pass
