import { useEffect, useState } from "react";
import { TrendingUp, TrendingDown, BarChart3, DollarSign, Activity } from "lucide-react";
import { formatUSD } from "@/lib/utils";

interface EthStats {
  price: number | null;
  change24h: number | null;
  marketCap: number | null;
  volume24h: number | null;
}

function formatCompact(value: number): string {
  if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
  if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(1)}M`;
  return formatUSD(value);
}

export function EthStatsBar() {
  const [stats, setStats] = useState<EthStats | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/prices?type=ethStats");
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) setStats(data);
      } catch {
        // silently fail -- stats bar is non-critical
      }
    }
    load();
    const interval = setInterval(load, 60_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  if (!stats || stats.price == null) return null;

  const isUp = (stats.change24h ?? 0) >= 0;

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="flex items-center justify-center gap-6 rounded-lg border border-border bg-card/60 px-4 py-2.5 text-xs">
        <div className="flex items-center gap-1.5">
          <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-muted-foreground">ETH</span>
          <span className="font-semibold text-card-foreground">
            {formatUSD(stats.price)}
          </span>
        </div>

        <div className="flex items-center gap-1">
          {isUp ? (
            <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
          ) : (
            <TrendingDown className="h-3.5 w-3.5 text-red-500" />
          )}
          <span
            className={`font-medium ${isUp ? "text-emerald-600" : "text-red-500"}`}
          >
            {stats.change24h != null
              ? `${isUp ? "+" : ""}${stats.change24h.toFixed(2)}%`
              : "—"}
          </span>
          <span className="text-muted-foreground">24h</span>
        </div>

        {stats.marketCap != null && (
          <div className="hidden sm:flex items-center gap-1.5">
            <BarChart3 className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-muted-foreground">MCap</span>
            <span className="font-medium text-card-foreground">
              {formatCompact(stats.marketCap)}
            </span>
          </div>
        )}

        {stats.volume24h != null && (
          <div className="hidden md:flex items-center gap-1.5">
            <Activity className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-muted-foreground">Vol</span>
            <span className="font-medium text-card-foreground">
              {formatCompact(stats.volume24h)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
