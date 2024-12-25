"use client"

import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser-client";

export default function Admin() {

    const supabase = createSupabaseBrowserClient();
    const [userId, setUserId] = useState<string | null>(null);

    useEffect(() => {
      const fetchUser = async () => {
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();
  
        if (error) {
          console.error("Error fetching user:", error.message);
          return;
        }
  
        setUserId(user?.id || null);
      };
  
      fetchUser();
    }, []);

  return (
    <div className='w-full h-full'>
      <div className='flex items-center justify-center'>
        <h1 className='text-lg font-bold mb-4'>
          User {userId}
        </h1>
      </div>

      {/* Table */}
      <div className="flex items-center justify-center">
        <h2>Market list</h2>
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

          </tbody>
        </table>
      </div>
    </div>
  );
}