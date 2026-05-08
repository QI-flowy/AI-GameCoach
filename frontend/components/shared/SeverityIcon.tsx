import type { Severity } from "@/lib/types";
import { AlertCircle, AlertTriangle, Info } from "lucide-react";

interface Props { severity: Severity; }
const map: Record<Severity, { icon: React.ReactNode; color: string }> = {
  critical: { icon: <AlertCircle className="h-4 w-4" />, color: "text-red-400" },
  major: { icon: <AlertTriangle className="h-4 w-4" />, color: "text-orange-400" },
  minor: { icon: <Info className="h-4 w-4" />, color: "text-yellow-400" },
};

export default function SeverityIcon({ severity }: Props) {
  const m = map[severity]; return <span className={m.color}>{m.icon}</span>;
}
