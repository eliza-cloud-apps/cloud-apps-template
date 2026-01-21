"use client";

/**
 * OAuth Callback Page
 *
 * Handles the redirect from Eliza Cloud after authentication.
 * Stores the token and redirects to the intended destination.
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { handleCallback, getPostAuthRedirect } from "@/lib/eliza-auth";
import { Loader2, CheckCircle, XCircle } from "lucide-react";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading",
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function processCallback() {
      try {
        const user = await handleCallback();

        if (user) {
          setStatus("success");
          // Small delay to show success state
          await new Promise((resolve) => setTimeout(resolve, 500));
          // Redirect to intended destination
          const redirect = getPostAuthRedirect();
          router.push(redirect);
        } else {
          setStatus("error");
          setError("Failed to complete sign in. Please try again.");
        }
      } catch (e) {
        setStatus("error");
        setError(e instanceof Error ? e.message : "Authentication failed");
      }
    }

    processCallback();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#09090b] px-4">
      <div className="max-w-md w-full text-center space-y-6">
        {status === "loading" && (
          <>
            <Loader2 className="h-12 w-12 animate-spin text-eliza-orange mx-auto" />
            <div className="space-y-2">
              <h1 className="text-xl font-semibold text-white">
                Completing sign in...
              </h1>
              <p className="text-gray-400">
                Please wait while we set up your session.
              </p>
            </div>
          </>
        )}

        {status === "success" && (
          <>
            <CheckCircle className="h-12 w-12 text-emerald-400 mx-auto" />
            <div className="space-y-2">
              <h1 className="text-xl font-semibold text-white">
                Sign in successful!
              </h1>
              <p className="text-gray-400">Redirecting you now...</p>
            </div>
          </>
        )}

        {status === "error" && (
          <>
            <XCircle className="h-12 w-12 text-red-400 mx-auto" />
            <div className="space-y-2">
              <h1 className="text-xl font-semibold text-white">
                Sign in failed
              </h1>
              <p className="text-gray-400">{error}</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => (window.location.href = "/")}
                className="px-4 py-2 rounded-lg border border-gray-700 text-gray-200 hover:bg-gray-800 transition-colors"
              >
                Go Home
              </button>
              <button
                onClick={() => {
                  const { signIn } = require("@/lib/eliza-auth");
                  signIn();
                }}
                className="px-4 py-2 rounded-lg bg-eliza-orange text-white hover:bg-eliza-orange-hover transition-colors"
              >
                Try Again
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
