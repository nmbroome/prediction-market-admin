export function constantProductMarketMaker(
  outcome1_tokens: number,
  outcome2_tokens: number,
  predict_amt: number
): number {
  if (predict_amt <= 0) {
    throw new Error("Prediction amount must be greater than zero.");
  }
  if (outcome1_tokens <= 0 || outcome2_tokens <= 0) {
    throw new Error("Token pools must be greater than zero.");
  }

  const k = outcome1_tokens * outcome2_tokens;
  const new_outcome1_tokens = outcome1_tokens + predict_amt;
  const new_outcome2_tokens = k / new_outcome1_tokens;
  const return_amt = outcome2_tokens - new_outcome2_tokens;

  return return_amt;
}
