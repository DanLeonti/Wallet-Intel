export type Classification =
  | "Exchange"
  | "Mixer"
  | "OTC"
  | "Personal"
  | "Unknown";

export type RiskLevel = "Low" | "Medium" | "High";

export interface TokenBalance {
  contractAddress: string;
  symbol: string;
  name: string;
  balance: number;
  decimals: number;
  usdPrice: number | null;
  usdValue: number | null;
}

export interface AssetTransfer {
  hash: string;
  from: string;
  to: string;
  value: number;
  asset: string;
  category: "external" | "internal" | "erc20" | "erc721" | "erc1155";
  blockNum: string;
  blockTimestamp: string;
  usdValue: number | null;
}

export interface Counterparty {
  address: string;
  label: string | null;
  totalVolumeETH: number;
  totalVolumeUSD: number | null;
  txCount: number;
  direction: "inbound" | "outbound" | "both";
}

export interface BehavioralSignals {
  totalTxCount: number;
  uniqueCounterparties: number;
  inboundTxCount: number;
  outboundTxCount: number;
  avgTxValueETH: number;
  tokenDiversity: number;
  txFrequencyPerDay: number;
  fanInOutRatio: number;
}

export interface LLMVerdict {
  classification: Classification;
  riskLevel: RiskLevel;
  reasoning: string;
  summary: string;
}

export interface WalletAnalysis {
  address: string;
  ensName: string | null;
  firstTxDate: Date | null;
  ethBalance: number;
  ethPriceUSD: number;
  totalUSDValue: number;
  tokenBalances: TokenBalance[];
  isSanctioned: boolean;
  transfers: AssetTransfer[];
  counterparties: Counterparty[];
  recentTransactions: AssetTransfer[];
  behavioralSignals: BehavioralSignals;
  verdict: LLMVerdict;
}

export type AnalysisState =
  | { status: "idle" }
  | { status: "loading"; step: string }
  | { status: "success"; data: WalletAnalysis }
  | { status: "error"; error: string };
