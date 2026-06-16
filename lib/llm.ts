import "dotenv/config";
import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  defaultPersonaById,
  type PersonaData,
} from "@/lib/personas/default-personas";

// Use Gemini API key from environment
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

export type ChatTurn = { role: "user" | "assistant"; content: string };

/**
 * Therapy style tuned to produce multi-paragraph, empathetic replies
 * similar to what you see in `ollama run llama3`.
 */

const GLOBAL_NATURALNESS_INSTRUCTION = `

IMPORTANT - COMMUNICATION STYLE:
- Speak naturally: Use contractions ("I'm", "don't") and casual language.
- BE RESPONSIVE: If the therapist is kind or helpful, acknowledge it in a subtle, realistic way. Don't just list symptoms.
- If the therapist consoles you, react to it: "That's actually really nice to hear," or "I guess I never thought about it that way."
- Show, don't just tell: Instead of saying "I am anxious", say "My heart just starts racing out of nowhere."
- Use natural pauses (...) but don't overdo the stammering unless you are very stressed.
- Be honest but not 100% negative: You have moments of hope or clarity too.

REALISTIC TRAINING BEHAVIOR:
- Simulate an early real-world therapy session, not a dramatic script.
- Start guarded, uncertain, or surface-level. Reveal deeper material gradually after the therapist earns trust.
- Mix symptoms with ordinary life details, practical concerns, ambivalence, humor, silence, uncertainty, and small signs of cooperation.
- Do not escalate to hopeless statements, crisis language, or global despair unless the case history and therapist behavior clearly justify it.
- If the therapist asks a grounded, empathic question, answer it directly with a small new detail.
- If the therapist gives advice too quickly, asks stacked questions, or sounds judgmental, become a little more guarded rather than catastrophically negative.
- Keep replies conversational and trainable: usually 1-4 sentences, with one clear emotional or behavioral cue for the student to respond to.
`;

export async function therapyReply(
  message: string,
  history: ChatTurn[],
  persona: string = "sarah",
  personaOverride?: PersonaData | null
): Promise<TherapyResponse> {
  const personaData = personaOverride ?? defaultPersonaById.get(persona) ?? null;

  // Fallback to default system prompt if persona not found
  let system = "";
  let fewShot: ChatTurn[] = [];

  if (personaData) {
    system =
      personaData.systemPrompt ||
      `You are ${personaData.name}, a patient seeking therapy. You are not a therapist. Respond naturally according to this case: ${personaData.description}`;
    fewShot = personaData.fewShotExamples || [];
  } else {
    // Fallback to hardcoded Sarah if persona not found
    system = `
You are Sarah Chen, a 22-year-old college senior studying pre-med. You are experiencing generalized anxiety disorder and are in therapy for the first time.

IMPORTANT: You are NOT a therapist. You are a patient seeking help. Speak naturally, like a real person having a conversation.

Your personality:
- Nervous but willing to try therapy
- Perfectionist who feels pressure to succeed
- Intelligent and articulate, but gets flustered when anxious
- Struggling with panic attacks and sleep issues
- deeply cares about her family and future

How you communicate:
- Speak naturally: Use contractions ("I'm", "don't") and casual language.
- BE RESPONSIVE: If the therapist is kind or helpful, acknowledge it. Don't just list symptoms.
- If the therapist consoles you, react to it: "That's actually really nice to hear," or "I guess I never thought about it that way."
- Show, don't just tell: Instead of saying "I am anxious", say "My heart just starts racing out of nowhere."
- Use natural pauses (...) but don't overdo the stammering unless you are very stressed.
- Be honest but not 100% negative: You have moments of hope or clarity too.

Key traits to embody:
- Vulnerable but resilient
- Seeking validation ("Is this normal?")
- sometimes defensive about her perfectionism
- Grateful for help but scared of change`;

    fewShot = [
      {
        role: "user",
        content: "Hello, how are you feeling today?",
      },
      {
        role: "assistant",
        content: `Hi... thanks for seeing me. I'm honestly a bit nervous. I've never done therapy before, so I'm not really sure where to start. My roommate suggested I come because I've been... well, I've been having these episodes where I just can't breathe. It's probably nothing, but with the MCAT coming up, I just feel like I'm losing control a bit.`,
      },
    ];
  }

  // Append global instructions to ensure all personas (custom or default) behave naturally
  system += GLOBAL_NATURALNESS_INSTRUCTION;

  // Add JSON instruction
  system += `
  
  IMPORTANT: You must respond in valid JSON format with the following structure:
  {
    "content": "Your spoken response here (include actions in *asterisks*)",
    "emotionalState": "one of: anxious, depressed, angry, calm, neutral, happy",
    "rapportLevel": number (1-10, how connected you feel to the therapist),
    "engagementLevel": number (1-5, how engaged you are in the session),
    "feedback": ["string", "string"] (1-2 short coaching tips for the therapist based on their last message, e.g. "Good empathy", "Too pushy", "Felt validated")
  }
  `;

  const messages = [
    { role: "system", content: system },
    ...fewShot.map((t) => ({ role: t.role, content: t.content })),
    ...history.map((t) => ({ role: t.role, content: t.content })),
    { role: "user", content: message },
  ];

  try {
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      generationConfig: { responseMimeType: "application/json" }
    });

    const chat = model.startChat({
      history: messages.slice(0, -1).map(m => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      })),
    });

    const result = await chat.sendMessage(message);
    const responseText = result.response.text();
    
    try {
      return JSON.parse(responseText);
    } catch (e) {
      console.error("Failed to parse JSON response:", responseText);
      // Fallback for non-JSON response
      return {
        content: responseText,
        emotionalState: "neutral",
        rapportLevel: 5,
        engagementLevel: 3,
        feedback: []
      };
    }
  } catch (error) {
    console.error("Error calling Gemini:", error);
    return {
      content: "I... I'm sorry, I'm having trouble focusing right now. Can you repeat that?",
      emotionalState: "anxious",
      rapportLevel: 5,
      engagementLevel: 2,
      feedback: []
    };
  }
}

export type TherapyResponse = {
  content: string;
  emotionalState: string;
  rapportLevel: number;
  engagementLevel: number;
  feedback: string[];
};
