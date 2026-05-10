"""AI 电竞教练 API（Dota 2）"""
import os, asyncio, time, json
from datetime import datetime
from fastapi import FastAPI, UploadFile, File, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager

from models.report import DotaAnalysisReport, AnalysisStatus
from llm.qwen_client import QwenClient
from pipeline.analyzer import DotaAnalyzer, STATUSES
from services.dota_meta import get_dota_meta

# ─── 路径（D 盘，空间充裕） ───
BASE = os.path.dirname(os.path.dirname(__file__))
UPLOAD_DIR = r"D:\dota-coach\uploads"
SCREENSHOT_DIR = r"D:\dota-coach\screenshots"
REPORT_DIR = r"D:\dota-coach\reports"
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(SCREENSHOT_DIR, exist_ok=True)
os.makedirs(REPORT_DIR, exist_ok=True)

# ─── 全局分析器 ───
qwen = QwenClient()
dota_analyzer = DotaAnalyzer(qwen, SCREENSHOT_DIR)
reports: dict[str, DotaAnalysisReport] = {}


async def _cb(tid, p):
    """进度回调（前端显示用）"""
    if tid in STATUSES:
        STATUSES[tid].progress = int(p * 100)


def _save_report(tid: str, report: DotaAnalysisReport):
    """持久化报告到磁盘"""
    rp = os.path.join(REPORT_DIR, f"{tid}.json")
    with open(rp, "w", encoding="utf-8") as f:
        f.write(report.model_dump_json(indent=2))


def _load_report(tid: str) -> DotaAnalysisReport | None:
    """从磁盘加载报告"""
    rp = os.path.join(REPORT_DIR, f"{tid}.json")
    try:
        with open(rp, "r", encoding="utf-8") as f:
            return DotaAnalysisReport.model_validate_json(f.read())
    except (FileNotFoundError, json.JSONDecodeError):
        return None


def _load_all_reports():
    """启动时加载所有持久化报告"""
    if not os.path.isdir(REPORT_DIR):
        return {}
    result = {}
    for fn in os.listdir(REPORT_DIR):
        if fn.endswith(".json"):
            tid = fn[:-5]
            report = _load_report(tid)
            if report:
                result[tid] = report
    return result


async def _run(tid, vp, interval=15, batch_size=8):
    """后台分析任务"""
    try:
        reports[tid] = await dota_analyzer.analyze_full(tid, vp, _cb, interval=interval, batch_size=batch_size)
        _save_report(tid, reports[tid])
    except Exception as e:
        if tid in STATUSES:
            STATUSES[tid].status = "error"
            STATUSES[tid].error = str(e)
        print(f"[Error] {tid}: {e}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # 启动时加载持久化报告
    global reports
    reports = _load_all_reports()
    if reports:
        print(f"[启动] 已加载 {len(reports)} 份持久化报告")
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
    interval: int = Form(15),
    batch_size: int = Form(8),
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

    asyncio.create_task(_run(tid, vp, interval=interval, batch_size=batch_size))
    return {"task_id": tid, "status": "started", "interval": interval, "batch_size": batch_size}


@app.get("/api/analysis/{tid}/status")
async def analysis_status(tid: str):
    if tid not in STATUSES:
        # 检查是否有持久化报告（分析已完成）
        report = _load_report(tid)
        if report:
            return AnalysisStatus(
                task_id=tid, status="done", progress=100,
                frames_done=report.total_frames, total_frames=report.total_frames
            )
        raise HTTPException(404, "任务不存在")
    return STATUSES[tid].model_dump()


@app.get("/api/analysis/{tid}/report")
async def analysis_report(tid: str):
    # 先查内存，没有则尝试磁盘
    if tid not in reports:
        report = _load_report(tid)
        if report:
            reports[tid] = report
        else:
            raise HTTPException(404, "报告不存在或分析未完成")
    return reports[tid].model_dump()


@app.post("/api/analysis/{tid}/rerun")
async def rerun_analysis(tid: str, interval: int = 15, batch_size: int = 8):
    """重新分析已有视频（无需重新上传）"""
    # 查找已有视频文件
    upload_dir = r"D:\dota-coach\uploads"
    candidates = [f for f in os.listdir(upload_dir) if f.startswith(tid)]
    if not candidates:
        raise HTTPException(404, f"未找到任务 {tid} 的上传文件")
    vp = os.path.join(upload_dir, candidates[0])

    # 清空旧的截图
    import shutil
    ss_dir = os.path.join(SCREENSHOT_DIR, tid)
    if os.path.isdir(ss_dir):
        shutil.rmtree(ss_dir)

    # 启动分析
    asyncio.create_task(_run(tid, vp, interval=interval, batch_size=batch_size))
    return {"task_id": tid, "status": "started", "interval": interval, "batch_size": batch_size}


@app.put("/api/analysis/{tid}/heroes")
async def update_heroes(tid: str, body: dict):
    if tid not in reports:
        report = _load_report(tid)
        if not report:
            raise HTTPException(404, "报告不存在")
        reports[tid] = report
    r = reports[tid]
    r.radiant_heroes = body.get("radiant_heroes", r.radiant_heroes)
    r.dire_heroes = body.get("dire_heroes", r.dire_heroes)
    _save_report(tid, r)  # 保存编辑后的内容
    return r.model_dump()


@app.get("/api/dota2/meta")
async def dota_meta(refresh: bool = False):
    """获取 Dota 2 版本元数据（热门英雄/版本号等）"""
    return await get_dota_meta(refresh=refresh)


# ─── 静态文件 ───
try:
    app.mount("/screenshots", StaticFiles(directory=SCREENSHOT_DIR), name="screenshots")
except Exception:
    pass
