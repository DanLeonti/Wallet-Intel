import type { Counterparty } from "@/types";
import { shortenAddress, formatUSD } from "@/lib/utils";
import { Users, ArrowDownLeft, ArrowUpRight, ArrowLeftRight } from "lucide-react";

interface CounterpartiesTableProps {
  counterparties: Counterparty[];
}

const directionIcons: Record<string, React.ReactNode> = {
  inbound: <ArrowDownLeft className="h-3.5 w-3.5 text-emerald-600" />,
  outbound: <ArrowUpRight className="h-3.5 w-3.5 text-red-500" />,
  both: <ArrowLeftRight className="h-3.5 w-3.5 text-blue-600" />,
};

const directionLabels: Record<string, string> = {
  inbound: "In",
  outbound: "Out",
  both: "Both",
};

export function CounterpartiesTable({
  counterparties,
}: CounterpartiesTableProps) {
  if (counterparties.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Users className="h-5 w-5 text-primary" />
          <h3 className="text-base font-semibold text-card-foreground">
            Top Counterparties
          </h3>
        </div>
        <p className="text-sm text-muted-foreground">
          No counterparty data available.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Users className="h-5 w-5 text-primary" />
        <h3 className="text-base font-semibold text-card-foreground">
          Top Counterparties
        </h3>
        <span className="text-xs text-muted-foreground ml-auto">
          Top {counterparties.length} by volume
        </span>
      </div>

      <div className="overflow-x-auto -mx-6">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="px-6 py-2.5 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Address
              </th>
              <th className="px-6 py-2.5 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Label
              </th>
              <th className="px-6 py-2.5 text-xs font-medium text-muted-foreground uppercase tracking-wide text-right">
                Volume (USD)
              </th>
              <th className="px-6 py-2.5 text-xs font-medium text-muted-foreground uppercase tracking-wide text-right">
                Txns
              </th>
              <th className="px-6 py-2.5 text-xs font-medium text-muted-foreground uppercase tracking-wide text-center">
                Direction
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {counterparties.map((cp, i) => (
              <tr key={cp.address} className={i % 2 === 0 ? "" : "bg-muted/30"}>
                <td className="px-6 py-3 font-mono text-xs">
                  {shortenAddress(cp.address)}
                </td>
                <td className="px-6 py-3 text-xs text-muted-foreground">
                  {cp.label ?? "Unknown"}
                </td>
                <td className="px-6 py-3 text-xs text-right font-medium">
                  {cp.totalVolumeUSD != null
                    ? formatUSD(cp.totalVolumeUSD)
                    : "—"}
                </td>
                <td className="px-6 py-3 text-xs text-right">
                  {cp.txCount}
                </td>
                <td className="px-6 py-3">
                  <div className="flex items-center justify-center gap-1">
                    {directionIcons[cp.direction]}
                    <span className="text-xs text-muted-foreground">
                      {directionLabels[cp.direction]}
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
