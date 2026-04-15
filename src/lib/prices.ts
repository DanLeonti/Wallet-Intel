export async function getETHPrice(): Promise<number> {
  const res = await fetch("/api/prices?type=eth");
  if (!res.ok) throw new Error("Failed to fetch ETH price");
  const data = await res.json();
  return data.price ?? 0;
}

export async function getTokenPrices(
  contractAddresses: string[]
): Promise<Record<string, number>> {
  if (contractAddresses.length === 0) return {};

  const batchSize = 50;
  const result: Record<string, number> = {};

  for (let i = 0; i < contractAddresses.length; i += batchSize) {
    const batch = contractAddresses.slice(i, i + batchSize);
    const addresses = batch.map((a) => a.toLowerCase()).join(",");
    const res = await fetch(
      `/api/prices?type=tokens&addresses=${encodeURIComponent(addresses)}`
    );
    if (!res.ok) continue;
    const data = await res.json();
    for (const [addr, priceData] of Object.entries(data)) {
      const usd = (priceData as { usd?: number })?.usd;
      if (usd != null) {
        result[addr.toLowerCase()] = usd;
      }
    }
  }

  return result;
}
