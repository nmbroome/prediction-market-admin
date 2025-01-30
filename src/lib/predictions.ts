import supabase from "@/lib/supabase/createClient";

export interface Prediction {
  user_id: string;
  market_id: number;
  outcome_id: number;
  predict_amt: number;
  return_amt: number;
}

export async function addPrediction(prediction: Prediction) {
  const { data, error } = await supabase.from("predictions").insert(prediction).select("*").single();

  if (error) {
    throw new Error(`Failed to add prediction: ${error.message}`);
  }

  return data;
}
