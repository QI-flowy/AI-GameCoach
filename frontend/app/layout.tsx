import type { Metadata } from "next";
import "./globals.css";
import { GameProvider } from "../context/GameContext";
import GameSwitcher from "../components/shared/GameSwitcher";

export const metadata: Metadata = {
  title: "AI 电竞教练",
  description: "上传游戏录像，AI 智能分析你的对局表现",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body className="bg-zinc-950 text-zinc-100 min-h-screen">
        <GameProvider>
          <header className="border-b border-zinc-800 px-6 py-3">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold text-emerald-400">AI 电竞教练</span>
              </div>
              <GameSwitcher />
            </div>
          </header>
          <main className="max-w-7xl mx-auto px-4 py-6">{children}</main>
        </GameProvider>
      </body>
    </html>
  );
}
