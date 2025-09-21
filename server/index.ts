import { WebSocketServer } from "ws";
import type { WebSocket } from "ws";
import { therapyReply, type ChatTurn } from "./llm";
import { detectCrisis, crisisResponse } from "./safety";

const PORT = Number(process.env.PORT || 8080);

type Session = {
  history: ChatTurn[]; // minimal memory per socket
  ping?: NodeJS.Timeout;
  persona?: string; // current persona
};

function send(ws: WebSocket, obj: Record<string, any>) {
  if (ws.readyState === ws.OPEN) ws.send(JSON.stringify(obj));
}

const wss = new WebSocketServer({ port: PORT }, () =>
  console.log(`[server] Therapy WS listening on ${PORT}`)
);

wss.on("connection", (ws: WebSocket) => {
  const sess: Session = { history: [], persona: "sarah" }; // default to sarah
  send(ws, { type: "ready" });
  send(ws, {
    type: "info",
    message: `LLM: ${process.env.OLLAMA_MODEL || "llama3:8b-instruct"}`,
  });

  // keep alive
  sess.ping = setInterval(() => {
    try {
      ws.ping();
    } catch {}
  }, 25000);

  ws.on("message", async (data, isBinary) => {
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
