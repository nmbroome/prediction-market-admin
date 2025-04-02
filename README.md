# Prediction Market Platform

## Overview

This is a web-based prediction market platform built with Next.js, React, and Supabase. The platform allows users to create markets (questions about future events), make predictions by investing tokens, and potentially earn returns based on the market's outcome.

## Core Features

- **User Authentication**: Sign up, login, and OAuth with Google via Supabase
- **Market Creation**: Users can create prediction markets with customizable parameters
- **Market Participation**: Users can stake tokens on different outcomes
- **Automated Market Makers**: Implementation of market makers (CPMM, Maniswap) to provide liquidity
- **User Profiles**: User information, prediction history, and payment details
- **Admin Functions**: Market management and resolution

## Technical Stack

- **Frontend**: Next.js 15, React 19, TailwindCSS
- **Backend**: Supabase (PostgreSQL, Authentication)
- **State Management**: React hooks and context
- **Styling**: TailwindCSS for responsive UI
- **API Integration**: OpenAI integration (in progress)

## Project Structure

- `/src/app`: Next.js app router pages
  - `/admin`: Admin dashboard for market management
  - `/auth`: Authentication pages and workflows
  - `/markets`: Market browsing and individual market views
  - `/profile`: User profile management
  - `/market_maker`: Testing interface for market maker algorithms
- `/src/components`: Reusable React components
- `/src/lib`: Utility functions, Supabase clients, types
  - `/supabase`: Supabase client configurations
  - `marketMakers.ts`: Implementation of CPMM and Maniswap algorithms
  - `predictions.ts`: Functions for managing predictions
  - `types.ts`: TypeScript type definitions

## Market Makers

The platform implements two market maker mechanisms:

1. **CPMM (Constant Product Market Maker)**: Similar to Uniswap's algorithm where the product of token quantities remains constant
2. **Maniswap**: Inspired by Manifold Markets' approach (implementation in progress)

## Database Schema

### Main Tables

- `markets`: Stores market information, creator, token pools, etc.
- `outcomes`: Possible outcomes for each market and their token pools
- `predictions`: User predictions linking users to outcomes with amounts
- `profiles`: Extended user information including payment details

## Current Development Focus

- Implementing the market resolving mechanism
- Improving the UI/UX of the market participation flow
- Adding user balance tracking and management
- Enhancing the admin dashboard for market resolution
- Implementing the Maniswap market maker algorithm

## Getting Started

### Prerequisites

- Node.js 18.x or higher
- Supabase account and project

### Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```

### Setting Up Supabase

1. Create tables in Supabase:
   - markets
   - outcomes
   - predictions
   - profiles
2. Configure Authentication providers (Email, Google)
3. Set up Row Level Security policies

## Future Enhancements

- Real money integration
- Mobile app version
- Advanced analytics dashboard
- Integration with external data sources for market resolution
- Enhanced social features and user reputation system