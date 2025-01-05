"use client";

import React, { useState } from "react";
import { Markets } from "@/lib/types";

type MarketsPageProps = {
  markets: Markets[];
};

const tags = [
  "All",
  "event",
  "election",
  "economy",
  "politics",
  "movies",
  "legal",
  "science",
  "bug",
  "feature",
];

const MarketsPage: React.FC<MarketsPageProps> = ({ markets }) => {
  const [selectedTag, setSelectedTag] = useState<string>("All");

  const handleTagClick = (tag: string) => {
    setSelectedTag(tag);
  };

  const filteredMarkets =
    selectedTag === "All"
      ? markets
      : markets.filter((market) =>
          market.description.toLowerCase().includes(selectedTag.toLowerCase())
        );

  return (
    <div>
      <h1 className="text-2xl font-bold text-center my-4">Markets Table</h1>

      {/* Tag Buttons */}
      <div className="flex flex-wrap justify-center gap-2 mb-4">
        {tags.map((tag) => (
          <button
            key={tag}
            className={`px-4 py-2 rounded ${
              selectedTag === tag
                ? "bg-blue-500 text-white"
                : "bg-gray-200 text-gray-800"
            } hover:bg-blue-400`}
            onClick={() => handleTagClick(tag)}
          >
            {tag}
          </button>
        ))}
      </div>

      {/* Markets Table */}
      <div className="flex items-center justify-center">
        <table className="min-w-full bg-white shadow-md rounded-lg overflow-hidden">
          <thead>
            <tr className="bg-gray-800 text-white border-b">
              <th className="px-4 py-2">Market Name</th>
              <th className="px-4 py-2">Description</th>
              <th className="px-4 py-2">Token Pool</th>
              <th className="px-4 py-2">Market Maker</th>
              <th className="px-4 py-2">Outcome</th>
            </tr>
          </thead>
          <tbody>
            {filteredMarkets.map((row, index) => (
              <tr
                key={row.marketId}
                className={`${
                  index % 2 === 0 ? "bg-gray-100" : "bg-gray-200"
                } border-b`}
              >
                <td className="px-4 py-2">{row.marketName}</td>
                <td className="px-4 py-2">{row.description}</td>
                <td className="px-4 py-2">{row.tokenPool}</td>
                <td className="px-4 py-2">{row.marketMaker}</td>
                <td className="px-4 py-2">{row.outcome}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MarketsPage;
