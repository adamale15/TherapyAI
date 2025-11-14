import { NextRequest } from "next/server";
import { therapyReply } from "@/lib/llm";
import { detectCrisis, crisisResponse } from "@/lib/safety";
import { supabaseSessionStore } from "@/lib/supabase-session-store";

export async function POST(request: NextRequest) {
  try {
    const sessionId = request.headers.get("x-session-id") || `session-${Date.now()}`;
    const body = await request.json();
    const { type, text, persona } = body;

    const session = await supabaseSessionStore.getSession(sessionId);

    if (type === "set_persona") {
      await supabaseSessionStore.updatePersona(sessionId, persona || "sarah");
      return Response.json({
        type: "info",
        message: `Persona set to: ${persona || "sarah"}`,
      });
    }

    if (type === "text_input") {
      const userText = String(text || "").trim();
      if (!userText) {
        return Response.json({ error: "Empty message" }, { status: 400 });
      }

      // Crisis detection
      if (detectCrisis(userText)) {
        const reply = crisisResponse();
        session.history.push({ role: "user", content: userText });
        session.history.push({ role: "assistant", content: reply });
        // Save to Supabase
        await supabaseSessionStore.setSession(sessionId, session);
        
        return Response.json({
          type: "final_stt",
          text: userText,
          reply: { type: "persona_say", who: "thera", text: reply },
        });
      }

      // Normal reply
      const reply = await therapyReply(
        userText,
        session.history,
        session.persona
      );

      // Update memory
      session.history.push({ role: "user", content: userText });
      session.history.push({ role: "assistant", content: reply });
      if (session.history.length > 20) {
        session.history.splice(0, session.history.length - 20);
      }
      // Save to Supabase
      await supabaseSessionStore.setSession(sessionId, session);

      return Response.json({
        type: "final_stt",
        text: userText,
        reply: { type: "persona_say", who: "thera", text: reply },
      });
    }

    if (type === "reset") {
      await supabaseSessionStore.clearHistory(sessionId);
      return Response.json({
        type: "info",
        message: "Memory cleared",
      });
    }

    return Response.json({ error: "Invalid message type" }, { status: 400 });
  } catch (error) {
    console.error("Chat API error:", error);
    return Response.json(
      {
        type: "error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

