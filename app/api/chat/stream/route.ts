import { NextRequest } from "next/server";
import { supabaseSessionStore } from "@/lib/supabase-session-store";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const sessionId = searchParams.get("sessionId") || `session-${Date.now()}`;
  
  // Initialize session if it doesn't exist
  await supabaseSessionStore.getSession(sessionId);

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      
      // Send initial ready message
      const send = (data: Record<string, any>) => {
        const message = `data: ${JSON.stringify(data)}\n\n`;
        controller.enqueue(encoder.encode(message));
      };

      send({ type: "ready" });
      send({
        type: "info",
        message: `LLM: Gemini Pro (Google AI)`,
      });

      // Keep connection alive with periodic ping
      const keepAlive = setInterval(() => {
        try {
          send({ type: "ping" });
        } catch (error) {
          clearInterval(keepAlive);
        }
      }, 30000);

      // Cleanup on close
      request.signal.addEventListener("abort", () => {
        clearInterval(keepAlive);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}

