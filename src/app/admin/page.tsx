"use client";

import CreateMarketForm from "@/components/CreateMarket";

export default function Admin() {

  return (
    <div className="w-full h-full">
      <div className="flex items-center justify-center">
        <h1 className="text-lg font-bold mb-4">Admin page</h1>
      </div>

      <CreateMarketForm />
    </div>
  );
}
