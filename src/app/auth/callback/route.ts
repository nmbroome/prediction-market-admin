import supabase from "@/lib/supabase/createClient";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);

  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    try {
      const { error } = await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        console.error("Error exchanging code for session:", error.message);
        return NextResponse.redirect(`${origin}/auth/auth-error`);
      }

      return NextResponse.redirect(`${origin}${next}`);
    } catch (error) {
      console.error("Unexpected error during auth callback:", error);
      return NextResponse.redirect(`${origin}/auth/auth-error`);
    }
  }

  console.error("Missing 'code' parameter in callback URL.");
  return NextResponse.redirect(`${origin}/auth/auth-error`);
}
