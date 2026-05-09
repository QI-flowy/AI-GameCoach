Dota 2 AI Coach 🎮🧠

AI 驱动的 Dota 2 比赛录像智能复盘分析平台。

上传比赛视频 → FFmpeg 逐帧截图 → Qwen3.6-35B 多模态视觉分析 → 自动生成战术报告（6维度 + 时间轴关键切片 + 教练建议）。


<img width="2211" height="1947" alt="image" src="https://github.com/user-attachments/assets/9750dff6-6b1f-46d3-9e3c-132075378548" />


---

## ✨ 功能

- **上传录像**：拖入 MP4/WebM 视频，自动截取每 30 秒一帧
- **AI 分析**：Qwen3.6-35B 多模态模型逐帧识别英雄、装备、地图局势
- **6 维度评估**：对线期｜团战决策｜装备路线｜地图控制｜Roshan｜经济
- **时间轴切片**：自动标出高光/失误点，点击跳转到视频对应位置
- **教练总结**：全局复盘 + 3-5 条可执行的改进建议

---

## 🚀 快速开始

### 前置依赖

| 工具 | 版本 | 说明 |
|------|------|------|
| Python | >= 3.12 | 后端服务 |
| Node.js | >= 18 | 前端页面 |
| FFmpeg | 最新 | 视频截图 |
| Qwen 模型 | 多模态 | AI 分析引擎 |

### 方式一：一键部署 (Windows)

```bash
git clone https://github.com/你的用户名/dota2-ai-coach.git
cd dota2-ai-coach
deploy.bat
```

会自动检测依赖、安装包、启动服务。

### 方式二：手动部署

**后端：**

```bash
cd backend
python -m venv .venv
.venv\Scripts\pip install -r requirements.txt
.venv\Scripts\uvicorn api.main:app --host 0.0.0.0 --port 8000 --reload
```

**前端：**

```bash
cd frontend
npm install
npm run dev -- -p 3000
```

### Qwen 模型服务

分析引擎需要一个 OpenAI 兼容的多模态 LLM API。推荐部署方式：

- **Herdsman**：`Qwen3.6-35B-A3B` 或 `Qwen2.5-VL:32B-Instruct` 等视觉模型
- 需运行在 `localhost:8080`，提供 `/v1/chat/completions` 接口
- 配置在 `backend/llm/qwen_client.py` 中

---

## 🏗 项目结构

```
dota2-ai-coach/
├── backend/                  # FastAPI 后端
│   ├── api/
│   │   └── main.py           # API 路由入口
│   ├── llm/
│   │   └── qwen_client.py    # Qwen 多模态 LLM 客户端
│   ├── models/
│   │   └── report.py         # 分析报告数据模型
│   ├── pipeline/
│   │   ├── analyzer.py       # 分析编排器（截图→分析→总结）
│   │   └── screenshotter.py  # FFmpeg 截图模块
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/                 # Next.js 前端
│   ├── app/
│   ├── components/
│   ├── hooks/
│   └── package.json
├── deploy.bat                # Windows 一键部署
├── .gitignore
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

## 🛣 技术栈

- **后端**：Python + FastAPI + Uvicorn
- **前端**：Next.js 14 + React + TypeScript + Tailwind CSS
- **AI**：Qwen3.6-35B-A3B（多模态视觉语言模型）
- **视频处理**：FFmpeg（逐帧截图 + 缩略图）

---

## 📝 开源协议

MIT License

---

## 🤝 贡献

欢迎提交 Issue 和 PR！代码规范（随意，能跑就行）。
