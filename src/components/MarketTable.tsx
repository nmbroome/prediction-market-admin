"use client";

import React, { useEffect, useState } from "react";
import { Markets } from "@/lib/types";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser-client";

const supabase = createSupabaseBrowserClient();

const MarketsPage = () => {
  const [markets, setMarkets] = useState<Markets[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchMarkets = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("markets")
        .select("id, name, description, token_pool, outcome_id, market_maker");

      if (error) {
        console.error("Error fetching markets:", error.message);
        setLoading(false);
        return;
      }

      // Map Supabase data to Markets type
      const formattedData: Markets[] = data.map((market) => ({
        marketId: market.id,
        marketName: market.name,
        description: market.description,
        tokenPool: market.token_pool,
        marketMaker: market.market_maker,
        outcome: market.outcome_id,
      }));

      setMarkets(formattedData);
      setLoading(false);
    };

    fetchMarkets();
  }, []);

  if (loading) {
    return <p className="text-center text-lg">Loading markets...</p>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-center my-4">Markets Table</h1>
      <div className="flex items-center justify-center">
        <table className="min-w-full bg-white shadow-md rounded-lg overflow-hidden">
          <thead>
            <tr className="bg-gray-800 text-white border-b">
              <th className="px-4 py-2">Market Name</th>
              <th className="px-4 py-2">Description</th>
              <th className="px-4 py-2">Token Pool</th>
              <th className="px-4 py-2">Market Maker</th>
              <th className="px-4 py-2">Outcome</th>
            </tr>
          </thead>
          <tbody className="text-black text-center">
            {markets.map((row, index) => (
              <tr
                key={row.marketId}
                className={`${
                  index % 2 === 0 ? "bg-gray-100" : "bg-gray-200"
                } border-b`}
              >
                <td className="px-4 py-2">{row.marketName}</td>
                <td className="px-4 py-2">{row.description}</td>
                <td className="px-4 py-2">{row.tokenPool}</td>
                <td className="px-4 py-2">{row.marketMaker}</td>
                <td className="px-4 py-2">{row.outcome}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MarketsPage;