"use client";

import React from "react";
import { useAuth } from "@clerk/nextjs";
import { ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

const convex =
  convexUrl && convexUrl.length > 0 ? new ConvexReactClient(convexUrl) : null;

export function ConvexClientProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!convex) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center p-6">
        <div className="max-w-xl rounded-2xl border border-white/10 bg-white/5 p-8">
          <h1 className="text-2xl font-bold mb-3">Convex setup required</h1>
          <p className="text-gray-300 leading-relaxed">
            Missing NEXT_PUBLIC_CONVEX_URL. Run{" "}
            <code className="rounded bg-white/10 px-2 py-1">
              npx convex dev
            </code>{" "}
            and add the generated Convex URL to your environment.
          </p>
        </div>
      </main>
    );
  }

  return (
    <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
      {children}
    </ConvexProviderWithClerk>
  );
}
