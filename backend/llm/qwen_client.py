"""qwen3.5-35b 多模态 LLM 客户端"""
import base64, json, httpx
from pathlib import Path

QWEN_BASE = "http://localhost:8080/v1"
MODEL = "Qwen3.6-35B-A3B"  # 多模态模型，从 /v1/models 自动检测

SYS = """你是 Dota 2 顶级职业教练。分析比赛录像截图中可见的信息。
按6维度分析（各1-2句）：laning, teamfight, items, map_control, roshan, economy。
同时输出 key_event(null或描述), rating(1-5), type("highlight"/"mistake"/null)。
只输出JSON: {"dimensions":{...},"key_event":"..."|null,"rating":3,"type":"..."|null}"""

SUMMARY_SYS = """基于逐帧分析JSON数组做全局复盘。
输出: {"summary":"200字总结","coach_advice":["建议1",...]}"""

ROSTER_SYS = """你是 Dota 2 解说员。根据截图识别天辉(Radiant)和夜魇(Dire)双方的英雄。
只输出JSON: {"radiant":["英雄1","英雄2","英雄3","英雄4","英雄5"],"dire":["英雄1","英雄2","英雄3","英雄4","英雄5"],"lineup_analysis":"双方阵容风格简评"}"""

def _b64(path):
    ext = Path(path).suffix[1:]
    ext = {"jpg": "jpeg"}.get(ext, ext)
    with open(path, "rb") as f:
        return f"data:image/{ext};base64,{base64.b64encode(f.read()).decode()}"

class QwenClient:
    def __init__(self, base=QWEN_BASE, model=MODEL):
        self.base, self.model = base.rstrip("/"), model

    async def analyze_frame(self, frame, prev, nxt, ts):
        content = [{"type": "image_url", "image_url": {"url": _b64(frame)}}]
        m, s = int(ts // 60), int(ts % 60)
        content.append({"type": "text", "text": f"时间戳: {m}:{s:02d} ({ts}s)\n按6维度输出JSON。"})
        return await self._call(
            [{"role": "system", "content": SYS}, {"role": "user", "content": content}],
            800, 0.3,
        )

    async def analyze_roster(self, frame_path):
        """识别双方阵容"""
        content = [{"type": "image_url", "image_url": {"url": _b64(frame_path)}}]
        content.append({"type": "text", "text": "识别这场Dota 2比赛的天辉夜魇英雄。"})
        return await self._call(
            [{"role": "system", "content": ROSTER_SYS}, {"role": "user", "content": content}],
            600, 0.3,
        )

    async def generate_summary(self, results):
        prompt = "基于逐帧分析JSON数组做全局复盘。\n输出: {\"summary\":\"200字总结\",\"coach_advice\":[\"建议1\",...]}\n\n以下是要分析的数据：\n" + json.dumps(results, ensure_ascii=False)
        return await self._call(
            [{"role": "user", "content": prompt}], 600, 0.5,
        )

    async def _call(self, msgs, max_tok, temp):
        async with httpx.AsyncClient(timeout=180) as c:
            r = await c.post(
                f"{self.base}/chat/completions",
                json={
                    "model": self.model,
                    "messages": msgs,
                    "temperature": temp,
                    "max_tokens": max_tok,
                },
            )
            r.raise_for_status()
            txt = r.json()["choices"][0]["message"]["content"].strip()
        try:
            if txt.startswith("```"):
                txt = "\n".join(txt.split("\n")[1:-1])
            return json.loads(txt)
        except Exception:
            return {
                "dimensions": {
                    d: txt[:80] for d in
                    ["laning", "teamfight", "items", "map_control", "roshan", "economy"]
                },
                "key_event": None,
                "rating": 3,
            }
