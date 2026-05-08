import { MatchReport, AnalysisTask, Segment, ProblemItem, SummaryStats } from "./types";

// ── CS2 Mock Data ─
export const mockMatchReport: MatchReport = {
  matchId: "mock-001",
  totalRounds: 24,
  duration: "45:12",
  segments: [
    {
      id: 1, tickStart: 15000, tickEnd: 45000, roundNumber: 1,
      type: "highlight", severity: "minor",
      label: "手枪局三杀清点",
      analysis: "你在 A Long 利用闪身 pick 拿下三杀，爆头率 100%。身位控制精准，配合队友闪光弹时机得当，手枪局 3v5 翻盘的关键 carry。",
      category: "枪法·对枪质量", polarity: "POSITIVE", subType: "对枪",
    },
    {
      id: 2, tickStart: 45001, tickEnd: 78000, roundNumber: 2,
      type: "mistake", severity: "critical",
      label: "残局 1v2 主动peek 被架死",
      analysis: "作为 CT 防守 A 包点，已知对方两人在 A Long，你选择主动拉出烟去找人对枪。正确做法是躲在烟雾后等对方拆包或者近点清点。",
      category: "决策·激进度", polarity: "NEGATIVE", subType: "身位",
    },
    {
      id: 3, tickStart: 78001, tickEnd: 105000, roundNumber: 3,
      type: "mistake", severity: "major",
      label: "eco 局强起冲锋白给",
      analysis: "全队 eco 局，你起沙鹰独自冲 A Long 被 AWP 架死。应该和队友一起打默认或者近点混烟，本次死亡导致 CT 白得一把 AK。",
      category: "决策·经济管理", polarity: "NEGATIVE", subType: "经济",
    },
    {
      id: 4, tickStart: 105001, tickEnd: 135000, roundNumber: 4,
      type: "highlight", severity: "major",
      label: "AWP 回防双杀拆包",
      analysis: "B 点被攻破后你从 CT 回防，利用 AWP 在中门架住过点连杀两人，成功拆包。站位选择和架枪时机都很好，体现了优秀的回防意识。",
      category: "身位·位置选择", polarity: "POSITIVE", subType: "对枪",
    },
    {
      id: 5, tickStart: 135001, tickEnd: 170000, roundNumber: 5,
      type: "mistake", severity: "minor",
      label: "信息判断失误导致被背身击杀",
      analysis: "队友报点 A Long 有人，你回头看 A 点时被从 B 摸过来的敌人背身击杀。应该贴墙架两边，这次死亡让 B 点完全失守。",
      category: "信息·意识判断", polarity: "NEGATIVE", subType: "信息",
    },
  ],
  summary: {
    totalHighlights: 2, totalMistakes: 3,
    topMistakeCategory: "决策·激进度",
    avgKdRatio: 1.2, totalKills: 18, totalDeaths: 15,
  },
  problemMap: [
    { category: "决策·激进度", positive: 1, negative: 1,
      summary: "整体激进程度较高，关键局需要更耐心。建议在 1vX 残局中优先选择保守架点而非主动拉出。" },
    { category: "决策·经济管理", positive: 0, negative: 1,
      summary: "经济管理有提升空间，eco 局需要更严格遵循战术纪律。" },
    { category: "信息·意识判断", positive: 0, negative: 1,
      summary: "信息处理能力需要加强，多利用队友报点和地图声音判断敌人位置。" },
    { category: "枪法·对枪质量", positive: 1, negative: 0,
      summary: "枪法基本功扎实，爆头率优秀。继续保持对枪节奏和预瞄习惯。" },
    { category: "身位·位置选择", positive: 1, negative: 0,
      summary: "回防站位选择得当，建议在更多场景中保持类似的防守位置意识。" },
  ],
  overallAdvice: "整体表现中上，枪法基本功扎实，但战术决策有明显短板。建议重点改进：\n1) 残局中减少主动peek，多利用掩体架枪\n2) eco 局严格遵循团队战术\n3) 提高对地图信息的利用效率。",
};

// ── DOTA 2 Mock Data ──
const dota2Segments: Segment[] = [
  {
    id: 1, tickStart: 120, tickEnd: 240, roundNumber: 1,
    type: "highlight", severity: "minor",
    label: "一级团完美切入",
    analysis: "你操作的影魔在一级团战中从阴影切入，精准释放三连压 + 影压，配合队友完成双杀。站位选择极佳，利用了对方辅助未插眼的视野盲区。",
    category: "战术·团战执行", polarity: "POSITIVE", subType: "团战",
  },
  {
    id: 2, tickStart: 241, tickEnd: 380, roundNumber: 2,
    type: "mistake", severity: "critical",
    label: "盲目追人导致被反杀",
    analysis: "对方残血 TP 回家，你选择越过河道追人，结果被对方支援赶到的双英雄反杀。应该见好就收，这次死亡浪费了 1 分多钟的发育时间。",
    category: "决策·时机把握", polarity: "NEGATIVE", subType: "时机",
  },
  {
    id: 3, tickStart: 381, tickEnd: 520, roundNumber: 3,
    type: "highlight", severity: "major",
    label: "肉山团战三杀带盾",
    analysis: "肉山争夺战中你利用跳刀切入后排，黑皇杖开启后完成三杀，拿下 A 盾。技能释放顺序正确，体现了优秀的团战意识。",
    category: "战术·团战执行", polarity: "POSITIVE", subType: "团战",
  },
  {
    id: 4, tickStart: 521, tickEnd: 680, roundNumber: 4,
    type: "mistake", severity: "major",
    label: "带线过深被先手秒",
    analysis: "带线推到对方高地塔下，没有插眼观察对方 TP 位置，被对方大哥+辅助包夹秒杀。应该在二塔附近做视野再深入，这次死亡直接导致中路高地被破。",
    category: "信息·视野控制", polarity: "NEGATIVE", subType: "视野",
  },
  {
    id: 5, tickStart: 681, tickEnd: 800, roundNumber: 5,
    type: "highlight", severity: "minor",
    label: "精准抢盾 + 反打胜利",
    analysis: "肉山血量见底时你用精准技能抢下 A 盾，随后反手击杀对方核心英雄。抢盾时机和技能选择都非常出色。",
    category: "操作·技能释放", polarity: "POSITIVE", subType: "操作",
  },
];

const dota2ProblemMap: ProblemItem[] = [
  { category: "战术·团战执行", positive: 2, negative: 0,
    summary: "团战执行力优秀，切入时机和技能释放顺序都很到位。继续保持这种团战意识。" },
  { category: "决策·时机把握", positive: 0, negative: 1,
    summary: "追击决策需要改进，学会判断追人的风险收益比，避免盲目深入。" },
  { category: "信息·视野控制", positive: 0, negative: 1,
    summary: "带线时需要更重视视野控制，深入前务必确认安全路线和对方 TP 位置。" },
  { category: "操作·技能释放", positive: 1, negative: 0,
    summary: "技能释放精准度高，抢盾等高难度操作表现出色。" },
];

export const mockDota2Report: MatchReport = {
  matchId: "mock-dota-001",
  totalRounds: 28,
  duration: "52:34",
  segments: dota2Segments,
  summary: {
    totalHighlights: 3, totalMistakes: 2,
    topMistakeCategory: "决策·时机把握",
    avgKdRatio: 1.5, totalKills: 24, totalDeaths: 16,
  },
  problemMap: dota2ProblemMap,
  overallAdvice: "整体表现优秀，团战执行和技能释放是亮点。需要改进的方面：\n1) 学会判断追人的风险，避免盲目深入\n2) 带线时加强视野控制，注意插眼\n3) 继续保持优秀的团战意识，这是你的核心竞争力。",
};

export const mockTask: AnalysisTask = {
  id: "mock-001",
  demoFileName: "mirage_rankA.dem",
  status: "done",
  progress: 100,
  game: "cs2",
  createdAt: new Date().toISOString(),
  result: mockMatchReport,
};

export const mockDota2Task: AnalysisTask = {
  id: "mock-dota-001",
  demoFileName: "match_12345.dem",
  status: "done",
  progress: 100,
  game: "dota2",
  createdAt: new Date().toISOString(),
  result: mockDota2Report,
};

// ── 按游戏获取 Mock 数据 ──
export function getMockReport(game: "cs2" | "dota2"): MatchReport {
  return game === "cs2" ? mockMatchReport : mockDota2Report;
}

export function getMockTask(game: "cs2" | "dota2"): AnalysisTask {
  return game === "cs2" ? mockTask : mockDota2Task;
}
