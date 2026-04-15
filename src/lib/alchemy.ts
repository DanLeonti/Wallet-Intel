import type { AssetTransfer } from "@/types";

const ALCHEMY_BASE_URL = `https://eth-mainnet.g.alchemy.com/v2/${import.meta.env.VITE_ALCHEMY_API_KEY}`;

async function alchemyFetch(method: string, params: unknown[]) {
  const res = await fetch(ALCHEMY_BASE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
  });
  const json = await res.json();
  if (json.error) throw new Error(json.error.message);
  return json.result;
}

export async function getETHBalance(address: string): Promise<number> {
  const hex = await alchemyFetch("eth_getBalance", [address, "latest"]);
  return parseInt(hex, 16) / 1e18;
}

interface AlchemyTokenBalance {
  contractAddress: string;
  tokenBalance: string;
}

export interface RawTokenBalance {
  contractAddress: string;
  rawBalance: bigint;
}

export async function getTokenBalances(
  address: string
): Promise<RawTokenBalance[]> {
  const result = await alchemyFetch("alchemy_getTokenBalances", [
    address,
    "DEFAULT_TOKENS",
  ]);
  return (result.tokenBalances as AlchemyTokenBalance[])
    .filter((t) => t.tokenBalance !== "0x" && BigInt(t.tokenBalance) > 0n)
    .map((t) => ({
      contractAddress: t.contractAddress,
      rawBalance: BigInt(t.tokenBalance),
    }));
}

interface TokenMetadataResult {
  name: string;
  symbol: string;
  decimals: number;
}

export async function getTokenMetadata(
  contractAddress: string
): Promise<TokenMetadataResult> {
  const result = await alchemyFetch("alchemy_getTokenMetadata", [
    contractAddress,
  ]);
  return {
    name: result.name || "Unknown",
    symbol: result.symbol || "???",
    decimals: result.decimals ?? 18,
  };
}

export async function resolveENS(address: string): Promise<string | null> {
  try {
    const result = await fetch(ALCHEMY_BASE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "eth_call",
        params: [
          {
            to: "0x3671aE578E63FdF66ad4F3E12CC0c0d71Ac7510C",
            data: encodeReverseResolve(address),
          },
          "latest",
        ],
      }),
    });
    const json = await result.json();
    if (!json.result || json.result === "0x") return null;
    return decodeString(json.result);
  } catch {
    return null;
  }
}

function encodeReverseResolve(address: string): string {
  const selector = "0x01ffc9a7";
  void selector;
  const addr = address.toLowerCase().slice(2);
  const namehash = reverseNamehash(addr);
  const resolverSig = "0x0178b8bf";
  return resolverSig + namehash;
}

function reverseNamehash(_addr: string): string {
  return "0".repeat(64);
}

function decodeString(hex: string): string | null {
  try {
    if (hex.length < 130) return null;
    const offset = parseInt(hex.slice(2, 66), 16) * 2;
    const length = parseInt(hex.slice(2 + offset, 2 + offset + 64), 16);
    if (length === 0) return null;
    const strHex = hex.slice(2 + offset + 64, 2 + offset + 64 + length * 2);
    let str = "";
    for (let i = 0; i < strHex.length; i += 2) {
      str += String.fromCharCode(parseInt(strHex.slice(i, i + 2), 16));
    }
    return str.endsWith(".eth") ? str : null;
  } catch {
    return null;
  }
}

export async function resolveENSSimple(
  address: string
): Promise<string | null> {
  try {
    const res = await fetch(
      `https://api.ensideas.com/ens/resolve/${address.toLowerCase()}`
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data.name || null;
  } catch {
    return null;
  }
}

interface AlchemyTransfer {
  hash: string;
  from: string;
  to: string;
  value: number | null;
  asset: string;
  category: string;
  blockNum: string;
  metadata: { blockTimestamp: string };
}

interface TransferResponse {
  transfers: AlchemyTransfer[];
  pageKey?: string;
}

export async function getAssetTransfers(
  address: string,
  direction: "from" | "to",
  maxPages: number = 3
): Promise<AssetTransfer[]> {
  const transfers: AssetTransfer[] = [];
  let pageKey: string | undefined;

  for (let page = 0; page < maxPages; page++) {
    const params: Record<string, unknown> = {
      [direction === "from" ? "fromAddress" : "toAddress"]: address,
      category: ["external", "internal", "erc20"],
      order: "desc",
      maxCount: "0x64",
      withMetadata: true,
    };
    if (pageKey) params.pageKey = pageKey;

    const result: TransferResponse = await alchemyFetch(
      "alchemy_getAssetTransfers",
      [params]
    );

    for (const t of result.transfers) {
      transfers.push({
        hash: t.hash,
        from: t.from?.toLowerCase() ?? "",
        to: t.to?.toLowerCase() ?? "",
        value: t.value ?? 0,
        asset: t.asset ?? "ETH",
        category: t.category as AssetTransfer["category"],
        blockNum: t.blockNum,
        blockTimestamp: t.metadata.blockTimestamp,
        usdValue: null,
      });
    }

    pageKey = result.pageKey;
    if (!pageKey) break;
  }

  return transfers;
}

export async function getFirstTransaction(
  address: string
): Promise<Date | null> {
  try {
    const params = {
      toAddress: address,
      category: ["external"],
      order: "asc",
      maxCount: "0x1",
      withMetadata: true,
    };
    const result: TransferResponse = await alchemyFetch(
      "alchemy_getAssetTransfers",
      [params]
    );

    const paramsFrom = {
      fromAddress: address,
      category: ["external"],
      order: "asc",
      maxCount: "0x1",
      withMetadata: true,
    };
    const resultFrom: TransferResponse = await alchemyFetch(
      "alchemy_getAssetTransfers",
      [paramsFrom]
    );

    const dates: Date[] = [];
    if (result.transfers.length > 0) {
      dates.push(new Date(result.transfers[0].metadata.blockTimestamp));
    }
    if (resultFrom.transfers.length > 0) {
      dates.push(new Date(resultFrom.transfers[0].metadata.blockTimestamp));
    }
    if (dates.length === 0) return null;
    return dates.reduce((a, b) => (a < b ? a : b));
  } catch {
    return null;
  }
}

export function isValidAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}
