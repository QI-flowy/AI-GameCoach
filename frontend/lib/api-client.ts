const B = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface AnalysisStatus {
  task_id: string; status: string; progress: number;
  frames_done: number; total_frames: number; error?: string;
}
export interface FrameAnalysis {
  index: number; timestamp: number; dimensions: Record<string, string>;
  key_event: string | null; rating: number; type?: string; error?: string;
}
export interface KeyClip {
  timestamp: number; label: string; analysis: string;
  frame_index: number; clip_type: "highlight" | "mistake"; dimension_tags: string[];
}
export interface DotaAnalysisReport {
  task_id: string; video_duration: number; total_frames: number;
  frames: FrameAnalysis[]; timeline: KeyClip[];
  summary: string; coach_advice: string[];
  radiant_heroes: string[]; dire_heroes: string[]; lineup_analysis: string;
  error?: string;
}

export async function startAnalysis(file: File) {
  var f = new FormData(); f.append("file", file); f.append("game", "dota2");
  var r = await fetch(B + "/api/analysis/start", { method: "POST", body: f });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}
export async function getAnalysisStatus(tid: string) {
  var r = await fetch(B + "/api/analysis/" + tid + "/status");
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}
export async function getAnalysisReport(tid: string) {
  var r = await fetch(B + "/api/analysis/" + tid + "/report");
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export async function updateHeroes(tid: string, radiant: string[], dire: string[]) {
  var r = await fetch(B + "/api/analysis/" + tid + "/heroes", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ radiant_heroes: radiant, dire_heroes: dire }),
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}
