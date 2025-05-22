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
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
  const [batchPaymentAmount, setBatchPaymentAmount] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showBatchConfirm, setShowBatchConfirm] = useState<boolean>(false);
  const [showCycleConfirm, setShowCycleConfirm] = useState<boolean>(false);
  const [processingCycle, setProcessingCycle] = useState<boolean>(false);
  const [processingBatch, setProcessingBatch] = useState<boolean>(false);

  // Calculate the start and end dates for the current 2-week cycle (previous 14 days)
  const getCurrentCycleDates = () => {
    const now = new Date();
    const cycleEnd = new Date(now);
    cycleEnd.setHours(23, 59, 59, 999); // Set to end of today
    
    const cycleStart = new Date(now);
    cycleStart.setDate(now.getDate() - 13); // 14 days total (today + previous 13 days)
    cycleStart.setHours(0, 0, 0, 0); // Set to start of day
    
    return {
      start: cycleStart.toLocaleDateString(),
      end: cycleEnd.toLocaleDateString()
    };
  };

  const cycleDates = getCurrentCycleDates();

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

  // Handle batch user selection
  const toggleBatchUserSelection = (userId: string) => {
    setSelectedUserIds((prev) => {
      const newSelection = new Set(prev);
      if (newSelection.has(userId)) {
        newSelection.delete(userId);
      } else {
        newSelection.add(userId);
      }
      return newSelection;
    });
  };

  // Select/deselect all users for batch payment
  const toggleSelectAll = () => {
    const eligibleUsers = players.filter(p => p.payment_id && p.payment_method);
    if (selectedUserIds.size === eligibleUsers.length) {
      setSelectedUserIds(new Set());
    } else {
      setSelectedUserIds(new Set(eligibleUsers.map(p => p.id)));
    }
  };

  // Get selected players data
  const getSelectedPlayersForBatch = () => {
    return players.filter(p => selectedUserIds.has(p.id));
  };

  // Calculate total batch payment amount
  const calculateTotalBatchAmount = () => {
    const amount = parseFloat(batchPaymentAmount) || 0;
    return amount * selectedUserIds.size;
  };

  // Validate batch payment amount
  const validateBatchPayment = () => {
    const amount = parseFloat(batchPaymentAmount) || 0;
    if (amount <= 0) {
      return 'Payment amount must be greater than 0';
    }
    
    const selectedPlayers = getSelectedPlayersForBatch();
    for (const player of selectedPlayers) {
      if (amount > player.balance) {
        return `Amount ${amount.toFixed(2)} exceeds ${player.username}'s balance of ${player.balance.toFixed(2)}`;
      }
    }
    return null;
  };

  // Handle batch payments
  const handleBatchPayments = async () => {
    if (selectedUserIds.size === 0) {
      setError('Please select at least one user.');
      setShowBatchConfirm(false);
      return;
    }

    const validationError = validateBatchPayment();
    if (validationError) {
      setError(validationError);
      setShowBatchConfirm(false);
      return;
    }

    setProcessingBatch(true);
    setError(null);
    setSuccess(null);

    try {
      const amount = parseFloat(batchPaymentAmount);
      const selectedPlayers = getSelectedPlayersForBatch();
      const paymentRecords: Payment[] = [];
      const failedPayments: string[] = [];
      const workerIds: string[] = [];

      for (const player of selectedPlayers) {
        if (!player.payment_id || !player.payment_method) {
          failedPayments.push(`Missing payment details for ${player.username}`);
          continue;
        }

        // Collect worker IDs for batch processing
        workerIds.push(player.payment_id);

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

      console.log('Batch payment worker IDs:', workerIds); // For debugging - you can use this list in your payment function

      if (failedPayments.length > 0) {
        setError(`Some payments failed:\n${failedPayments.join('\n')}`);
      } else {
        setSuccess(`Successfully processed ${paymentRecords.length} batch payments!`);
      }

      // Refresh players data
      const { data: updatedPlayers, error: playersError } = await supabase
        .from('profiles')
        .select('id, username, email, payment_id, payment_method, balance');
      if (!playersError) setPlayers(updatedPlayers || []);

      // Reset selections
      setSelectedUserIds(new Set());
      setBatchPaymentAmount('');
    } catch (err) {
      setError(`Error processing batch payments: ${err}`);
    } finally {
      setProcessingBatch(false);
      setShowBatchConfirm(false);
    }
  };

  // Handle payment for all active users for the current cycle
  const handleCyclePayments = async () => {
    setProcessingCycle(true);
    setError(null);
    setSuccess(null);

    try {
      // This is where you would implement the logic for processing payments for all active users
      // For now, just show a success message
      setTimeout(() => {
        setSuccess(`Cycle payments for ${cycleDates.start} to ${cycleDates.end} will be processed. Actual implementation pending.`);
        setProcessingCycle(false);
        setShowCycleConfirm(false);
      }, 1500);
    } catch (err) {
      setError(`Error processing cycle payments: ${err}`);
      setProcessingCycle(false);
      setShowCycleConfirm(false);
    }
  };

  // Render
  return (
    <div className="container mx-auto p-6 bg-gray-900 min-h-screen text-white">
      <h2 className="text-2xl font-bold mb-6">Send Payments</h2>

      {/* Batch Payment Selection Section */}
      <div className="bg-gray-800 p-4 mb-6 rounded-lg shadow-md border border-gray-700">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex-1">
            <h3 className="text-xl font-semibold mb-2">Batch Payment Selection</h3>
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-300">
              <span>
                <strong>{selectedUserIds.size}</strong> users selected
              </span>
              {selectedUserIds.size > 0 && (
                <>
                  <span>•</span>
                  <span>
                    Payment per user: <strong>${parseFloat(batchPaymentAmount) || 0}</strong>
                  </span>
                  <span>•</span>
                  <span>
                    Total amount: <strong>${calculateTotalBatchAmount().toFixed(2)}</strong>
                  </span>
                </>
              )}
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
            <div className="flex items-center gap-2">
              <label htmlFor="batchAmount" className="text-sm font-medium whitespace-nowrap">
                Amount per user:
              </label>
              <input
                id="batchAmount"
                type="number"
                min="0.01"
                step="0.01"
                value={batchPaymentAmount}
                onChange={(e) => setBatchPaymentAmount(e.target.value)}
                className="w-24 p-2 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                placeholder="0.00"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={toggleSelectAll}
                className="px-3 py-2 bg-gray-600 hover:bg-gray-700 rounded text-sm font-medium transition-colors"
                disabled={loading}
              >
                {selectedUserIds.size === players.filter(p => p.payment_id && p.payment_method).length ? 'Deselect All' : 'Select All'}
              </button>
              <button
                onClick={() => setShowBatchConfirm(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded font-medium transition-colors"
                disabled={loading || selectedUserIds.size === 0 || !batchPaymentAmount || processingBatch}
              >
                {processingBatch ? 'Processing...' : `Pay ${selectedUserIds.size} Users`}
              </button>
            </div>
          </div>
        </div>
        {selectedUserIds.size > 0 && (
          <div className="mt-3 p-3 bg-gray-700 rounded-md">
            <p className="text-sm text-gray-300 mb-2">Selected users:</p>
            <div className="flex flex-wrap gap-2">
              {getSelectedPlayersForBatch().map((player) => (
                <span
                  key={player.id}
                  className="px-2 py-1 bg-blue-600 text-white text-xs rounded-md"
                >
                  {player.username}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Cycle Payment Button */}
      <div className="bg-gray-800 p-4 mb-6 rounded-lg shadow-md border border-gray-700">
        <div className="flex flex-col sm:flex-row justify-between items-center">
          <div>
            <h3 className="text-xl font-semibold">Current Payment Cycle</h3>
            <p className="text-gray-300 mt-1">
              {cycleDates.start} - {cycleDates.end}
            </p>
          </div>
          <button
            onClick={() => setShowCycleConfirm(true)}
            className="mt-3 sm:mt-0 px-6 py-2 bg-green-600 hover:bg-green-700 rounded-lg font-semibold transition-colors"
            disabled={loading || processingCycle}
          >
            {processingCycle ? 'Processing...' : 'Pay All Active Users For Current Cycle'}
          </button>
        </div>
      </div>

      {error && <p className="text-red-500 mb-4 whitespace-pre-line">{error}</p>}
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
                  <th className="px-4 py-3">Payment ID</th>
                  <th className="px-4 py-3">Balance</th>
                </tr>
              </thead>
              <tbody>
                {players.map((player, index) => (
                  <tr
                    key={player.id}
                    className={`border-b ${index % 2 === 0 ? 'bg-gray-800' : 'bg-gray-900'} ${
                      selectedUserIds.has(player.id) ? 'ring-2 ring-blue-500' : ''
                    }`}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedUserIds.has(player.id)}
                        onChange={() => toggleBatchUserSelection(player.id)}
                        className="h-5 w-5 text-blue-600 rounded focus:ring-blue-500 focus:ring-2"
                        disabled={loading}
                      />
                    </td>
                    <td className="px-4 py-3 font-medium">{player.username}</td>
                    <td className="px-4 py-3">{player.email}</td>
                    <td className="px-4 py-3 text-sm text-gray-300">{player.payment_id || 'N/A'}</td>
                    <td className="px-4 py-3 font-semibold">${player.balance.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Modal for batch payment confirmation */}
          {showBatchConfirm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-gray-800 p-6 rounded-lg shadow-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
                <h3 className="text-lg font-semibold mb-4">Confirm Batch Payments</h3>
                <div className="mb-4 p-4 bg-gray-700 rounded-md">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-300">Users selected:</span>
                      <span className="ml-2 font-semibold">{selectedUserIds.size}</span>
                    </div>
                    <div>
                      <span className="text-gray-300">Amount per user:</span>
                      <span className="ml-2 font-semibold">${parseFloat(batchPaymentAmount).toFixed(2)}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-gray-300">Total payment amount:</span>
                      <span className="ml-2 font-semibold text-green-400">${calculateTotalBatchAmount().toFixed(2)}</span>
                    </div>
                  </div>
                </div>
                <p className="mb-4">The following users will receive payments:</p>
                <div className="max-h-60 overflow-y-auto mb-4 bg-gray-900 rounded-md p-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {getSelectedPlayersForBatch().map((player) => (
                      <div key={player.id} className="flex justify-between items-center py-1 px-2 bg-gray-800 rounded text-sm">
                        <span>{player.username}</span>
                        <span className="text-gray-400">${parseFloat(batchPaymentAmount).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex justify-end gap-4">
                  <button
                    onClick={() => setShowBatchConfirm(false)}
                    className="px-4 py-2 bg-gray-600 rounded hover:bg-gray-700"
                    disabled={processingBatch}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleBatchPayments}
                    className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700"
                    disabled={processingBatch}
                  >
                    {processingBatch ? 'Processing...' : 'Confirm Batch Payment'}
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {/* Modal for cycle payment */}
          {showCycleConfirm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-gray-800 p-6 rounded-lg shadow-lg max-w-md w-full">
                <h3 className="text-lg font-semibold mb-4">Confirm Cycle Payments</h3>
                <p>Are you sure you want to process payments for all active users for the current cycle?</p>
                <p className="mt-2 text-gray-300">
                  Cycle period: {cycleDates.start} - {cycleDates.end}
                </p>
                <div className="mt-6 text-amber-400 bg-amber-900/30 p-3 rounded-md">
                  <p>Note: This will calculate and process payments for all eligible users based on their activity during the current cycle.</p>
                </div>
                <div className="flex justify-end gap-4 mt-6">
                  <button
                    onClick={() => setShowCycleConfirm(false)}
                    className="px-4 py-2 bg-gray-600 rounded hover:bg-gray-700"
                    disabled={processingCycle}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCyclePayments}
                    className="px-4 py-2 bg-green-600 rounded hover:bg-green-700"
                    disabled={processingCycle}
                  >
                    {processingCycle ? 'Processing...' : 'Confirm'}
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