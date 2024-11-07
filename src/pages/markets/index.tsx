import { useEffect, useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser-client';

const supabase = createSupabaseBrowserClient();

export default function ViewMarkets() {
  type Market = {
    id: number;
    name: string;
    description: string;
    token_pool: number;
  };

  const [markets, setMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMarkets = async () => {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase.from('markets').select('*');
      
      if (error) {
        setError('Failed to load markets');
      } else {
        setMarkets(data || []);
      }
      setLoading(false);
    };

    fetchMarkets();
  }, []);

  if (loading) {
    return <p>Loading...</p>;
  }

  if (error) {
    return <p className="text-red-600">{error}</p>;
  }

  return (
    <div className="max-w-5xl mx-auto p-6 bg-gray-900 text-white rounded-lg shadow-md border border-gray-700">
      <h1 className="text-3xl font-bold mb-6 text-center">All Markets</h1>
      {markets.length === 0 ? (
        <p>No markets available.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="table-auto min-w-full bg-gray-800 border-collapse border border-gray-700">
            <thead>
              <tr>
                <th className="py-3 px-4 border-b border-gray-700 text-left font-semibold bg-gray-900">Name</th>
                <th className="py-3 px-4 border-b border-gray-700 text-left font-semibold bg-gray-900">Description</th>
                <th className="py-3 px-4 border-b border-gray-700 text-left font-semibold bg-gray-900">Total Tokens</th>
              </tr>
            </thead>
            <tbody>
              {markets.map((market) => (
                <tr key={market.id} className="hover:bg-gray-700">
                  <td className="py-3 px-4 border-b border-gray-700">{market.name}</td>
                  <td className="py-3 px-4 border-b border-gray-700">{market.description}</td>
                  <td className="py-3 px-4 border-b border-gray-700">{market.token_pool}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
