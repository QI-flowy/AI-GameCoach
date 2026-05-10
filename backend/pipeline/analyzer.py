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

    async def analyze_full(self, tid, vid, cb=None, interval=15, batch_size=BATCH):
        """完整分析流程：截图 → 逐帧分析 → 总结"""
        out = f"{self.ss_dir}/{tid}"
        s = AnalysisStatus(task_id=tid, status="screenshotting")
        STATUSES[tid] = s
        meta = await Screenshotter(vid, out, interval=interval).extract()
        s.status = "analyzing"
        s.total_frames = len(meta)
        if cb:
            await cb(tid, 10)

        # ─── 全局上下文：缓存关键信息，保持帧间一致性 ───
        ctx = {
            "radiant_heroes": [],
            "dire_heroes": [],
            "known_heroes": {},      # hero_name → count (统计出现次数)
            "prev_analysis": None,   # 上一帧的完整 JSON
            "timeline": [],          # 关键事件记录
            "prev_timestamp": -999,
        }

        # 阵容识别（用第2帧避免大厅界面，或用户手动设置过的已缓存）
        radiant_heroes = []
        dire_heroes = []
        lineup_analysis = ""
        roster_frame = None
        for fm in meta:
            if fm["timestamp"] >= 60:  # 至少1分钟后，正常游戏已开始
                roster_frame = fm["frame_path"]
                break
        if roster_frame:
            try:
                roster = await self.qwen.analyze_roster(roster_frame)
                radiant_heroes = roster.get("radiant", [])
                dire_heroes = roster.get("dire", [])
                lineup_analysis = roster.get("lineup_analysis", "")
                ctx["radiant_heroes"] = radiant_heroes
                ctx["dire_heroes"] = dire_heroes
                for h in (radiant_heroes + dire_heroes):
                    if h and h != "未知":
                        ctx["known_heroes"][h] = ctx["known_heroes"].get(h, 0) + 1
            except Exception:
                pass

        results = []
        batches = [meta[i:i + batch_size] for i in range(0, len(meta), batch_size)]
        for bi, batch in enumerate(batches):
            tasks = [self._one(fm, ctx) for fm in batch]
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
                    # 更新上下文
                    ctx["prev_analysis"] = r.model_dump()
                    ctx["prev_timestamp"] = r.timestamp
                    if r.key_event:
                        ctx["timeline"].append(r.model_dump())
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
        # ─── 一致性修正：合并矛盾英雄名 ───
        resolved_heroes = await self._resolve_heroes(ctx["known_heroes"])
        # 总结只传关键帧(评分1/5+带事件)，最多30帧
        si_key = [s for s in si if s["rating"] in (1, 5) or s.get("key_event")][:30]
        sm = await self.qwen.generate_summary(si_key or si[:20])

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
            radiant_heroes=resolved_heroes.get("radiant", radiant_heroes),
            dire_heroes=resolved_heroes.get("dire", dire_heroes),
            lineup_analysis=lineup_analysis,
        )

    async def _one(self, fm, ctx):
        """分析单帧，携带历史上下文"""
        # 构建历史上下文文本
        prev_json = ""
        if ctx["prev_analysis"]:
            prev = ctx["prev_analysis"]
            ts = prev.get("timestamp", 0)
            prev_json = (
                f"【上一帧({int(ts//60)}:{int(ts%60):02d})的分析结果】\n"
                f"关键事件: {prev.get('key_event', '无')}\n"
                f"评分: {prev.get('rating', 3)}\n"
                f"类型: {prev.get('type', '普通')}\n"
                f"团战: {prev.get('dimensions', {}).get('teamfight', '')[:80]}\n"
            )

        heroes_json = ""
        if ctx.get("radiant_heroes") or ctx.get("dire_heroes"):
            heroes_json = (
                f"【已识别的阵容】天辉: {ctx['radiant_heroes']}  夜魇: {ctx['dire_heroes']}\n"
                f"英雄名请严格保持一致。\n"
            )

        timeline_json = ""
        if ctx.get("timeline"):
            recent = ctx["timeline"][-3:]  # 最近3个事件
            timeline_json = "【最近关键事件】\n" + "\n".join(
                f"  +{int((e.get('timestamp',0) - ctx['prev_timestamp'])/60)}分: {e.get('key_event','')[:60]}"
                for e in recent
            ) + "\n"

        context_blob = prev_json + heroes_json + timeline_json
        if not context_blob.strip():
            context_blob = "这是第一帧，无历史上下文。"

        try:
            r = await asyncio.wait_for(
                self.qwen.analyze_frame(
                    fm["frame_path"], fm["prev_thumb"],
                    fm["next_thumb"], fm["timestamp"],
                    context_blob,
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

    async def _resolve_heroes(self, known_heroes: dict[str, int]) -> dict:
        """从帧分析中统计最可能的英雄列表"""
        if not known_heroes:
            return {"radiant": [], "dire": []}
        # 按出现次数排序，取 top 10
        sorted_heroes = sorted(known_heroes.items(), key=lambda x: -x[1])
        all_heroes = [h for h, _ in sorted_heroes[:10]]
        # 平分给天辉和夜魇
        mid = (len(all_heroes) + 1) // 2
        return {"radiant": all_heroes[:mid][:5], "dire": all_heroes[mid:][:5]}