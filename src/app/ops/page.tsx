import { listOpsDashboardData } from "@/lib/opsKernel";
import {
  hasSupabaseServiceEnv,
  listMissingSupabaseServiceEnv,
} from "@/lib/supabaseRest";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function formatDate(value: string): string {
  return new Date(value).toLocaleString();
}

export default async function OpsPage() {
  if (!hasSupabaseServiceEnv()) {
    return (
      <main className="min-h-screen p-8 text-gray-900">
        <div className="mx-auto max-w-4xl space-y-4 rounded-lg border border-black/5 bg-white/70 backdrop-blur-xl p-6">
          <h1 className="text-xl font-semibold">Ops Kernel</h1>
          <p className="text-sm text-gray-500">
            Supabase service role env vars are missing. Add these server-only
            variables before using the Ops kernel UI or heartbeat route.
          </p>
          <ul className="list-disc pl-6 text-sm text-gray-600">
            {listMissingSupabaseServiceEnv().map((key) => (
              <li key={key}>{key}</li>
            ))}
          </ul>
          <p className="text-xs text-gray-400">
            Do not prefix these env vars with NEXT_PUBLIC.
          </p>
        </div>
      </main>
    );
  }

  let dashboardData: Awaited<ReturnType<typeof listOpsDashboardData>> | null =
    null;
  let loadError: string | null = null;

  try {
    dashboardData = await listOpsDashboardData();
  } catch (error) {
    loadError = error instanceof Error ? error.message : "Unknown error";
  }

  if (loadError) {
    return (
      <main className="min-h-screen p-8 text-gray-900">
        <div className="mx-auto max-w-4xl rounded-lg border border-red-200 bg-white/70 backdrop-blur-xl p-6">
          <h1 className="text-xl font-semibold">Ops Kernel</h1>
          <p className="mt-2 text-sm text-red-500">
            Failed to load ops data: {loadError}
          </p>
        </div>
      </main>
    );
  }

  if (!dashboardData) {
    return (
      <main className="min-h-screen p-8 text-gray-900">
        <div className="mx-auto max-w-4xl rounded-lg border border-red-200 bg-white/70 backdrop-blur-xl p-6">
          <h1 className="text-xl font-semibold">Ops Kernel</h1>
          <p className="mt-2 text-sm text-red-500">
            Failed to load ops data: empty response.
          </p>
        </div>
      </main>
    );
  }

  const { events, activeSteps, status } = dashboardData;

  return (
    <main className="min-h-screen p-6 text-gray-900">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <header className="rounded-lg border border-black/5 bg-white/70 backdrop-blur-xl p-5">
          <h1 className="text-2xl font-semibold">Ops Kernel</h1>
          <p className="mt-1 text-sm text-gray-500">
            Recent events and currently queued/running steps.
          </p>
        </header>

        <section className="rounded-lg border border-black/5 bg-white/70 backdrop-blur-xl p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-medium">Ops Summary Events</h2>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <article className="rounded border border-black/5 bg-white/60 p-3">
              <p className="text-xs uppercase tracking-wide text-gray-500">
                Last Heartbeat
              </p>
              <p className="mt-1 text-sm">
                {status.lastHeartbeat
                  ? formatDate(status.lastHeartbeat.created_at)
                  : "No heartbeat event yet"}
              </p>
            </article>
            <article className="rounded border border-black/5 bg-white/60 p-3">
              <p className="text-xs uppercase tracking-wide text-gray-500">
                Last Standup
              </p>
              <p className="mt-1 text-sm">
                {status.lastStandup
                  ? formatDate(status.lastStandup.created_at)
                  : "No standup event yet"}
              </p>
            </article>
            <article className="rounded border border-black/5 bg-white/60 p-3">
              <p className="text-xs uppercase tracking-wide text-gray-500">
                Last Briefing
              </p>
              <p className="mt-1 text-sm">
                {status.lastBriefing
                  ? formatDate(status.lastBriefing.created_at)
                  : "No briefing event yet"}
              </p>
            </article>
          </div>
        </section>

        <section className="rounded-lg border border-black/5 bg-white/70 backdrop-blur-xl p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-medium">Queued / Running Steps</h2>
            <span className="text-xs text-gray-500">{activeSteps.length} visible</span>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="pb-2 pr-4">Kind</th>
                  <th className="pb-2 pr-4">Status</th>
                  <th className="pb-2 pr-4">Attempts</th>
                  <th className="pb-2 pr-4">Created</th>
                  <th className="pb-2 pr-4">Mission</th>
                </tr>
              </thead>
              <tbody>
                {activeSteps.map((step) => (
                  <tr key={step.id} className="border-t border-black/5">
                    <td className="py-2 pr-4">{step.kind}</td>
                    <td className="py-2 pr-4">{step.status}</td>
                    <td className="py-2 pr-4">{step.attempts}</td>
                    <td className="py-2 pr-4">{formatDate(step.created_at)}</td>
                    <td className="py-2 pr-4 font-mono text-xs text-gray-500">
                      {step.mission_id}
                    </td>
                  </tr>
                ))}
                {activeSteps.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="py-4 text-center text-sm text-gray-500"
                    >
                      No queued or running steps.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-lg border border-black/5 bg-white/70 backdrop-blur-xl p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-medium">Recent Ops Events</h2>
            <span className="text-xs text-gray-500">{events.length} visible</span>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="pb-2 pr-4">Created</th>
                  <th className="pb-2 pr-4">Kind</th>
                  <th className="pb-2 pr-4">Title</th>
                  <th className="pb-2 pr-4">Summary</th>
                </tr>
              </thead>
              <tbody>
                {events.map((event) => (
                  <tr key={event.id} className="border-t border-black/5">
                    <td className="py-2 pr-4">{formatDate(event.created_at)}</td>
                    <td className="py-2 pr-4">{event.kind}</td>
                    <td className="py-2 pr-4">{event.title}</td>
                    <td className="py-2 pr-4 text-gray-500">{event.summary}</td>
                  </tr>
                ))}
                {events.length === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      className="py-4 text-center text-sm text-gray-500"
                    >
                      No ops events found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
