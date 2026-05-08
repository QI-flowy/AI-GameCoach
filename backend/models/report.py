"""Dota 2 战术分析数据模型"""
from pydantic import BaseModel
from typing import Optional


class FrameAnalysis(BaseModel):
    index: int
    timestamp: float
    dimensions: dict
    key_event: Optional[str] = None
    rating: int = 3
    type: Optional[str] = None  # "highlight" | "mistake" | null
    error: Optional[str] = None


class KeyClip(BaseModel):
    timestamp: float
    label: str
    analysis: str
    frame_index: int
    clip_type: str  # "highlight" | "mistake"
    dimension_tags: list[str] = []


class DotaAnalysisReport(BaseModel):
    task_id: str
    video_duration: float
    total_frames: int
    frames: list[FrameAnalysis] = []
    timeline: list[KeyClip] = []
    summary: str = ""
    coach_advice: list[str] = []
    error: Optional[str] = None


class AnalysisStatus(BaseModel):
    task_id: str
    status: str
    progress: int = 0
    frames_done: int = 0
    total_frames: int = 0
    error: Optional[str] = None
