"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

export default function AuthCallback() {
  const router = useRouter();
  const [error, setError] = useState("");

  useEffect(() => {
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
      auth: { flowType: "pkce", detectSessionInUrl: true, persistSession: true, autoRefreshToken: true },
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
        router.replace("/");
        return;
      }
      setError("The sign-in link could not create a session. Please request a new link.");
    })();
  }, [router]);

  return (
    <main className="min-h-screen bg-black text-[#ededed] antialiased grid place-items-center p-6">
      <div className="w-full max-w-[420px] rounded-xl bg-[#0a0a0a] border border-white/[0.08] p-7 text-center">
        <div
          className={`mx-auto mb-5 w-11 h-11 rounded-full border flex items-center justify-center ${
            error ? "border-[#ff7b7b]/40 text-[#ff7b7b]" : "border-[#3ecf8e]/40 text-[#3ecf8e]"
          }`}
          aria-hidden="true"
        >
          {error ? (
            <span className="text-lg leading-none">&times;</span>
          ) : (
            <span className="block w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
          )}
        </div>
        <h1 className="text-xl font-semibold tracking-tight">{error ? "Sign-in link failed" : "Signing you in…"}</h1>
        <p className="mt-2 text-[13px] text-[#a1a1a1] leading-relaxed" role={error ? "alert" : "status"}>
          {error || "Please wait while we securely complete your sign-in."}
        </p>
        {error && (
          <a
            href="/login"
            className="mt-5 inline-flex px-3.5 py-1.5 rounded-lg bg-white hover:bg-[#eaeaea] text-black text-[13px] font-medium"
          >
            Back to sign in
          </a>
        )}
      </div>
    </main>
  );
}
