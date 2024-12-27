"use client"

import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser-client";
import Table from "@/components/Market-Table";
import { Markets } from "@/lib/types";

export default function Admin() {

    const sampleData: Markets[] = [
        {
          marketName: "Test",
          description: "Test market description",
          tokenPool: "250",
          marketMaker: "CPMM",
        },
      ];


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

      <h2>Market list</h2>
      <Table data={sampleData}/>
    </div>
  );
}