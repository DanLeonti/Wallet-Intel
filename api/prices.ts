import type { VercelRequest, VercelResponse } from "@vercel/node";

const COINGECKO_BASE = "https://api.coingecko.com/api/v3";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { type } = req.query;

    if (type === "eth") {
      const cgRes = await fetch(
        `${COINGECKO_BASE}/simple/price?ids=ethereum&vs_currencies=usd`,
        { headers: buildHeaders() }
      );
      const data = await cgRes.json();
      return res.status(200).json({ price: data.ethereum?.usd ?? null });
    }

    if (type === "ethStats") {
      const cgRes = await fetch(
        `${COINGECKO_BASE}/simple/price?ids=ethereum&vs_currencies=usd&include_24hr_change=true&include_market_cap=true&include_24hr_vol=true`,
        { headers: buildHeaders() }
      );
      const data = await cgRes.json();
      const eth = data.ethereum ?? {};
      return res.status(200).json({
        price: eth.usd ?? null,
        change24h: eth.usd_24h_change ?? null,
        marketCap: eth.usd_market_cap ?? null,
        volume24h: eth.usd_24h_vol ?? null,
      });
    }

    if (type === "tokens") {
      const addresses = req.query.addresses as string;
      if (!addresses) {
        return res.status(400).json({ error: "addresses parameter required" });
      }
      const cgRes = await fetch(
        `${COINGECKO_BASE}/simple/token_price/ethereum?contract_addresses=${addresses}&vs_currencies=usd`,
        { headers: buildHeaders() }
      );
      const data = await cgRes.json();
      return res.status(200).json(data);
    }

    return res.status(400).json({ error: "Invalid type parameter" });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return res.status(500).json({ error: message });
  }
}

function buildHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: "application/json",
  };
  const apiKey = process.env.COINGECKO_API_KEY;
  if (apiKey) {
    headers["x-cg-demo-api-key"] = apiKey;
  }
  return headers;
}
