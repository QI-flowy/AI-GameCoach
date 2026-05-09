"use client";
import { useState } from "react";
import { Pencil, Save, X } from "lucide-react";

interface Props {
  radiantHeroes: string[];
  direHeroes: string[];
  lineupAnalysis: string;
  onSave: (radiant: string[], dire: string[]) => void;
}

function HeroList({
  heroes,
  editing,
  onChange,
  side,
}: {
  heroes: string[];
  editing: boolean;
  onChange: (i: number, v: string) => void;
  side: "radiant" | "dire";
}) {
  if (heroes.length === 0 && !editing) {
    return <p className="text-xs text-zinc-600">点击编辑填写{side === "radiant" ? "天辉" : "夜魇"}英雄</p>;
  }
  if (!editing) {
    return (
      <ul className="space-y-0.5">
        {heroes.map((h, i) => (
          <li key={i} className="text-sm text-zinc-200">{h}</li>
        ))}
      </ul>
    );
  }
  // 编辑模式：至少显示5个输入框
  var items = heroes.length >= 5 ? heroes : [...heroes, ...Array(5 - heroes.length).fill("")];
  return (
    <ul className="space-y-1">
      {items.map((h, i) => (
        <li key={i}>
          <input
            className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-0.5 text-sm text-zinc-200"
            value={i < heroes.length ? heroes[i] : ""}
            placeholder={i < heroes.length ? "" : `英雄${i + 1}`}
            onChange={function (e) { onChange(i, e.target.value); }}
          />
        </li>
      ))}
    </ul>
  );
}

export default function LineupCard({ radiantHeroes, direHeroes, lineupAnalysis, onSave }: Props) {
  var [editing, setEditing] = useState(false);
  var [radiant, setRadiant] = useState(radiantHeroes);
  var [dire, setDire] = useState(direHeroes);
  // sync when prop changes
  if (!editing && (radiant !== radiantHeroes || dire !== direHeroes)) {
    setRadiant(radiantHeroes);
    setDire(direHeroes);
  }

  var handleSave = function () {
    onSave(radiant, dire);
    setEditing(false);
  };
  var handleCancel = function () {
    setRadiant(radiantHeroes);
    setDire(direHeroes);
    setEditing(false);
  };

  return (
    <div className="bg-zinc-900/50 rounded-lg border border-zinc-800 p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 text-xs text-zinc-400 font-medium">
          <span>⚔️ 天辉</span>
          <span className="text-zinc-600">vs</span>
          <span>☠️ 夜魇</span>
        </div>
        {!editing ? (
          <button
            onClick={function () { setEditing(true); }}
            className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300"
          >
            <Pencil className="h-3 w-3" /> 编辑阵容
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button onClick={handleSave} className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300">
              <Save className="h-3 w-3" /> 保存
            </button>
            <button onClick={handleCancel} className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300">
              <X className="h-3 w-3" /> 取消
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="border border-zinc-800/50 rounded p-2">
          <div className="flex items-center gap-1.5 mb-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
            <span className="text-xs text-zinc-400 font-medium">天辉</span>
          </div>
          <HeroList
            heroes={radiant}
            editing={editing}
            side="radiant"
            onChange={function (i, v) {
              var h = [...radiant]; h[i] = v; setRadiant(h);
            }}
          />
        </div>
        <div className="border border-zinc-800/50 rounded p-2">
          <div className="flex items-center gap-1.5 mb-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
            <span className="text-xs text-zinc-400 font-medium">夜魇</span>
          </div>
          <HeroList
            heroes={dire}
            editing={editing}
            side="dire"
            onChange={function (i, v) {
              var h = [...dire]; h[i] = v; setDire(h);
            }}
          />
        </div>
      </div>

      {lineupAnalysis && (
        <p className="text-xs text-zinc-500 mt-2 leading-relaxed">{lineupAnalysis}</p>
      )}
    </div>
  );
}