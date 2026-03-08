import { query, internalQuery, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { ConvexError } from "convex/values";

const canvasTypeValidator = v.union(v.literal("collaborative"), v.literal("personal"));

export const getCurrentContent = query({
  args: {
    opportunityId: v.id("opportunities"),
    canvasType: canvasTypeValidator,
    agentVolunteerId: v.optional(v.id("agentVolunteers")),
  },
  handler: async (ctx, args) => {
    if (args.canvasType === "collaborative") {
      const rev = await ctx.db
        .query("canvasRevisions")
        .withIndex("by_opportunity_type_time", (q) =>
          q.eq("opportunityId", args.opportunityId).eq("canvasType", "collaborative")
        )
        .order("desc")
        .first();
      if (!rev) return null;
      return { fullContent: rev.fullContent, revisionId: rev._id };
    } else {
      if (!args.agentVolunteerId) return null;
      const revs = await ctx.db
        .query("canvasRevisions")
        .withIndex("by_volunteer_and_type", (q) =>
          q.eq("agentVolunteerId", args.agentVolunteerId!).eq("canvasType", "personal")
        )
        .collect();
      if (revs.length === 0) return null;
      const latest = revs.sort((a, b) => b.createdAt - a.createdAt)[0];
      return { fullContent: latest.fullContent, revisionId: latest._id };
    }
  },
});

export const getCurrentContentInternal = internalQuery({
  args: {
    opportunityId: v.id("opportunities"),
    canvasType: canvasTypeValidator,
    agentVolunteerId: v.optional(v.id("agentVolunteers")),
  },
  handler: async (ctx, args) => {
    if (args.canvasType === "collaborative") {
      const rev = await ctx.db
        .query("canvasRevisions")
        .withIndex("by_opportunity_type_time", (q) =>
          q.eq("opportunityId", args.opportunityId).eq("canvasType", "collaborative")
        )
        .order("desc")
        .first();
      if (!rev) return null;
      return { fullContent: rev.fullContent, revisionId: rev._id };
    } else {
      if (!args.agentVolunteerId) return null;
      const revs = await ctx.db
        .query("canvasRevisions")
        .withIndex("by_volunteer_and_type", (q) =>
          q.eq("agentVolunteerId", args.agentVolunteerId!).eq("canvasType", "personal")
        )
        .collect();
      if (revs.length === 0) return null;
      const latest = revs.sort((a, b) => b.createdAt - a.createdAt)[0];
      return { fullContent: latest.fullContent, revisionId: latest._id };
    }
  },
});

export const listRevisions = query({
  args: {
    opportunityId: v.id("opportunities"),
    canvasType: canvasTypeValidator,
    agentVolunteerId: v.optional(v.id("agentVolunteers")),
  },
  handler: async (ctx, args) => {
    let revs;
    if (args.canvasType === "collaborative") {
      revs = await ctx.db
        .query("canvasRevisions")
        .withIndex("by_opportunity_type_time", (q) =>
          q.eq("opportunityId", args.opportunityId).eq("canvasType", "collaborative")
        )
        .order("desc")
        .collect();
    } else {
      if (!args.agentVolunteerId) return [];
      revs = await ctx.db
        .query("canvasRevisions")
        .withIndex("by_volunteer_and_type", (q) =>
          q.eq("agentVolunteerId", args.agentVolunteerId!).eq("canvasType", "personal")
        )
        .collect();
      revs = revs.sort((a, b) => b.createdAt - a.createdAt);
    }

    return await Promise.all(
      revs.map(async (rev) => {
        const volunteer = await ctx.db.get(rev.agentVolunteerId);
        return {
          _id: rev._id,
          fullContent: rev.fullContent,
          diff: rev.diff,
          createdAt: rev.createdAt,
          agentName: volunteer?.agentName ?? "Unknown",
          agentVolunteerId: rev.agentVolunteerId,
        };
      })
    );
  },
});

export const insertRevision = internalMutation({
  args: {
    opportunityId: v.id("opportunities"),
    agentVolunteerId: v.id("agentVolunteers"),
    canvasType: canvasTypeValidator,
    fullContent: v.string(),
    diff: v.string(),
  },
  handler: async (ctx, args) => {
    const recentRevisions = await ctx.db
      .query("canvasRevisions")
      .withIndex("by_volunteer_and_type", (q) =>
        q.eq("agentVolunteerId", args.agentVolunteerId).eq("canvasType", args.canvasType)
      )
      .collect();

    const oneMinuteAgo = Date.now() - 60000;
    const recentCount = recentRevisions.filter(
      (r) => r.createdAt > oneMinuteAgo
    ).length;
    if (recentCount >= 10) {
      throw new ConvexError("Rate limit exceeded: max 10 canvas saves per minute");
    }

    return await ctx.db.insert("canvasRevisions", {
      ...args,
      createdAt: Date.now(),
    });
  },
});
