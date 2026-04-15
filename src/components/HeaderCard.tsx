import type { WalletAnalysis } from "@/types";
import { formatUSD, formatETH, walletAge, shortenAddress } from "@/lib/utils";
import { Wallet, Clock, DollarSign, Hash } from "lucide-react";

interface HeaderCardProps {
  data: WalletAnalysis;
}

export function HeaderCard({ data }: HeaderCardProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <div className="flex items-start gap-4 mb-6">
        <div className="rounded-lg bg-primary/10 p-3">
          <Wallet className="h-6 w-6 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-semibold text-card-foreground">
            {data.ensName ?? "Ethereum Wallet"}
          </h2>
          <p className="font-mono text-sm text-muted-foreground break-all">
            {data.address}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatBlock
          icon={<Hash className="h-4 w-4" />}
          label="Address"
          value={data.ensName ?? shortenAddress(data.address)}
        />
        <StatBlock
          icon={<Clock className="h-4 w-4" />}
          label="Wallet Age"
          value={data.firstTxDate ? walletAge(data.firstTxDate) : "Unknown"}
        />
        <StatBlock
          icon={<DollarSign className="h-4 w-4" />}
          label="ETH Balance"
          value={formatETH(data.ethBalance)}
          subtitle={formatUSD(data.ethBalance * data.ethPriceUSD)}
        />
        <StatBlock
          icon={<DollarSign className="h-4 w-4" />}
          label="Total All Assets Value (USD)"
          value={formatUSD(data.totalUSDValue)}
        />
      </div>
    </div>
  );
}

function StatBlock({
  icon,
  label,
  value,
  subtitle,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  subtitle?: string;
}) {
  return (
    <div className="rounded-lg bg-secondary/50 p-3">
      <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
        {icon}
        <span className="text-xs font-medium uppercase tracking-wide">
          {label}
        </span>
      </div>
      <p className="text-sm font-semibold text-card-foreground truncate">
        {value}
      </p>
      {subtitle && (
        <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
      )}
    </div>
  );
}
