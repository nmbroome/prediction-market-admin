"use client";

import { useEffect, useState, useCallback } from "react";
import { User } from "@supabase/supabase-js";
import { useParams } from "next/navigation";
import supabase from "@/lib/supabase/createClient";
import { addPrediction } from "@/lib/predictions";
import { constantProductMarketMaker } from "@/lib/marketMakers";

interface Market {
  id: number;
  name: string;
  description: string;
  token_pool: number;
  market_maker: string;
  creator_id?: string; // Make this optional since it might not exist in all records
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
  const [user, setUser] = useState<User | null>(null);
  const [isCreator, setIsCreator] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const fetchUser = async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) throw new Error(error.message);
      setUser(user);
      
      if (market && user && market.creator_id) {
        setIsCreator(market.creator_id === user.id);
      }
    } catch (e) {
      setError(`Error fetching user: ${e}`);
    }
  };

  const fetchMarketData = useCallback(async () => {
    if (!id) return;

    try {
      // Try to fetch with creator_id if it exists
      const { data: marketData, error: marketError } = await supabase
        .from("markets")
        .select("id, name, description, token_pool, market_maker, creator_id")
        .eq("id", id)
        .single();

      if (marketError) throw new Error(marketError.message);
      
      setMarket(marketData as Market);
      
      // Check if the current user is the creator
      if (user && marketData.creator_id) {
        setIsCreator(marketData.creator_id === user.id);
      }

      const { data: answersData, error: answersError } = await supabase
        .from("outcomes")
        .select("id, name, tokens, market_id")
        .eq("market_id", id);

      if (answersError) throw new Error(answersError.message);
      setAnswers(answersData as Answer[]);
    } catch (e) {
      setError(`Error fetching market data: ${e}`);
    }
  }, [id, user]);

  useEffect(() => {
    fetchUser();
    fetchMarketData();
  }, [fetchMarketData]);

  const handlePrediction = async (selectedAnswer: Answer) => {
    setError(null);
    setSuccess(null);

    if (!user) {
      setError("User is not logged in.");
      return;
    }

    if (!market) {
      setError("Market data is not available.");
      return;
    }

    try {
      // Get token reserves
      const reserveA = selectedAnswer.tokens;
      const otherAnswers = answers.filter((a) => a.id !== selectedAnswer.id);
      const reserveB = otherAnswers.reduce((sum, a) => sum + a.tokens, 0);

      if (reserveA <= 0 || reserveB <= 0) {
        throw new Error("Market liquidity is insufficient.");
      }

      // Calculate return amount using CPMM
      const returnAmount = constantProductMarketMaker(reserveA, reserveB, amountIn);

      if (returnAmount <= 0) {
        throw new Error("Trade failed: Insufficient liquidity.");
      }

      // Insert prediction
      await addPrediction({
        user_id: user.id,
        market_id: market.id,
        outcome_id: selectedAnswer.id,
        predict_amt: amountIn,
        return_amt: returnAmount,
      });

      // Update token pool in the database
      const { error: updateError } = await supabase
        .from("outcomes")
        .update({ tokens: reserveA + amountIn })
        .eq("id", selectedAnswer.id);

      if (updateError) throw new Error(updateError.message);

      setSuccess(
        `Prediction successful! You invested ${amountIn} tokens and may receive ${returnAmount.toFixed(
          2
        )} tokens if correct.`
      );

      // Refresh Market Data
      await fetchMarketData();
    } catch (e) {
      setError(`Error making prediction: ${e}`);
    }
  };

  const handleCloseMarket = async (outcomeId: number) => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    if (!user) {
      setError("User is not logged in.");
      setLoading(false);
      return;
    }

    if (!isCreator) {
      setError("Only the market creator can close this market.");
      setLoading(false);
      return;
    }

    try {
      // Call the Edge Function to close the market with the selected outcome
      const { error } = await supabase.functions.invoke('close-market', {
        body: { 
          marketId: market?.id, 
          outcomeId: outcomeId 
        }
      });

      if (error) throw new Error(error.message);

      setSuccess(`Market successfully closed with outcome: ${answers.find(a => a.id === outcomeId)?.name}`);
      
      // Refresh market data to show updated state
      await fetchMarketData();
    } catch (e) {
      setError(`Error closing market: ${e}`);
    } finally {
      setLoading(false);
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

      <div className="mt-6">
        <label htmlFor="amountIn" className="block text-sm font-medium text-white">
          Prediction Amount:
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

      <div className="mt-6">
        <h2 className="text-xl font-semibold">Select an Outcome</h2>
        {answers.length > 0 ? (
          <div className="flex flex-col">
            {answers.map((answer) => (
              <div key={answer.id} className="mt-2 flex gap-4 items-center">
                <button
                  onClick={() => handlePrediction(answer)}
                  className="w-fit px-4 py-2 text-white bg-blue-600 rounded-lg shadow hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <span className="block text-lg font-medium">{answer.name}</span>
                  <span className="block text-sm">
                    {market?.token_pool
                      ? ((answer.tokens / market.token_pool) * 100).toFixed(2) + "%"
                      : "N/A"}
                  </span>
                </button>
                
                {/* Only show close market buttons to the creator */}
                {isCreator && (
                  <button
                    onClick={() => handleCloseMarket(answer.id)}
                    className="w-fit px-4 py-2 text-white bg-green-600 rounded-lg shadow hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                    disabled={loading}
                  >
                    {loading ? "Processing..." : `Close market with ${answer.name}`}
                  </button>
                )}
              </div>
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