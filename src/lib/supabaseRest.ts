import "server-only";

type QueryParams = Record<
  string,
  string | number | boolean | null | undefined | Array<string | number | boolean>
>;

interface PostgrestRequest {
  table: string;
  method?: "GET" | "POST" | "PATCH" | "DELETE" | "HEAD";
  query?: QueryParams;
  body?: unknown;
  prefer?: string;
}

export function hasSupabaseServiceEnv(): boolean {
  return Boolean(
    process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
}

export function listMissingSupabaseServiceEnv(): string[] {
  const missing: string[] = [];
  if (!process.env.SUPABASE_URL) {
    missing.push("SUPABASE_URL");
  }
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    missing.push("SUPABASE_SERVICE_ROLE_KEY");
  }
  return missing;
}

function requireSupabaseServiceEnv(): {
  url: string;
  serviceRoleKey: string;
} {
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    const missing = listMissingSupabaseServiceEnv().join(", ");
    throw new Error(`Missing required Supabase env var(s): ${missing}`);
  }
  return { url, serviceRoleKey };
}

function buildUrl(baseUrl: string, table: string, query?: QueryParams): URL {
  const url = new URL(`/rest/v1/${table}`, baseUrl);
  if (!query) {
    return url;
  }
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null) {
      continue;
    }
    if (Array.isArray(value)) {
      for (const item of value) {
        url.searchParams.append(key, String(item));
      }
      continue;
    }
    url.searchParams.set(key, String(value));
  }
  return url;
}

async function postgrestRequest(request: PostgrestRequest): Promise<Response> {
  const { url, serviceRoleKey } = requireSupabaseServiceEnv();
  const resolvedMethod = request.method ?? "GET";

  const response = await fetch(buildUrl(url, request.table, request.query), {
    method: resolvedMethod,
    cache: "no-store",
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      "Content-Type": "application/json",
      Prefer: request.prefer ?? "return=representation",
    },
    body:
      request.body !== undefined && resolvedMethod !== "GET" && resolvedMethod !== "HEAD"
        ? JSON.stringify(request.body)
        : undefined,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `PostgREST ${resolvedMethod} ${request.table} failed (${response.status}): ${errorText}`,
    );
  }

  return response;
}

export async function selectRows<T>(
  table: string,
  query: QueryParams,
): Promise<T[]> {
  const response = await postgrestRequest({
    table,
    method: "GET",
    query,
  });
  const json = (await response.json()) as T[];
  return json;
}

export async function insertRows<T>(
  table: string,
  rows: Record<string, unknown>[],
  options?: {
    onConflict?: string;
    upsert?: boolean;
  },
): Promise<T[]> {
  const query: QueryParams = {};
  if (options?.onConflict) {
    query.on_conflict = options.onConflict;
  }

  const preferParts = ["return=representation"];
  if (options?.upsert) {
    preferParts.push("resolution=merge-duplicates");
  }

  const response = await postgrestRequest({
    table,
    method: "POST",
    query,
    prefer: preferParts.join(","),
    body: rows,
  });
  return (await response.json()) as T[];
}

export async function patchRows<T>(
  table: string,
  values: Record<string, unknown>,
  query: QueryParams,
): Promise<T[]> {
  const response = await postgrestRequest({
    table,
    method: "PATCH",
    query,
    prefer: "return=representation",
    body: values,
  });
  return (await response.json()) as T[];
}

export async function countRows(
  table: string,
  query: QueryParams,
): Promise<number> {
  const response = await postgrestRequest({
    table,
    method: "HEAD",
    query: {
      ...query,
      select: "id",
    },
    prefer: "count=exact",
  });

  const contentRange = response.headers.get("content-range");
  if (!contentRange) {
    return 0;
  }

  const total = Number(contentRange.split("/")[1]);
  if (!Number.isFinite(total)) {
    return 0;
  }

  return total;
}
