// src/lib/calculateLeaderboard.ts

import { useState, useEffect } from 'react';
import supabase from '@/lib/supabase/createClient';

interface LeaderboardEntry {
  user_id: string;
  username: string;
  pnl_absolute: number;
  pnl_percent: number;
  starting_balance: number;
  current_balance: number;
  total_invested: number;
  total_returned: number;
  outstanding_shares_value: number;
  total_pnl_with_shares: number;
  total_pnl_percent_with_shares: number;
  prediction_count: number;
  period_trade_value: number;
  active_positions: number;
}

interface UserPosition {
  user_id: string;
  outcome_id: number;
  market_id: number;
  shares: number;
  current_odds: number;
  current_value: number;
  market_name: string;
  outcome_name: string;
}

// Additional interface for user statistics during processing
interface UserStats {
  user_id: string;
  username: string;
  current_balance: number;
  total_invested: number;
  total_returned: number;
  prediction_count: number;
  period_trade_value: number;
  wins: number;
  losses: number;
}

// Type definition for the prediction with joined market and profile data
interface PredictionWithJoins {
  user_id: string;
  predict_amt: number;
  return_amt: number;
  outcome_id: number;
  market_id: number;
  trade_value: number;
  created_at: string;
  markets: {
    id: number;
    name: string;
    resolved: boolean;
    winning_outcome_id: number | null;
  }[];
  profiles: {
    username: string;
    balance: number;
  }[];
}

// Type definition for outcome with market data
interface OutcomeWithMarket {
  id: number;
  name: string;
  tokens: number;
  market_id: number;
  markets: {
    id: number;
    name: string;
    resolved: boolean;
    token_pool: number;
  }[];
}

export async function calculateLeaderboardWithOutstandingShares(days: number = 14): Promise<{
  leaderboard: LeaderboardEntry[];
  userPositions: Map<string, UserPosition[]>;
}> {
  // Calculate date range
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - days);

  // Step 1: Get predictions during the period
  const { data: periodPredictions, error: periodError } = await supabase
    .from('predictions')
    .select(`
      user_id,
      predict_amt,
      return_amt,
      outcome_id,
      market_id,
      trade_value,
      created_at,
      markets!inner(
        id,
        name,
        resolved,
        winning_outcome_id
      ),
      profiles!inner(
        username,
        balance
      )
    `)
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString());

  if (periodError) throw new Error(`Error fetching predictions: ${periodError.message}`);

  // Cast the data to our properly typed interface
  const typedPredictions = periodPredictions as PredictionWithJoins[] | null;

  // Step 2: Calculate user share holdings for unresolved markets
  const userShareHoldings = new Map<string, Map<number, number>>(); // user_id -> outcome_id -> shares
  const unresolvedMarkets = new Set<number>();

  typedPredictions?.forEach(prediction => {
    const userId = prediction.user_id;
    const outcomeId = prediction.outcome_id;
    const market = prediction.markets[0]; // Take first (and only) market

    // Only track shares for unresolved markets
    if (market && !market.resolved) {
      unresolvedMarkets.add(market.id);
      
      if (!userShareHoldings.has(userId)) {
        userShareHoldings.set(userId, new Map());
      }
      
      const userOutcomes = userShareHoldings.get(userId)!;
      const currentShares = userOutcomes.get(outcomeId) || 0;
      userOutcomes.set(outcomeId, currentShares + (prediction.return_amt || 0));
    }
  });

  // Step 3: Get current market data for unresolved markets to calculate odds
  const marketOdds = new Map<number, Map<number, number>>(); // market_id -> outcome_id -> odds
  
  if (unresolvedMarkets.size > 0) {
    const { data: marketData, error: marketError } = await supabase
      .from('outcomes')
      .select(`
        id,
        name,
        tokens,
        market_id,
        markets!inner(
          id,
          name,
          resolved,
          token_pool
        )
      `)
      .in('market_id', Array.from(unresolvedMarkets))
      .eq('markets.resolved', false);

    if (marketError) {
      console.warn('Error fetching market data:', marketError.message);
    } else {
      // Cast to our typed interface
      const typedMarketData = marketData as OutcomeWithMarket[] | null;
      
      // Group outcomes by market
      const outcomesByMarket = new Map<number, OutcomeWithMarket[]>();
      typedMarketData?.forEach(outcome => {
        if (!outcomesByMarket.has(outcome.market_id)) {
          outcomesByMarket.set(outcome.market_id, []);
        }
        outcomesByMarket.get(outcome.market_id)!.push(outcome);
      });

      // Calculate odds for each outcome using CPMM
      outcomesByMarket.forEach((outcomes, marketId) => {
        const marketOddsMap = new Map<number, number>();
        
        // Calculate total tokens in market
        const totalTokens = outcomes.reduce((sum, outcome) => sum + (outcome.tokens || 0), 0);
        
        outcomes.forEach(outcome => {
          if (totalTokens > 0) {
            // Calculate implied probability and convert to odds
            const impliedProbability = (outcome.tokens || 0) / totalTokens;
            // Odds = 1 / probability (e.g., 50% chance = 2.0 odds)
            const odds = impliedProbability > 0 ? 1 / impliedProbability : 0;
            marketOddsMap.set(outcome.id, odds);
          } else {
            marketOddsMap.set(outcome.id, 1);
          }
        });
        
        marketOdds.set(marketId, marketOddsMap);
      });
    }
  }

  // Step 4: Calculate outstanding shares value for each user
  const userPositionsMap = new Map<string, UserPosition[]>();
  const userOutstandingValues = new Map<string, number>();

  userShareHoldings.forEach((outcomeShares, userId) => {
    const userPositions: UserPosition[] = [];
    let totalValue = 0;

    outcomeShares.forEach((shares, outcomeId) => {
      // Find the market for this outcome
      const prediction = typedPredictions?.find(p => 
        p.user_id === userId && p.outcome_id === outcomeId
      );
      
      if (prediction && shares > 0) {
        const marketId = prediction.market_id;
        const marketOddsMap = marketOdds.get(marketId);
        const currentOdds = marketOddsMap?.get(outcomeId) || 1;
        const currentValue = shares * currentOdds;
        
        totalValue += currentValue;
        
        userPositions.push({
          user_id: userId,
          outcome_id: outcomeId,
          market_id: marketId,
          shares: shares,
          current_odds: currentOdds,
          current_value: currentValue,
          market_name: prediction.markets[0]?.name || 'Unknown Market',
          outcome_name: `Outcome ${outcomeId}` // You might want to fetch actual outcome names
        });
      }
    });

    userPositionsMap.set(userId, userPositions);
    userOutstandingValues.set(userId, totalValue);
  });

  // Step 5: Get historical trade values
  const uniqueUserIds = [...new Set(typedPredictions?.map(p => p.user_id) || [])];
  const historicalTradeValues = new Map<string, number>();
  
  if (uniqueUserIds.length > 0) {
    const { data: historicalData, error: historicalError } = await supabase
      .from('predictions')
      .select('user_id, trade_value')
      .in('user_id', uniqueUserIds)
      .lt('created_at', startDate.toISOString());

    if (!historicalError) {
      historicalData?.forEach(prediction => {
        const userId = prediction.user_id;
        const currentTotal = historicalTradeValues.get(userId) || 0;
        historicalTradeValues.set(userId, currentTotal + (prediction.trade_value || 0));
      });
    }
  }

  // Step 6: Process predictions and calculate PnL
  const userStats = new Map<string, UserStats>();

  typedPredictions?.forEach(prediction => {
    const userId = prediction.user_id;
    const market = prediction.markets[0]; // Take first market
    const profile = prediction.profiles[0]; // Take first profile

    if (!userStats.has(userId)) {
      const currentBalance = profile?.balance || 100;
      
      userStats.set(userId, {
        user_id: userId,
        username: profile?.username || `User_${userId.slice(0, 8)}`,
        current_balance: currentBalance,
        total_invested: 0,
        total_returned: 0,
        prediction_count: 0,
        period_trade_value: 0,
        wins: 0,
        losses: 0
      });
    }

    const stats = userStats.get(userId)!; // We know it exists from the check above
    stats.total_invested += prediction.predict_amt || 0;
    stats.prediction_count += 1;
    stats.period_trade_value += prediction.trade_value || 0;

    // Calculate returns for resolved markets
    if (market && market.resolved) {
      if (market.winning_outcome_id === prediction.outcome_id) {
        stats.total_returned += prediction.return_amt || 0;
        stats.wins += 1;
      } else {
        stats.losses += 1;
      }
    }
  });

  // Step 7: Calculate final metrics including outstanding shares
  const leaderboard: LeaderboardEntry[] = Array.from(userStats.values()).map(user => {
    const starting_balance = user.current_balance - user.period_trade_value;
    const pnl_absolute = user.total_returned - user.total_invested;
    const outstanding_shares_value = userOutstandingValues.get(user.user_id) || 0;
    const total_pnl_with_shares = pnl_absolute + outstanding_shares_value;
    
    // Percentage PnL based on starting balance (without shares)
    const pnl_percent = starting_balance > 0 ? (pnl_absolute / starting_balance) * 100 : 0;
    
    // Percentage PnL including outstanding shares value
    const total_pnl_percent_with_shares = starting_balance > 0 ? 
      (total_pnl_with_shares / starting_balance) * 100 : 0;

    const userPositions = userPositionsMap.get(user.user_id) || [];

    return {
      user_id: user.user_id,
      username: user.username,
      pnl_absolute,
      pnl_percent,
      starting_balance,
      current_balance: user.current_balance,
      total_invested: user.total_invested,
      total_returned: user.total_returned,
      outstanding_shares_value,
      total_pnl_with_shares,
      total_pnl_percent_with_shares,
      prediction_count: user.prediction_count,
      period_trade_value: user.period_trade_value,
      active_positions: userPositions.length
    };
  });

  // Sort by total PnL including shares
  const sortedLeaderboard = leaderboard.sort((a, b) => b.total_pnl_with_shares - a.total_pnl_with_shares);

  return {
    leaderboard: sortedLeaderboard,
    userPositions: userPositionsMap
  };
}

// React hook for the enhanced leaderboard
export function useLeaderboardWithShares(days: number = 14) {
  const [data, setData] = useState<LeaderboardEntry[]>([]);
  const [userPositions, setUserPositions] = useState<Map<string, UserPosition[]>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const result = await calculateLeaderboardWithOutstandingShares(days);
      setData(result.leaderboard);
      setUserPositions(result.userPositions);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch leaderboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [days]);

  return { data, userPositions, loading, error, refresh: fetchData };
}

// Export the types for use in components
export type { LeaderboardEntry, UserPosition };