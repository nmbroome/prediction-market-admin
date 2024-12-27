import React from "react";
import { Markets } from "@/lib/types";

type TableProps = {
    data: Markets[];
  };

const Table: React.FC<TableProps> = ({ data }) => {
  return (
    <div className="flex items-center justify-center">
      <table className="min-w-full bg-white shadow-md rounded-lg overflow-hidden">
        <thead>
          <tr className="bg-gray-800 text-white border-b">
            <th className="px-4 py-2">Market Name</th>
            <th className="px-4 py-2">Description</th>
            <th className="px-4 py-2">Token Pool</th>
            <th className="px-4 py-2">Market Maker</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => (
            <tr
              key={index}
              className={`${
                index % 2 === 0 ? "bg-gray-100" : "bg-gray-200"
              } border-b`}
            >
              <td className="px-4 py-2">{row.marketName}</td>
              <td className="px-4 py-2">{row.description}</td>
              <td className="px-4 py-2">{row.tokenPool}</td>
              <td className="px-4 py-2">{row.marketMaker}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Table;
