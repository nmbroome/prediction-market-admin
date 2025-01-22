"use client";

import { useState } from 'react';
import { NextPage } from 'next';

const MarketMakerTestPage: NextPage = () => {
  const [tokenA, setTokenA] = useState('TokenA');
  const [tokenB, setTokenB] = useState('TokenB');
  const [reserveA, setReserveA] = useState<number>(1000);
  const [reserveB, setReserveB] = useState<number>(1000);
  const [inputToken, setInputToken] = useState('TokenA');
  const [amountIn, setAmountIn] = useState<number>(0);
  const [marketMaker, setMarketMaker] = useState<'cpmm' | 'maniswap'>('cpmm');

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-black">
      <div className="flex flex-col items-center bg-gray-100 p-4 rounded-md shadow-md w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">Market Maker Test</h2>
        <div className="flex flex-col gap-4 w-full">
          <div>
            <label className="block font-medium">Market Maker Type:</label>
            <select
              value={marketMaker}
              onChange={(e) => setMarketMaker(e.target.value as 'cpmm' | 'maniswap')}
              className="w-full p-2 border border-gray-300 rounded-md"
            >
              <option value="cpmm">CPMM (Constant Product Market Maker)</option>
              <option value="maniswap">Maniswap (Manifold Markets)</option>
            </select>
          </div>
          <div>
            <label className="block font-medium">Token A:</label>
            <input
              type="text"
              value={tokenA}
              onChange={(e) => setTokenA(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label className="block font-medium">Token B:</label>
            <input
              type="text"
              value={tokenB}
              onChange={(e) => setTokenB(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label className="block font-medium">Reserve A:</label>
            <input
              type="number"
              value={reserveA}
              onChange={(e) => setReserveA(Number(e.target.value))}
              className="w-full p-2 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label className="block font-medium">Reserve B:</label>
            <input
              type="number"
              value={reserveB}
              onChange={(e) => setReserveB(Number(e.target.value))}
              className="w-full p-2 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label className="block font-medium">Input Token:</label>
            <select
              value={inputToken}
              onChange={(e) => setInputToken(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
            >
              <option value="TokenA">TokenA</option>
              <option value="TokenB">TokenB</option>
            </select>
          </div>
          <div>
            <label className="block font-medium">Amount In:</label>
            <input
              type="number"
              value={amountIn}
              onChange={(e) => setAmountIn(Number(e.target.value))}
              className="w-full p-2 border border-gray-300 rounded-md"
            />
          </div>
          <button
            className="bg-blue-500 text-white p-2 rounded-md hover:bg-blue-600 transition-colors"
          >
            Swap Tokens
          </button>
        </div>
      </div>
        <div className="mt-4 p-4 bg-white shadow-md rounded-md">
          <h3 className="text-lg font-semibold">Swap Result:</h3>
          <p>Amount Out: </p>
          <p>New Reserve A: </p>
          <p>New Reserve B: </p>
        </div>
    </div>
  );
};

export default MarketMakerTestPage;
