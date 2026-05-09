"use client";
import { useEffect, useState, useCallback } from "react";
import { RefreshCw, ExternalLink, TrendingUp, ShieldBan } from "lucide-react";

interface HeroStat {
  name: string;
  localized_name: string;
  win_rate: number;
  pick_rate: number;
}

interface BanStat {
  name: string;
  ban_rate: number;
}

interface DotaMeta {
  version: string;
  patch_notes_url: string;
  popular_heroes: HeroStat[];
  top_bans: BanStat[];
}

export default function DotaMetaPanel() {
  var [meta, setMeta] = useState<DotaMeta | null>(null);
  var [loading, setLoading] = useState(true);
  var [refreshing, setRefreshing] = useState(false);
  var [error, setError] = useState<string | null>(null);

  var fetchMeta = useCallback(async function (forceRefresh = false) {
    try {
      if (forceRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);
      var res = await fetch(
        "http://localhost:8000/api/dota2/meta" +
          (forceRefresh ? "?refresh=true" : "")
      );
      if (!res.ok) throw new Error("HTTP " + res.status);
      var data = await res.json();
      setMeta(data);
    } catch (e) {
      setError("获取版本信息失败");
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(function () {
    fetchMeta();
  }, [fetchMeta]);

  if (loading) {
    return (
      <div className="bg-zinc-900/50 rounded-lg border border-zinc-800 p-3">
        <p className="text-xs text-zinc-500">加载版本信息...</p>
      </div>
    );
  }

  if (error || !meta) {
    return (
      <div className="bg-zinc-900/50 rounded-lg border border-zinc-800 p-3">
        <p className="text-xs text-zinc-500">{error || "暂无版本信息"}</p>
        <button
          onClick={function () { fetchMeta(true); }}
          className="text-xs text-emerald-400 hover:text-emerald-300 mt-1"
        >
          重试
        </button>
      </div>
    );
  }

  return (
    <div className="bg-zinc-900/50 rounded-lg border border-zinc-800 overflow-hidden">
      {/* 版本头部 */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-400">🎮 Dota 2</span>
          <span className="text-sm font-bold text-emerald-300">{meta.version}</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={function () { window.open("https://www.dota2.com/patches/", "_blank"); }}
            className="text-xs text-zinc-500 hover:text-zinc-300 flex items-center gap-1"
          >
            补丁说明 <ExternalLink className="h-3 w-3" />
          </button>
          <button
            onClick={function () { fetchMeta(true); }}
            className="ml-2 p-1 rounded hover:bg-zinc-800 transition-colors"
            title="刷新版本信息"
          >
            <RefreshCw className={"h-3 w-3 text-zinc-500" + (refreshing ? " animate-spin" : "")} />
          </button>
        </div>
      </div>

      {/* 热门英雄 */}
      <div className="px-3 py-2 border-b border-zinc-800">
        <p className="text-xs text-zinc-400 font-medium mb-1.5 flex items-center gap-1">
          <TrendingUp className="h-3 w-3" /> 热门英雄（胜率）
        </p>
        <div className="space-y-1">
          {meta.popular_heroes.slice(0, 5).map(function (h, i) {
            var wrColor =
              h.win_rate >= 55
                ? "text-emerald-400"
                : h.win_rate >= 50
                  ? "text-yellow-400"
                  : "text-red-400";
            return (
              <div key={i} className="flex items-center justify-between text-xs">
                <span className="text-zinc-300">{h.localized_name || h.name}</span>
                <div className="flex items-center gap-2">
                  <span className="text-zinc-500">选用 {h.pick_rate}%</span>
                  <span className={wrColor + " font-medium tabular-nums w-12 text-right"}>
                    {h.win_rate}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 热门禁用 */}
      {meta.top_bans && meta.top_bans.length > 0 && (
        <div className="px-3 py-2">
          <p className="text-xs text-zinc-400 font-medium mb-1.5 flex items-center gap-1">
            <ShieldBan className="h-3 w-3" /> 热门禁用
          </p>
          <div className="flex flex-wrap gap-1.5">
            {meta.top_bans.map(function (b, i) {
              return (
                <span
                  key={i}
                  className="text-xs px-2 py-0.5 bg-red-900/30 text-red-300 rounded-full border border-red-900/50"
                >
                  {b.name} {b.ban_rate}%
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}