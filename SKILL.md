---
name: mission-control
description: Monitor and manage AI agent squads via Mission Control dashboard. Send heartbeats, log activities, update tasks.
homepage: https://github.com/ShoafSystems/mission-control-template
metadata:
  openclaw:
    emoji: "🎮"
    requires:
      env: ["MISSION_CONTROL_URL"]
    primaryEnv: "MISSION_CONTROL_URL"
---

# Mission Control Integration

Your Mission Control dashboard tracks agent status, activities, and tasks in real-time.

## Environment Setup

Set your Mission Control URL in OpenClaw config or environment:

```bash
export MISSION_CONTROL_URL="https://your-mission-control.vercel.app"
```

Or in `~/.openclaw/openclaw.json`:
```json
{
  "skills": {
    "mission-control": {
      "env": {
        "MISSION_CONTROL_URL": "https://your-mission-control.vercel.app"
      }
    }
  }
}
```

## API Endpoints

### Heartbeat (Agent Status)

Send heartbeat to show agent is alive:

```bash
curl -X POST "$MISSION_CONTROL_URL/api/heartbeat" \
  -H "Content-Type: application/json" \
  -d '{"name": "Jarvis", "status": "active"}'
```

Status options: `active`, `idle`, `sleeping`, `error`

### Log Activity

Record what an agent is doing:

```bash
curl -X POST "$MISSION_CONTROL_URL/api/activity" \
  -H "Content-Type: application/json" \
  -d '{"agent": "Jarvis", "action": "Deployed PR #42 to production"}'
```

### Update Task Status

Move a task through the workflow:

```bash
curl -X POST "$MISSION_CONTROL_URL/api/task-update" \
  -H "Content-Type: application/json" \
  -d '{"title": "Build landing page", "status": "in_progress"}'
```

Status options: `inbox`, `in_progress`, `review`, `done`, `blocked`

⚠️ **Gotcha:** Use `in_progress` (underscore), NOT `in-progress` (hyphen).

### Create New Task

Add a task to the queue:

```bash
curl -X POST "$MISSION_CONTROL_URL/api/task-create" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Implement feature X",
    "description": "Details here",
    "status": "inbox",
    "assignee": "Forge",
    "priority": "P1"
  }'
```

Priority: `P0` (urgent), `P1` (high), `P2` (normal)

### Log Metrics

Track numerical metrics:

```bash
curl -X POST "$MISSION_CONTROL_URL/api/metric" \
  -H "Content-Type: application/json" \
  -d '{"name": "emails_sent", "value": 15, "agent": "Ghost"}'
```

## Agent Behavior Rules

Every agent MUST:

1. **Send heartbeat on start:**
   ```bash
   curl -X POST "$MISSION_CONTROL_URL/api/heartbeat" \
     -d '{"name": "YOUR_NAME", "status": "active"}'
   ```

2. **Log significant actions:**
   ```bash
   curl -X POST "$MISSION_CONTROL_URL/api/activity" \
     -d '{"agent": "YOUR_NAME", "action": "What you did"}'
   ```

3. **Update task status when working:**
   ```bash
   curl -X POST "$MISSION_CONTROL_URL/api/task-update" \
     -d '{"title": "Task name", "status": "in_progress"}'
   ```

4. **Send heartbeat when done:**
   ```bash
   curl -X POST "$MISSION_CONTROL_URL/api/heartbeat" \
     -d '{"name": "YOUR_NAME", "status": "sleeping"}'
   ```

## Agent Names (Customize in config/agents.json)

Default squad:
- **Forge** 🔨 - Code Builder
- **Scout** 🔍 - Research & Discovery  
- **Ghost** 👻 - Outreach & Growth
- **Closer** 🤝 - Sales & Deals
- **Hype** 📣 - Social & Content

Edit `config/agents.json` to rename or add agents.

## Dashboard Views

- `/` - Main dashboard with agent cards
- `/ops` - Operations overview
- `/tasks` - Task management kanban
- `/activity` - Activity feed

## Making Agents "Real"

Agents become real when they:

1. **Have a cron schedule** - Run automatically via OpenClaw cron
2. **Send heartbeats** - Show up as "active" on dashboard
3. **Log activities** - Create visible trail of work
4. **Complete tasks** - Move items through the pipeline

Example OpenClaw cron for an agent:
```json
{
  "name": "forge-builder",
  "schedule": { "kind": "cron", "expr": "0 2 * * *" },
  "sessionTarget": "isolated",
  "payload": {
    "kind": "agentTurn",
    "message": "Check build-queue, pick highest priority task, build it, create PR"
  }
}
```

## Troubleshooting

**Agent not showing on dashboard?**
- Check heartbeat is being sent
- Verify MISSION_CONTROL_URL is correct
- Check Convex deployment is running

**Tasks not updating?**
- Use `in_progress` not `in-progress`
- Ensure task title matches exactly
- Check API response for errors
