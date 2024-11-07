import { createSupabaseServerComponentClient } from "@/lib/supabase/server-client";
import LoginButton from "./login-button";
import LogoutButton from "./logout-button";

export default async function Navbar() {
  const {
    data: { user },
  } = await (await createSupabaseServerComponentClient()).auth.getUser();

  return <>{user ? <LogoutButton /> : <LoginButton />}</>;
}