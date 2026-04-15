import type { BehavioralSignals, Counterparty, LLMVerdict } from "@/types";
import { formatUSD } from "./utils";

interface TemplateInput {
  address: string;
  ensName: string | null;
  ethBalance: number;
  totalUSDValue: number;
  isSanctioned: boolean;
  walletAgeDays: number | null;
  behavioralSignals: BehavioralSignals;
  topCounterparties: Counterparty[];
}

export function generateTemplateVerdict(input: TemplateInput): LLMVerdict {
  const classification = inferClassification(input.behavioralSignals);
  const riskLevel = inferRiskLevel(input);
  const reasoning = buildReasoning(input, classification, riskLevel);
  const summary = buildSummary(input);

  return { classification, riskLevel, reasoning, summary };
}

function inferClassification(
  signals: BehavioralSignals
): LLMVerdict["classification"] {
  if (signals.totalTxCount === 0) return "Unknown";

  const ratio = signals.fanInOutRatio;
  const uniqueCPs = signals.uniqueCounterparties;

  // High fan-out with many counterparties suggests exchange or mixer
  if (signals.outboundTxCount > 100 && uniqueCPs > 50) {
    if (ratio < 0.3) return "Mixer";
    return "Exchange";
  }

  // Very few counterparties, low activity = personal
  if (uniqueCPs <= 10 && signals.totalTxCount < 100) {
    return "Personal";
  }

  // Moderate activity with balanced in/out and fewer counterparties
  if (uniqueCPs <= 30 && ratio > 0.3 && ratio < 3) {
    return "OTC";
  }

  return "Unknown";
}

function inferRiskLevel(
  input: TemplateInput
): LLMVerdict["riskLevel"] {
  if (input.isSanctioned) return "High";

  const { behavioralSignals } = input;
  if (behavioralSignals.totalTxCount === 0) return "Low";

  let score = 0;
  if (behavioralSignals.uniqueCounterparties > 100) score++;
  if (behavioralSignals.txFrequencyPerDay > 10) score++;
  if (behavioralSignals.avgTxValueETH > 10) score++;
  if (behavioralSignals.fanInOutRatio < 0.1 || behavioralSignals.fanInOutRatio > 10) score++;

  if (score >= 3) return "High";
  if (score >= 1) return "Medium";
  return "Low";
}

function buildReasoning(
  input: TemplateInput,
  classification: LLMVerdict["classification"],
  riskLevel: LLMVerdict["riskLevel"]
): string {
  const { behavioralSignals: s } = input;
  const parts: string[] = [];

  parts.push(
    `This wallet has ${s.totalTxCount} total transactions with ${s.uniqueCounterparties} unique counterparties.`
  );

  parts.push(
    `The inbound-to-outbound ratio is ${s.fanInOutRatio === Infinity ? "all inbound" : s.fanInOutRatio.toFixed(2)}, with an average transaction value of ${s.avgTxValueETH.toFixed(4)} ETH.`
  );

  if (classification !== "Unknown") {
    parts.push(
      `Based on these behavioral patterns, the wallet is classified as "${classification}" with ${riskLevel} risk.`
    );
  } else {
    parts.push(
      `Insufficient behavioral patterns to confidently classify this wallet. Risk assessed as ${riskLevel}.`
    );
  }

  if (input.isSanctioned) {
    parts.push(
      "ALERT: This address appears on the OFAC sanctioned addresses list."
    );
  }

  return parts.join(" ");
}

function buildSummary(input: TemplateInput): string {
  const { behavioralSignals: s, topCounterparties } = input;
  const parts: string[] = [];

  const ageStr =
    input.walletAgeDays != null
      ? `approximately ${input.walletAgeDays} days old`
      : "of unknown age";

  parts.push(
    `This Ethereum wallet (${input.ensName ?? input.address.slice(0, 10) + "..."}) is ${ageStr} and holds ${formatUSD(input.totalUSDValue)} in total assets.`
  );

  parts.push(
    `It has conducted ${s.totalTxCount} transactions (${s.inboundTxCount} inbound, ${s.outboundTxCount} outbound) across ${s.uniqueCounterparties} unique addresses.`
  );

  if (topCounterparties.length > 0) {
    const top = topCounterparties[0];
    parts.push(
      `The top counterparty (${top.address.slice(0, 10)}...) accounts for ${top.txCount} transactions at ${top.totalVolumeETH.toFixed(2)} ETH total volume.`
    );
  }

  if (input.isSanctioned) {
    parts.push(
      "This address is flagged on the OFAC SDN sanctioned digital currency addresses list."
    );
  } else {
    parts.push("This address is not present on the OFAC SDN sanctions list.");
  }

  return parts.join(" ");
}
