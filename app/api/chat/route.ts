import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { therapyReply } from "@/lib/llm";
import { detectCrisis, crisisResponse } from "@/lib/safety";
import { getConvexServerClient } from "@/lib/convex/server";
import { convexFunctions } from "@/lib/convex/functions";

export async function POST(request: NextRequest) {
  try {
    const sessionId = request.headers.get("x-session-id") || `session-${Date.now()}`;
    const { userId } = await auth();
    const convex = getConvexServerClient();
    const body = await request.json();
    const { type, text, persona } = body;

    const session = await convex.mutation(convexFunctions.chatSessions.getOrCreate, {
      sessionKey: sessionId,
      ownerClerkId: userId ?? undefined,
    });

    if (type === "set_persona") {
      await convex.mutation(convexFunctions.chatSessions.setPersona, {
        sessionKey: sessionId,
        personaId: persona || "sarah",
        ownerClerkId: userId ?? undefined,
      });
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
        await convex.mutation(convexFunctions.chatSessions.appendTurns, {
          sessionKey: sessionId,
          ownerClerkId: userId ?? undefined,
          turns: [
            { role: "user", content: userText },
            { role: "assistant", content: reply },
          ],
        });
        
        return Response.json({
          type: "final_stt",
          text: userText,
          reply: { type: "persona_say", who: "thera", text: reply },
        });
      }

      const personaData = await convex.query(convexFunctions.personas.getById, {
        personaId: session.personaId || "sarah",
        ownerClerkId: userId ?? undefined,
      });

      // Normal reply
      const replyData = await therapyReply(
        userText,
        session.history,
        session.personaId,
        personaData
      );

      // Update memory
      await convex.mutation(convexFunctions.chatSessions.appendTurns, {
        sessionKey: sessionId,
        ownerClerkId: userId ?? undefined,
        turns: [
          { role: "user", content: userText },
          { role: "assistant", content: replyData.content },
        ],
      });

      return Response.json({
        type: "final_stt",
        text: userText,
        reply: { 
          type: "persona_say", 
          who: "thera", 
          text: replyData.content,
          state: {
            emotionalState: replyData.emotionalState,
            rapportLevel: replyData.rapportLevel,
            engagementLevel: replyData.engagementLevel,
            feedback: replyData.feedback
          }
        },
      });
    }

    if (type === "reset") {
      await convex.mutation(convexFunctions.chatSessions.clearHistory, {
        sessionKey: sessionId,
      });
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

