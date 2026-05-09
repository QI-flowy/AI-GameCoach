 AI Game Coach 🎮🧠

> AI 驱动的 Dota 2 比赛录像智能复盘分析平台。
>
> 上传比赛视频 → **FFmpeg 每 15 秒截图** → **Qwen3.6-35B 多模态视觉分析** → 自动生成战术报告（6 维度评估 + 时间轴关键切片 + 教练建议 + 版本信息）。


<img width="2211" height="1947" alt="image" src="https://github.com/user-attachments/assets/9750dff6-6b1f-46d3-9e3c-132075378548" />
---

## ✨ 功能

- **上传录像**：拖入 MP4 视频，自动截取每 15 秒一帧
- **AI 分析**：Qwen 多模态模型逐帧识别英雄、装备、地图局势、团战
- **6 维度评估**：对线期 · 团战决策 · 装备路线 · 地图控制 · Roshan · 经济
- **时间轴切片**：自动标出高光 / 失误点，点击跳转到视频对应位置
- **教练总结**：全局复盘 + 可执行的改进建议
- **阵容编辑**：手动填写/修改天辉夜魇英雄
- **版本信息**：自动抓取 Dota 2 当前版本及热门英雄（7.41c）
- **报告持久化**：分析完成后保存至磁盘，后端重启后自动恢复

---

## 🚀 快速开始

### 前置依赖

| 工具 | 版本 | 说明 |
|------|------|------|
| Python | >= 3.12 | 后端服务，使用 `uv` 运行 |
| Node.js | >= 18 | 前端页面 |
| FFmpeg | 最新 | 视频截图（需在 PATH 或 D:\\ffmpeg-*\\bin\\） |
| Qwen 多模态模型 | -- | AI 分析引擎（OpenAI 兼容 API） |

### 数据目录

服务会在以下路径读写数据：

```
D:\dota-coach\
├── screenshots\       ← FFmpeg 截图输出
├── reports\           ← 分析报告持久化（JSON）
└── uploads\           ← 上传的视频文件
```

### 手动部署

**后端：**

```bash
cd backend
uv pip install -r requirements.txt
uv run python -m uvicorn api.main:app --host 0.0.0.0 --port 8000
```

**前端：**

```bash
cd frontend
npm install
npm run dev -- -p 3000
```

前端默认连接 `http://localhost:8000`，可通过 `NEXT_PUBLIC_API_URL` 环境变量修改。

### Qwen 模型服务

分析引擎需要一个 OpenAI 兼容的多模态 LLM API，运行在 `localhost:8080`，提供 `/v1/chat/completions` 接口。

推荐部署方式：

- **Herdsman**（`Qwen3.6-35B-A3B` / `Qwen2.5-VL:32B-Instruct` 等视觉模型）

默认 API key 为 `sk-test`，可在 `backend/llm/qwen_client.py` 中修改 `LLM_API_KEY`。

---

## 🏗 项目结构

```
dota2-ai-coach/
│
├── backend/                          # FastAPI 后端
│   ├── api/
│   │   └── main.py                   # API 路由入口（upload/status/report/heroes/meta）
│   ├── llm/
│   │   └── qwen_client.py            # Qwen 多模态 LLM 客户端
│   ├── models/
│   │   └── report.py                 # 分析报告数据模型
│   ├── pipeline/
│   │   ├── __init__.py
│   │   ├── analyzer.py               # 分析编排器（截图 → 分析 → 总结）
│   │   └── screenshotter.py          # FFmpeg 截图模块（15s 间隔）
│   └── services/
│       └── dota_meta.py              # 版本元数据服务（自动抓取当前版本/热门英雄）
│
├── frontend/                         # Next.js 14 前端
│   ├── app/
│   │   ├── layout.tsx                # 根布局
│   │   ├── page.tsx                  # 首页（上传页）
│   │   └── analysis/[id]/
│   │       └── page.tsx              # 分析报告页
│   ├── components/
│   │   ├── dashboard/
│   │   │   ├── AnalysisPanel.tsx      # 6 维度分析面板
│   │   │   ├── DotaMetaPanel.tsx      # 版本信息面板（7.41c 热门英雄/禁用）
│   │   │   ├── LineupCard.tsx         # 阵容卡片（支持编辑）
│   │   │   ├── MatchSummary.tsx       # 比赛总结
│   │   │   ├── SegmentCard.tsx        # 切片卡片
│   │   │   ├── TimelineSidebar.tsx    # 时间轴侧边栏
│   │   │   ├── TimelineTracks.tsx     # 时间轴轨道
│   │   │   └── VideoPlayer.tsx        # 视频播放器
│   │   ├── upload/
│   │   │   ├── DropZone.tsx
│   │   │   ├── UploadProgress.tsx
│   │   │   └── VideoDropZone.tsx
│   │   ├── report/
│   │   │   ├── ProblemMap.tsx
│   │   │   └── SummaryCards.tsx
│   │   └── shared/
│   │       ├── GameSwitcher.tsx
│   │       ├── PolarityBadge.tsx
│   │       └── SeverityIcon.tsx
│   ├── context/
│   │   └── GameContext.tsx            # 游戏上下文（Dota2 / CS2）
│   ├── hooks/
│   │   ├── useDotaAnalysis.ts         # 分析状态轮询 + 报告加载
│   │   ├── useAnalysisTask.ts
│   │   └── useUploadTask.ts
│   └── lib/
│       ├── api-client.ts              # API 调用的客户端封装
│       ├── types.ts
│       └── video-storage.ts
│
├── data/                             # 缓存数据
│   └── dota_meta_cache.json          # 版本元数据缓存
│
├── deploy.bat                        # Windows 一键部署
└── README.md
```

---

## 📊 分析维度

| 维度 | 说明 |
|------|------|
| **对线期** | 站位、补刀、换血、压制 |
| **团战决策** | 技能释放、切入时机、集火 |
| **装备路线** | 出装顺序、性价比、应对 |
| **地图控制** | 视野、推塔、野区入侵 |
| **Roshan** | 肉山时机、争夺 |
| **经济** | 补刀效率、击杀转化 |

---

## 🔌 API 端点

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/analysis/start` | 上传视频开始分析 |
| GET | `/api/analysis/{tid}/status` | 查询分析进度 |
| GET | `/api/analysis/{tid}/report` | 获取分析报告 |
| PUT | `/api/analysis/{tid}/heroes` | 编辑阵容英雄 |
| GET | `/api/dota2/meta` | 版本元数据 |
| GET | `/api/dota2/heroes` | 可选英雄列表 |

---

## 🛠 技术栈

- **后端**：Python + FastAPI + Uvicorn
- **前端**：Next.js 14 + React + TypeScript + Tailwind CSS
- **AI**：Qwen3.6-35B-A3B（多模态视觉语言模型）
- **视频处理**：FFmpeg（逐帧截图）
- **包管理**：后端 `uv`，前端 `npm`

---

## 📝 开源协议

MIT License

---

## 🤝 贡献

欢迎提交 Issue 和 PR！代码规范（随意，能跑就行）。
