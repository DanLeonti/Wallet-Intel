const OFAC_URL =
  "https://raw.githubusercontent.com/0xB10C/ofac-sanctioned-digital-currency-addresses/lists/sanctioned_addresses_ETH.txt";

let cachedSet: Set<string> | null = null;

async function loadSanctionedAddresses(): Promise<Set<string>> {
  if (cachedSet) return cachedSet;

  const res = await fetch(OFAC_URL);
  if (!res.ok) {
    throw new Error(`Failed to fetch OFAC list: ${res.status}`);
  }
  const text = await res.text();
  cachedSet = new Set(
    text
      .split("\n")
      .map((line) => line.trim().toLowerCase())
      .filter((line) => line.startsWith("0x"))
  );
  return cachedSet;
}

export async function checkSanctions(address: string): Promise<boolean> {
  const sanctioned = await loadSanctionedAddresses();
  return sanctioned.has(address.toLowerCase());
}
