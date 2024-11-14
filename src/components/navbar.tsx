import { createSupabaseServerComponentClient } from "@/lib/supabase/server-client";
import LoginButton from "./login-button";
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
        <Link href="/markets">
          Markets
        </Link>
        {user ? <LogoutButton /> : <LoginButton />}
      </div>
    </nav>
  );
}
