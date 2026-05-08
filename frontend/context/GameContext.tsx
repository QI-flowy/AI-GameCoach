"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

export type GameId = "cs2" | "dota2";

export interface GameContextValue {
  selectedGame: GameId;
  setSelectedGame: (game: GameId) => void;
  /** hydration 完成后才为 true，避免 SSR 不匹配 */
  hydrated: boolean;
}

const GAME_STORAGE_KEY = "ai-coach-selected-game";

function getStoredGame(): GameId {
  try {
    const stored = localStorage.getItem(GAME_STORAGE_KEY);
    if (stored === "cs2" || stored === "dota2") return stored;
  } catch {}
  return "cs2";
}

function setStoredGame(game: GameId) {
  try {
    localStorage.setItem(GAME_STORAGE_KEY, game);
  } catch {}
}

const GameContext = createContext<GameContextValue>({
  selectedGame: "cs2",
  setSelectedGame: () => {},
  hydrated: false,
});

export function GameProvider({ children }: { children: ReactNode }) {
  // 始终从 "cs2" 开始，匹配服务端渲染
  const [selectedGame, setSelectedGame] = useState<GameId>("cs2");
  const [hydrated, setHydrated] = useState(false);

  // 客户端挂载后从 localStorage 恢复
  useEffect(() => {
    const stored = getStoredGame();
    if (stored !== "cs2") {
      setSelectedGame(stored);
    }
    setHydrated(true);
  }, []);

  const handleSetGame = (game: GameId) => {
    setSelectedGame(game);
    setStoredGame(game);
  };

  return (
    <GameContext.Provider value={{ selectedGame, setSelectedGame: handleSetGame, hydrated }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  return useContext(GameContext);
}
