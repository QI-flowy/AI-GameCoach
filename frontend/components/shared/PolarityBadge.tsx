import type { Polarity } from "@/lib/types";

interface Props { polarity: Polarity; }
const config: Record<Polarity, { label: string; cn: string }> = {
  POSITIVE: { label: "高光", cn: "bg-positive-bg text-positive border-positive/30" },
  NEGATIVE: { label: "失误", cn: "bg-negative-bg text-negative border-negative/30" },
};

export default function PolarityBadge({ polarity }: Props) {
  const c = config[polarity];
  return <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${c.cn}`}>{c.label}</span>;
}
