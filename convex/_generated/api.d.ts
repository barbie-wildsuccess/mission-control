/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as actionLogs from "../actionLogs.js";
import type * as activities from "../activities.js";
import type * as agents from "../agents.js";
import type * as buildQueue from "../buildQueue.js";
import type * as http from "../http.js";
import type * as leads from "../leads.js";
import type * as metrics from "../metrics.js";
import type * as revenue from "../revenue.js";
import type * as revenueSync from "../revenueSync.js";
import type * as seed from "../seed.js";
import type * as tasks from "../tasks.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  actionLogs: typeof actionLogs;
  activities: typeof activities;
  agents: typeof agents;
  buildQueue: typeof buildQueue;
  http: typeof http;
  leads: typeof leads;
  metrics: typeof metrics;
  revenue: typeof revenue;
  revenueSync: typeof revenueSync;
  seed: typeof seed;
  tasks: typeof tasks;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
