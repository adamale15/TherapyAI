import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { defaultPersonas } from "../lib/personas/default-personas";

const personaArgs = {
  personaId: v.string(),
  ownerClerkId: v.optional(v.string()),
  name: v.string(),
  age: v.number(),
  occupation: v.string(),
  condition: v.string(),
  difficulty: v.union(
    v.literal("Beginner"),
    v.literal("Intermediate"),
    v.literal("Advanced")
  ),
  description: v.string(),
  personality: v.optional(v.any()),
  background: v.object({
    demographics: v.array(v.string()),
    presentingConcerns: v.array(v.string()),
    clinicalNotes: v.array(v.string()),
    sessionGoals: v.array(v.string()),
    therapeuticConsiderations: v.array(v.string()),
  }),
  voiceSettings: v.object({
    voice: v.string(),
    speed: v.number(),
    pitch: v.number(),
  }),
  systemPrompt: v.optional(v.string()),
  fewShotExamples: v.optional(
    v.array(
      v.object({
        role: v.union(v.literal("user"), v.literal("assistant")),
        content: v.string(),
      })
    )
  ),
};

async function callerClerkId(ctx: any, fallback?: string) {
  const identity = await ctx.auth.getUserIdentity();
  if (identity?.subject) return identity.subject;
  return fallback;
}

function toPersona(row: any) {
  return {
    id: row.personaId,
    name: row.name,
    age: row.age,
    occupation: row.occupation,
    condition: row.condition,
    difficulty: row.difficulty,
    description: row.description,
    personality: row.personality,
    background: row.background,
    voiceSettings: row.voiceSettings,
    systemPrompt: row.systemPrompt,
    fewShotExamples: row.fewShotExamples,
    isDefault: row.isDefault,
    ownerClerkId: row.ownerClerkId,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export const listForUser = query({
  args: { ownerClerkId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const ownerClerkId = await callerClerkId(ctx, args.ownerClerkId);
    const defaults = await ctx.db
      .query("personas")
      .withIndex("by_default", (q) => q.eq("isDefault", true))
      .collect();

    const custom = ownerClerkId
      ? await ctx.db
          .query("personas")
          .withIndex("by_owner", (q) => q.eq("ownerClerkId", ownerClerkId))
          .collect()
      : [];

    return [...defaults, ...custom].map(toPersona);
  },
});

export const getById = query({
  args: {
    personaId: v.string(),
    ownerClerkId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const ownerClerkId = await callerClerkId(ctx, args.ownerClerkId);
    const matches = await ctx.db
      .query("personas")
      .withIndex("by_persona_id", (q) => q.eq("personaId", args.personaId))
      .collect();

    const persona =
      matches.find((row) => row.isDefault) ||
      matches.find((row) => row.ownerClerkId === ownerClerkId);

    return persona ? toPersona(persona) : null;
  },
});

export const saveCustom = mutation({
  args: personaArgs,
  handler: async (ctx, args) => {
    const ownerClerkId = await callerClerkId(ctx, args.ownerClerkId);
    if (!ownerClerkId) {
      throw new Error("Authentication is required to save custom personas.");
    }

    const now = new Date().toISOString();
    const existing = await ctx.db
      .query("personas")
      .withIndex("by_owner", (q) => q.eq("ownerClerkId", ownerClerkId))
      .collect()
      .then((rows) =>
        rows.find((row) => row.personaId === args.personaId && !row.isDefault)
      );

    const doc = {
      ...args,
      ownerClerkId,
      isDefault: false,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };

    if (existing) {
      await ctx.db.patch(existing._id, doc);
    } else {
      await ctx.db.insert("personas", doc);
    }

    return { ...args, id: args.personaId, ownerClerkId, isDefault: false };
  },
});

export const deleteCustom = mutation({
  args: {
    personaId: v.string(),
    ownerClerkId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const ownerClerkId = await callerClerkId(ctx, args.ownerClerkId);
    if (!ownerClerkId) {
      throw new Error("Authentication is required to delete custom personas.");
    }

    const existing = await ctx.db
      .query("personas")
      .withIndex("by_owner", (q) => q.eq("ownerClerkId", ownerClerkId))
      .collect()
      .then((rows) =>
        rows.find((row) => row.personaId === args.personaId && !row.isDefault)
      );

    if (!existing || existing.isDefault) {
      throw new Error("Persona not found or cannot be deleted.");
    }

    await ctx.db.delete(existing._id);
    return { success: true };
  },
});

export const seedDefaults = mutation({
  args: {},
  handler: async (ctx) => {
    const now = new Date().toISOString();
    for (const persona of defaultPersonas) {
      const existing = await ctx.db
        .query("personas")
        .withIndex("by_persona_id", (q) => q.eq("personaId", persona.id))
        .first();

      const doc = {
        personaId: persona.id,
        ownerClerkId: undefined,
        name: persona.name,
        age: persona.age,
        occupation: persona.occupation,
        condition: persona.condition,
        difficulty: persona.difficulty,
        description: persona.description,
        personality: persona.personality,
        background: persona.background,
        voiceSettings: persona.voiceSettings,
        systemPrompt: persona.systemPrompt,
        fewShotExamples: persona.fewShotExamples,
        isDefault: true,
        createdAt: existing?.createdAt ?? now,
        updatedAt: now,
      };

      if (existing) {
        await ctx.db.patch(existing._id, doc);
      } else {
        await ctx.db.insert("personas", doc);
      }
    }

    return { seeded: defaultPersonas.length };
  },
});
