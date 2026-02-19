import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";

const http = httpRouter();

// CORS headers for all responses
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

// OPTIONS handler for CORS preflight
const optionsHandler = httpAction(async () => {
  return new Response(null, { status: 204, headers: corsHeaders });
});

// POST /api/heartbeat — agent reports alive + what they're doing
http.route({
  path: "/api/heartbeat",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const body = await request.json();
    const { name, status, currentTask } = body;

    if (!name || !status) {
      return new Response(
        JSON.stringify({ error: "name and status are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    await ctx.runMutation(api.agents.heartbeat, {
      name,
      status,
      currentTask,
    });

    return new Response(
      JSON.stringify({ ok: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }),
});
http.route({ path: "/api/heartbeat", method: "OPTIONS", handler: optionsHandler });

// POST /api/activity — agent logs an activity
http.route({
  path: "/api/activity",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const body = await request.json();
    const { agent, action, detail } = body;

    if (!agent || !action) {
      return new Response(
        JSON.stringify({ error: "agent and action are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    await ctx.runMutation(api.activities.log, {
      agent,
      action,
      detail,
    });

    return new Response(
      JSON.stringify({ ok: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }),
});
http.route({ path: "/api/activity", method: "OPTIONS", handler: optionsHandler });

// POST /api/task-update — update a task status
http.route({
  path: "/api/task-update",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const body = await request.json();
    const { title, status, assignee } = body;

    if (!title || !status) {
      return new Response(
        JSON.stringify({ error: "title and status are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    await ctx.runMutation(api.tasks.updateStatus, {
      title,
      status,
      assignee,
    });

    return new Response(
      JSON.stringify({ ok: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }),
});
http.route({ path: "/api/task-update", method: "OPTIONS", handler: optionsHandler });

// POST /api/task-create — create a new task
http.route({
  path: "/api/task-create",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const body = await request.json();
    const { title, description, status, assignee, priority } = body;

    if (!title || !status || !assignee || !priority) {
      return new Response(
        JSON.stringify({ error: "title, status, assignee, and priority are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    await ctx.runMutation(api.tasks.create, {
      title,
      description: description ?? "",
      status,
      assignee,
      priority,
    });

    return new Response(
      JSON.stringify({ ok: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }),
});
http.route({ path: "/api/task-create", method: "OPTIONS", handler: optionsHandler });

// POST /api/metric — increment a metric
http.route({
  path: "/api/metric",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const body = await request.json();
    const { key, value, increment } = body;

    if (!key) {
      return new Response(
        JSON.stringify({ error: "key is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (value !== undefined) {
      await ctx.runMutation(api.metrics.set, { key, value });
    } else {
      await ctx.runMutation(api.metrics.increment, { key, amount: increment });
    }

    return new Response(
      JSON.stringify({ ok: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }),
});
http.route({ path: "/api/metric", method: "OPTIONS", handler: optionsHandler });

// POST /api/leads — create a new lead
http.route({
  path: "/api/leads",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const body = await request.json();
    const { name, company, email, phone, source, status, assignee, value, notes } = body;

    if (!name || !source) {
      return new Response(
        JSON.stringify({ error: "name and source are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const id = await ctx.runMutation(api.leads.create, {
      name,
      company,
      email,
      phone,
      source,
      status,
      assignee,
      value,
      notes,
    });

    return new Response(
      JSON.stringify({ ok: true, id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }),
});
http.route({ path: "/api/leads", method: "OPTIONS", handler: optionsHandler });

// PATCH /api/leads/:id — update a lead
http.route({
  path: "/api/leads/update",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return new Response(
        JSON.stringify({ error: "id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    await ctx.runMutation(api.leads.update, { id, ...updates });

    return new Response(
      JSON.stringify({ ok: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }),
});
http.route({ path: "/api/leads/update", method: "OPTIONS", handler: optionsHandler });

// POST /api/actions — log a new action
http.route({
  path: "/api/actions",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const body = await request.json();
    const { agent, action, prediction, category, status, outcome, autoVerify } = body;

    if (!agent || !action || !category) {
      return new Response(
        JSON.stringify({ error: "agent, action, and category are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const id = await ctx.runMutation(api.actionLogs.log, {
      agent,
      action,
      prediction,
      category,
      status,
      outcome,
      autoVerify,
    });

    return new Response(
      JSON.stringify({ ok: true, id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }),
});
http.route({ path: "/api/actions", method: "OPTIONS", handler: optionsHandler });

// POST /api/actions/update — update action outcome
http.route({
  path: "/api/actions/update",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const body = await request.json();
    const { id, status, outcome, lessonsLearned } = body;

    if (!id || !status) {
      return new Response(
        JSON.stringify({ error: "id and status are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    await ctx.runMutation(api.actionLogs.updateOutcome, {
      id,
      status,
      outcome,
      lessonsLearned,
    });

    return new Response(
      JSON.stringify({ ok: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }),
});
http.route({ path: "/api/actions/update", method: "OPTIONS", handler: optionsHandler });

export default http;
