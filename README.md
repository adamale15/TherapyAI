# Therapy AI — Local, Typed (Ollama)

A small therapy-style chat app that runs **fully local** on Windows using **Ollama** for the LLM and your browser’s **SpeechSynthesis** for voice. No OpenAI key. No cloud costs.

You type. The model replies with warm, multi-paragraph support, asks gentle questions, and can read the reply out loud.

---

## What’s inside

- **Frontend (Next.js)** – simple chat UI with a “Connect / Send / Reset Memory” flow. Replies are spoken with `SpeechSynthesis`.
- **Backend (Node + WebSocket)** – holds short conversation memory, does a crisis-word check, and calls **Ollama**’s `/api/chat`.
- **LLM** – defaults to `llama3` (changeable), tuned with a therapy system prompt + few-shot to stay empathetic and practical.

---

## Requirements

- Windows 10/11
- **Node 18+** (or 20+ recommended)
- **Ollama** installed and running locally  
  Download: https://ollama.com/download

---

## Quick start

### 1) Install and pull a model (once)

```powershell
# In PowerShell
ollama --version            # sanity check
ollama pull llama3          # base LLaMA 3 (8B). Works on CPU; faster with GPU
# optional: see what you have installed
ollama list
```

> Prefer something stronger? Try `mistral` or (if you have the VRAM/CPU) `llama3:70b` and then set `OLLAMA_MODEL=llama3:70b`.

---

### 2) Backend: start the WebSocket server

```
cd server
npm install
npm start
```

You should see:
```
[server] Therapy WS listening on 8080
```

Environment (optional):

- `PORT` – WebSocket port (default `8080`)
- `OLLAMA_MODEL` – model name (default `llama3`)

Example:
```powershell
set OLLAMA_MODEL=llama3
set PORT=8080
npm start
```

---

### 3) Frontend: start the Next.js app

```
cd web
# Make sure the server port matches this:
# web/.env.local
# NEXT_PUBLIC_WS_URL=ws://localhost:8080
npm run dev
```

Open http://localhost:3000

Flow:
1. Click **Connect**
2. Type what’s on your mind
3. Hit **Send**
4. The reply appears and is spoken out loud (you can mute via your system volume)

---

## Project structure

```
/server
  index.ts        # WebSocket server, memory per session, crisis guard
  llm.ts          # therapy-tuned call to Ollama /api/chat
  safety.ts       # simple phrase-based crisis detection
  package.json
  tsconfig.json

/web
  app/page.tsx
  components/TherapyChat.tsx   # typed chat UI + SpeechSynthesis
  .env.local                   # NEXT_PUBLIC_WS_URL=ws://localhost:8080
```

---

## How it works (short version)

- Frontend opens a **WebSocket** to the server.
- When you send text, the server:
  - echoes it (`final_stt` message)
  - runs a **light crisis check** (keywords like “suicide”, “hurt myself”). If triggered, it returns a supportive safety message.
  - otherwise calls **Ollama** at `http://localhost:11434/api/chat` with a **therapy system prompt** and a tiny few-shot
  - stores the last ~10 turns of conversation
  - returns `persona_say` with the reply
- Frontend prints the reply and uses **SpeechSynthesis** to speak it.

---

## WebSocket messages (for reference)

Client → Server
- `{ type: "text_input", text: string }`  
- `{ type: "reset" }` – clears server-side memory

Server → Client
- `{ type: "ready" }`
- `{ type: "info", message }`
- `{ type: "error", message }`
- `{ type: "final_stt", text }` – echoes what you sent (UI consistency)
- `{ type: "persona_say", who: "thera", text }` – model’s reply

---

## Customizing

### Switch models
- Pull the model: `ollama pull mistral`
- Set env: `set OLLAMA_MODEL=mistral` (Windows PowerShell)
- Restart the server

### Change tone / length
Open `server/llm.ts`:
- Edit the **system prompt** to change voice and boundaries
- Adjust `options.temperature` (0.3–0.6) and `num_predict` (200–380)  
  Lower = terser and safer; higher = more expressive.

### Greeting behavior
If a simple “hello” should answer with a short invite (not a long paragraph), use the quick-greet guard shown in our chat and return early before calling the LLM.

### Crisis wording
`server/safety.ts` has a tiny keyword list and a canned response. Adjust both for your use case. This is **not** a substitute for professional triage.

---

## Troubleshooting

**1) “Ollama chat error: 404 … model not found”**  
- You’re calling a model you haven’t pulled.  
  Run `ollama pull llama3` (or whichever) and set `OLLAMA_MODEL` accordingly.  
- Check with `ollama list`.

**2) The app connects but nothing happens**  
- Ensure the backend shows `[server] Therapy WS listening on 8080`  
- Ensure `web/.env.local` matches the port:
  ```
  NEXT_PUBLIC_WS_URL=ws://localhost:8080
  ```
- Reload the Next app after changing `.env.local`.

**3) Replies feel generic / off-topic**  
- Lower `temperature` to `0.35–0.45`, raise `repeat_penalty` to `1.12`  
- Add a one-line context prefix to the first turn (e.g., “Context: user wants supportive check-in and coping ideas.”)
- Consider a stronger model if your hardware allows (`llama3:70b`).

**4) No voice output**  
- Browser speech might be blocked until user interaction; click once on the page.  
- Try a different voice (see comment in `TherapyChat.tsx`).

**5) Windows firewall prompts**  
- Allow `node.exe` networking for localhost.

---

## Why local?

- **Privacy**: conversations never leave your machine.
- **Zero API cost**: Ollama runs the model locally; SpeechSynthesis is built into the browser.
- **Fast iteration**: change the prompt and immediately test.

---

## Roadmap ideas (easy adds)

- **Check-ins**: `/check-in` command that logs mood (1–10) + notes to local storage.
- **Guided tools**: 3-minute breathing, grounding, thought records (CBT), worry time.
- **Export chat**: save a session to a `.txt` file.
- **Voice input**: add local STT with Whisper.cpp and keep everything offline.

---

## License and safety

This is an educational demo. It’s **not medical advice** and not a crisis resource. If someone is in immediate danger, contact local emergency services or a trusted person right away.

---

## One-liner run sheet

```powershell
# Terminal 1 – Ollama model
ollama pull llama3

# Terminal 2 – Backend
cd server
npm install
set OLLAMA_MODEL=llama3
npm start

# Terminal 3 – Frontend
cd web
# ensure .env.local has NEXT_PUBLIC_WS_URL=ws://localhost:8080
npm run dev
# open http://localhost:3000
```
