"use client";

import { useState } from "react";
import Navbar from "@/components/navbar";

interface EconomicIndicator {
  id: string;
  name: string;
  value: string;
  change: string;
  changeType: "increase" | "decrease" | "neutral";
  period: string;
  category: string;
  source: string;
  description: string;
  lastUpdated: string;
}

// Placeholder data - this would eventually come from your API/database
const placeholderIndicators: EconomicIndicator[] = [
  {
    id: "gdp",
    name: "Gross Domestic Product (GDP)",
    value: "$27.36 trillion",
    change: "+2.4%",
    changeType: "increase",
    period: "Q3 2024",
    category: "Economic Growth",
    source: "Bureau of Economic Analysis",
    description: "The total value of goods and services produced in the United States",
    lastUpdated: "2024-10-30"
  },
  {
    id: "unemployment",
    name: "Unemployment Rate",
    value: "3.7%",
    change: "-0.1%",
    changeType: "decrease",
    period: "October 2024",
    category: "Employment",
    source: "Bureau of Labor Statistics",
    description: "Percentage of the labor force that is unemployed and actively seeking employment",
    lastUpdated: "2024-11-01"
  },
  {
    id: "inflation",
    name: "Consumer Price Index (CPI)",
    value: "3.2%",
    change: "+0.1%",
    changeType: "increase",
    period: "October 2024",
    category: "Inflation",
    source: "Bureau of Labor Statistics",
    description: "Measures the average change in prices paid by consumers for goods and services",
    lastUpdated: "2024-11-15"
  },
  {
    id: "housing",
    name: "New Housing Starts",
    value: "1.31 million",
    change: "-4.2%",
    changeType: "decrease",
    period: "October 2024",
    category: "Housing",
    source: "U.S. Census Bureau",
    description: "Number of new residential construction projects started",
    lastUpdated: "2024-11-19"
  },
  {
    id: "retail",
    name: "Retail Sales",
    value: "$714.4 billion",
    change: "+0.4%",
    changeType: "increase",
    period: "October 2024",
    category: "Consumer Spending",
    source: "U.S. Census Bureau",
    description: "Total receipts of retail and food services stores",
    lastUpdated: "2024-11-15"
  },
  {
    id: "manufacturing",
    name: "Industrial Production",
    value: "102.8",
    change: "-0.3%",
    changeType: "decrease",
    period: "October 2024",
    category: "Manufacturing",
    source: "Federal Reserve",
    description: "Measures the real output of manufacturing, mining, and utilities",
    lastUpdated: "2024-11-15"
  }
];

const categories = ["All", "Economic Growth", "Employment", "Inflation", "Housing", "Consumer Spending", "Manufacturing"];

export default function EconomicIndicatorsPage() {
  const [indicators] = useState<EconomicIndicator[]>(placeholderIndicators);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [loading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredIndicators = indicators.filter(indicator => {
    const matchesCategory = selectedCategory === "All" || indicator.category === selectedCategory;
    const matchesSearch = indicator.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         indicator.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getChangeColor = (changeType: string) => {
    switch (changeType) {
      case "increase":
        return "text-green-400";
      case "decrease":
        return "text-red-400";
      default:
        return "text-gray-400";
    }
  };

  const getChangeIcon = (changeType: string) => {
    switch (changeType) {
      case "increase":
        return "↗";
      case "decrease":
        return "↘";
      default:
        return "→";
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />
      <div className="container mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Economic Indicators</h1>
          <p className="text-gray-400">
            Track key economic metrics and their trends over time
          </p>
        </div>

        {/* Search and Filter Controls */}
        <div className="mb-6 space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search indicators..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex gap-2 overflow-x-auto">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                    selectedCategory === category
                      ? "bg-blue-600 text-white"
                      : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Indicators List */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredIndicators.map((indicator) => (
              // This will be replaced with <EconomicIndicator key={indicator.id} indicator={indicator} />
              <div
                key={indicator.id}
                className="bg-gray-900 rounded-lg p-6 border border-gray-800 hover:border-gray-700 transition-colors"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left section - Name and category */}
                  <div className="flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold">{indicator.name}</h3>
                      <span className="text-sm text-blue-400 bg-blue-900/30 px-2 py-1 rounded w-fit">
                        {indicator.category}
                      </span>
                    </div>
                    <p className="text-sm text-gray-400">{indicator.description}</p>
                  </div>

                  {/* Middle section - Value and change */}
                  <div className="flex flex-col items-start lg:items-center gap-1">
                    <span className="text-2xl font-bold">{indicator.value}</span>
                    <span className={`text-sm flex items-center gap-1 ${getChangeColor(indicator.changeType)}`}>
                      {getChangeIcon(indicator.changeType)}
                      {indicator.change}
                    </span>
                  </div>

                  {/* Right section - Metadata */}
                  <div className="flex flex-col lg:items-end text-sm text-gray-400 gap-1">
                    <p><span className="text-gray-500">Period:</span> {indicator.period}</p>
                    <p><span className="text-gray-500">Source:</span> {indicator.source}</p>
                    <p><span className="text-gray-500">Updated:</span> {new Date(indicator.lastUpdated).toLocaleDateString()}</p>
                  </div>

                  {/* Action button */}
                  <div className="flex-shrink-0">
                    <button className="text-blue-400 hover:text-blue-300 text-sm font-medium px-4 py-2 border border-blue-400/30 rounded-lg hover:bg-blue-900/20 transition-colors">
                      View Details →
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {filteredIndicators.length === 0 && !loading && (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg">No indicators found matching your criteria</p>
          </div>
        )}

        {/* Data Sources Section */}
        <div className="mt-12 bg-gray-900 rounded-lg p-6 border border-gray-800">
          <h2 className="text-xl font-semibold mb-4">Data Sources</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <h3 className="font-medium text-blue-400">Bureau of Economic Analysis</h3>
              <p className="text-sm text-gray-400">GDP, Personal Income, Trade Balance</p>
            </div>
            <div className="space-y-2">
              <h3 className="font-medium text-blue-400">Bureau of Labor Statistics</h3>
              <p className="text-sm text-gray-400">Employment, Inflation, Wages</p>
            </div>
            <div className="space-y-2">
              <h3 className="font-medium text-blue-400">U.S. Census Bureau</h3>
              <p className="text-sm text-gray-400">Housing, Retail Sales, Trade</p>
            </div>
            <div className="space-y-2">
              <h3 className="font-medium text-blue-400">Federal Reserve</h3>
              <p className="text-sm text-gray-400">Interest Rates, Money Supply</p>
            </div>
            <div className="space-y-2">
              <h3 className="font-medium text-blue-400">Treasury Department</h3>
              <p className="text-sm text-gray-400">Government Finances, Debt</p>
            </div>
            <div className="space-y-2">
              <h3 className="font-medium text-blue-400">Department of Commerce</h3>
              <p className="text-sm text-gray-400">Business Activity, International Trade</p>
            </div>
          </div>
        </div>

        {/* Implementation Notes */}
        <div className="mt-8 bg-blue-900/20 border border-blue-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-3 text-blue-400">Implementation Roadmap</h3>
          <div className="space-y-2 text-sm">
            <p className="text-gray-300">• <span className="text-yellow-400">Phase 1:</span> Set up automated data crawling from Census Bureau API</p>
            <p className="text-gray-300">• <span className="text-yellow-400">Phase 2:</span> Integrate Federal Reserve Economic Data (FRED) API</p>
            <p className="text-gray-300">• <span className="text-yellow-400">Phase 3:</span> Add historical charts and trend analysis</p>
            <p className="text-gray-300">• <span className="text-yellow-400">Phase 4:</span> Create prediction markets based on economic forecasts</p>
            <p className="text-gray-300">• <span className="text-yellow-400">Phase 5:</span> Implement real-time alerts and notifications</p>
          </div>
        </div>
      </div>
    </div>
  );
}