"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import supabase from "@/lib/supabase/createClient";

interface Market {
  id: number;
  name: string;
  description: string;
  token_pool: number;
  market_maker: string;
}

interface Answer {
  id: number;
  name: string;
  tokens: number;
  market_id: number;
}

export default function MarketDetails() {
  const { id } = useParams();
  const [market, setMarket] = useState<Market | null>(null);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [amountIn, setAmountIn] = useState<number>(10);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchMarketData = useCallback(async () => {
    if (id) {
      const { data: marketData, error: marketError } = await supabase
        .from("markets")
        .select("id, name, description, token_pool, market_maker")
        .eq("id", id)
        .single();
  
      if (marketError) {
        console.error("Error fetching market:", marketError.message);
      } else {
        setMarket(marketData as Market);
      }
  
      const { data: answersData, error: answersError } = await supabase
        .from("outcomes")
        .select("id, name, tokens, market_id")
        .eq("market_id", id);
  
      if (answersError) {
        console.error("Error fetching answers:", answersError.message);
      } else {
        setAnswers(answersData as Answer[]);
      }
    }
  }, [id]);

  // Use the reusable `fetchMarketData` in `useEffect`
useEffect(() => {
  fetchMarketData();
}, [fetchMarketData]);

const handleButtonClick = async (answer: Answer) => {
  setError(null);
  setSuccess(null);

  if (!market) {
    setError("Market data is not available.");
    return;
  }

  const reserveA = answer.tokens; // Reserve of the clicked answer
  const otherAnswers = answers.filter((a) => a.id !== answer.id);
  const reserveB = otherAnswers.reduce((sum, a) => sum + a.tokens, 0); // Sum of other tokens
  const k = reserveA * reserveB;

  const newReserveA = reserveA + amountIn;
  const newReserveB = k / newReserveA;

  const tokensPurchased = reserveB - newReserveB;

  if (tokensPurchased <= 0) {
    setError("Trade failed: Insufficient liquidity.");
    return;
  }

  const { error: updateError } = await supabase
    .from("outcomes")
    .update({ tokens: newReserveA })
    .eq("id", answer.id);

  if (updateError) {
    setError("Failed to update reserves.");
    return;
  }

  setSuccess(
    `Trade successful! You purchased ${tokensPurchased.toFixed(
      2
    )} tokens for ${amountIn} Token A.`
  );

  await fetchMarketData();
};


  if (!market) return <div>Loading...</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">{market.name}</h1>
      <p className="mt-2">{market.description}</p>
      <p className="mt-4">
        <strong>Token Pool:</strong> {market.token_pool}
      </p>
      <p className="mt-2">
        <strong>Market Maker:</strong> {market.market_maker}
      </p>

      {/* Amount to Trade Input */}
      <div className="mt-6">
        <label htmlFor="amountIn" className="block text-sm font-medium text-white">
          Amount to Trade:
        </label>
        <input
          type="number"
          id="amountIn"
          value={amountIn}
          onChange={(e) => setAmountIn(Number(e.target.value))}
          min="1"
          className="mt-1 block w-fit px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-black"
        />
      </div>

      {/* Display answers as buttons */}
      <div className="mt-6">
        <h2 className="text-xl font-semibold">Possible Answers</h2>
        {answers.length > 0 ? (
          <div className="flex flex-col">
            {answers.map((answer) => (
              <button
                key={answer.id}
                onClick={() => handleButtonClick(answer)}
                className="mt-2 w-fit px-4 py-2 text-white bg-blue-600 rounded-lg shadow hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <span className="block text-lg font-medium">{answer.name}</span>
                <span className="block text-sm">
                  {/* Safeguard to ensure valid market and token_pool */}
                  {market?.token_pool
                    ? ((answer.tokens / market.token_pool) * 100).toFixed(2) + "%"
                    : "N/A"}
                </span>
              </button>
            ))}
          </div>
        ) : (
          <p className="mt-2">No answers available for this market.</p>
        )}
        {error && <p className="mt-4 text-red-600">{error}</p>}
        {success && <p className="mt-4 text-green-600">{success}</p>}
      </div>
    </div>
  );
}
