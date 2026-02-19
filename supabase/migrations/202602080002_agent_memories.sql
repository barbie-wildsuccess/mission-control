-- Agent Shared Memory (pgvector)
-- All agents can store and search memories semantically

create extension if not exists vector;

create table if not exists public.agent_memories (
  id uuid primary key default gen_random_uuid(),
  agent text not null,                    -- 'jarvis', 'closer', 'forge', 'ghost', 'hype', 'scout'
  text text not null,
  embedding vector(1536),                 -- OpenAI text-embedding-3-small dimensions
  tags text[] default '{}',
  metadata jsonb default '{}',            -- flexible extra data
  created_at timestamptz not null default now()
);

-- Index for vector similarity search
create index if not exists idx_agent_memories_embedding 
  on public.agent_memories using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

-- Index for filtering by agent
create index if not exists idx_agent_memories_agent 
  on public.agent_memories (agent);

-- Index for recent memories
create index if not exists idx_agent_memories_created_at 
  on public.agent_memories (created_at desc);

-- Index for tag filtering (GIN for array containment)
create index if not exists idx_agent_memories_tags 
  on public.agent_memories using gin (tags);

comment on table public.agent_memories is 'Shared semantic memory across all agents';

-- RPC function for vector similarity search
create or replace function search_agent_memories(
  query_embedding vector(1536),
  match_threshold float default 0.5,
  match_count int default 10,
  filter_agent text default null,
  filter_tags text[] default null
)
returns table (
  id uuid,
  agent text,
  text text,
  tags text[],
  metadata jsonb,
  created_at timestamptz,
  similarity float
)
language sql stable
as $$
  select
    am.id,
    am.agent,
    am.text,
    am.tags,
    am.metadata,
    am.created_at,
    1 - (am.embedding <=> query_embedding) as similarity
  from agent_memories am
  where 
    1 - (am.embedding <=> query_embedding) > match_threshold
    and (filter_agent is null or am.agent = filter_agent)
    and (filter_tags is null or am.tags && filter_tags)
  order by am.embedding <=> query_embedding
  limit match_count;
$$;
