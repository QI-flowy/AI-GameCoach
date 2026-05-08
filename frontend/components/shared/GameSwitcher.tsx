"use client";

import { useState, useEffect } from "react";
import { useGame, type GameId } from "../../context/GameContext";

const GAMES: { id: GameId; name: string; icon: string }[] = [
  { id: "cs2", name: "CS2", icon: "🔫" },
  { id: "dota2", name: "DOTA 2", icon: "⚔️" },
];

export default function GameSwitcher() {
  const { selectedGame, setSelectedGame, hydrated } = useGame();
  const [menuOpen, setMenuOpen] = useState(false);
  const current = GAMES.find((g) => g.id === selectedGame) ?? GAMES[0];

  // 始终渲染相同尺寸的容器，避免布局抖动
  return (
    <div className="relative">
      <button
        onClick={() => setMenuOpen(!menuOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 transition-colors"
      >
        {/* 服务端 & hydration 前始终渲染 "🔫 CS2"，避免 hydration 不匹配 */}
        <span className="text-lg" suppressHydrationWarning>
          {hydrated ? current.icon : "🔫"}
        </span>
        <span className="text-sm font-medium text-zinc-200" suppressHydrationWarning>
          {hydrated ? current.name : "CS2"}
        </span>
        <svg
          className={`w-4 h-4 text-zinc-500 transition-transform ${menuOpen ? "rotate-180" : ""}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {menuOpen && (
        <div className="absolute right-0 top-full mt-1 w-48 bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl z-50 overflow-hidden">
          {GAMES.map((game) => (
            <button
              key={game.id}
              onClick={() => { setSelectedGame(game.id); setMenuOpen(false); }}
              className={`w-full flex items-center gap-2 px-3 py-2.5 text-sm transition-colors ${
                selectedGame === game.id
                  ? "bg-zinc-700 text-emerald-400"
                  : "text-zinc-300 hover:bg-zinc-700 hover:text-zinc-100"
              }`}
            >
              <span className="text-lg">{game.icon}</span>
              <span>{game.name}</span>
              {selectedGame === game.id && (
                <svg className="w-4 h-4 ml-auto text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
