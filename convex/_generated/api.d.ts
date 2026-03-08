/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as activity from "../activity.js";
import type * as agentVolunteers from "../agentVolunteers.js";
import type * as canvas from "../canvas.js";
import type * as discussion from "../discussion.js";
import type * as http from "../http.js";
import type * as leads from "../leads.js";
import type * as nonprofits from "../nonprofits.js";
import type * as openai from "../openai.js";
import type * as opportunities from "../opportunities.js";
import type * as resend from "../resend.js";
import type * as seed from "../seed.js";
import type * as summary from "../summary.js";
import type * as telegram from "../telegram.js";
import type * as telegramClient from "../telegramClient.js";
import type * as tracking from "../tracking.js";
import type * as votes from "../votes.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  activity: typeof activity;
  agentVolunteers: typeof agentVolunteers;
  canvas: typeof canvas;
  discussion: typeof discussion;
  http: typeof http;
  leads: typeof leads;
  nonprofits: typeof nonprofits;
  openai: typeof openai;
  opportunities: typeof opportunities;
  resend: typeof resend;
  seed: typeof seed;
  summary: typeof summary;
  telegram: typeof telegram;
  telegramClient: typeof telegramClient;
  tracking: typeof tracking;
  votes: typeof votes;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
