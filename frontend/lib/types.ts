export type GameId = "cs2" | "dota2";
export type TaskStatus = "uploading" | "parsing" | "analyzing" | "done" | "error";
export type Polarity = "POSITIVE" | "NEGATIVE";
export type Severity = "critical" | "major" | "minor";
export type SegmentType = "highlight" | "mistake" | "normal";

export interface AnalysisTask {
  id: string; demoFileName: string; status: TaskStatus;
  progress: number; game: GameId; createdAt: string; result?: MatchReport;
}

export interface Segment {
  id: number; tickStart: number; tickEnd: number; roundNumber: number;
  type: SegmentType; severity: Severity; label: string; analysis: string;
  category: string; polarity: Polarity; subType?: string;
}

export interface ProblemItem {
  category: string; positive: number; negative: number; summary: string;
}

export interface SummaryStats {
  totalHighlights: number; totalMistakes: number; topMistakeCategory: string;
  avgKdRatio: number; totalKills: number; totalDeaths: number;
}

export interface MatchReport {
  matchId: string; totalRounds: number; duration: string;
  segments: Segment[]; summary: SummaryStats; problemMap: ProblemItem[];
  overallAdvice: string;
}
