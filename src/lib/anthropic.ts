import type { BehavioralSignals, Counterparty, LLMVerdict } from "@/types";

const SYSTEM_PROMPT = `You are an expert blockchain compliance analyst. You will receive structured on-chain data about an Ethereum wallet. Your job is to classify the wallet, assess risk, and provide a plain-English intelligence summary.

CRITICAL RULES:
- You must ONLY reference data explicitly provided to you. Do NOT invent addresses, labels, transaction hashes, or numbers.
- If the data is insufficient for a confident classification, respond with "Unknown".
- "Unknown" is always a valid and preferred answer over speculation.
- Every claim you make must be directly traceable to the provided data.
- Do NOT hallucinate counterparty identities or external context not present in the data.

Respond with ONLY a valid JSON object (no markdown, no code fences) in this exact format:
{
  "classification": "Exchange" | "Mixer" | "OTC" | "Personal" | "Unknown",
  "riskLevel": "Low" | "Medium" | "High",
  "reasoning": "<one paragraph explaining your classification and risk assessment based on the data>",
  "summary": "<a plain-English intelligence brief paragraph suitable for a compliance investigator>"
}`;

interface AnalysisPayload {
  address: string;
  ensName: string | null;
  ethBalance: number;
  totalUSDValue: number;
  isSanctioned: boolean;
  walletAgeDays: number | null;
  behavioralSignals: BehavioralSignals;
  topCounterparties: Pick<Counterparty, "address" | "totalVolumeETH" | "txCount" | "direction">[];
  tokenCount: number;
  recentTxCount: number;
}

export async function getWalletVerdict(
  payload: AnalysisPayload
): Promise<LLMVerdict> {
  const userMessage = `<data>\n${JSON.stringify(payload, null, 2)}\n</data>\n\nAnalyze this Ethereum wallet and provide your classification, risk assessment, and intelligence summary.`;

  const res = await fetch("/api/llm", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ systemPrompt: SYSTEM_PROMPT, userMessage }),
  });

  if (!res.ok) {
    throw new Error(`LLM proxy error: ${res.status}`);
  }

  const data = await res.json();
  if (data.error) throw new Error(data.error);

  try {
    const parsed = JSON.parse(data.text);
    return validateVerdict(parsed);
  } catch {
    throw new Error("Failed to parse LLM response as valid verdict JSON");
  }
}

function validateVerdict(obj: unknown): LLMVerdict {
  if (!obj || typeof obj !== "object") throw new Error("Invalid verdict");
  const v = obj as Record<string, unknown>;

  const validClassifications = [
    "Exchange",
    "Mixer",
    "OTC",
    "Personal",
    "Unknown",
  ];
  const validRiskLevels = ["Low", "Medium", "High"];

  const classification = validClassifications.includes(
    v.classification as string
  )
    ? (v.classification as LLMVerdict["classification"])
    : "Unknown";

  const riskLevel = validRiskLevels.includes(v.riskLevel as string)
    ? (v.riskLevel as LLMVerdict["riskLevel"])
    : "Medium";

  return {
    classification,
    riskLevel,
    reasoning: typeof v.reasoning === "string" ? v.reasoning : "Unable to determine reasoning.",
    summary: typeof v.summary === "string" ? v.summary : "Unable to generate summary.",
  };
}
