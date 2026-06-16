import { makeFunctionReference } from "convex/server";
import type { PersonaData } from "@/lib/personas/default-personas";
import type { ChatTurn } from "@/lib/llm";
import type { ClinicalMessage, ClinicalScores } from "@/lib/clinical-metrics";

export const convexFunctions = {
  personas: {
    listForUser: makeFunctionReference<
      "query",
      { ownerClerkId?: string },
      PersonaData[]
    >("personas:listForUser"),
    getById: makeFunctionReference<
      "query",
      { personaId: string; ownerClerkId?: string },
      PersonaData | null
    >("personas:getById"),
    saveCustom: makeFunctionReference<
      "mutation",
      Omit<PersonaData, "id" | "isDefault" | "createdAt" | "updatedAt"> & {
        personaId: string;
        ownerClerkId?: string;
      },
      PersonaData
    >("personas:saveCustom"),
    deleteCustom: makeFunctionReference<
      "mutation",
      { personaId: string; ownerClerkId?: string },
      { success: boolean }
    >("personas:deleteCustom"),
    seedDefaults: makeFunctionReference<"mutation", {}, { seeded: number }>(
      "personas:seedDefaults"
    ),
  },
  chatSessions: {
    getBySessionKey: makeFunctionReference<
      "query",
      { sessionKey: string },
      { history: ChatTurn[]; personaId: string } | null
    >("chatSessions:getBySessionKey"),
    getOrCreate: makeFunctionReference<
      "mutation",
      { sessionKey: string; ownerClerkId?: string },
      { history: ChatTurn[]; personaId: string }
    >("chatSessions:getOrCreate"),
    setPersona: makeFunctionReference<
      "mutation",
      { sessionKey: string; personaId: string; ownerClerkId?: string },
      { success: boolean }
    >("chatSessions:setPersona"),
    appendTurns: makeFunctionReference<
      "mutation",
      { sessionKey: string; ownerClerkId?: string; turns: ChatTurn[] },
      { success: boolean }
    >("chatSessions:appendTurns"),
    clearHistory: makeFunctionReference<
      "mutation",
      { sessionKey: string },
      { success: boolean }
    >("chatSessions:clearHistory"),
    listCompletedForUser: makeFunctionReference<
      "query",
      { ownerClerkId?: string },
      Array<{
        personaId: string;
        personaName: string;
        duration: number;
        totalMessages: number;
        scores: Partial<ClinicalScores>;
        messages: ClinicalMessage[];
        createdAt: string;
      }>
    >("chatSessions:listCompletedForUser"),
    saveCompleted: makeFunctionReference<
      "mutation",
      {
        ownerClerkId: string;
        personaId: string;
        personaName: string;
        duration: number;
        totalMessages: number;
        scores: ClinicalScores;
        messages: ClinicalMessage[];
      },
      { success: boolean }
    >("chatSessions:saveCompleted"),
  },
};
