import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { HubItem } from '@/types';
import { runProactiveAIAnalysis } from '@/utils/aiInsights';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

export async function POST(req: NextRequest) {
  try {
    const { items = [] }: { items: HubItem[] } = await req.json();

    if (!items || items.length === 0) {
      return NextResponse.json({ insights: [] });
    }

    // First generate local heuristic insights
    const localInsights = await runProactiveAIAnalysis(items);

    // If no OpenAI key, return local insights immediately
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({
        insights: localInsights,
        engine: 'local_heuristic',
      });
    }

    // Call OpenAI for deep semantic analysis across all notes
    const activeNotes = items
      .filter((i) => !i.isDeleted)
      .slice(0, 30) // Cap to avoid token explosion
      .map((i) => `[ID: ${i.id}] [Type: ${i.type}] Title: "${i.title}"\nContent: ${i.noteBody || i.content || ''}`);

    const prompt = `Analyze these user knowledge hub items. 
Tasks to perform:
1. Identify any contradictory or duplicate entries across notes.
2. Detect hidden actionable deadlines/promises inside note bodies that are not yet tasks.
3. Suggest clear merge actions or task creations.

Output MUST be valid JSON matching this schema:
{
  "insights": [
    {
      "id": "unique-id",
      "type": "briefing" | "duplicate_merge" | "hidden_deadline" | "contradiction",
      "title": "Short title with emoji",
      "description": "Clear 1-2 sentence actionable description",
      "confidence": 0.95,
      "relatedItemIds": ["id1", "id2"],
      "actionType": "create_task" | "merge_items" | "dismiss",
      "actionPayload": {
        "taskTitle": "...",
        "dueDate": "ISO timestamp",
        "mergedNoteBody": "...",
        "targetItemId": "...",
        "sourceItemId": "..."
      }
    }
  ]
}

Items to analyze:
${activeNotes.join('\n---\n')}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.2,
    });

    const responseContent = completion.choices[0]?.message?.content;
    let aiInsights = [];
    if (responseContent) {
      const parsed = JSON.parse(responseContent);
      aiInsights = parsed.insights || [];
    }

    // Combine AI insights with the daily briefing
    const briefing = localInsights.find((i) => i.type === 'briefing');
    const combined = briefing ? [briefing, ...aiInsights] : aiInsights;

    return NextResponse.json({
      insights: combined.length > 0 ? combined : localInsights,
      engine: 'openai_gpt4o',
    });
  } catch (error: any) {
    console.warn('AI Insights API warning, falling back to local engine:', error.message);
    const { items = [] } = await req.json().catch(() => ({ items: [] }));
    const fallback = await runProactiveAIAnalysis(items);
    return NextResponse.json({
      insights: fallback,
      engine: 'fallback_heuristic',
    });
  }
}
