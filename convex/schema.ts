import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const difficulty = v.union(
  v.literal("Beginner"),
  v.literal("Intermediate"),
  v.literal("Advanced")
);

const chatTurn = v.object({
  role: v.union(v.literal("user"), v.literal("assistant")),
  content: v.string(),
});

const personaBackground = v.object({
  demographics: v.array(v.string()),
  presentingConcerns: v.array(v.string()),
  clinicalNotes: v.array(v.string()),
  sessionGoals: v.array(v.string()),
  therapeuticConsiderations: v.array(v.string()),
});

const voiceSettings = v.object({
  voice: v.string(),
  speed: v.number(),
  pitch: v.number(),
});

export default defineSchema({
  personas: defineTable({
    personaId: v.string(),
    ownerClerkId: v.optional(v.string()),
    name: v.string(),
    age: v.number(),
    occupation: v.string(),
    condition: v.string(),
    difficulty,
    description: v.string(),
    personality: v.optional(v.any()),
    background: personaBackground,
    voiceSettings,
    systemPrompt: v.optional(v.string()),
    fewShotExamples: v.optional(v.array(chatTurn)),
    isDefault: v.boolean(),
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index("by_persona_id", ["personaId"])
    .index("by_owner", ["ownerClerkId"])
    .index("by_default", ["isDefault"])
    .index("by_owner_and_persona", ["ownerClerkId", "personaId"]),

  chatSessions: defineTable({
    sessionKey: v.string(),
    ownerClerkId: v.optional(v.string()),
    personaId: v.string(),
    history: v.array(chatTurn),
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index("by_session_key", ["sessionKey"])
    .index("by_owner", ["ownerClerkId"]),

  sessionHistory: defineTable({
    ownerClerkId: v.string(),
    personaId: v.string(),
    personaName: v.string(),
    duration: v.number(),
    totalMessages: v.number(),
    scores: v.any(),
    messages: v.any(),
    createdAt: v.string(),
  })
    .index("by_owner", ["ownerClerkId"])
    .index("by_persona", ["personaId"])
    .index("by_created_at", ["createdAt"]),
});
