"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import type { AnalysisStatus, DotaAnalysisReport } from "@/lib/api-client";
import { startAnalysis, getAnalysisStatus, getAnalysisReport } from "@/lib/api-client";

export function useDotaAnalysis(initTid?: string) {
  var [tid, setTid] = useState<string | null>(initTid || null);
  var [status, setStatus] = useState<AnalysisStatus | null>(null);
  var [report, setReport] = useState<DotaAnalysisReport | null>(null);
  var [loading, setLoading] = useState(false);
  var [error, setError] = useState<string | null>(null);
  var polling = useRef<ReturnType<typeof setInterval> | null>(null);

  var start = useCallback(async function (file: File) {
    setLoading(true); setError(null); setReport(null);
    try {
      var { task_id } = await startAnalysis(file);
      setTid(task_id);
    } catch (e) {
      setError(String(e)); setLoading(false);
    }
  }, []);

  useEffect(function () {
    if (!tid) return;
    polling.current = setInterval(async function () {
      try {
        var s = await getAnalysisStatus(tid!);
        setStatus(s);
        if (s.status === "done") {
          if (polling.current) clearInterval(polling.current);
          var r = await getAnalysisReport(tid!);
          setReport(r); setLoading(false);
        } else if (s.status === "error") {
          if (polling.current) clearInterval(polling.current);
          setError(s.error || "分析失败"); setLoading(false);
        }
      } catch (e) {
        setError(String(e)); setLoading(false);
      }
    }, 2000);
    return function () {
      if (polling.current) clearInterval(polling.current);
    };
  }, [tid]);

  return { tid, status, report, loading, error, start, refreshReport: async function () {
    if (!tid) return;
    try { var r = await getAnalysisReport(tid); setReport(r); } catch {}
  } };
}
