let cachedPrice: number | null = null;
let lastFetch = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export async function fetchSbdPrice(): Promise<number> {
  const now = Date.now();
  if (cachedPrice !== null && now - lastFetch < CACHE_DURATION) {
    return cachedPrice;
  }

  try {
    const res = await fetch("/api/sbd-price");
    if (!res.ok) throw new Error("Failed to fetch SBD price");
    const data = await res.json();
    if (data?.price_usd && typeof data.price_usd === "number") {
      cachedPrice = data.price_usd;
      lastFetch = now;
      return data.price_usd;
    }
    throw new Error("Invalid price data");
  } catch (err) {
    console.error("Failed to fetch SBD price:", err);
    return 1;
  }
}
