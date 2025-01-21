"use client";

import supabase from "@/lib/supabase/createClient";

export default function LoginButton(props: { nextUrl?: string }) {

  const handleLogin = async () => {
    const redirectUrl = `${location.origin}/auth/callback?next=${props.nextUrl || ""}`;
    console.log("Redirect URL:", redirectUrl);
  
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: redirectUrl,
      },
    });
  };
  

  return <button onClick={handleLogin}>Login</button>;
}