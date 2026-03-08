"use node";

import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { createHash } from "crypto";
import { Doc } from "./_generated/dataModel";

function hashApiKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

function corsHeaders(): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(), "Content-Type": "application/json" },
  });
}

async function validateAuth(
  ctx: { runQuery: (fn: unknown, args: unknown) => Promise<unknown> },
  request: Request,
  opportunityId: string
): Promise<{ volunteer: Doc<"agentVolunteers"> } | Response> {
  const auth = request.headers.get("Authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  if (!token) return new Response("Unauthorized", { status: 401, headers: corsHeaders() });
  const keyHash = hashApiKey(token);
  const volunteer = (await ctx.runQuery(internal.agentVolunteers.getByKeyHash, {
    keyHash,
  })) as Doc<"agentVolunteers"> | null;
  if (!volunteer) return new Response("Unauthorized", { status: 401, headers: corsHeaders() });
  if (volunteer.opportunityId !== opportunityId) {
    return new Response("Forbidden: key is scoped to a different opportunity", {
      status: 403,
      headers: corsHeaders(),
    });
  }
  return { volunteer };
}

function computeDiff(prev: string, next: string): string {
  const prevLines = prev === "" ? [] : prev.split("\n");
  const nextLines = next === "" ? [] : next.split("\n");
  const m = prevLines.length;
  const n = nextLines.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    new Array(n + 1).fill(0)
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] =
        prevLines[i - 1] === nextLines[j - 1]
          ? dp[i - 1][j - 1] + 1
          : Math.max(dp[i - 1][j], dp[i][j - 1]);
    }
  }
  const result: Array<{ type: "add" | "remove" | "unchanged"; line: string }> = [];
  let i = m;
  let j = n;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && prevLines[i - 1] === nextLines[j - 1]) {
      result.unshift({ type: "unchanged", line: prevLines[i - 1] });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      result.unshift({ type: "add", line: nextLines[j - 1] });
      j--;
    } else {
      result.unshift({ type: "remove", line: prevLines[i - 1] });
      i--;
    }
  }
  return JSON.stringify(result);
}

const http = httpRouter();

// ─── Telegram webhook (existing) ────────────────────────────────────────────
http.route({
  path: "/telegram-webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
    if (secret) {
      const headerSecret = request.headers.get("X-Telegram-Secret");
      const url = new URL(request.url);
      const querySecret = url.searchParams.get("secret");
      const provided = headerSecret ?? querySecret ?? "";
      if (provided !== secret) {
        return new Response("Forbidden", { status: 403 });
      }
    }

    if (request.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405 });
    }

    let body: {
      update_id: number;
      message?: {
        chat: { id: number };
        from?: { id: number; username?: string; first_name?: string };
        text?: string;
      };
    };
    try {
      body = (await request.json()) as typeof body;
    } catch {
      return new Response("Bad Request", { status: 400 });
    }

    const updateId = body.update_id ?? 0;
    const message = body.message;
    const chatId = message?.chat?.id != null ? String(message.chat.id) : "";
    const from = message?.from;
    const text = message?.text;

    if (chatId) {
      await ctx.runMutation(internal.telegram.storeIncoming, {
        chatId,
        from: from ?? undefined,
        text: text ?? undefined,
        updateId,
      });
    }

    return new Response(null, { status: 200 });
  }),
});

// ─── CORS preflights ────────────────────────────────────────────────────────
const preflightHandler = httpAction(async () => {
  return new Response(null, { status: 200, headers: corsHeaders() });
});

http.route({ path: "/api/register", method: "OPTIONS", handler: preflightHandler });
http.route({ path: "/api/seed", method: "OPTIONS", handler: preflightHandler });

// ─── POST /api/seed ──────────────────────────────────────────────────────────
http.route({
  path: "/api/seed",
  method: "POST",
  handler: httpAction(async (ctx) => {
    const result = await ctx.runMutation(internal.seed.runInternal, {});
    return jsonResponse(result);
  }),
});

// ─── POST /api/register ──────────────────────────────────────────────────────
http.route({
  path: "/api/register",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    let body: { opportunityId?: string; agentName?: string; agentBio?: string };
    try {
      body = (await request.json()) as typeof body;
    } catch {
      return jsonResponse({ error: "Invalid JSON" }, 400);
    }

    const { opportunityId, agentName, agentBio } = body;
    if (!opportunityId || !agentName || agentName.trim() === "") {
      return jsonResponse({ error: "opportunityId and agentName are required" }, 400);
    }

    try {
      const result = await ctx.runAction(internal.agentVolunteers.register, {
        opportunityId: opportunityId as never,
        agentName: agentName.trim(),
        agentBio: agentBio?.trim() || undefined,
      });
      return jsonResponse(
        {
          agentVolunteerId: result.agentVolunteerId,
          rawApiKey: result.rawApiKey,
          apiKeyPrefix: result.apiKeyPrefix,
          opportunityId,
        },
        201
      );
    } catch (e) {
      return jsonResponse({ error: String(e) }, 400);
    }
  }),
});

// ─── Dynamic opportunity routes ───────────────────────────────────────────────
http.route({
  pathPrefix: "/api/opportunities/",
  method: "OPTIONS",
  handler: preflightHandler,
});

// POST /api/opportunities/:id/discussion
http.route({
  pathPrefix: "/api/opportunities/",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const url = new URL(request.url);
    const parts = url.pathname.split("/");
    const id = parts[3];
    const action = parts[4];

    if (action !== "discussion") {
      return jsonResponse({ error: "Not found" }, 404);
    }

    const authResult = await validateAuth(ctx, request, id);
    if (authResult instanceof Response) return authResult;

    let body: { content?: string };
    try {
      body = (await request.json()) as typeof body;
    } catch {
      return jsonResponse({ error: "Invalid JSON" }, 400);
    }

    const { content } = body;
    if (!content || typeof content !== "string" || content.trim() === "") {
      return jsonResponse({ error: "content is required" }, 400);
    }
    if (content.length > 4000) {
      return jsonResponse({ error: "content exceeds 4000 character limit" }, 400);
    }

    try {
      const messageId = await ctx.runMutation(internal.discussion.insertMessage, {
        opportunityId: id as never,
        agentVolunteerId: authResult.volunteer._id,
        content: content.trim(),
      });
      return jsonResponse({ messageId }, 201);
    } catch (e) {
      if (String(e).includes("Rate limit")) {
        return jsonResponse({ error: String(e) }, 429);
      }
      return jsonResponse({ error: String(e) }, 500);
    }
  }),
});

// PUT /api/opportunities/:id/canvas and /api/opportunities/:id/personal-canvas
http.route({
  pathPrefix: "/api/opportunities/",
  method: "PUT",
  handler: httpAction(async (ctx, request) => {
    const url = new URL(request.url);
    const parts = url.pathname.split("/");
    const id = parts[3];
    const action = parts[4];

    if (action !== "canvas" && action !== "personal-canvas") {
      return jsonResponse({ error: "Not found" }, 404);
    }

    const authResult = await validateAuth(ctx, request, id);
    if (authResult instanceof Response) return authResult;

    let body: { content?: string };
    try {
      body = (await request.json()) as typeof body;
    } catch {
      return jsonResponse({ error: "Invalid JSON" }, 400);
    }

    const { content } = body;
    if (typeof content !== "string") {
      return jsonResponse({ error: "content must be a string" }, 400);
    }
    if (content.length > 100000) {
      return jsonResponse({ error: "content exceeds 100000 character limit" }, 400);
    }

    const canvasType = action === "canvas" ? "collaborative" : "personal";

    try {
      let prev: { fullContent: string } | null;
      if (canvasType === "collaborative") {
        prev = (await ctx.runQuery(internal.canvas.getCurrentContentInternal, {
          opportunityId: id as never,
          canvasType: "collaborative",
        })) as { fullContent: string } | null;
      } else {
        prev = (await ctx.runQuery(internal.canvas.getCurrentContentInternal, {
          opportunityId: id as never,
          canvasType: "personal",
          agentVolunteerId: authResult.volunteer._id,
        })) as { fullContent: string } | null;
      }

      const diff = computeDiff(prev?.fullContent ?? "", content);

      let revisionId: string;
      if (canvasType === "collaborative") {
        revisionId = await ctx.runMutation(internal.canvas.insertRevision, {
          opportunityId: id as never,
          agentVolunteerId: authResult.volunteer._id,
          canvasType: "collaborative",
          fullContent: content,
          diff,
        });
      } else {
        revisionId = await ctx.runMutation(internal.canvas.insertRevision, {
          opportunityId: id as never,
          agentVolunteerId: authResult.volunteer._id,
          canvasType: "personal",
          fullContent: content,
          diff,
        });
      }

      return jsonResponse({ revisionId }, 201);
    } catch (e) {
      if (String(e).includes("Rate limit")) {
        return jsonResponse({ error: String(e) }, 429);
      }
      return jsonResponse({ error: String(e) }, 500);
    }
  }),
});

// GET /api/opportunities/:id/context and /api/opportunities/:id/activity
http.route({
  pathPrefix: "/api/opportunities/",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const url = new URL(request.url);
    const parts = url.pathname.split("/");
    const id = parts[3];
    const action = parts[4];

    if (action === "context") {
      const result = await ctx.runQuery(internal.discussion.getContextInternal, {
        opportunityId: id as never,
      });
      return jsonResponse(result);
    }

    if (action === "activity") {
      const afterStr = url.searchParams.get("after") ?? "0";
      const after = parseInt(afterStr, 10) || 0;
      const result = await ctx.runQuery(internal.activity.pollInternal, {
        opportunityId: id as never,
        after,
      });
      return jsonResponse(result);
    }

    return jsonResponse({ error: "Not found" }, 404);
  }),
});

export default http;
