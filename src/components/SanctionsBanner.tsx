import { ShieldAlert, ShieldCheck } from "lucide-react";

interface SanctionsBannerProps {
  isSanctioned: boolean;
}

export function SanctionsBanner({ isSanctioned }: SanctionsBannerProps) {
  if (isSanctioned) {
    return (
      <div className="rounded-xl border-2 border-red-300 bg-red-50 p-4 flex items-start gap-3">
        <ShieldAlert className="h-6 w-6 text-red-600 shrink-0 mt-0.5" />
        <div>
          <h3 className="text-sm font-semibold text-red-800">
            OFAC Sanctions Match
          </h3>
          <p className="text-sm text-red-700 mt-0.5">
            This address appears on the U.S. Treasury OFAC Specially Designated
            Nationals (SDN) sanctioned digital currency addresses list.
            Transactions with this address may violate U.S. sanctions law.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 flex items-center gap-3">
      <ShieldCheck className="h-5 w-5 text-emerald-600 shrink-0" />
      <p className="text-sm font-medium text-emerald-800">
        OFAC Sanctions Check: Clear — address not found on the SDN list
      </p>
    </div>
  );
}
