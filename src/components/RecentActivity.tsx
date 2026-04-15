import type { AssetTransfer } from "@/types";
import { shortenAddress, formatUSD, timeAgo } from "@/lib/utils";
import {
  Activity,
  ArrowDownLeft,
  ArrowUpRight,
  ExternalLink,
} from "lucide-react";

interface RecentActivityProps {
  transactions: AssetTransfer[];
  walletAddress: string;
}

export function RecentActivity({
  transactions,
  walletAddress,
}: RecentActivityProps) {
  if (transactions.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="h-5 w-5 text-primary" />
          <h3 className="text-base font-semibold text-card-foreground">
            Recent Activity
          </h3>
        </div>
        <p className="text-sm text-muted-foreground">
          No recent transactions found.
        </p>
      </div>
    );
  }

  const addr = walletAddress.toLowerCase();

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Activity className="h-5 w-5 text-primary" />
        <h3 className="text-base font-semibold text-card-foreground">
          Recent Activity
        </h3>
        <span className="text-xs text-muted-foreground ml-auto">
          Last {transactions.length} transactions
        </span>
      </div>

      <div className="space-y-2">
        {transactions.map((tx, i) => {
          const isInbound = tx.to === addr;
          const counterparty = isInbound ? tx.from : tx.to;
          const date = new Date(tx.blockTimestamp);

          return (
            <div
              key={`${tx.hash}-${i}`}
              className="flex items-center gap-3 rounded-lg p-3 hover:bg-muted/50 transition-colors"
            >
              <div
                className={`rounded-full p-2 ${
                  isInbound ? "bg-emerald-50" : "bg-red-50"
                }`}
              >
                {isInbound ? (
                  <ArrowDownLeft className="h-4 w-4 text-emerald-600" />
                ) : (
                  <ArrowUpRight className="h-4 w-4 text-red-500" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">
                    {isInbound ? "Received" : "Sent"}{" "}
                    {tx.value > 0
                      ? `${tx.value.toFixed(4)} ${tx.asset}`
                      : tx.asset}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {tx.category}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground font-mono">
                  {isInbound ? "From" : "To"}: {shortenAddress(counterparty)}
                </p>
              </div>

              <div className="text-right shrink-0">
                {tx.usdValue != null && tx.usdValue > 0 && (
                  <p className="text-sm font-medium">{formatUSD(tx.usdValue)}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  {timeAgo(date)}
                </p>
              </div>

              <a
                href={`https://etherscan.io/tx/${tx.hash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          );
        })}
      </div>
    </div>
  );
}
