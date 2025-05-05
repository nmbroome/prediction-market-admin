'use client';

import React, { useState, useEffect } from 'react';
import supabase from '@/lib/supabase/createClient';
import { useRouter } from 'next/navigation';

interface Player {
  id: string;
  username: string;
  email: string;
  payment_id: string; // PayPal email or MTurk Worker ID
  payment_method: 'PayPal' | 'MTurk' | null;
  balance: number;
}

interface Payment {
  id: string;
  player_id: string;
  amount: number;
  payment_method: 'PayPal' | 'MTurk';
  transaction_id: string | null;
  status: 'Pending' | 'Completed' | 'Failed';
  created_at: string;
}

const PaymentsPage: React.FC = () => {
  const router = useRouter();
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedPlayers, setSelectedPlayers] = useState<Map<string, number>>(new Map());
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState<boolean>(false);

  // Fetch user and players data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Verify user is logged in
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
          setError('User not logged in.');
          router.push('/auth');
          return;
        }

        // Fetch all players
        const { data: playersData, error: playersError } = await supabase
          .from('profiles')
          .select('id, username, email, payment_id, payment_method, balance');

        if (playersError) throw new Error(playersError.message);

        setPlayers(playersData || []);
      } catch (err) {
        setError(`Error fetching data: ${err}`);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  // Handle amount input change with validation
  const handleAmountChange = (payment_id: string, amount: string) => {
    const value = parseFloat(amount) || 0;
    const player = players.find((p) => p.payment_id === payment_id);
    if (player && (value < 0 || value > player.balance)) {
      setError(`Amount for ${player.username} must be between 0 and ${player.balance.toFixed(2)}.`);
      return;
    }
    setSelectedPlayers((prev) => new Map(prev).set(payment_id, value));
  };

  // Toggle player selection
  const togglePlayerSelection = (payment_id: string) => {
    setSelectedPlayers((prev) => {
      const newSelection = new Map(prev);
      if (newSelection.has(payment_id)) {
        newSelection.delete(payment_id);
      } else {
        newSelection.set(payment_id, 0);
      }
      return newSelection;
    });
  };

  // Send payments with transaction logging
  const handleSendPayments = async () => {
    if (selectedPlayers.size === 0) {
      setError('Please select at least one player.');
      setShowConfirm(false);
      return;
    }

    // Validate all amounts
    for (const [payment_id, amount] of selectedPlayers) {
      const player = players.find((p) => p.payment_id === payment_id);
      if (!player || amount <= 0 || amount > player.balance) {
        setError(`Invalid amount for ${player?.username || 'player'}: $${amount.toFixed(2)}.`);
        setShowConfirm(false);
        return;
      }
      if (!player.payment_id || !player.payment_method) {
        setError(`Missing payment details for ${player.username}.`);
        setShowConfirm(false);
        return;
      }
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const paymentRecords: Payment[] = [];
      const failedPayments: string[] = [];

      for (const [payment_id, amount] of selectedPlayers) {
        const player = players.find((p) => p.payment_id === payment_id);
        if (!player) continue;

        // Create payment record
        const { data: paymentData, error: paymentError } = await supabase
          .from('payments')
          .insert({
            player_id: player.id,
            amount,
            payment_method: player.payment_method,
            status: 'Pending',
          })
          .select()
          .single();

        if (paymentError) {
          failedPayments.push(`Failed to log payment for ${player.username}: ${paymentError.message}`);
          continue;
        }

        const payment = paymentData as Payment;

        // Process payment
        const isPayPal = player.payment_method === 'PayPal';
        const payload = isPayPal
          ? { email: player.payment_id, amount }
          : { workerId: player.payment_id, amount, reason: 'Prediction market payout' };

        const functionName = isPayPal ? 'send-paypal-payout' : 'send-mturk-bonus';

        const { data, error } = await supabase.functions.invoke(functionName, {
          body: payload,
        });

        if (error || !data?.transaction_id) {
          // Update payment status to Failed
          await supabase
            .from('payments')
            .update({ status: 'Failed' })
            .eq('id', payment.id);
          failedPayments.push(`Failed to send payment to ${player.username}: ${error?.message || 'No transaction ID'}`);
          continue;
        }

        // Update payment status and transaction ID
        await supabase
          .from('payments')
          .update({ status: 'Completed', transaction_id: data.transaction_id })
          .eq('id', payment.id);

        // Update player balance
        const newBalance = player.balance - amount;
        const { error: balanceError } = await supabase
          .from('profiles')
          .update({ balance: newBalance })
          .eq('id', player.id);

        if (balanceError) {
          failedPayments.push(`Failed to update balance for ${player.username}: ${balanceError.message}`);
          continue;
        }

        paymentRecords.push({ ...payment, status: 'Completed', transaction_id: data.transaction_id });
      }

      if (failedPayments.length > 0) {
        setError(`Some payments failed:\n${failedPayments.join('\n')}`);
      } else {
        setSuccess('All payments sent successfully!');
      }

      // Refresh players data
      const { data: updatedPlayers, error: playersError } = await supabase
        .from('profiles')
        .select('id, username, email, payment_id, payment_method, balance');
      if (!playersError) setPlayers(updatedPlayers || []);

      setSelectedPlayers(new Map());
    } catch (err) {
      setError(`Error processing payments: ${err}`);
    } finally {
      setLoading(false);
      setShowConfirm(false);
    }
  };

  // Render
  return (
    <div className="container mx-auto p-6 bg-gray-900 min-h-screen text-white">
      <h2 className="text-2xl font-bold mb-6">Send Payments</h2>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      {success && <p className="text-green-500 mb-4">{success}</p>}
      {loading ? (
        <p className="text-center">Loading...</p>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-gray-800 rounded-lg shadow-md">
              <thead>
                <tr className="bg-gray-700 text-left text-sm font-semibold">
                  <th className="px-4 py-3">Select</th>
                  <th className="px-4 py-3">Username</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Payment Method</th>
                  <th className="px-4 py-3">Payment ID</th>
                  <th className="px-4 py-3">Balance</th>
                  <th className="px-4 py-3">Amount ($)</th>
                </tr>
              </thead>
              <tbody>
                {players.map((player, index) => (
                  <tr
                    key={player.id}
                    className={`border-b ${index % 2 === 0 ? 'bg-gray-800' : 'bg-gray-900'}`}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedPlayers.has(player.payment_id)}
                        onChange={() => togglePlayerSelection(player.payment_id)}
                        className="h-5 w-5 text-blue-600"
                        disabled={!player.payment_id || !player.payment_method}
                      />
                    </td>
                    <td className="px-4 py-3">{player.username}</td>
                    <td className="px-4 py-3">{player.email}</td>
                    <td className="px-4 py-3">{player.payment_method || 'N/A'}</td>
                    <td className="px-4 py-3">{player.payment_id || 'N/A'}</td>
                    <td className="px-4 py-3">${player.balance.toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={selectedPlayers.get(player.payment_id) || ''}
                        onChange={(e) => handleAmountChange(player.payment_id, e.target.value)}
                        disabled={!selectedPlayers.has(player.payment_id)}
                        className="w-24 p-2 bg-gray-700 border border-gray-600 rounded text-white"
                        placeholder="0.00"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button
            onClick={() => setShowConfirm(true)}
            disabled={loading || selectedPlayers.size === 0}
            className={`mt-6 px-6 py-2 rounded-lg font-semibold ${
              loading || selectedPlayers.size === 0
                ? 'bg-gray-600 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {loading ? 'Processing...' : 'Send Payments'}
          </button>
          {showConfirm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
                <h3 className="text-lg font-semibold mb-4">Confirm Payments</h3>
                <p>Are you sure you want to send the following payments?</p>
                <ul className="my-4">
                  {Array.from(selectedPlayers.entries()).map(([payment_id, amount]) => {
                    const player = players.find((p) => p.payment_id === payment_id);
                    return (
                      <li key={payment_id}>
                        {player?.username}: ${amount.toFixed(2)} via {player?.payment_method}
                      </li>
                    );
                  })}
                </ul>
                <div className="flex justify-end gap-4">
                  <button
                    onClick={() => setShowConfirm(false)}
                    className="px-4 py-2 bg-gray-600 rounded hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSendPayments}
                    className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700"
                  >
                    Confirm
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default PaymentsPage;