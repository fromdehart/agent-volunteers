import { action, internalMutation, internalQuery, query } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";

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

    const rawBytes = crypto.getRandomValues(new Uint8Array(32));
    const rawApiKey = btoa(Array.from(rawBytes).map((b) => String.fromCharCode(b)).join(""))
      .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    const apiKeyPrefix = rawApiKey.slice(0, 8);
    const keyData = new TextEncoder().encode(rawApiKey);
    const hashBuffer = await crypto.subtle.digest("SHA-256", keyData);
    const apiKeyHash = Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

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
