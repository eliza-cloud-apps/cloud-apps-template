"use client";

/**
 * Billing Success Page
 *
 * Shown after a successful credit purchase.
 * Verifies the purchase and shows confirmation.
 */

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { verifyPurchase } from "@/lib/eliza-credits";
import { Loader2, CheckCircle, XCircle, ArrowRight } from "lucide-react";

function BillingSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading",
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function verify() {
      const sessionId = searchParams.get("session_id");

      if (!sessionId) {
        setStatus("error");
        setError("No session ID found");
        return;
      }

      try {
        const success = await verifyPurchase(sessionId);

        if (success) {
          setStatus("success");
        } else {
          setStatus("error");
          setError(
            "Could not verify purchase. Please contact support if credits were charged.",
          );
        }
      } catch (e) {
        setStatus("error");
        setError(e instanceof Error ? e.message : "Verification failed");
      }
    }

    verify();
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#09090b] px-4">
      <div className="max-w-md w-full text-center space-y-6">
        {status === "loading" && (
          <>
            <Loader2 className="h-12 w-12 animate-spin text-eliza-orange mx-auto" />
            <div className="space-y-2">
              <h1 className="text-xl font-semibold text-white">
                Verifying purchase...
              </h1>
              <p className="text-gray-400">
                Please wait while we confirm your payment.
              </p>
            </div>
          </>
        )}

        {status === "success" && (
          <>
            <div className="relative">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-24 w-24 rounded-full bg-emerald-500/20 animate-ping" />
              </div>
              <CheckCircle className="h-16 w-16 text-emerald-400 mx-auto relative" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-white">
                Purchase Successful!
              </h1>
              <p className="text-gray-400">
                Your credits have been added to your account.
              </p>
            </div>
            <div className="pt-4">
              <button
                onClick={() => router.push("/")}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-eliza-orange text-white font-medium hover:bg-eliza-orange-hover transition-colors"
              >
                Continue
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </>
        )}

        {status === "error" && (
          <>
            <XCircle className="h-12 w-12 text-red-400 mx-auto" />
            <div className="space-y-2">
              <h1 className="text-xl font-semibold text-white">
                Something went wrong
              </h1>
              <p className="text-gray-400">{error}</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => router.push("/")}
                className="px-4 py-2 rounded-lg border border-gray-700 text-gray-200 hover:bg-gray-800 transition-colors"
              >
                Go Home
              </button>
              <a
                href="mailto:support@elizacloud.ai"
                className="px-4 py-2 rounded-lg bg-eliza-orange text-white hover:bg-eliza-orange-hover transition-colors"
              >
                Contact Support
              </a>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function BillingSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#09090b] px-4">
          <div className="max-w-md w-full text-center space-y-6">
            <Loader2 className="h-12 w-12 animate-spin text-eliza-orange mx-auto" />
            <div className="space-y-2">
              <h1 className="text-xl font-semibold text-white">Loading...</h1>
            </div>
          </div>
        </div>
      }
    >
      <BillingSuccessContent />
    </Suspense>
  );
}
