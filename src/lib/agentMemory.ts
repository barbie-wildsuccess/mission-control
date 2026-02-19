/**
 * Shared Agent Memory - Supabase pgvector
 * 
 * All agents can store and search memories semantically.
 * Uses OpenAI text-embedding-3-small (1536 dimensions).
 */

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY!;

const EMBEDDING_MODEL = 'text-embedding-3-small';
const EMBEDDING_DIMENSIONS = 1536;

interface Memory {
  id: string;
  agent: string;
  text: string;
  tags: string[];
  metadata: Record<string, unknown>;
  created_at: string;
  similarity?: number;
}

/**
 * Generate embedding vector from text using OpenAI
 */
async function embed(text: string): Promise<number[]> {
  const res = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: EMBEDDING_MODEL,
      input: text,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenAI embedding failed: ${res.status} ${err}`);
  }

  const data = await res.json();
  return data.data[0].embedding;
}

/**
 * Store a memory with embedding
 */
export async function addMemory(
  agent: string,
  text: string,
  tags: string[] = [],
  metadata: Record<string, unknown> = {}
): Promise<Memory> {
  const embedding = await embed(text);

  const res = await fetch(`${SUPABASE_URL}/rest/v1/agent_memories`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
    },
    body: JSON.stringify({
      agent,
      text,
      embedding: `[${embedding.join(',')}]`,
      tags,
      metadata,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to add memory: ${res.status} ${err}`);
  }

  const rows = await res.json();
  return rows[0];
}

/**
 * Search memories by semantic similarity
 * 
 * Uses Supabase RPC for vector similarity search
 */
export async function searchMemories(
  query: string,
  options: {
    limit?: number;
    agent?: string;        // filter to specific agent
    tags?: string[];       // filter by tags (any match)
    threshold?: number;    // minimum similarity (0-1)
  } = {}
): Promise<Memory[]> {
  const { limit = 10, agent, tags, threshold = 0.5 } = options;
  const queryEmbedding = await embed(query);

  // Use RPC function for vector search
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/search_agent_memories`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query_embedding: `[${queryEmbedding.join(',')}]`,
      match_threshold: threshold,
      match_count: limit,
      filter_agent: agent || null,
      filter_tags: tags || null,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Memory search failed: ${res.status} ${err}`);
  }

  return res.json();
}

/**
 * Get recent memories
 */
export async function recentMemories(
  options: {
    days?: number;
    limit?: number;
    agent?: string;
  } = {}
): Promise<Memory[]> {
  const { days = 7, limit = 50, agent } = options;
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  let url = `${SUPABASE_URL}/rest/v1/agent_memories?created_at=gte.${since}&order=created_at.desc&limit=${limit}`;
  if (agent) {
    url += `&agent=eq.${agent}`;
  }

  const res = await fetch(url, {
    headers: {
      'apikey': SUPABASE_SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    },
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to fetch recent memories: ${res.status} ${err}`);
  }

  return res.json();
}

/**
 * Delete a memory by ID
 */
export async function deleteMemory(id: string): Promise<void> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/agent_memories?id=eq.${id}`, {
    method: 'DELETE',
    headers: {
      'apikey': SUPABASE_SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    },
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to delete memory: ${res.status} ${err}`);
  }
}
