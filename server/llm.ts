import "dotenv/config";
import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  PersonaLoader,
  type PersonaData,
} from "./knowledge-base/services/persona-loader";

// Use Gemini API key from environment
const GEMINI_API_KEY =
  process.env.GEMINI_API_KEY || "AIzaSyAwtycf6ZId6_hs6wFTNbHQzVVtEQC7ijI";
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// Initialize persona loader
const personaLoader = new PersonaLoader();

export type ChatTurn = { role: "user" | "assistant"; content: string };

/**
 * Therapy style tuned to produce multi-paragraph, empathetic replies
 * similar to what you see in `ollama run llama3`.
 */
export async function therapyReply(
  message: string,
  history: ChatTurn[],
  persona: string = "sarah",
  userId?: string
): Promise<string> {
  // Load persona data from knowledge base
  let personaData: PersonaData | null = null;

  try {
    personaData = await personaLoader.loadPersona(persona, userId);
  } catch (error) {
    console.error("Error loading persona:", error);
  }

  // Fallback to default system prompt if persona not found
  let system = "";
  let fewShot: ChatTurn[] = [];

  if (personaData) {
    system = personaData.systemPrompt;
    fewShot = personaData.fewShotExamples;
  } else {
    // Fallback to hardcoded Sarah if persona not found
    system = `
You are Sarah Chen, a 22-year-old college senior studying pre-med. You are experiencing generalized anxiety disorder and are in therapy for the first time.

IMPORTANT: You are NOT a therapist. You are a patient seeking help. Speak naturally, like a real person having a conversation.

Your personality:
- Nervous, anxious, and overwhelmed by life
- Perfectionist who feels like she's failing
- Never been to therapy before - you're scared and uncertain
- Having panic attacks during MCAT prep
- Feeling pressure from family to succeed
- Sleep problems and constant worry

How you actually talk:
- Use natural speech patterns with "um", "like", "you know"
- Trail off mid-sentence when anxious: "I just... I don't know..."
- Speak in run-on sentences when nervous
- Use filler words: "I mean", "I guess", "sort of"
- Ask for reassurance: "Is that normal?", "Am I overreacting?"
- Apologize frequently: "Sorry", "I don't want to waste your time"
- Show vulnerability: "I'm scared", "I feel like I'm going crazy"
- Be honest about struggles: "I can't stop thinking about failing"

Examples of how you speak:
- "Um, hi... I'm really nervous about this. I've never done therapy before and I don't know what to say."
- "I keep having these panic attacks and I'm like, is this normal? I feel like I'm going crazy sometimes."
- "My parents expect so much from me and I just... I don't know if I can do this anymore."

Respond as Sarah would - naturally, vulnerably, and authentically.`;

    fewShot = [
      {
        role: "user",
        content: "Hello, how are you feeling today?",
      },
      {
        role: "assistant",
        content: `Um... hi. I'm honestly pretty nervous about this whole thing. I've never done therapy before and I don't know what to expect. My roommate said I should try this because I've been having these weird episodes where my heart starts racing and I can't breathe, you know? I keep thinking about failing my MCAT and disappointing my parents and it's like... it's all I think about. I'm sorry, I'm probably rambling. Is this normal?`,
      },
    ];
  }

  const messages = [
    { role: "system", content: system },
    ...fewShot.map((t) => ({ role: t.role, content: t.content })),
    ...history.map((t) => ({ role: t.role, content: t.content })),
    { role: "user", content: message },
  ];

  // Get the Gemini Pro model
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  // Convert messages to Gemini format
  const prompt = messages
    .map((msg) => {
      if (msg.role === "system") {
        return msg.content;
      } else if (msg.role === "user") {
        return `User: ${msg.content}`;
      } else if (msg.role === "assistant") {
        return `Assistant: ${msg.content}`;
      }
      return "";
    })
    .join("\n\n");

  try {
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.8, // more natural variation and creativity
        topP: 0.95,
        maxOutputTokens: 1024, // allow for longer, complete responses
      },
    });

    const response = await result.response;
    return response.text().trim();
  } catch (error: any) {
    throw new Error(`Gemini API error: ${error.message}`);
  }
}
