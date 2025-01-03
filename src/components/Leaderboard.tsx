import React from "react";

type LeaderboardData = {
  id: number;
  score: number;
};

type LeaderboardProps = {
  data: LeaderboardData[];
};

const Leaderboard: React.FC<LeaderboardProps> = ({ data }) => {
  return (
    <div className="flex items-center justify-center">
      <table className="min-w-full bg-white shadow-md rounded-lg overflow-hidden">
        <thead>
          <tr className="bg-gray-800 text-white border-b">
            <th className="px-4 py-2">ID</th>
            <th className="px-4 py-2">Score</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => (
            <tr
              key={row.id}
              className={`${
                index % 2 === 0 ? "bg-gray-100" : "bg-gray-200"
              } border-b`}
            >
              <td className="px-4 py-2 text-center">{row.id}</td>
              <td className="px-4 py-2 text-center">{row.score}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Leaderboard;
