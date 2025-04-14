"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import supabase from "@/lib/supabase/createClient";
import Navbar from "@/components/navbar";
import Link from "next/link";

interface Profile {
  id: string;
  username?: string;
  payment_type?: string;
  paypal_info?: string | null;
  mturk_info?: string | null;
  balance?: number;
  created_at?: string;
  is_admin?: boolean;
}

interface Prediction {
  id: number;
  market_id: number;
  outcome_id: number;
  predict_amt: number;
  return_amt: number;
  created_at: string;
  market_name?: string;
  outcome_name?: string;
}

export default function PlayerDetailsPage() {
  const { id } = useParams();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPlayerData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch player profile
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", id)
          .single();

        if (profileError) throw profileError;
        setProfile(profileData);

        // Fetch player predictions
        const { data: predictionsData, error: predictionsError } = await supabase
          .from("predictions")
          .select("*")
          .eq("user_id", id);

        if (predictionsError) throw predictionsError;

        // Get all markets to add market names
        const { data: marketsData, error: marketsError } = await supabase
          .from("markets")
          .select("id, name");

        if (marketsError) throw marketsError;

        // Get all outcomes to add outcome names
        const { data: outcomesData, error: outcomesError } = await supabase
          .from("outcomes")
          .select("id, name");

        if (outcomesError) throw outcomesError;

        // Enrich predictions with market and outcome names
        const enrichedPredictions = predictionsData.map((prediction) => {
          const market = marketsData.find((m) => m.id === prediction.market_id);
          const outcome = outcomesData.find((o) => o.id === prediction.outcome_id);
          
          return {
            ...prediction,
            market_name: market?.name || "Unknown Market",
            outcome_name: outcome?.name || "Unknown Outcome"
          };
        });

        setPredictions(enrichedPredictions);
      } catch (err) {
        console.error("Error fetching player data:", err);
        setError("Failed to load player data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchPlayerData();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white">
        <Navbar />
        <div className="container mx-auto p-4">
          <div className="flex justify-center items-center py-8">
            <p className="text-xl">Loading player data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-black text-white">
        <Navbar />
        <div className="container mx-auto p-4">
          <div className="bg-red-900 p-4 rounded">
            <p className="text-white">{error || "Player not found"}</p>
            <Link href="/players" className="text-blue-300 hover:underline mt-2 inline-block">
              ← Back to players list
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />
      <div className="container mx-auto p-4">
        <div className="mb-4">
          <Link href="/players" className="text-blue-400 hover:underline flex items-center">
            ← Back to players list
          </Link>
        </div>

        <div className="bg-gray-900 rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-2xl font-bold mb-6 border-b border-gray-700 pb-4">
            Player Profile: {profile.username || "Anonymous"}
          </h1>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h2 className="text-xl font-semibold mb-4">Basic Information</h2>
              <div className="space-y-3">
                <p className="flex justify-between">
                  <span className="text-gray-400">Username:</span>
                  <span>{profile.username || "Not set"}</span>
                </p>
                <p className="flex justify-between">
                  <span className="text-gray-400">User ID:</span>
                  <span className="font-mono text-sm">{profile.id}</span>
                </p>
                <p className="flex justify-between">
                  <span className="text-gray-400">Account Balance:</span>
                  <span>{typeof profile.balance === 'number' ? profile.balance.toFixed(2) : 'N/A'}</span>
                </p>
                <p className="flex justify-between">
                  <span className="text-gray-400">Account Created:</span>
                  <span>
                    {profile.created_at 
                      ? new Date(profile.created_at).toLocaleDateString() 
                      : "N/A"}
                  </span>
                </p>
                <p className="flex justify-between">
                  <span className="text-gray-400">Account Type:</span>
                  <span>{profile.is_admin ? "Administrator" : "Standard User"}</span>
                </p>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-4">Payment Information</h2>
              <div className="space-y-3">
                <p className="flex justify-between">
                  <span className="text-gray-400">Payment Type:</span>
                  <span>{profile.payment_type || "Not set"}</span>
                </p>
                {profile.payment_type === "PayPal" && (
                  <p className="flex justify-between">
                    <span className="text-gray-400">PayPal Email:</span>
                    <span>{profile.paypal_info || "Not provided"}</span>
                  </p>
                )}
                {profile.payment_type === "MTurk" && (
                  <p className="flex justify-between">
                    <span className="text-gray-400">MTurk ID:</span>
                    <span>{profile.mturk_info || "Not provided"}</span>
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gray-900 rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4 border-b border-gray-700 pb-4">
            Prediction History
          </h2>

          {predictions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-gray-800 text-white border border-gray-700 rounded-lg">
                <thead>
                  <tr className="bg-gray-700">
                    <th className="px-4 py-3 text-left">Market</th>
                    <th className="px-4 py-3 text-left">Outcome</th>
                    <th className="px-4 py-3 text-right">Prediction</th>
                    <th className="px-4 py-3 text-right">Potential Return</th>
                    <th className="px-4 py-3 text-right">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {predictions.map((prediction) => (
                    <tr key={prediction.id} className="border-t border-gray-700 hover:bg-gray-700">
                      <td className="px-4 py-3">
                        <Link 
                          href={`/markets/${prediction.market_id}`}
                          className="text-blue-400 hover:underline"
                        >
                          {prediction.market_name}
                        </Link>
                      </td>
                      <td className="px-4 py-3">{prediction.outcome_name}</td>
                      <td className="px-4 py-3 text-right">{prediction.predict_amt.toFixed(2)}</td>
                      <td className="px-4 py-3 text-right">{prediction.return_amt.toFixed(2)}</td>
                      <td className="px-4 py-3 text-right">
                        {new Date(prediction.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-center py-4">This player has not made any predictions yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}