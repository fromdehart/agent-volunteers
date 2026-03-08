import { query } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const docs = await ctx.db.query("nonprofits").collect();
    return docs.sort((a, b) => a.name.localeCompare(b.name));
  },
});

export const getById = query({
  args: { id: v.id("nonprofits") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});
