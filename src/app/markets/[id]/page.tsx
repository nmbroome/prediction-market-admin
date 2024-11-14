"use client"

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser-client';

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

  useEffect(() => {
    async function fetchMarketData() {
      if (id) {
        // Fetch market details
        const { data: marketData, error: marketError } = await supabase
          .from('markets')
          .select('id, name, description, token_pool, market_maker')
          .eq('id', id)
          .single();

        if (marketError) {
          console.error('Error fetching market:', marketError.message);
        } else {
          setMarket(marketData as Market);
        }

        // Fetch answers associated with the market
        const { data: answersData, error: answersError } = await supabase
          .from('answers')
          .select('id, name, tokens, market_id')
          .eq('market_id', id);

        if (answersError) {
          console.error('Error fetching answers:', answersError.message);
        } else {
          setAnswers(answersData as Answer[]);
        }
      }
    }

    fetchMarketData();
  }, [id]);

  if (!market) return <div>Loading...</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">{market.name}</h1>
      <p className="mt-2">{market.description}</p>
      <p className="mt-4"><strong>Token Pool:</strong> {market.token_pool}</p>
      <p className="mt-2"><strong>Market Maker:</strong> {market.market_maker}</p>

      {/* Display answers */}
      <div className="mt-6">
        <h2 className="text-xl font-semibold">Possible Answers</h2>
        {answers.length > 0 ? (
          <ul className="list-disc list-inside mt-2">
            {answers.map((answer) => (
              <li key={answer.id} className="mt-1">
                <strong>{answer.name}</strong>: {answer.tokens / market.token_pool}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2">No answers available for this market.</p>
        )}
      </div>
    </div>
  );
}
