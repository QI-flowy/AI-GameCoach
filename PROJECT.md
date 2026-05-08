# CS2 AI 教练 - 完整项目架构

## 技术栈

| 层 | 技术 | 说明 |
|---|---|---|
| **前端** | Next.js 14 + Tailwind CSS | 3 页 Mock UI + 视频播放器占位 |
| **后端** | FastAPI (Python 3.12) | REST API + 异步任务管线 |
| **AI** | Doubao-seed (火山引擎) | 回合决策推理 + 中文建议生成 |
| **视频** | FFmpeg | tick→时间映射，自动切片高光片段 |

## 核心模块

```
cs2-ai-coach/
├── frontend/          # Next.js 前端（已完成）
│   ├── app/           # 3 页面：上传 / 看板 / 报告
│   ├── components/    # DropZone, TimelineTracks, VideoPlayer, etc.
│   ├── hooks/         # useUploadTask (支持 Mock + 真实 API 切换)
│   └── lib/           # types.ts, mock-data.ts
│
├── backend/           # FastAPI 后端（已完成）
│   ├── api/main.py    # 5 个 REST 接口 + 任务管理
│   ├── pipeline/      # 解析器 → 分段器 → AI 分析器
│   ├── llm/doubao.py  # 豆包 API 封装
│   ├── video/clipper.py # FFmpeg 视频切片器
│   ├── models/report.py # Pydantic 数据模型
│   └── pyproject.toml   # uv 依赖管理
│
└── uploads/ clips/    # 文件存储目录
```

## API 接口

| 方法 | 路径 | 功能 |
|---|---|---|
| POST | `/api/upload` | 上传 .dem，后台启动解析+AI 分析 |
| GET | `/api/tasks/{id}` | 轮询任务进度 |
| POST | `/api/tasks/{id}/clips` | 触发视频切片 |
| GET | `/api/tasks/{id}/clips` | 查询切片状态 |

## 数据流

```
用户上传 .dem → 保存 uploads/ → 解析器提取回合事件
    ↓
按回合分段 → 构建 Prompt → 调用 Doubao-seed
    ↓
AI 返回 JSON → 转换为 Segment/Report → 存入内存
    ↓
前端轮询 → 渲染时间轴 + 片段详情 + 问题图谱
    ↓
用户选择高光片段 → 触发视频切片 → FFmpeg 截取 MP4
```

## 视频切片原理

```python
# tick → 视频时间映射
tickrate = 128  # CS2 默认 tickrate
video_start = tick_start / tickrate - 5  # 前 5 秒缓冲
video_end = tick_end / tickrate + 5      # 后 5 秒缓冲

# FFmpeg 命令
ffmpeg -ss {start} -t {duration} -i source.mp4 -c:v libx264 clip.mp4
```

## 启动方式

```bash
# 前端（Mock 模式）
cd frontend && npm run dev

# 后端（配置 API Key 后）
cd backend && uv sync
export DOUBAO_API_KEY=your_key
uv run uvicorn api.main:app --reload --port 8000

# 前端切换为真实 API
NEXT_PUBLIC_API_URL=http://localhost:8000 npm run dev
```
