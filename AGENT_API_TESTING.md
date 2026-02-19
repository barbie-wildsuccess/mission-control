# Agent API Testing Guide

This document provides testing instructions for the Mission Control Template agent APIs.

## Overview

All agent-related API endpoints are handled via Convex HTTP router. The endpoints are available at your Convex deployment URL.

**Base URL**: Your Convex deployment URL (found in `.env.local` as `NEXT_PUBLIC_CONVEX_URL`)

## Available Endpoints

### 1. Heartbeat (POST /api/heartbeat)

Records an agent heartbeat and updates status.

**Request:**
```bash
curl -X POST https://your-convex-url.convex.cloud/api/heartbeat \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jarvis",
    "status": "active",
    "currentTask": "Monitoring systems"
  }'
```

**Response:**
```json
{
  "ok": true
}
```

**Parameters:**
- `name` (required): Agent name
- `status` (required): "idle" | "active" | "sleeping"
- `currentTask` (optional): What the agent is currently working on

---

### 2. Activity Log (POST /api/activity)

Logs an activity from an agent.

**Request:**
```bash
curl -X POST https://your-convex-url.convex.cloud/api/activity \
  -H "Content-Type: application/json" \
  -d '{
    "agent": "Forge",
    "action": "Deployed new feature",
    "detail": "Updated agent settings page with color picker"
  }'
```

**Response:**
```json
{
  "ok": true
}
```

**Parameters:**
- `agent` (required): Agent name
- `action` (required): Action description
- `detail` (optional): Additional details

---

### 3. Task Create (POST /api/task-create)

Creates a new task.

**Request:**
```bash
curl -X POST https://your-convex-url.convex.cloud/api/task-create \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Build new dashboard feature",
    "description": "Add real-time metrics visualization",
    "status": "inbox",
    "assignee": "Forge",
    "priority": "P1"
  }'
```

**Response:**
```json
{
  "ok": true
}
```

**Parameters:**
- `title` (required): Task title
- `description` (optional): Task description
- `status` (required): "inbox" | "in_progress" | "review" | "done" | "blocked"
- `assignee` (required): Agent name
- `priority` (required): "P0" | "P1" | "P2"

---

### 4. Task Update (POST /api/task-update)

Updates an existing task's status.

**Request:**
```bash
curl -X POST https://your-convex-url.convex.cloud/api/task-update \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Build Mission Control Dashboard",
    "status": "done",
    "assignee": "Forge"
  }'
```

**Response:**
```json
{
  "ok": true
}
```

**Parameters:**
- `title` (required): Task title (used to find the task)
- `status` (required): New status
- `assignee` (optional): New assignee

---

## Testing from OpenClaw Agents

### Example Heartbeat Call

```typescript
// Send heartbeat every 5 minutes
const response = await fetch(`${process.env.CONVEX_URL}/api/heartbeat`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Jarvis',
    status: 'active',
    currentTask: 'Monitoring inbox'
  })
});
```

### Example Activity Log

```typescript
// Log an activity
const response = await fetch(`${process.env.CONVEX_URL}/api/activity`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    agent: 'Closer',
    action: 'Sent cold email',
    detail: 'Campaign: SaaS founders - Subject: Quick question about...'
  })
});
```

### Example Task Creation

```typescript
// Create a task
const response = await fetch(`${process.env.CONVEX_URL}/api/task-create`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: 'Research competitor pricing',
    description: 'Analyze top 5 competitors in the space',
    status: 'inbox',
    assignee: 'Scout',
    priority: 'P2'
  })
});
```

---

## Verification

All endpoints should return:
- Status code: 200 (success) or 400 (validation error)
- JSON response with `ok: true` on success
- Error message if validation fails

Check the Mission Control dashboard after making API calls to see changes reflected in real-time.

---

## Notes

- All endpoints support CORS for cross-origin requests
- The Convex deployment URL is different from your Next.js app URL
- Find your Convex URL in `.env.local` or in the Convex dashboard
- Heartbeats update the `lastSeen` timestamp automatically
- Agent names are case-sensitive
