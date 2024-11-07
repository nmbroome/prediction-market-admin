"use client"

import React, { useState } from 'react';

const ConstantProductMarketMaker: React.FC = () => {
  const [reserveX, setReserveX] = useState(1000);
  const [reserveY, setReserveY] = useState(1000);
  const [amount, setAmount] = useState(0);
  const k = reserveX * reserveY;

  const getPriceXInY = () => reserveY / reserveX;
  const getPriceYInX = () => reserveX / reserveY;

  const handlePredictYes = () => {
    const newReserveX = reserveX + amount;
    const newReserveY = k / newReserveX;
    const amountYReceived = reserveY - newReserveY;

    setReserveX(newReserveX);
    setReserveY(newReserveY);
    alert(`Amount of Y received: ${amountYReceived.toFixed(2)}`);
  };

  const handlePredictNo = () => {
    const newReserveY = reserveY + amount;
    const newReserveX = k / newReserveY;
    const amountXReceived = reserveX - newReserveX;

    setReserveY(newReserveY);
    setReserveX(newReserveX);
    alert(`Amount of X received: ${amountXReceived.toFixed(2)}`);
  };

  return (
    <div>
      <h1>Constant Product Market Maker</h1>
      <div>
        <p>Reserve X: {reserveX}</p>
        <p>Reserve Y: {reserveY}</p>
        <p>Price of X in terms of Y: {getPriceXInY().toFixed(2)}</p>
        <p>Price of Y in terms of X: {getPriceYInX().toFixed(2)}</p>
      </div>
      <div>
        <h2>Predict Swap Outcome</h2>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(Number(e.target.value))}
        />
        <button onClick={handlePredictYes}>Predict Yes (Swap X for Y)</button>
        <button onClick={handlePredictNo}>Predict No (Swap Y for X)</button>
      </div>
    </div>
  );
};

export default ConstantProductMarketMaker;
