import { ConvexHttpClient } from "convex/browser";

export function getConvexServerClient() {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL || process.env.CONVEX_URL;

  if (!url) {
    throw new Error(
      "Missing NEXT_PUBLIC_CONVEX_URL. Run `npx convex dev` and add the generated Convex URL to your environment."
    );
  }

  return new ConvexHttpClient(url);
}
