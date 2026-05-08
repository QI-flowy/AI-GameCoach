@echo off
chcp 65001 >nul
title Dota 2 AI Coach - 安装 & 启动

set ROOT=%~dp0
set BACKEND=%ROOT%backend
set FRONTEND=%ROOT%frontend

echo ╔══════════════════════════════════════╗
echo ║    Dota 2 AI Coach - 一键部署       ║
echo ╚══════════════════════════════════════╝
echo.

:: ─── 1. 检测 Python ───
echo [1/5] 检测 Python...
where python >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ 未找到 Python，请安装 Python 3.12+
    pause
    exit /b 1
)
python --version

:: ─── 2. 检测 Node.js ───
echo [2/5] 检测 Node.js...
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ 未找到 Node.js，请安装 Node.js 18+
    pause
    exit /b 1
)
node --version

:: ─── 3. 检测 FFmpeg ───
echo [3/5] 检测 FFmpeg...
where ffmpeg >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠ FFmpeg 未在 PATH 中找到
    if exist C:\ffmpeg\bin\ffmpeg.exe (
        echo ✅ 使用 C:\ffmpeg\bin\ffmpeg.exe
    ) else (
        echo.
        echo 正在自动下载 FFmpeg...
        echo 如果下载失败，请手动下载并添加到 PATH
        echo 下载地址: https://ffmpeg.org/download.html
        echo.
        echo 下载链接: https://www.gyan.dev/ffmpeg/builds/ffmpeg-release-essentials.zip
        echo.
        echo 下载完成后:
        echo   1. 解压到 C:\ffmpeg\
        echo   2. 将 C:\ffmpeg\bin 添加到系统 PATH
        echo.
        echo 现在是否打开下载页面? (Y/N)
        set /p OPEN_DL=
        if /i "%OPEN_DL%"=="Y" (
            start "" "https://www.gyan.dev/ffmpeg/builds/ffmpeg-release-essentials.zip"
        )
    )
) else (
    echo ✅ FFmpeg 可用
)

:: ─── 4. 安装后端依赖 ───
echo [4/5] 安装后端依赖...
cd /d "%BACKEND%"

:: 检查是否已有虚拟环境
if exist .venv\Scripts\python.exe (
    echo ✅ 虚拟环境已存在
) else (
    echo 📦 创建虚拟环境...
    python -m venv .venv
)
.venv\Scripts\python.exe -m pip install -r requirements.txt --quiet
echo ✅ 后端依赖安装完成

:: ─── 5. 安装前端依赖 ───
echo [5/5] 安装前端依赖...
cd /d "%FRONTEND%"
if exist node_modules (
    echo ✅ node_modules 已存在
) else (
    call npm install --silent
)
echo ✅ 前端依赖安装完成

:: ─── 创建运行目录 ───
mkdir "%BACKEND%\uploads" 2>nul
mkdir "%BACKEND%\data\screenshots" 2>nul

:: ─── 启动服务 ───
echo.
echo ╔══════════════════════════════════════╗
echo ║          启动服务                    ║
echo ╚══════════════════════════════════════╝
echo.
echo 📌 启动后端 (port 8000)...
cd /d "%BACKEND%"
start "DotaCoach-Backend" .venv\Scripts\python.exe -m uvicorn api.main:app --host 0.0.0.0 --port 8000 --reload

echo 📌 启动前端 (port 3000)...
cd /d "%FRONTEND%"
start "DotaCoach-Frontend" node_modules\.bin\next.cmd dev -p 3000

echo.
echo ✅ 部署完成！
echo.
echo ┌────────────────────────────────────────┐
echo │  🌐 前端页面: http://localhost:3000    │
echo │  🔧 后端 API:  http://localhost:8000   │
echo │  🏥 健康检查:  http://localhost:8000/health │
echo │                                        │
echo │  ⚠ 需要 Qwen 模型服务在 8080 端口运行  │
echo └────────────────────────────────────────┘
echo.
echo 关闭此窗口不会停止服务。
echo 需要停止时请关闭两个命令行窗口。
echo.
pause
