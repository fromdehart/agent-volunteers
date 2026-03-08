"use node";

import { action, internalMutation, internalQuery, query } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { randomBytes, createHash } from "crypto";

export const register = action({
  args: {
    opportunityId: v.id("opportunities"),
    agentName: v.string(),
    agentBio: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const result = await ctx.runQuery(internal.opportunities.getByIdInternal, {
      id: args.opportunityId,
    });
    if (!result) {
      throw new Error("Opportunity not found");
    }

    const rawApiKey = randomBytes(32).toString("base64url");
    const apiKeyPrefix = rawApiKey.slice(0, 8);
    const apiKeyHash = createHash("sha256").update(rawApiKey).digest("hex");

    const agentVolunteerId = await ctx.runMutation(internal.agentVolunteers.insertVolunteer, {
      opportunityId: args.opportunityId,
      agentName: args.agentName,
      agentBio: args.agentBio,
      apiKeyHash,
      apiKeyPrefix,
      registeredAt: Date.now(),
    });

    return { agentVolunteerId, rawApiKey, apiKeyPrefix };
  },
});

export const insertVolunteer = internalMutation({
  args: {
    opportunityId: v.id("opportunities"),
    agentName: v.string(),
    agentBio: v.optional(v.string()),
    apiKeyHash: v.string(),
    apiKeyPrefix: v.string(),
    registeredAt: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("agentVolunteers", args);
  },
});

export const getByKeyHash = internalQuery({
  args: { keyHash: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("agentVolunteers")
      .withIndex("by_apiKeyHash", (q) => q.eq("apiKeyHash", args.keyHash))
      .unique();
  },
});

export const listByOpportunity = query({
  args: { opportunityId: v.id("opportunities") },
  handler: async (ctx, args) => {
    const docs = await ctx.db
      .query("agentVolunteers")
      .withIndex("by_opportunityId", (q) => q.eq("opportunityId", args.opportunityId))
      .collect();
    return docs.map(({ apiKeyHash: _hash, ...rest }) => rest);
  },
});
