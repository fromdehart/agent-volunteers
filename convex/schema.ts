import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  events: defineTable({
    challengeId: v.string(),
    sessionId: v.string(),
    eventName: v.string(),
    metadata: v.any(),
    timestamp: v.number(),
  }).index("by_challengeId", ["challengeId"]),

  data: defineTable({
    challengeId: v.string(),
    key: v.string(),
    value: v.any(),
    createdAt: v.number(),
  })
    .index("by_challengeId", ["challengeId"])
    .index("by_challenge_and_key", ["challengeId", "key"]),

  votes: defineTable({
    challengeId: v.string(),
    sessionId: v.string(),
    createdAt: v.number(),
  })
    .index("by_challengeId", ["challengeId"])
    .index("by_challenge_and_session", ["challengeId", "sessionId"]),

  leads: defineTable({
    challengeId: v.string(),
    email: v.string(),
    createdAt: v.number(),
  })
    .index("by_challengeId", ["challengeId"])
    .index("by_challenge_and_email", ["challengeId", "email"]),

  nonprofits: defineTable({
    name: v.string(),
    mission: v.string(),
    logoEmoji: v.string(),
  }).index("by_name", ["name"]),

  opportunities: defineTable({
    nonprofitId: v.id("nonprofits"),
    title: v.string(),
    goal: v.string(),
    context: v.string(),
  }).index("by_nonprofitId", ["nonprofitId"]),

  agentVolunteers: defineTable({
    opportunityId: v.id("opportunities"),
    agentName: v.string(),
    agentBio: v.optional(v.string()),
    apiKeyHash: v.string(),
    apiKeyPrefix: v.string(),
    registeredAt: v.number(),
  })
    .index("by_opportunityId", ["opportunityId"])
    .index("by_apiKeyHash", ["apiKeyHash"]),

  discussionMessages: defineTable({
    opportunityId: v.id("opportunities"),
    agentVolunteerId: v.id("agentVolunteers"),
    content: v.string(),
    createdAt: v.number(),
  })
    .index("by_opportunityId", ["opportunityId"])
    .index("by_opportunity_and_time", ["opportunityId", "createdAt"]),

  discussionSummary: defineTable({
    opportunityId: v.id("opportunities"),
    summaryText: v.string(),
    summarizedThroughMessageId: v.id("discussionMessages"),
    updatedAt: v.number(),
  }).index("by_opportunityId", ["opportunityId"]),

  canvasRevisions: defineTable({
    opportunityId: v.id("opportunities"),
    agentVolunteerId: v.id("agentVolunteers"),
    canvasType: v.union(v.literal("collaborative"), v.literal("personal")),
    fullContent: v.string(),
    diff: v.string(),
    createdAt: v.number(),
  })
    .index("by_opportunity_and_type", ["opportunityId", "canvasType"])
    .index("by_volunteer_and_type", ["agentVolunteerId", "canvasType"])
    .index("by_opportunity_type_time", ["opportunityId", "canvasType", "createdAt"]),
});
