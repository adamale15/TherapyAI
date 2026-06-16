import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const chatTurn = v.object({
  role: v.union(v.literal("user"), v.literal("assistant")),
  content: v.string(),
});

async function callerClerkId(ctx: any, fallback?: string) {
  const identity = await ctx.auth.getUserIdentity();
  if (identity?.subject) return identity.subject;
  return fallback;
}

export const getBySessionKey = query({
  args: { sessionKey: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("chatSessions")
      .withIndex("by_session_key", (q) => q.eq("sessionKey", args.sessionKey))
      .first();
  },
});

export const getOrCreate = mutation({
  args: {
    sessionKey: v.string(),
    ownerClerkId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("chatSessions")
      .withIndex("by_session_key", (q) => q.eq("sessionKey", args.sessionKey))
      .first();

    if (existing) return existing;

    const now = new Date().toISOString();
    const ownerClerkId = await callerClerkId(ctx, args.ownerClerkId);
    const id = await ctx.db.insert("chatSessions", {
      sessionKey: args.sessionKey,
      ownerClerkId,
      personaId: "sarah",
      history: [],
      createdAt: now,
      updatedAt: now,
    });

    return await ctx.db.get(id);
  },
});

export const setPersona = mutation({
  args: {
    sessionKey: v.string(),
    personaId: v.string(),
    ownerClerkId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("chatSessions")
      .withIndex("by_session_key", (q) => q.eq("sessionKey", args.sessionKey))
      .first();

    if (!session) {
      const now = new Date().toISOString();
      await ctx.db.insert("chatSessions", {
        sessionKey: args.sessionKey,
        ownerClerkId: await callerClerkId(ctx, args.ownerClerkId),
        personaId: args.personaId,
        history: [],
        createdAt: now,
        updatedAt: now,
      });
      return { success: true };
    }

    await ctx.db.patch(session._id, {
      personaId: args.personaId,
      updatedAt: new Date().toISOString(),
    });
    return { success: true };
  },
});

export const appendTurns = mutation({
  args: {
    sessionKey: v.string(),
    ownerClerkId: v.optional(v.string()),
    turns: v.array(chatTurn),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("chatSessions")
      .withIndex("by_session_key", (q) => q.eq("sessionKey", args.sessionKey))
      .first();

    const now = new Date().toISOString();
    if (!session) {
      await ctx.db.insert("chatSessions", {
        sessionKey: args.sessionKey,
        ownerClerkId: await callerClerkId(ctx, args.ownerClerkId),
        personaId: "sarah",
        history: args.turns.slice(-20),
        createdAt: now,
        updatedAt: now,
      });
      return { success: true };
    }

    await ctx.db.patch(session._id, {
      history: [...session.history, ...args.turns].slice(-20),
      updatedAt: now,
    });

    return { success: true };
  },
});

export const clearHistory = mutation({
  args: { sessionKey: v.string() },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("chatSessions")
      .withIndex("by_session_key", (q) => q.eq("sessionKey", args.sessionKey))
      .first();

    if (session) {
      await ctx.db.patch(session._id, {
        history: [],
        updatedAt: new Date().toISOString(),
      });
    }

    return { success: true };
  },
});

export const saveCompleted = mutation({
  args: {
    ownerClerkId: v.string(),
    personaId: v.string(),
    personaName: v.string(),
    duration: v.number(),
    totalMessages: v.number(),
    scores: v.any(),
    messages: v.any(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("sessionHistory", {
      ...args,
      createdAt: new Date().toISOString(),
    });

    return { success: true };
  },
});
