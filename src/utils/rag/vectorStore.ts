import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { generateEmbedding } from './embeddings';

/**
 * -----------------------------------------------------------------------------------
 * SUPABASE PGVECTOR SQL SETUP (Run once in Supabase SQL Editor):
 * -----------------------------------------------------------------------------------
 * 
 * -- 1. Enable pgvector extension
 * CREATE EXTENSION IF NOT EXISTS vector;
 * 
 * -- 2. Create the document embeddings table
 * CREATE TABLE IF NOT EXISTS note_embeddings (
 *   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 *   item_id TEXT NOT NULL,
 *   user_id TEXT,
 *   title TEXT NOT NULL,
 *   content TEXT NOT NULL,
 *   metadata JSONB DEFAULT '{}'::jsonb,
 *   embedding VECTOR(1536), -- 1536 dimensions for text-embedding-3-small
 *   created_at TIMESTAMPTZ DEFAULT now()
 * );
 * 
 * -- 3. Create an HNSW index for ultra-fast cosine similarity search
 * CREATE INDEX IF NOT EXISTS note_embeddings_hnsw_idx 
 *   ON note_embeddings 
 *   USING hnsw (embedding vector_cosine_ops);
 * 
 * -- 4. Create the match RPC function for vector search
 * CREATE OR REPLACE FUNCTION match_notes (
 *   query_embedding VECTOR(1536),
 *   match_threshold FLOAT DEFAULT 0.5,
 *   match_count INT DEFAULT 5,
 *   filter_user_id TEXT DEFAULT NULL
 * )
 * RETURNS TABLE (
 *   id UUID,
 *   item_id TEXT,
 *   title TEXT,
 *   content TEXT,
 *   metadata JSONB,
 *   similarity FLOAT
 * )
 * LANGUAGE plpgsql
 * AS $$
 * BEGIN
 *   RETURN QUERY
 *   SELECT
 *     note_embeddings.id,
 *     note_embeddings.item_id,
 *     note_embeddings.title,
 *     note_embeddings.content,
 *     note_embeddings.metadata,
 *     1 - (note_embeddings.embedding <=> query_embedding) AS similarity
 *   FROM note_embeddings
 *   WHERE (filter_user_id IS NULL OR note_embeddings.user_id = filter_user_id)
 *     AND 1 - (note_embeddings.embedding <=> query_embedding) > match_threshold
 *   ORDER BY note_embeddings.embedding <=> query_embedding
 *   LIMIT match_count;
 * END;
 * $$;
 * -----------------------------------------------------------------------------------
 */

export interface NoteEmbeddingRecord {
  itemId: string;
  userId?: string;
  title: string;
  content: string;
  metadata?: Record<string, any>;
}

export interface MatchedNote {
  id: string;
  itemId: string;
  title: string;
  content: string;
  metadata: Record<string, any>;
  similarity: number;
}

// Get Supabase client using environment variables
export function getSupabaseClient(): SupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  if (!supabaseUrl || !supabaseKey) {
    console.warn('Supabase credentials missing. Check SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
  }

  return createClient(supabaseUrl, supabaseKey);
}

/**
 * Generates an embedding and stores a note in the Supabase vector database.
 */
export async function storeNoteEmbedding(record: NoteEmbeddingRecord): Promise<void> {
  const supabase = getSupabaseClient();
  const textToEmbed = `Title: ${record.title}\nContent: ${record.content}`;
  
  // 1. Generate 1536-dim vector embedding
  const embedding = await generateEmbedding(textToEmbed);

  // 2. Insert or update into Supabase
  const { error } = await supabase.from('note_embeddings').insert({
    item_id: record.itemId,
    user_id: record.userId || null,
    title: record.title,
    content: record.content,
    metadata: record.metadata || {},
    embedding,
  });

  if (error) {
    console.error('Failed to store note embedding in Supabase:', error);
    throw error;
  }
}

/**
 * Searches the vector database for notes most semantically similar to the user's question.
 */
export async function searchSimilarNotes(
  query: string,
  options?: {
    matchThreshold?: number;
    matchCount?: number;
    userId?: string;
  }
): Promise<MatchedNote[]> {
  const supabase = getSupabaseClient();

  // 1. Embed the search query
  const queryEmbedding = await generateEmbedding(query);

  // 2. Call the PostgreSQL RPC vector search function
  const { data, error } = await supabase.rpc('match_notes', {
    query_embedding: queryEmbedding,
    match_threshold: options?.matchThreshold ?? 0.3,
    match_count: options?.matchCount ?? 5,
    filter_user_id: options?.userId || null,
  });

  if (error) {
    console.error('Vector search error:', error);
    throw error;
  }

  return (data || []).map((row: any) => ({
    id: row.id,
    itemId: row.item_id,
    title: row.title,
    content: row.content,
    metadata: row.metadata || {},
    similarity: row.similarity,
  }));
}
