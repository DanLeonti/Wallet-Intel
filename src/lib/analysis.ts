import type {
  AssetTransfer,
  BehavioralSignals,
  Counterparty,
  TokenBalance,
} from "@/types";
import type { RawTokenBalance } from "./alchemy";
import { getTokenMetadata } from "./alchemy";

function bigIntToFloat(raw: bigint, decimals: number): number {
  const str = raw.toString();
  if (decimals === 0) return Number(str);
  if (str.length <= decimals) {
    return Number("0." + str.padStart(decimals, "0"));
  }
  const whole = str.slice(0, str.length - decimals);
  const frac = str.slice(str.length - decimals);
  return Number(whole + "." + frac);
}

export function computeCounterparties(
  address: string,
  transfers: AssetTransfer[],
  ethPriceUSD: number
): Counterparty[] {
  const addr = address.toLowerCase();
  const map = new Map<
    string,
    { inVolume: number; outVolume: number; inCount: number; outCount: number }
  >();

  for (const tx of transfers) {
    const counterparty =
      tx.from === addr ? tx.to : tx.to === addr ? tx.from : null;
    if (!counterparty || counterparty === addr) continue;

    const entry = map.get(counterparty) ?? {
      inVolume: 0,
      outVolume: 0,
      inCount: 0,
      outCount: 0,
    };

    const ethValue =
      tx.asset === "ETH" || tx.category === "external" ? tx.value : 0;

    if (tx.to === addr) {
      entry.inVolume += ethValue;
      entry.inCount++;
    } else {
      entry.outVolume += ethValue;
      entry.outCount++;
    }

    map.set(counterparty, entry);
  }

  const counterparties: Counterparty[] = [];
  for (const [cpAddr, data] of map) {
    const totalVolumeETH = data.inVolume + data.outVolume;
    const hasIn = data.inCount > 0;
    const hasOut = data.outCount > 0;
    counterparties.push({
      address: cpAddr,
      label: null,
      totalVolumeETH,
      totalVolumeUSD: totalVolumeETH * ethPriceUSD,
      txCount: data.inCount + data.outCount,
      direction: hasIn && hasOut ? "both" : hasIn ? "inbound" : "outbound",
    });
  }

  counterparties.sort((a, b) => b.totalVolumeETH - a.totalVolumeETH);
  return counterparties.slice(0, 10);
}

export function computeBehavioralSignals(
  address: string,
  transfers: AssetTransfer[],
  tokenCount: number
): BehavioralSignals {
  const addr = address.toLowerCase();
  const uniqueCounterparties = new Set<string>();
  let inboundCount = 0;
  let outboundCount = 0;
  let totalValueETH = 0;

  for (const tx of transfers) {
    if (tx.to === addr) {
      inboundCount++;
      uniqueCounterparties.add(tx.from);
    }
    if (tx.from === addr) {
      outboundCount++;
      uniqueCounterparties.add(tx.to);
    }
    if (tx.asset === "ETH" || tx.category === "external") {
      totalValueETH += tx.value;
    }
  }

  const totalTxCount = transfers.length;

  let txFrequencyPerDay = 0;
  if (transfers.length >= 2) {
    const timestamps = transfers
      .map((t) => new Date(t.blockTimestamp).getTime())
      .filter((t) => !isNaN(t))
      .sort((a, b) => a - b);
    if (timestamps.length >= 2) {
      const spanDays =
        (timestamps[timestamps.length - 1] - timestamps[0]) /
        (1000 * 60 * 60 * 24);
      txFrequencyPerDay = spanDays > 0 ? totalTxCount / spanDays : 0;
    }
  }

  return {
    totalTxCount,
    uniqueCounterparties: uniqueCounterparties.size,
    inboundTxCount: inboundCount,
    outboundTxCount: outboundCount,
    avgTxValueETH: totalTxCount > 0 ? totalValueETH / totalTxCount : 0,
    tokenDiversity: tokenCount,
    txFrequencyPerDay,
    fanInOutRatio: outboundCount > 0 ? inboundCount / outboundCount : inboundCount > 0 ? Infinity : 0,
  };
}

export function getRecentTransactions(
  transfers: AssetTransfer[],
  ethPriceUSD: number
): AssetTransfer[] {
  const sorted = [...transfers].sort(
    (a, b) =>
      new Date(b.blockTimestamp).getTime() -
      new Date(a.blockTimestamp).getTime()
  );

  return sorted.slice(0, 10).map((tx) => ({
    ...tx,
    usdValue:
      tx.asset === "ETH" || tx.category === "external"
        ? tx.value * ethPriceUSD
        : tx.usdValue,
  }));
}

export async function resolveTokenBalances(
  rawBalances: RawTokenBalance[],
  tokenPrices: Record<string, number>
): Promise<TokenBalance[]> {
  const results: TokenBalance[] = [];

  const metadataPromises = rawBalances.map(async (raw) => {
    try {
      const metadata = await getTokenMetadata(raw.contractAddress);
      const decimals = metadata.decimals ?? 18;
      const balance = bigIntToFloat(raw.rawBalance, decimals);
      const addr = raw.contractAddress.toLowerCase();
      const usdPrice = tokenPrices[addr] ?? null;
      return {
        contractAddress: raw.contractAddress,
        symbol: metadata.symbol,
        name: metadata.name,
        balance,
        decimals,
        usdPrice,
        usdValue: usdPrice != null ? balance * usdPrice : null,
      };
    } catch {
      return null;
    }
  });

  const resolved = await Promise.all(metadataPromises);
  for (const token of resolved) {
    if (token && token.balance > 0) {
      results.push(token);
    }
  }

  results.sort((a, b) => (b.usdValue ?? 0) - (a.usdValue ?? 0));
  return results;
}

export function computeTotalUSDValue(
  ethBalance: number,
  ethPriceUSD: number,
  tokenBalances: TokenBalance[]
): number {
  const ethValue = ethBalance * ethPriceUSD;
  const tokenValue = tokenBalances.reduce(
    (sum, t) => sum + (t.usdValue ?? 0),
    0
  );
  return ethValue + tokenValue;
}
