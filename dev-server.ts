import express from "express";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";
const COINGECKO_BASE = "https://api.coingecko.com/api/v3";

async function callAnthropic(apiKey: string, systemPrompt: string, userMessage: string): Promise<string> {
  const response = await fetch(ANTHROPIC_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Anthropic ${response.status}: ${errText}`);
  }

  const data = await response.json();
  return data.content?.[0]?.type === "text" ? data.content[0].text : "";
}

async function callOpenAI(apiKey: string, systemPrompt: string, userMessage: string): Promise<string> {
  const response = await fetch(OPENAI_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      max_tokens: 1024,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`OpenAI ${response.status}: ${errText}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content ?? "";
}

app.post("/api/llm", async (req, res) => {
  const { systemPrompt, userMessage } = req.body;

  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  if (anthropicKey) {
    try {
      console.log("[LLM] Trying Anthropic...");
      const text = await callAnthropic(anthropicKey, systemPrompt, userMessage);
      console.log("[LLM] Anthropic succeeded");
      return res.status(200).json({ text });
    } catch (err) {
      console.error("[LLM] Anthropic failed:", err instanceof Error ? err.message : err);
    }
  }

  if (openaiKey) {
    try {
      console.log("[LLM] Trying OpenAI fallback...");
      const text = await callOpenAI(openaiKey, systemPrompt, userMessage);
      console.log("[LLM] OpenAI succeeded");
      return res.status(200).json({ text });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      console.error("[LLM] OpenAI also failed:", message);
      return res.status(502).json({ error: `Both LLM providers failed. OpenAI: ${message}` });
    }
  }

  return res.status(503).json({ error: "No LLM API key configured (set ANTHROPIC_API_KEY or OPENAI_API_KEY)" });
});

app.get("/api/prices", async (req, res) => {
  try {
    const { type, addresses } = req.query;
    const headers: Record<string, string> = { Accept: "application/json" };
    const apiKey = process.env.COINGECKO_API_KEY;
    if (apiKey) headers["x-cg-demo-api-key"] = apiKey;

    if (type === "eth") {
      const cgRes = await fetch(
        `${COINGECKO_BASE}/simple/price?ids=ethereum&vs_currencies=usd`,
        { headers }
      );
      const data = await cgRes.json();
      return res.status(200).json({ price: data.ethereum?.usd ?? null });
    }

    if (type === "ethStats") {
      const cgRes = await fetch(
        `${COINGECKO_BASE}/simple/price?ids=ethereum&vs_currencies=usd&include_24hr_change=true&include_market_cap=true&include_24hr_vol=true`,
        { headers }
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
      if (!addresses) {
        return res.status(400).json({ error: "addresses parameter required" });
      }
      const cgRes = await fetch(
        `${COINGECKO_BASE}/simple/token_price/ethereum?contract_addresses=${addresses}&vs_currencies=usd`,
        { headers }
      );
      const data = await cgRes.json();
      return res.status(200).json(data);
    }

    return res.status(400).json({ error: "Invalid type parameter" });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return res.status(500).json({ error: message });
  }
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`API dev server running on http://localhost:${PORT}`);
});
