import { useCallback, useReducer } from "react";
import type { AnalysisState, WalletAnalysis } from "@/types";
import {
  getETHBalance,
  getTokenBalances,
  getAssetTransfers,
  getFirstTransaction,
  resolveENSSimple,
  isValidAddress,
} from "@/lib/alchemy";
import { getETHPrice, getTokenPrices } from "@/lib/prices";
import { checkSanctions } from "@/lib/ofac";
import { getWalletVerdict } from "@/lib/anthropic";
import {
  computeCounterparties,
  computeBehavioralSignals,
  getRecentTransactions,
  resolveTokenBalances,
  computeTotalUSDValue,
} from "@/lib/analysis";
import { generateTemplateVerdict } from "@/lib/template";

type Action =
  | { type: "start"; step: string }
  | { type: "step"; step: string }
  | { type: "success"; data: WalletAnalysis }
  | { type: "error"; error: string };

function reducer(_state: AnalysisState, action: Action): AnalysisState {
  switch (action.type) {
    case "start":
      return { status: "loading", step: action.step };
    case "step":
      return { status: "loading", step: action.step };
    case "success":
      return { status: "success", data: action.data };
    case "error":
      return { status: "error", error: action.error };
  }
}

export function useWalletAnalysis() {
  const [state, dispatch] = useReducer(reducer, { status: "idle" });

  const analyze = useCallback(async (address: string) => {
    if (!isValidAddress(address)) {
      dispatch({ type: "error", error: "Invalid Ethereum address format" });
      return;
    }

    const addr = address.toLowerCase();

    try {
      dispatch({ type: "start", step: "Fetching on-chain data..." });

      const [
        ethBalance,
        rawTokenBalances,
        inboundTransfers,
        outboundTransfers,
        firstTxDate,
        ensName,
        ethPriceUSD,
        isSanctioned,
      ] = await Promise.all([
        getETHBalance(addr),
        getTokenBalances(addr),
        getAssetTransfers(addr, "to", 3),
        getAssetTransfers(addr, "from", 3),
        getFirstTransaction(addr),
        resolveENSSimple(addr),
        getETHPrice(),
        checkSanctions(addr),
      ]);

      dispatch({ type: "step", step: "Resolving token prices..." });

      const tokenAddresses = rawTokenBalances.map((t) =>
        t.contractAddress.toLowerCase()
      );
      const tokenPrices = await getTokenPrices(tokenAddresses);

      dispatch({ type: "step", step: "Analyzing wallet activity..." });

      const tokenBalances = await resolveTokenBalances(
        rawTokenBalances,
        tokenPrices
      );

      const allTransfers = [...inboundTransfers, ...outboundTransfers];

      const counterparties = computeCounterparties(
        addr,
        allTransfers,
        ethPriceUSD
      );

      const behavioralSignals = computeBehavioralSignals(
        addr,
        allTransfers,
        tokenBalances.length
      );

      const recentTransactions = getRecentTransactions(
        allTransfers,
        ethPriceUSD
      );

      const totalUSDValue = computeTotalUSDValue(
        ethBalance,
        ethPriceUSD,
        tokenBalances
      );

      dispatch({ type: "step", step: "Generating intelligence brief..." });

      const walletAgeDays =
        firstTxDate != null
          ? Math.floor(
              (Date.now() - firstTxDate.getTime()) / (1000 * 60 * 60 * 24)
            )
          : null;

      let verdict;
      try {
        verdict = await getWalletVerdict({
          address: addr,
          ensName,
          ethBalance,
          totalUSDValue,
          isSanctioned,
          walletAgeDays,
          behavioralSignals,
          topCounterparties: counterparties.map((c) => ({
            address: c.address,
            totalVolumeETH: c.totalVolumeETH,
            txCount: c.txCount,
            direction: c.direction,
          })),
          tokenCount: tokenBalances.length,
          recentTxCount: recentTransactions.length,
        });
      } catch {
        verdict = generateTemplateVerdict({
          address: addr,
          ensName,
          ethBalance,
          totalUSDValue,
          isSanctioned,
          walletAgeDays,
          behavioralSignals,
          topCounterparties: counterparties,
        });
      }

      const result: WalletAnalysis = {
        address: addr,
        ensName,
        firstTxDate,
        ethBalance,
        ethPriceUSD,
        totalUSDValue,
        tokenBalances,
        isSanctioned,
        transfers: allTransfers,
        counterparties,
        recentTransactions,
        behavioralSignals,
        verdict,
      };

      dispatch({ type: "success", data: result });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "An unexpected error occurred";
      dispatch({ type: "error", error: message });
    }
  }, []);

  return { state, analyze };
}
