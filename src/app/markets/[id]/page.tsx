"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser-client";

const supabase = createSupabaseBrowserClient();

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
  const [amountIn, setAmountIn] = useState<number>(10); // Default amount to trade
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMarketData() {
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
          .from("answers")
          .select("id, name, tokens, market_id")
          .eq("market_id", id);

        if (answersError) {
          console.error("Error fetching answers:", answersError.message);
        } else {
          setAnswers(answersData as Answer[]);
        }
      }
    }

    fetchMarketData();
  }, [id]);

  const handleButtonClick = async (answer: Answer) => {
    setError(null);
    setSuccess(null);

    if (!market) {
      setError("Market data not available.");
      return;
    }

    const reserveA = answers[0].tokens; // Reserve of Token A
    const reserveB = answers[1]?.tokens || 0; // Reserve of Token B

    try {
      const response = await fetch("https://prediction-market-iota.vercel.app/api/handler", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token_a: answers[0].name, // Assuming Token A is the first answer
          reserve_a: reserveA,
          token_b: answers[1]?.name || "", // Assuming Token B is the second answer
          reserve_b: reserveB,
          input_token: answer.name, // The token being swapped (clicked answer)
          amount_in: amountIn,
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        setError(`API error: ${errorData}`);
      } else {
        const data = await response.json();
        setSuccess(
          `Swap successful! Received ${data.amount_out.toFixed(
            2
          )}. New reserves: A=${data.new_reserve_a.toFixed(
            2
          )}, B=${data.new_reserve_b.toFixed(2)}`
        );
      }
    } catch (err) {
      console.error("API call error:", err);
      setError("Failed to call market maker.");
    }
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
                  {(answer.tokens / market.token_pool * 100).toFixed(2)}%
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
