import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { searchSimilarNotes } from '@/utils/rag/vectorStore';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

export async function POST(req: NextRequest) {
  try {
    const { message, history = [], userId } = await req.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message query is required' }, { status: 400 });
    }

    // Check OpenAI API Key
    if (!process.env.OPENAI_API_KEY) {
      // Fallback demo response if no API key is provided
      return NextResponse.json({
        answer: `[Demo Mode - Set OPENAI_API_KEY and SUPABASE_URL in .env.local to enable live RAG]: I received your question: "${message}". In live mode, this retrieves top matching vector embeddings from your database and uses GPT-4o to synthesize an answer with citations.`,
        sources: [
          {
            title: "Sample Knowledge Note",
            content: "This is a preview of how retrieved context chunks appear below the AI response.",
            similarity: 0.94,
          }
        ],
      });
    }

    // 1. RETRIEVAL: Query Supabase Vector Store for relevant note chunks
    let relevantNotes: any[] = [];
    try {
      relevantNotes = await searchSimilarNotes(message, {
        userId,
        matchCount: 4,
        matchThreshold: 0.25,
      });
    } catch (dbErr) {
      console.warn('Vector search warning (check Supabase configuration):', dbErr);
    }

    // 2. AUGMENTATION: Build context block from retrieved notes
    const contextBlock = relevantNotes.length > 0
      ? relevantNotes
          .map((n, idx) => `[Source ${idx + 1}] Title: ${n.title}\nContent:\n${n.content}`)
          .join('\n\n---\n\n')
      : 'No relevant saved notes found for this query.';

    const systemPrompt = `You are a helpful and intelligent Personal Knowledge Assistant.
Your goal is to answer the user's questions accurately and concisely, grounded ONLY in the retrieved personal notes and documents provided below in the Context.

Guidelines:
1. Always base your response directly on the provided Context.
2. If the Context contains the answer, explain it clearly and cite the relevant note title or source number.
3. If the Context does NOT contain sufficient information to answer the question, clearly state: "I couldn't find information about that in your saved notes." Do not invent facts.
4. Keep answers clean, well-formatted, and easy to read with bullet points when appropriate.

=== RETRIEVED USER NOTES CONTEXT ===
${contextBlock}
====================================`;

    // 3. GENERATION: Call OpenAI LLM
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
      ...history.slice(-6).map((h: any) => ({
        role: h.role as 'user' | 'assistant',
        content: h.content,
      })),
      { role: 'user', content: message },
    ];

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      temperature: 0.2, // Low temperature for high factual grounding
      max_tokens: 800,
    });

    const answer = completion.choices[0]?.message?.content || 'No response generated.';

    // Return the generated answer alongside source citations
    return NextResponse.json({
      answer,
      sources: relevantNotes.map(n => ({
        id: n.id,
        itemId: n.itemId,
        title: n.title,
        snippet: n.content.length > 180 ? `${n.content.slice(0, 180)}...` : n.content,
        similarity: Math.round(n.similarity * 100),
      })),
    });
  } catch (error: any) {
    console.error('RAG Chat API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process chat request' },
      { status: 500 }
    );
  }
}
