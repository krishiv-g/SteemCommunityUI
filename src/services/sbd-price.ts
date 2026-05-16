import { supabase } from "@/integrations/supabase/client";

let cachedPrice: number | null = null;
let lastFetch = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export async function fetchSbdPrice(): Promise<number> {
  const now = Date.now();
  if (cachedPrice !== null && now - lastFetch < CACHE_DURATION) {
    return cachedPrice;
  }

  try {
    const { data, error } = await supabase.functions.invoke("sbd-price");
    if (error) throw error;
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
