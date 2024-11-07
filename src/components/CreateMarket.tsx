'use client'

import { useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser-client';

const supabase = createSupabaseBrowserClient();

const getUserId = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  return user ? user.id : null;
};

export default function CreateMarketForm() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [tokens, setTokens] = useState(100);
  const [marketMaker, setMarketMaker] = useState('CPMM');
  const [answers, setAnswers] = useState<{ answer: string; token_pool: number }[]>([
    { answer: '', token_pool: 50 },
    { answer: '', token_pool: 50 },
  ]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleAnswerChange = (index: number, field: 'answer' | 'token_pool', value: string | number) => {
    const newAnswers = [...answers];
    newAnswers[index] = {
      ...newAnswers[index],
      [field]: value,
    };
    setAnswers(newAnswers);

    // Update total tokens if token_pool is changed
    if (field === 'token_pool') {
      const totalTokens = newAnswers.reduce((acc, answer) => acc + answer.token_pool, 0);
      setTokens(totalTokens);
    }
  };

  const addAnswerField = () => {
    setAnswers([...answers, { answer: '', token_pool: 0 }]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    const userId = await getUserId();
    if (!userId) {
      setError('User is not logged in.');
      return;
    }
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const totalAnswerTokens = answers.reduce((acc, answer) => acc + answer.token_pool, 0);
    if (totalAnswerTokens !== tokens) {
      setError('The total of all answer token pools must equal the total market tokens.');
      return;
    }

    const { data: market, error: insertError } = await supabase.from('markets').insert([
      {
        name,
        description,
        token_pool: tokens,
        market_maker: marketMaker,
        creator_id: userId,
        created_at: new Date().toISOString(),
      }
    ]).select('*').single();

    if (insertError || !market) {
      setError(insertError?.message || 'Failed to create market');
    } else {
      const { id: marketId } = market;
      const answerInsertions = answers.map((answer) => ({
        market_id: marketId,
        creator_id: userId,
        name: answer.answer,
        tokens: answer.token_pool,
        created_at: new Date().toISOString(),
      }));

      const { error: answersError } = await supabase.from('answers').insert(answerInsertions);

      if (answersError) {
        setError('Failed to add answers to the market');
      } else {
        setSuccess('Market and answers created successfully!');
        setTokens(totalAnswerTokens);
        setName('');
        setDescription('');
        setTokens(0);
        setAnswers([{ answer: '', token_pool: 0 }]);
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-lg mx-auto p-6 bg-gray-100 rounded-lg shadow-md">
      <div className="mb-4">
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">Market Name:</label>
        <input
          type="text"
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="text-black mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        />
      </div>
      <div className="mb-4">
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description:</label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          className="text-black mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        />
      </div>
      <div className="mb-4">
        <label htmlFor="tokens" className="block text-sm font-medium text-gray-700">Total Market Tokens:</label>
        <input
          type="number"
          id="tokens"
          value={tokens}
          onChange={(e) => setTokens(Number(e.target.value))}
          required
          className="text-black mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        />
      </div>
      <div className="mb-4">
        <label htmlFor="marketMaker" className="block text-sm font-medium text-gray-700">Market Maker:</label>
        <select
          id="marketMaker"
          value={marketMaker}
          onChange={(e) => setMarketMaker(e.target.value)}
          required
          className="text-black mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        >
          <option value="CPMM">CPMM</option>
          <option value="Maniswap">Maniswap</option>
        </select>
      </div>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700">Initial Answers:</label>
        {answers.map((answer, index) => (
          <div key={index} className="flex gap-4 mt-2">
            <input
              type="text"
              value={answer.answer}
              onChange={(e) => handleAnswerChange(index, 'answer', e.target.value)}
              required
              placeholder="Answer"
              className="text-black flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
            <input
              type="number"
              value={answer.token_pool}
              onChange={(e) => handleAnswerChange(index, 'token_pool', Number(e.target.value))}
              required
              placeholder="Token Pool (Initial Value)"
              className="text-black w-1/4 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
        ))}
        <button
          type="button"
          onClick={addAnswerField}
          className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Add Another Answer
        </button>
      </div>
      <button
        type="submit"
        className="w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
      >
        Create Market
      </button>
      {error && <p className="mt-4 text-red-600">{error}</p>}
      {success && <p className="mt-4 text-green-600">{success}</p>}
    </form>
  );
}
