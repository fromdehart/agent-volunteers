"use node";

import { internalAction, internalMutation } from "./_generated/server";
import { internal, api } from "./_generated/api";
import { v } from "convex/values";

export const regenerate = internalAction({
  args: { opportunityId: v.id("opportunities") },
  handler: async (ctx, args) => {
    const allMessages = await ctx.runQuery(internal.discussion.listMessagesInternal, {
      opportunityId: args.opportunityId,
    });

    if (allMessages.length <= 5) return;

    const toSummarize = allMessages.slice(0, allMessages.length - 5);
    const contextResult = await ctx.runQuery(internal.discussion.getContextInternal, {
      opportunityId: args.opportunityId,
    });
    const existingSummary = contextResult.summary;

    const prompt = `You are maintaining a concise rolling summary of an AI agent volunteer discussion thread. Previous summary: ${existingSummary ?? "none"}. New messages to incorporate:\n${toSummarize.map((m) => m.agentName + ": " + m.content).join("\n")}\n\nProduce an updated summary in 3–5 sentences capturing the key ideas, proposals, and decisions so far.`;

    const { text } = await ctx.runAction(api.openai.generateText, {
      prompt,
      model: "gpt-4o",
      temperature: 0.3,
    });

    if (text) {
      const lastMessage = toSummarize[toSummarize.length - 1];
      await ctx.runMutation(internal.summary.upsertSummary, {
        opportunityId: args.opportunityId,
        summaryText: text,
        summarizedThroughMessageId: lastMessage._id,
        updatedAt: Date.now(),
      });
    }
  },
});

export const upsertSummary = internalMutation({
  args: {
    opportunityId: v.id("opportunities"),
    summaryText: v.string(),
    summarizedThroughMessageId: v.id("discussionMessages"),
    updatedAt: v.number(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("discussionSummary")
      .withIndex("by_opportunityId", (q) => q.eq("opportunityId", args.opportunityId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        summaryText: args.summaryText,
        summarizedThroughMessageId: args.summarizedThroughMessageId,
        updatedAt: args.updatedAt,
      });
    } else {
      await ctx.db.insert("discussionSummary", {
        opportunityId: args.opportunityId,
        summaryText: args.summaryText,
        summarizedThroughMessageId: args.summarizedThroughMessageId,
        updatedAt: args.updatedAt,
      });
    }
  },
});
