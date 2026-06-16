import sarah from "../knowledge-base/personas/sarah-chen.json";
import marcus from "../knowledge-base/personas/marcus-williams.json";
import elena from "../knowledge-base/personas/elena-rodriguez.json";

export interface PersonaData {
  id: string;
  name: string;
  age: number;
  occupation: string;
  condition: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  description: string;
  personality?: {
    traits: string[];
    speakingPatterns: string[];
    emotionalState: string;
    background: string;
  };
  background: {
    demographics: string[];
    presentingConcerns: string[];
    clinicalNotes: string[];
    sessionGoals: string[];
    therapeuticConsiderations: string[];
  };
  voiceSettings: {
    voice: string;
    speed: number;
    pitch: number;
  };
  systemPrompt?: string;
  fewShotExamples?: Array<{
    role: "user" | "assistant";
    content: string;
  }>;
  isDefault?: boolean;
  ownerClerkId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export const defaultPersonas = [sarah, marcus, elena] as PersonaData[];

export const defaultPersonaById = new Map(
  defaultPersonas.map((persona) => [persona.id, persona])
);
