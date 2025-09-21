import "dotenv/config";
import fetch from "node-fetch";

const OPENAI_KEY = process.env.OPENAI_API_KEY!;
if (!OPENAI_KEY) throw new Error("Missing OPENAI_API_KEY");

const TTS_MODEL = "gpt-4o-mini-tts"; // or 'tts-1-hd'
const TTS_VOICE = "verse";

export async function speakWav(
  text: string,
  voice: string = TTS_VOICE
): Promise<Buffer> {
  const resp = await fetch("https://api.openai.com/v1/audio/speech", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: TTS_MODEL,
      voice,
      input: text,
      format: "wav",
    }),
  });

  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`TTS failed: ${resp.status} ${err}`);
  }
  const arr = await resp.arrayBuffer();
  return Buffer.from(arr);
}
