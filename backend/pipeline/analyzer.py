"""Dota 2 分析编排器"""
import asyncio
from models.report import FrameAnalysis, KeyClip, DotaAnalysisReport, AnalysisStatus
from llm.qwen_client import QwenClient
from pipeline.screenshotter import Screenshotter

BATCH = 8
STATUSES: dict[str, AnalysisStatus] = {}


class DotaAnalyzer:
    def __init__(self, qwen: QwenClient, ss_dir: str):
        self.qwen, self.ss_dir = qwen, ss_dir

    async def analyze_full(self, tid, vid, cb=None):
        out = f"{self.ss_dir}/{tid}"
        s = AnalysisStatus(task_id=tid, status="screenshotting")
        STATUSES[tid] = s
        meta = await Screenshotter(vid, out).extract()
        s.status = "analyzing"
        s.total_frames = len(meta)
        if cb:
            await cb(tid, 10)

        results = []
        batches = [meta[i:i + BATCH] for i in range(0, len(meta), BATCH)]
        for bi, batch in enumerate(batches):
            tasks = [self._one(fm) for fm in batch]
            br = await asyncio.gather(*tasks, return_exceptions=True)
            for i, r in enumerate(br):
                fm = batch[i]
                if isinstance(r, Exception):
                    results.append(FrameAnalysis(
                        index=fm["index"], timestamp=fm["timestamp"],
                        dimensions={}, rating=3, error=str(r),
                    ))
                else:
                    results.append(r)
            s.frames_done = len(results)
            s.progress = 10 + int(80 * (bi + 1) / len(batches))
            if cb:
                await cb(tid, s.progress / 100)

        s.status = "summarizing"
        si = [
            {
                "timestamp": f.timestamp,
                "dimensions": f.dimensions,
                "key_event": f.key_event,
                "rating": f.rating,
            }
            for f in results if not f.error
        ]
        sm = await self.qwen.generate_summary(si)

        tl = []
        for r in results:
            if r.rating in (1, 5):
                tl.append(KeyClip(
                    timestamp=r.timestamp,
                    label=r.type == "mistake" and "失误" or "高光",
                    analysis=r.dimensions.get("teamfight", ""),
                    frame_index=r.index,
                    clip_type=r.type or "highlight",
                ))

        s.status = "done"
        s.progress = 100
        if cb:
            await cb(tid, 1.0)
        return DotaAnalysisReport(
            task_id=tid,
            video_duration=meta[-1]["timestamp"] if meta else 0,
            total_frames=len(results),
            frames=results,
            timeline=tl,
            summary=sm.get("summary", ""),
            coach_advice=sm.get("coach_advice", []),
        )

    async def _one(self, fm):
        try:
            r = await asyncio.wait_for(
                self.qwen.analyze_frame(
                    fm["frame_path"], fm["prev_thumb"],
                    fm["next_thumb"], fm["timestamp"],
                ),
                60,
            )
            return FrameAnalysis(
                index=fm["index"], timestamp=fm["timestamp"],
                dimensions=r.get("dimensions", {}),
                key_event=r.get("key_event"),
                type=r.get("type"),
                rating=r.get("rating", 3),
            )
        except asyncio.TimeoutError:
            return FrameAnalysis(
                index=fm["index"], timestamp=fm["timestamp"],
                dimensions={}, rating=3, error="timeout",
            )
