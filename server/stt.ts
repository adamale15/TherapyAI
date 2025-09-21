import "dotenv/config";
import FormData from "form-data";
import fetch from "node-fetch";

const OPENAI_KEY = process.env.OPENAI_API_KEY!;
if (!OPENAI_KEY) throw new Error("Missing OPENAI_API_KEY");

const STT_MODEL = "gpt-4o-transcribe"; // or 'whisper-1'

export async function transcribeWebm(
  buffer: Buffer,
  mime = "audio/webm"
): Promise<string> {
  const form = new FormData();
  form.append("file", buffer, { filename: "audio.webm", contentType: mime });
  form.append("model", STT_MODEL);
  form.append("response_format", "json");

  const resp = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${OPENAI_KEY}` },
    body: form as any,
  });

  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`STT failed: ${resp.status} ${err}`);
  }
  const data = (await resp.json()) as { text?: string };
  return (data.text ?? "").trim();
}
