"use client";

import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser-client";
import MarketTable from "@/components/MarketTable";
import PredictionsTable from "@/components/PredictionHistory";
import { Markets, Predictions } from "@/lib/types";


export default function Admin() {
  const sampleData: Markets[] = [
    {
      marketName: "Test",
      description: "Test market description",
      tokenPool: "250",
      marketMaker: "CPMM",
    },
  ];

  const predictionData: Predictions[] = [
    {
      marketName: "Test",
      tokenAmount: "10",
      outcomeId: "Yes",
    },
  ];

  const supabase = createSupabaseBrowserClient();
  const [userId, setUserId] = useState<string | null>(null);
  const [activeTable, setActiveTable] = useState<"markets" | "predictions">(
    "markets"
  );

  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error) {
        console.error("Error fetching user:", error.message);
        return;
      }

      setUserId(user?.id || null);
    };

    fetchUser();
  }, []);

  return (
    <div className="w-full h-full">
      <div className="flex items-center justify-center">
        <h1 className="text-lg font-bold mb-4">User {userId}</h1>
      </div>

      <div className="flex justify-center space-x-4 mb-4">
        <button
          className={`px-4 py-2 rounded ${
            activeTable === "markets" ? "bg-blue-500 text-white" : "bg-gray-200"
          }`}
          onClick={() => setActiveTable("markets")}
        >
          Show Markets
        </button>
        <button
          className={`px-4 py-2 rounded ${
            activeTable === "predictions"
              ? "bg-blue-500 text-white"
              : "bg-gray-200"
          }`}
          onClick={() => setActiveTable("predictions")}
        >
          Show Predictions
        </button>
      </div>

      {activeTable === "markets" ? (
        <div>
          <h2 className="text-center text-xl font-bold mb-4">Markets Table</h2>
          <MarketTable data={sampleData} />
        </div>
      ) : (
        <div>
          <h2 className="text-center text-xl font-bold mb-4">
            Predictions Table
          </h2>
          <PredictionsTable data={predictionData} />
        </div>
      )}
    </div>
  );
}
