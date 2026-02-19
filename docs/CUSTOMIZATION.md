# 🎨 Customization Guide

Make Mission Control your own! This guide covers branding, styling, and extending functionality.

---

## Branding

### 1. Update Site Title & Metadata

Edit `src/app/layout.tsx`:

```typescript
export const metadata: Metadata = {
  title: "Your Company Mission Control",
  description: "Real-time agent monitoring dashboard",
  icons: {
    icon: "/your-favicon.ico",
  },
};
```

### 2. Update Header

Edit `src/components/Header.tsx`:

```typescript
export function Header() {
  return (
    <header className="border-b border-[#1e1e1e] px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="text-2xl">🎯</div> {/* Your logo/emoji */}
          <div>
            <h1 className="text-lg font-bold text-[#e5e5e5]">YOUR COMPANY</h1>
            <p className="text-xs text-[#666]">Mission Control Dashboard</p>
          </div>
        </div>
        {/* Add your nav items */}
      </div>
    </header>
  );
}
```

### 3. Update Footer/Credits

Edit `src/components/MetricsBar.tsx`:

```typescript
<div className="font-mono text-[9px] text-[#2a2a2a]">
  YOUR COMPANY • MISSION CONTROL v1.0
</div>
```

### 4. Custom Favicon

Replace `src/app/favicon.ico` with your own favicon.

---

## Color Scheme

### Base Theme

Edit `src/app/globals.css`:

```css
:root {
  /* Background colors */
  --background: #0a0a0a;    /* Dark background */
  --surface: #1a1a1a;       /* Card backgrounds */
  --border: #2a2a2a;        /* Border color */
  
  /* Text colors */
  --foreground: #e5e5e5;    /* Primary text */
  --muted: #999;            /* Secondary text */
  
  /* Accent colors */
  --accent: #3b82f6;        /* Primary blue */
  --success: #22c55e;       /* Green */
  --warning: #f59e0b;       /* Amber */
  --error: #ef4444;         /* Red */
  
  /* Agent status colors */
  --status-active: #22c55e;
  --status-idle: #3b82f6;
  --status-sleeping: #6b7280;
  --status-error: #ef4444;
}

/* Light mode (optional) */
@media (prefers-color-scheme: light) {
  :root {
    --background: #ffffff;
    --surface: #f9fafb;
    --foreground: #1a1a1a;
    /* ... adjust other colors */
  }
}
```

### Agent Status Colors

Edit `src/components/AgentCards.tsx`:

```typescript
const statusColors = {
  active: "shadow-[0_0_20px_rgba(34,197,94,0.5)] border-green-500/30",
  idle: "shadow-[0_0_15px_rgba(59,130,246,0.3)] border-blue-500/20",
  sleeping: "shadow-[0_0_10px_rgba(107,114,128,0.2)] border-gray-500/20",
  error: "shadow-[0_0_20px_rgba(239,68,68,0.5)] border-red-500/30",
};
```

### Task Priority Colors

Edit `src/components/TaskBoard.tsx`:

```typescript
const priorityColors = {
  P0: "bg-red-500/20 text-red-400 border-red-500/30",
  P1: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  P2: "bg-gray-500/20 text-gray-400 border-gray-500/30",
};
```

---

## Layout & Components

### Dashboard Layout

Edit `src/app/page.tsx` to rearrange sections:

```typescript
export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col">
      <Header />
      
      <main className="flex-1 grid grid-cols-12 gap-6 p-6">
        {/* Left sidebar: Agents + Tasks (8 columns) */}
        <div className="col-span-8 space-y-6">
          <AgentCards agents={agents} />
          <TaskBoard tasks={tasks} />
        </div>
        
        {/* Right sidebar: Activity Feed (4 columns) */}
        <div className="col-span-4">
          <ActivityFeed activities={activities} />
        </div>
      </main>
      
      <MetricsBar metrics={metrics} tasks={tasks} />
    </div>
  );
}
```

### Add New Dashboard Section

Create a new component:

```typescript
// src/components/CustomWidget.tsx
"use client";

export function CustomWidget() {
  return (
    <div className="rounded-lg border border-[#1e1e1e] bg-[#0f0f0f] p-6">
      <h2 className="text-lg font-bold text-[#e5e5e5] mb-4">
        Your Custom Widget
      </h2>
      {/* Your content here */}
    </div>
  );
}
```

Add to dashboard:

```typescript
import { CustomWidget } from "@/components/CustomWidget";

<CustomWidget />
```

---

## Agent Configuration

### Add New Agent

Edit `convex/seed.ts`:

```typescript
const agents = [
  // ... existing agents
  {
    name: "YourAgent",
    role: "Your Role",
    emoji: "🤖",
    status: "idle" as const,
    currentTask: "Ready to work",
    lastSeen: Date.now(),
  },
];
```

Re-seed:
```bash
npx convex run seed:seed
```

### Agent Card Styling

Edit `src/components/AgentCards.tsx`:

```typescript
// Customize card appearance
<div className={`
  rounded-lg border bg-[#0f0f0f] p-4 transition-all
  ${statusColors[agent.status]}
  hover:scale-105 cursor-pointer
`}>
  {/* Card content */}
</div>
```

### Agent Emoji/Icons

Use emojis or replace with SVG icons:

```typescript
// Replace emoji with icon
<div className="text-4xl">{agent.emoji}</div>

// Or use an icon library (Lucide, Heroicons)
import { Bot } from "lucide-react";
<Bot className="w-10 h-10 text-blue-500" />
```

---

## Metrics Customization

### Add Custom Metric

1. **Define metric in `MetricsBar.tsx`:**

```typescript
const METRIC_CONFIG: Record<string, { 
  label: string; 
  icon: string; 
  format?: (v: number) => string;
  color?: string;
}> = {
  // ... existing metrics
  api_calls: { 
    label: "API Calls", 
    icon: "🔌",
    format: (v) => `${v.toLocaleString()}`,
    color: "text-purple-400"
  },
};
```

2. **Initialize in seed data:**

```typescript
// convex/seed.ts
{ key: "api_calls", value: 0, updatedAt: Date.now() }
```

3. **Update via API:**

```bash
curl -X POST https://your-domain.com/api/metric \
  -H "Content-Type: application/json" \
  -d '{"key":"api_calls","increment":1}'
```

### Metric Formatting

Custom formatters for different data types:

```typescript
const METRIC_CONFIG = {
  // Currency
  revenue: { 
    label: "Revenue", 
    icon: "💵",
    format: (v) => `$${(v/100).toLocaleString(undefined, {minimumFractionDigits: 2})}`
  },
  
  // Percentage
  success_rate: { 
    label: "Success Rate", 
    icon: "📈",
    format: (v) => `${v.toFixed(1)}%`
  },
  
  // Time duration
  uptime: { 
    label: "Uptime", 
    icon: "⏱️",
    format: (v) => `${(v/3600).toFixed(1)}h`
  },
  
  // Large numbers (K/M notation)
  total_requests: { 
    label: "Requests", 
    icon: "📊",
    format: (v) => v >= 1000000 ? `${(v/1000000).toFixed(1)}M` : 
                   v >= 1000 ? `${(v/1000).toFixed(1)}K` : 
                   v.toString()
  },
};
```

---

## Task Board Customization

### Add Custom Task Status

1. **Update schema in `convex/schema.ts`:**

```typescript
status: v.union(
  v.literal("inbox"),
  v.literal("in_progress"),
  v.literal("review"),
  v.literal("done"),
  v.literal("blocked")  // New status
),
```

2. **Update UI in `TaskBoard.tsx`:**

```typescript
const columns = [
  { id: "inbox", title: "📥 Inbox" },
  { id: "in_progress", title: "⚡ In Progress" },
  { id: "review", title: "👀 Review" },
  { id: "blocked", title: "🚫 Blocked" },  // New column
  { id: "done", title: "✅ Done" },
];
```

### Custom Task Card

Edit `src/components/TaskBoard.tsx`:

```typescript
function TaskCard({ task }: { task: Task }) {
  return (
    <div className="rounded-lg border border-[#1e1e1e] bg-[#0f0f0f] p-3">
      {/* Add custom fields */}
      <div className="flex items-center gap-2 mb-2">
        <span className="text-sm">{task.emoji || "📋"}</span>
        <h4 className="font-medium text-sm">{task.title}</h4>
      </div>
      
      {/* Add tags */}
      <div className="flex gap-2 flex-wrap">
        {task.tags?.map(tag => (
          <span key={tag} className="text-xs px-2 py-1 rounded-full bg-blue-500/10 text-blue-400">
            {tag}
          </span>
        ))}
      </div>
      
      {/* Add time estimate */}
      {task.estimatedHours && (
        <div className="text-xs text-gray-500 mt-2">
          Est: {task.estimatedHours}h
        </div>
      )}
    </div>
  );
}
```

---

## Activity Feed Customization

### Add Activity Icons

Edit `src/components/ActivityFeed.tsx`:

```typescript
const activityIcons: Record<string, string> = {
  "Email sent": "📧",
  "Task completed": "✅",
  "Error occurred": "❌",
  "System online": "🟢",
  "Agent deployed": "🚀",
  // Add your custom actions
};

function ActivityItem({ activity }: { activity: Activity }) {
  const icon = activityIcons[activity.action] || "📌";
  
  return (
    <div className="flex gap-3 items-start">
      <span className="text-xl">{icon}</span>
      {/* Rest of activity card */}
    </div>
  );
}
```

### Filter Activities

Add filter dropdown:

```typescript
const [filter, setFilter] = useState<string>("all");

const filteredActivities = activities.filter(a => 
  filter === "all" || a.agent === filter
);
```

---

## API Customization

### Add Custom Endpoint

Create `src/app/api/custom/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { api } from "../../../../convex/_generated/api";
import { fetchMutation } from "convex/nextjs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Your custom logic
    const result = await fetchMutation(api.your_module.your_function, {
      ...body
    });
    
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return NextResponse.json({ 
      error: "Failed to process request" 
    }, { status: 500 });
  }
}
```

### Add API Authentication

Create `src/middleware.ts`:

```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  // Skip auth for public routes
  if (!req.nextUrl.pathname.startsWith('/api/')) {
    return NextResponse.next();
  }
  
  // Check API key
  const apiKey = req.headers.get('x-api-key');
  const validKey = process.env.MISSION_CONTROL_API_KEY;
  
  if (!apiKey || apiKey !== validKey) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*',
};
```

Usage:
```bash
curl -X POST https://your-domain.com/api/heartbeat \
  -H "x-api-key: your-secret-key" \
  -H "Content-Type: application/json" \
  -d '{"name":"Jarvis","status":"active"}'
```

---

## Advanced Customization

### Add Real-Time Notifications

Install dependencies:
```bash
npm install react-hot-toast
```

Add to your layout:

```typescript
import { Toaster } from 'react-hot-toast';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Toaster position="bottom-right" />
      </body>
    </html>
  );
}
```

Use in components:

```typescript
import toast from 'react-hot-toast';

// On activity
toast.success('Agent Jarvis completed task!');
toast.error('Agent Forge encountered an error');
```

### Add Charts

Install chart library:
```bash
npm install recharts
```

Create chart component:

```typescript
// src/components/RevenueChart.tsx
import { LineChart, Line, XAxis, YAxis, Tooltip } from 'recharts';

export function RevenueChart({ data }: { data: any[] }) {
  return (
    <div className="rounded-lg border border-[#1e1e1e] bg-[#0f0f0f] p-6">
      <h2 className="text-lg font-bold mb-4">Revenue Trend</h2>
      <LineChart width={600} height={300} data={data}>
        <XAxis dataKey="date" stroke="#666" />
        <YAxis stroke="#666" />
        <Tooltip />
        <Line type="monotone" dataKey="amount" stroke="#22c55e" />
      </LineChart>
    </div>
  );
}
```

### Add Dark/Light Mode Toggle

Install next-themes:
```bash
npm install next-themes
```

Set up provider:

```typescript
// src/app/providers.tsx
"use client";
import { ThemeProvider } from "next-themes";

export function Providers({ children }: { children: React.ReactNode }) {
  return <ThemeProvider attribute="class">{children}</ThemeProvider>;
}
```

Add toggle button:

```typescript
import { useTheme } from "next-themes";

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  
  return (
    <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
      {theme === "dark" ? "🌙" : "☀️"}
    </button>
  );
}
```

---

## Tips & Best Practices

1. **Keep it performant** - Avoid heavy computations in components
2. **Use Tailwind** - Consistent styling, fast development
3. **Test responsively** - Check mobile, tablet, desktop
4. **Version control** - Commit often, branch for features
5. **Document changes** - Add comments for future you

---

Need help? Check [SETUP.md](SETUP.md), [CONFIGURATION.md](CONFIGURATION.md), or [DEPLOYMENT.md](DEPLOYMENT.md).
