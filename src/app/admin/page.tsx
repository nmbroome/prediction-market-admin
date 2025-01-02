"use client";

import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser-client";
import MarketTable from "@/components/MarketTable";
import PredictionsTable from "@/components/PredictionHistory";

export default function Admin() {

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

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="w-full h-full">
      <div className="flex items-center justify-center">
        <h1 className="text-lg font-bold mb-4">User {userId}</h1>
      </div>

      <div className="flex justify-center space-x-4 mb-4">
        <button
          className={`px-4 py-2 rounded ${
            activeTable === "markets" ? "bg-blue-500 text-white" : "bg-gray-200 text-black"
          }`}
          onClick={() => setActiveTable("markets")}
        >
          Show Markets
        </button>
        <button
          className={`px-4 py-2 rounded ${
            activeTable === "predictions"
              ? "bg-blue-500 text-white"
              : "bg-gray-200 text-black"
          }`}
          onClick={() => setActiveTable("predictions")}
        >
          Show Predictions
        </button>
      </div>

      {activeTable === "markets" ? (
        <div>
          <h2 className="text-center text-xl font-bold mb-4">Markets Table</h2>
          <MarketTable />
        </div>
      ) : (
        <div>
          <h2 className="text-center text-xl font-bold mb-4">
            Predictions Table
          </h2>
          <PredictionsTable />
        </div>
      )}
    </div>
  );
}
