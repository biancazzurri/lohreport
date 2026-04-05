"use client";

import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function LoginContent() {
  const params = useSearchParams();
  const error = params.get("error");

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4">
      <img src="/splash.png" alt="Loh Report" className="w-32 h-32 object-contain mb-8" />
      <h1 className="text-xl font-bold text-gray-200 mb-2">Loh Report</h1>
      <p className="text-sm text-gray-500 mb-8">Track your meals and macros</p>

      {error && (
        <div className="bg-[#f48fb1]/10 text-[#f48fb1] text-sm rounded-lg p-3 mb-4 w-full max-w-[280px] text-center">
          {error === "AccessDenied"
            ? "Your email is not on the whitelist."
            : "Sign in failed. Try again."}
        </div>
      )}

      <button
        onClick={() => signIn("google", { callbackUrl: "/" })}
        className="flex items-center gap-3 bg-white text-gray-800 rounded-xl px-6 py-3 font-medium text-sm hover:bg-gray-100 transition-colors"
      >
        <svg width="18" height="18" viewBox="0 0 48 48">
          <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
          <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
          <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
          <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
        </svg>
        Sign in with Google
      </button>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  );
}
