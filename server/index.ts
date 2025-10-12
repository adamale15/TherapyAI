import "dotenv/config";
import { WebSocketServer } from "ws";
import type { WebSocket } from "ws";
import express from "express";
import cors from "cors";
import { therapyReply, type ChatTurn } from "./llm";
import { detectCrisis, crisisResponse } from "./safety";
import personaRoutes from "./routes/personas";
import authRoutes from "./routes/auth";

const PORT = Number(process.env.PORT || 8080);
const API_PORT = Number(process.env.API_PORT || 3001);

type Session = {
  history: ChatTurn[]; // minimal memory per socket
  ping?: NodeJS.Timeout;
  persona?: string; // current persona
};

function send(ws: WebSocket, obj: Record<string, any>) {
  if (ws.readyState === ws.OPEN) ws.send(JSON.stringify(obj));
}

// Create Express app for API routes
const app = express();
app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// API routes
app.use("/api/personas", personaRoutes);
app.use("/api/auth", authRoutes);

// Health check endpoint
app.get("/health", (req: express.Request, res: express.Response) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Start API server
app.listen(API_PORT, () => {
  console.log(`[server] API server listening on port ${API_PORT}`);
});

const wss = new WebSocketServer({ port: PORT }, () =>
  console.log(`[server] Therapy WS listening on ${PORT}`)
);

wss.on("connection", (ws: WebSocket) => {
  const sess: Session = { history: [], persona: "sarah" }; // default to sarah
  send(ws, { type: "ready" });
  send(ws, {
    type: "info",
    message: `LLM: Gemini Pro (Google AI)`,
  });

  // keep alive
  sess.ping = setInterval(() => {
    try {
      ws.ping();
    } catch {}
  }, 25000);

  ws.on("message", async (data: Buffer, isBinary: boolean) => {
    if (isBinary) return; // no audio in this build

    try {
      const msg = JSON.parse(data.toString());

      // Set persona
      if (msg.type === "set_persona") {
        sess.persona = msg.persona || "sarah";
        send(ws, { type: "info", message: `Persona set to: ${sess.persona}` });
        return;
      }

      // Typed chat from client
      if (msg.type === "text_input") {
        const userText = String(msg.text || "").trim();
        if (!userText) return;

        // echo user text to UI
        send(ws, { type: "final_stt", text: userText });

        // basic crisis screen
        if (detectCrisis(userText)) {
          const reply = crisisResponse();
          sess.history.push({ role: "user", content: userText });
          sess.history.push({ role: "assistant", content: reply });
          send(ws, { type: "persona_say", who: "thera", text: reply });
          return;
        }

        // normal reply with persona context
        const reply = await therapyReply(userText, sess.history, sess.persona);
        // update memory (trim to last 10 turns)
        sess.history.push({ role: "user", content: userText });
        sess.history.push({ role: "assistant", content: reply });
        if (sess.history.length > 20)
          sess.history.splice(0, sess.history.length - 20);

        send(ws, { type: "persona_say", who: "thera", text: reply });
        return;
      }

      if (msg.type === "reset") {
        sess.history = [];
        send(ws, { type: "info", message: "Memory cleared" });
        return;
      }
    } catch (err: any) {
      console.error(err);
      send(ws, { type: "error", message: String(err?.message || err) });
    }
  });

  ws.on("close", () => {
    if (sess.ping) clearInterval(sess.ping);
  });
});
