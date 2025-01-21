"use client";

import React, { useEffect, useState } from "react";
import { Predictions } from "@/lib/types";
import supabase from "@/lib/supabase/createClient";

const PredictionsTable = () => {
  const [predictions, setPredictions] = useState<Predictions[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchUserAndPredictions = async () => {
      setLoading(true);

      try {
        // Get the currently authenticated user
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) throw userError;
        if (!user) throw new Error("No authenticated user found");

        // Fetch predictions for the current user
        const { data: predictionsData, error: predictionsError } = await supabase
          .from("predictions")
          .select("id, market_id, outcome_id, predict_amt, return_amt")
          .eq("user_id", user.id); // Filter by the current user's ID

        if (predictionsError) throw predictionsError;

        // Fetch markets data
        const { data: marketsData, error: marketsError } = await supabase
          .from("markets")
          .select("id, name");

        if (marketsError) throw marketsError;

        // Combine the data
        const formattedData: Predictions[] = predictionsData.map((prediction) => {
          const market = marketsData.find((m) => m.id === prediction.market_id);

          return {
            predictionId: prediction.id,
            marketName: market ? market.name : "Unknown Market",
            outcome: prediction.outcome_id,
            predictAmount: prediction.predict_amt,
            returnAmount: prediction.return_amt,
          };
        });

        setPredictions(formattedData);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserAndPredictions();
  }, []);

  if (loading) {
    return <p className="text-center text-lg">Loading predictions...</p>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-center my-4">Predictions Table</h1>
      <div className="flex items-center justify-center">
        <table className="min-w-full bg-white shadow-md rounded-lg overflow-hidden">
          <thead>
            <tr className="bg-gray-800 text-white border-b">
              <th className="px-4 py-2">Market Name</th>
              <th className="px-4 py-2">Outcome</th>
              <th className="px-4 py-2">Prediction Amount</th>
              <th className="px-4 py-2">Return Amount</th>
            </tr>
          </thead>
          <tbody className="text-black text-center">
            {predictions.map((row, index) => (
              <tr
                key={row.predictionId}
                className={`${
                  index % 2 === 0 ? "bg-gray-100" : "bg-gray-200"
                } border-b`}
              >
                <td className="px-4 py-2">{row.marketName}</td>
                <td className="px-4 py-2">{row.outcome}</td>
                <td className="px-4 py-2">{row.predictAmount}</td>
                <td className="px-4 py-2">{row.returnAmount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PredictionsTable;
