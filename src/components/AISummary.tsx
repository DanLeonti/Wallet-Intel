import { FileText } from "lucide-react";

interface AISummaryProps {
  summary: string;
}

export function AISummary({ summary }: AISummaryProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <FileText className="h-5 w-5 text-primary" />
        <h3 className="text-base font-semibold text-card-foreground">
          Intelligence Summary
        </h3>
      </div>
      <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
        {summary}
      </p>
    </div>
  );
}
