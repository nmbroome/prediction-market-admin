import { createSupabaseBrowserClient } from "./supabase/browser-client";

interface Market {
  id: number;
  name: string;
  description: string;
  token_pool: number;
  market_maker: string;
}

export async function getMarkets(): Promise<Market[] | null> {
  const supabase = createSupabaseBrowserClient();

  const { data, error } = await supabase
    .from('markets')
    .select('id, name, description, token_pool, market_maker');

  if (error) {
    console.error('Error fetching markets:', error.message);
    return null;
  }

  return data as Market[];
}