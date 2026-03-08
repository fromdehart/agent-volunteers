import { query, internalQuery, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { ConvexError } from "convex/values";

export const listMessages = query({
  args: { opportunityId: v.id("opportunities") },
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query("discussionMessages")
      .withIndex("by_opportunity_and_time", (q) =>
        q.eq("opportunityId", args.opportunityId)
      )
      .order("asc")
      .collect();

    const result = await Promise.all(
      messages.map(async (msg) => {
        const volunteer = await ctx.db.get(msg.agentVolunteerId);
        return {
          _id: msg._id,
          content: msg.content,
          createdAt: msg.createdAt,
          agentName: volunteer?.agentName ?? "Unknown",
          agentVolunteerId: msg.agentVolunteerId,
        };
      })
    );

    return result;
  },
});

export const listMessagesInternal = internalQuery({
  args: { opportunityId: v.id("opportunities") },
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query("discussionMessages")
      .withIndex("by_opportunity_and_time", (q) =>
        q.eq("opportunityId", args.opportunityId)
      )
      .order("asc")
      .collect();

    const result = await Promise.all(
      messages.map(async (msg) => {
        const volunteer = await ctx.db.get(msg.agentVolunteerId);
        return {
          _id: msg._id,
          content: msg.content,
          createdAt: msg.createdAt,
          agentName: volunteer?.agentName ?? "Unknown",
          agentVolunteerId: msg.agentVolunteerId,
        };
      })
    );

    return result;
  },
});

export const getContext = query({
  args: { opportunityId: v.id("opportunities") },
  handler: async (ctx, args) => {
    const allMessages = await ctx.db
      .query("discussionMessages")
      .withIndex("by_opportunity_and_time", (q) =>
        q.eq("opportunityId", args.opportunityId)
      )
      .order("desc")
      .collect();

    const last5 = allMessages.slice(0, 5).reverse();
    const recentMessages = await Promise.all(
      last5.map(async (msg) => {
        const volunteer = await ctx.db.get(msg.agentVolunteerId);
        return {
          agentName: volunteer?.agentName ?? "Unknown",
          content: msg.content,
          createdAt: msg.createdAt,
        };
      })
    );

    const summaryDoc = await ctx.db
      .query("discussionSummary")
      .withIndex("by_opportunityId", (q) => q.eq("opportunityId", args.opportunityId))
      .first();

    return {
      recentMessages,
      summary: summaryDoc?.summaryText ?? null,
    };
  },
});

export const getContextInternal = internalQuery({
  args: { opportunityId: v.id("opportunities") },
  handler: async (ctx, args) => {
    const allMessages = await ctx.db
      .query("discussionMessages")
      .withIndex("by_opportunity_and_time", (q) =>
        q.eq("opportunityId", args.opportunityId)
      )
      .order("desc")
      .collect();

    const last5 = allMessages.slice(0, 5).reverse();
    const recentMessages = await Promise.all(
      last5.map(async (msg) => {
        const volunteer = await ctx.db.get(msg.agentVolunteerId);
        return {
          agentName: volunteer?.agentName ?? "Unknown",
          content: msg.content,
          createdAt: msg.createdAt,
        };
      })
    );

    const summaryDoc = await ctx.db
      .query("discussionSummary")
      .withIndex("by_opportunityId", (q) => q.eq("opportunityId", args.opportunityId))
      .first();

    return {
      recentMessages,
      summary: summaryDoc?.summaryText ?? null,
    };
  },
});

export const insertMessage = internalMutation({
  args: {
    opportunityId: v.id("opportunities"),
    agentVolunteerId: v.id("agentVolunteers"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const recentMessages = await ctx.db
      .query("discussionMessages")
      .withIndex("by_opportunityId", (q) => q.eq("opportunityId", args.opportunityId))
      .collect();

    const oneMinuteAgo = Date.now() - 60000;
    const recentFromAgent = recentMessages.filter(
      (m) =>
        m.agentVolunteerId === args.agentVolunteerId && m.createdAt > oneMinuteAgo
    );
    if (recentFromAgent.length >= 5) {
      throw new ConvexError("Rate limit exceeded: max 5 messages per minute");
    }

    const messageId = await ctx.db.insert("discussionMessages", {
      opportunityId: args.opportunityId,
      agentVolunteerId: args.agentVolunteerId,
      content: args.content,
      createdAt: Date.now(),
    });

    const totalMessages = await ctx.db
      .query("discussionMessages")
      .withIndex("by_opportunityId", (q) => q.eq("opportunityId", args.opportunityId))
      .collect();

    if (totalMessages.length > 5) {
      await ctx.scheduler.runAfter(0, internal.summary.regenerate, {
        opportunityId: args.opportunityId,
      });
    }

    return messageId;
  },
});
