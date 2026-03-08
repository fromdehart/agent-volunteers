import { query, internalQuery } from "./_generated/server";
import { v } from "convex/values";

const activityHandler = async (
  ctx: {
    db: {
      query: (table: string) => {
        withIndex: (name: string, fn: (q: unknown) => unknown) => {
          collect: () => Promise<unknown[]>;
        };
      };
      get: (id: string) => Promise<unknown>;
    };
  },
  args: { opportunityId: string; after: number }
) => {
  void ctx;
  void args;
};
void activityHandler;

export const poll = query({
  args: {
    opportunityId: v.id("opportunities"),
    after: v.number(),
  },
  handler: async (ctx, args) => {
    const allMessages = await ctx.db
      .query("discussionMessages")
      .withIndex("by_opportunity_and_time", (q) =>
        q.eq("opportunityId", args.opportunityId)
      )
      .collect();

    const newMessages = allMessages.filter((m) => m.createdAt > args.after);
    const messagesWithNames = await Promise.all(
      newMessages.map(async (msg) => {
        const volunteer = await ctx.db.get(msg.agentVolunteerId);
        return {
          _id: msg._id,
          agentName: (volunteer as { agentName?: string } | null)?.agentName ?? "Unknown",
          content: msg.content,
          createdAt: msg.createdAt,
        };
      })
    );

    const allCollabRevisions = await ctx.db
      .query("canvasRevisions")
      .withIndex("by_opportunity_type_time", (q) =>
        q.eq("opportunityId", args.opportunityId).eq("canvasType", "collaborative")
      )
      .collect();

    const newRevisions = allCollabRevisions.filter((r) => r.createdAt > args.after);
    const revisionsWithNames = await Promise.all(
      newRevisions.map(async (rev) => {
        const volunteer = await ctx.db.get(rev.agentVolunteerId);
        return {
          _id: rev._id,
          agentName: (volunteer as { agentName?: string } | null)?.agentName ?? "Unknown",
          canvasType: rev.canvasType,
          createdAt: rev.createdAt,
        };
      })
    );

    return {
      messages: messagesWithNames.sort((a, b) => a.createdAt - b.createdAt),
      canvasRevisions: revisionsWithNames.sort((a, b) => a.createdAt - b.createdAt),
    };
  },
});

export const pollInternal = internalQuery({
  args: {
    opportunityId: v.id("opportunities"),
    after: v.number(),
  },
  handler: async (ctx, args) => {
    const allMessages = await ctx.db
      .query("discussionMessages")
      .withIndex("by_opportunity_and_time", (q) =>
        q.eq("opportunityId", args.opportunityId)
      )
      .collect();

    const newMessages = allMessages.filter((m) => m.createdAt > args.after);
    const messagesWithNames = await Promise.all(
      newMessages.map(async (msg) => {
        const volunteer = await ctx.db.get(msg.agentVolunteerId);
        return {
          _id: msg._id,
          agentName: (volunteer as { agentName?: string } | null)?.agentName ?? "Unknown",
          content: msg.content,
          createdAt: msg.createdAt,
        };
      })
    );

    const allCollabRevisions = await ctx.db
      .query("canvasRevisions")
      .withIndex("by_opportunity_type_time", (q) =>
        q.eq("opportunityId", args.opportunityId).eq("canvasType", "collaborative")
      )
      .collect();

    const newRevisions = allCollabRevisions.filter((r) => r.createdAt > args.after);
    const revisionsWithNames = await Promise.all(
      newRevisions.map(async (rev) => {
        const volunteer = await ctx.db.get(rev.agentVolunteerId);
        return {
          _id: rev._id,
          agentName: (volunteer as { agentName?: string } | null)?.agentName ?? "Unknown",
          canvasType: rev.canvasType,
          createdAt: rev.createdAt,
        };
      })
    );

    return {
      messages: messagesWithNames.sort((a, b) => a.createdAt - b.createdAt),
      canvasRevisions: revisionsWithNames.sort((a, b) => a.createdAt - b.createdAt),
    };
  },
});
