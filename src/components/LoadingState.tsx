import { Loader2 } from "lucide-react";

interface LoadingStateProps {
  step: string;
}

export function LoadingState({ step }: LoadingStateProps) {
  return (
    <div className="w-full max-w-3xl mx-auto space-y-4 mt-8">
      <div className="flex items-center justify-center gap-3 py-8">
        <Loader2 className="h-6 w-6 text-primary animate-spin" />
        <span className="text-sm font-medium text-muted-foreground">
          {step}
        </span>
      </div>

      {/* Skeleton cards */}
      <div className="space-y-4 animate-pulse">
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="h-5 w-40 bg-muted rounded mb-4" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="rounded-lg bg-secondary/50 p-3">
                <div className="h-3 w-16 bg-muted rounded mb-2" />
                <div className="h-4 w-24 bg-muted rounded" />
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <div className="h-5 w-32 bg-muted rounded mb-4" />
            <div className="h-3 w-full bg-muted rounded mb-2" />
            <div className="h-3 w-3/4 bg-muted rounded" />
          </div>
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm h-20" />
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="h-5 w-40 bg-muted rounded mb-4" />
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-8 bg-muted rounded" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
