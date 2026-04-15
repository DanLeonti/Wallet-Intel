import type { LLMVerdict } from "@/types";
import { cn } from "@/lib/utils";
import { Shield, AlertTriangle, CheckCircle } from "lucide-react";

interface VerdictCardProps {
  verdict: LLMVerdict;
}

const riskColors: Record<string, string> = {
  Low: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Medium: "bg-amber-50 text-amber-700 border-amber-200",
  High: "bg-red-50 text-red-700 border-red-200",
};

const riskIcons: Record<string, React.ReactNode> = {
  Low: <CheckCircle className="h-5 w-5 text-emerald-600" />,
  Medium: <AlertTriangle className="h-5 w-5 text-amber-600" />,
  High: <AlertTriangle className="h-5 w-5 text-red-600" />,
};

const classificationColors: Record<string, string> = {
  Exchange: "bg-blue-100 text-blue-800",
  Mixer: "bg-purple-100 text-purple-800",
  OTC: "bg-indigo-100 text-indigo-800",
  Personal: "bg-slate-100 text-slate-800",
  Unknown: "bg-gray-100 text-gray-800",
};

export function VerdictCard({ verdict }: VerdictCardProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Shield className="h-5 w-5 text-primary" />
        <h3 className="text-base font-semibold text-card-foreground">
          Risk Assessment
        </h3>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-medium",
            riskColors[verdict.riskLevel]
          )}
        >
          {riskIcons[verdict.riskLevel]}
          {verdict.riskLevel} Risk
        </span>
        <span
          className={cn(
            "inline-flex items-center rounded-full px-3 py-1 text-sm font-medium",
            classificationColors[verdict.classification]
          )}
        >
          {verdict.classification}
        </span>
      </div>

      <p className="text-sm text-muted-foreground leading-relaxed">
        {verdict.reasoning}
      </p>
    </div>
  );
}
