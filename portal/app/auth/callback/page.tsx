"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { Loader2, AlertCircle } from "lucide-react";
import Link from "next/link";

export default function AuthCallback() {
  const router = useRouter();
  const [error, setError] = useState("");

  useEffect(() => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      router.replace("/integrations");
      return;
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        flowType: "pkce",
        detectSessionInUrl: true,
        persistSession: true,
        autoRefreshToken: true,
      },
    });

    (async () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          setError(error.message);
          return;
        }
      }
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        router.replace("/overview");
        return;
      }
      router.replace("/integrations");
    })();
  }, [router]);

  return (
    <main className="min-h-screen bg-[#000000] text-[#ededed] font-sans antialiased flex items-center justify-center p-4">
      <div className="w-full max-w-md p-6 rounded-xl bg-[#0a0a0a] border border-white/8 text-center space-y-4">
        {error ? (
          <>
            <div className="w-10 h-10 rounded-full bg-[#ff7b7b]/10 border border-[#ff7b7b]/30 flex items-center justify-center text-[#ff7b7b] mx-auto">
              <AlertCircle className="w-5 h-5" />
            </div>
            <h1 className="text-base font-semibold text-[#ededed]">Sign-in link failed</h1>
            <p className="text-xs text-[#a1a1a1]">{error}</p>
            <div className="pt-2">
              <Link
                href="/login"
                className="inline-flex items-center justify-center px-4 py-2 rounded-lg text-xs font-semibold bg-[#60eca8] text-[#0a0a0a] hover:bg-[#3ecf8e]"
              >
                Back to sign in
              </Link>
            </div>
          </>
        ) : (
          <>
            <Loader2 className="w-6 h-6 animate-spin text-[#60eca8] mx-auto" />
            <h1 className="text-base font-semibold text-[#ededed]">Completing authorization...</h1>
            <p className="text-xs text-[#707070]">Please wait while we complete your sign-in session.</p>
          </>
        )}
      </div>
    </main>
  );
}
