"use client";

import { createSupabaseBrowserClient } from "@/lib/supabase/browser-client";

export default function LoginButton(props: { nextUrl?: string }) {
  const supabase = createSupabaseBrowserClient();

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