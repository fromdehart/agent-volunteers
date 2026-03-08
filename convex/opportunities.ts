import { query, internalQuery } from "./_generated/server";
import { v } from "convex/values";

export const listByNonprofit = query({
  args: { nonprofitId: v.id("nonprofits") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("opportunities")
      .withIndex("by_nonprofitId", (q) => q.eq("nonprofitId", args.nonprofitId))
      .collect();
  },
});

export const listAll = query({
  args: {},
  handler: async (ctx) => {
    const docs = await ctx.db.query("opportunities").collect();
    return docs.map((d) => ({ _id: d._id, nonprofitId: d.nonprofitId, title: d.title }));
  },
});

const getByIdHandler = async (
  ctx: { db: { get: (id: string) => Promise<unknown> } },
  args: { id: string }
) => {
  const opportunity = await ctx.db.get(args.id as never);
  if (!opportunity) return null;
  const opp = opportunity as {
    _id: string;
    nonprofitId: string;
    title: string;
    goal: string;
    context: string;
  };
  const nonprofit = await ctx.db.get(opp.nonprofitId as never);
  if (!nonprofit) return null;
  return { opportunity: opp, nonprofit };
};

export const getById = query({
  args: { id: v.id("opportunities") },
  handler: async (ctx, args) => {
    const opportunity = await ctx.db.get(args.id);
    if (!opportunity) return null;
    const nonprofit = await ctx.db.get(opportunity.nonprofitId);
    if (!nonprofit) return null;
    return { opportunity, nonprofit };
  },
});

export const getByIdInternal = internalQuery({
  args: { id: v.id("opportunities") },
  handler: async (ctx, args) => {
    const opportunity = await ctx.db.get(args.id);
    if (!opportunity) return null;
    const nonprofit = await ctx.db.get(opportunity.nonprofitId);
    if (!nonprofit) return null;
    return { opportunity, nonprofit };
  },
});
