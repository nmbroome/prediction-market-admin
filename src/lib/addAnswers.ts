import supabase from "@/lib/supabase/createClient";

interface Answer {
  market_id: number;
  creator_id: string;
  name: string;
  tokens: number;
  created_at: string;
}

export async function addAnswers(marketId: number, userId: string, answers: { answer: string; token_pool: number }[]) {
  const answerInsertions: Answer[] = answers.map((answer) => ({
    market_id: marketId,
    creator_id: userId,
    name: answer.answer,
    tokens: answer.token_pool,
    created_at: new Date().toISOString(),
  }));

  const { error } = await supabase.from('outcomes').insert(answerInsertions);

  if (error) {
    throw new Error(`Failed to add answers: ${error.message}`);
  }
}
