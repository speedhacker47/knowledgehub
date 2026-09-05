import OpenAI from 'openai';

// Initialize OpenAI client (requires OPENAI_API_KEY in .env.local)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

/**
 * Default OpenAI embedding model: text-embedding-3-small
 * Dimensions: 1536
 * Highly cost-effective and accurate for semantic search.
 */
export const EMBEDDING_MODEL = 'text-embedding-3-small';

/**
 * Generates an embedding vector for a single piece of text.
 *
 * @param text - The content (note title, note body, document text) to embed.
 * @returns An array of 1536 floating-point numbers representing the embedding.
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const sanitizedText = text.replace(/\n+/g, ' ').trim();
  if (!sanitizedText) {
    throw new Error('Cannot generate embedding for empty text.');
  }

  const response = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input: sanitizedText,
    encoding_format: 'float',
  });

  return response.data[0].embedding;
}

/**
 * Generates embeddings in batch for multiple notes/documents.
 *
 * @param texts - Array of strings to embed.
 * @returns Array of embedding vectors.
 */
export async function generateBatchEmbeddings(texts: string[]): Promise<number[][]> {
  const sanitizedTexts = texts.map((t) => t.replace(/\n+/g, ' ').trim()).filter(Boolean);
  if (sanitizedTexts.length === 0) return [];

  const response = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input: sanitizedTexts,
    encoding_format: 'float',
  });

  return response.data.map((item) => item.embedding);
}

/**
 * Chunks long text into smaller segments with overlap for better retrieval accuracy.
 *
 * @param text - Long document or note text.
 * @param maxChars - Approximate maximum characters per chunk (e.g. 1000 ~ 250 tokens).
 * @param overlapChars - Overlap between consecutive chunks.
 */
export function chunkText(text: string, maxChars = 1000, overlapChars = 150): string[] {
  if (text.length <= maxChars) return [text];

  const chunks: string[] = [];
  let startIndex = 0;

  while (startIndex < text.length) {
    let endIndex = startIndex + maxChars;

    // Avoid cutting words in half
    if (endIndex < text.length) {
      const lastSpace = text.lastIndexOf(' ', endIndex);
      if (lastSpace > startIndex) {
        endIndex = lastSpace;
      }
    }

    chunks.push(text.slice(startIndex, endIndex).trim());
    startIndex = endIndex - overlapChars;
    if (startIndex >= text.length - overlapChars) break;
  }

  return chunks.filter(Boolean);
}
