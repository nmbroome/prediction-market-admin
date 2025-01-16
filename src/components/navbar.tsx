import { createSupabaseServerComponentClient } from "@/lib/supabase/server-client";
import LogoutButton from "./logout-button";
import Link from "next/link";

export default async function Navbar() {
  const {
    data: { user },
  } = await (await createSupabaseServerComponentClient()).auth.getUser();

  return (
    <nav className="flex w-full justify-between items-center p-4 bg-transparent text-white">
      <h1 className="text-lg font-bold">Prediction Market</h1>
      <div className="flex space-x-4">
        <Link href="/markets" className="px-4 py-2 bg-blue-500 rounded-md hover:bg-blue-600">Markets</Link>
        {user && <Link href="/profile" className="px-4 py-2 bg-blue-500 rounded-md hover:bg-blue-600">Profile</Link>}
        {user ? <LogoutButton /> : <Link href="/auth" className="px-4 py-2 bg-blue-500 rounded-md hover:bg-blue-600">Log In</Link>}
      </div>
    </nav>
  );
}
