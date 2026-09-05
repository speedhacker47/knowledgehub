import { HubItem, AIInsight } from '../types';

/**
 * Intelligent background analyzer for user Hub items.
 * Extracts:
 * 1. Duplicate & Contradictory entries with merge recommendations.
 * 2. Hidden actionable deadlines inside notes to create task reminders.
 * 3. Daily morning briefing synthesizing current priorities & bookmarks.
 */
export async function runProactiveAIAnalysis(items: HubItem[]): Promise<AIInsight[]> {
  const activeItems = items.filter((item) => !item.isDeleted);
  const insights: AIInsight[] = [];

  // 1. Generate Daily Morning Briefing
  const briefingInsight = generateDailyBriefing(activeItems);
  if (briefingInsight) {
    insights.push(briefingInsight);
  }

  // 2. Detect Actionable Deadlines inside Notes
  const deadlineInsights = detectHiddenDeadlines(activeItems);
  insights.push(...deadlineInsights);

  // 3. Detect Duplicate / Contradictory entries & suggest merges
  const duplicateInsights = detectDuplicatesAndContradictions(activeItems);
  insights.push(...duplicateInsights);

  // Optional: If OpenAI API route is accessible, attempt remote deep AI scan
  return insights;
}

/**
 * 1. DAILY BRIEFING GENERATOR
 */
function generateDailyBriefing(items: HubItem[]): AIInsight | null {
  if (items.length === 0) return null;

  const hour = new Date().getHours();
  const timeGreeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const todayStr = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });

  const tasks = items.filter((i) => i.type === 'Task');
  const pendingTasks = tasks.filter((t) => !t.isCompleted);
  const pinnedItems = items.filter((i) => i.isPinned);
  const links = items.filter((i) => i.type === 'Web Link');
  const notes = items.filter((i) => i.type === 'Note');

  // Identify top priority links
  const topLinks = links.slice(0, 3);
  const topTasks = pendingTasks.slice(0, 3);

  let summaryParts: string[] = [];
  summaryParts.push(`${timeGreeting}! Here is your workspace briefing for ${todayStr}:`);

  if (pendingTasks.length > 0) {
    summaryParts.push(`• You have ${pendingTasks.length} pending ${pendingTasks.length === 1 ? 'task' : 'tasks'} (${topTasks.map((t) => `"${t.title}"`).join(', ')}).`);
  } else {
    summaryParts.push(`• All tasks are completed! Great job.`);
  }

  if (pinnedItems.length > 0) {
    summaryParts.push(`• ${pinnedItems.length} pinned priority items need your focus.`);
  }

  if (topLinks.length > 0) {
    summaryParts.push(`• Priority links to explore: ${topLinks.map((l) => l.title).join(', ')}.`);
  }

  return {
    id: 'briefing-today',
    type: 'briefing',
    title: `🌅 Daily Workspace Briefing (${todayStr})`,
    description: summaryParts.join('\n'),
    confidence: 0.98,
    relatedItemIds: [...pinnedItems.map((p) => p.id), ...topTasks.map((t) => t.id)],
    actionType: 'view_item',
    createdAt: new Date().toISOString(),
  };
}

/**
 * 2. HIDDEN DEADLINES DETECTION
 */
const DEADLINE_REGEXES = [
  /(?:by|due|before|on|deadline|until)\s+(tomorrow|today|tonight|monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i,
  /(?:by|due|before|on|deadline|until)\s+(\b\d{1,2}(?:st|nd|rd|th)?\s+(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*|\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{1,2}(?:st|nd|rd|th)?)/i,
  /(?:by|due|before|on|deadline|until)\s+(\d{4}-\d{2}-\d{2}|\d{1,2}\/\d{1,2}(?:\/\d{2,4})?)/i,
  /(?:submit|complete|finish|send|deliver|pay|call|review)\s+([^.\n]{4,40})\s+(?:by|before|on)\s+([^.\n]{3,20})/i,
];

function detectHiddenDeadlines(items: HubItem[]): AIInsight[] {
  const insights: AIInsight[] = [];
  const existingTaskTitles = new Set(
    items.filter((i) => i.type === 'Task').map((t) => t.title.toLowerCase().trim())
  );

  const notesAndDocs = items.filter((i) => i.type === 'Note' || i.type === 'Document' || i.type === 'Message');

  for (const item of notesAndDocs) {
    const fullText = `${item.title} ${item.noteBody || ''} ${item.content || ''}`;

    for (const regex of DEADLINE_REGEXES) {
      const match = fullText.match(regex);
      if (match) {
        const rawPhrase = match[0];
        const datePart = match[1] || match[2] || 'upcoming';
        const taskTitle = `Action: ${item.title} (${rawPhrase.trim()})`;

        // Check if task already created
        if (!existingTaskTitles.has(taskTitle.toLowerCase().trim())) {
          // Calculate an estimated ISO date
          const estimatedDueDate = parseEstimatedDate(datePart);

          insights.push({
            id: `deadline-${item.id}-${datePart.replace(/\s+/g, '-')}`,
            type: 'hidden_deadline',
            title: `⚡ Actionable Deadline in "${item.title}"`,
            description: `Found hidden deadline: "${rawPhrase.trim()}". Would you like to create a tracked task reminder?`,
            confidence: 0.92,
            relatedItemIds: [item.id],
            actionType: 'create_task',
            actionPayload: {
              taskTitle: `Follow up on: ${item.title}`,
              dueDate: estimatedDueDate,
            },
            createdAt: new Date().toISOString(),
          });
          break; // Avoid multiple duplicate insights for same item
        }
      }
    }
  }

  return insights;
}

/**
 * 3. DUPLICATE & CONTRADICTORY ENTRIES DETECTION
 */
function detectDuplicatesAndContradictions(items: HubItem[]): AIInsight[] {
  const insights: AIInsight[] = [];

  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      const a = items[i];
      const b = items[j];

      // Exact or near URL match for Web Links
      if (a.type === 'Web Link' && b.type === 'Web Link') {
        const urlA = cleanUrl(a.content);
        const urlB = cleanUrl(b.content);
        if (urlA && urlB && (urlA === urlB || urlA.includes(urlB) || urlB.includes(urlA))) {
          insights.push({
            id: `dup-link-${a.id}-${b.id}`,
            type: 'duplicate_merge',
            title: `🔗 Duplicate Bookmark Detected`,
            description: `"${a.title}" and "${b.title}" point to the same resource. Merge into a single bookmark?`,
            confidence: 0.95,
            relatedItemIds: [a.id, b.id],
            actionType: 'merge_items',
            actionPayload: {
              targetItemId: a.id,
              sourceItemId: b.id,
              mergedNoteBody: `${a.content}\nTags: ${Array.from(new Set([...(a.tags || []), ...(b.tags || [])])).join(', ')}`,
            },
            createdAt: new Date().toISOString(),
          });
        }
      }

      // Title and Content Similarity for Notes
      if (a.type === 'Note' && b.type === 'Note') {
        const textA = (a.title + ' ' + (a.noteBody || a.content)).toLowerCase();
        const textB = (b.title + ' ' + (b.noteBody || b.content)).toLowerCase();

        const similarity = calculateJaccardSimilarity(textA, textB);

        // Check for contradiction keywords
        const isContradiction =
          (textA.includes('rescheduled') || textA.includes('cancelled') || textA.includes('updated') ||
           textB.includes('rescheduled') || textB.includes('cancelled') || textB.includes('updated')) &&
          similarity > 0.35;

        if (isContradiction) {
          insights.push({
            id: `contradiction-${a.id}-${b.id}`,
            type: 'contradiction',
            title: `⚠️ Potential Contradictory Update`,
            description: `"${a.title}" and "${b.title}" appear to contain conflicting or updated schedule/status information.`,
            confidence: 0.88,
            relatedItemIds: [a.id, b.id],
            actionType: 'merge_items',
            actionPayload: {
              targetItemId: a.id,
              sourceItemId: b.id,
              mergedNoteBody: `[Updated Combined Note]\n${a.noteBody || a.content}\n\n---\n[Recent Note Update]\n${b.noteBody || b.content}`,
            },
            createdAt: new Date().toISOString(),
          });
        } else if (similarity > 0.65) {
          insights.push({
            id: `dup-note-${a.id}-${b.id}`,
            type: 'duplicate_merge',
            title: `📄 Similar Notes: "${a.title}" & "${b.title}"`,
            description: `These notes share ${Math.round(similarity * 100)}% similar content. Merge them to keep your workspace clean?`,
            confidence: similarity,
            relatedItemIds: [a.id, b.id],
            actionType: 'merge_items',
            actionPayload: {
              targetItemId: a.id,
              sourceItemId: b.id,
              mergedNoteBody: `${a.noteBody || a.content}\n\n[Merged Content from "${b.title}"]:\n${b.noteBody || b.content}`,
            },
            createdAt: new Date().toISOString(),
          });
        }
      }
    }
  }

  return insights;
}

// Helpers
function cleanUrl(url: string): string {
  try {
    return url.replace(/^https?:\/\/(www\.)?/, '').split('?')[0].replace(/\/$/, '').toLowerCase();
  } catch {
    return url.toLowerCase().trim();
  }
}

function calculateJaccardSimilarity(str1: string, str2: string): number {
  const words1 = new Set(str1.split(/\W+/).filter((w) => w.length > 2));
  const words2 = new Set(str2.split(/\W+/).filter((w) => w.length > 2));

  if (words1.size === 0 || words2.size === 0) return 0;

  let intersection = 0;
  words1.forEach((w) => {
    if (words2.has(w)) intersection++;
  });

  const union = words1.size + words2.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

function parseEstimatedDate(dateStr: string): string {
  const lower = dateStr.toLowerCase().trim();
  const target = new Date();

  if (lower === 'tomorrow') {
    target.setDate(target.getDate() + 1);
    target.setHours(17, 0, 0, 0);
  } else if (lower === 'today' || lower === 'tonight') {
    target.setHours(20, 0, 0, 0);
  } else if (['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].includes(lower)) {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const targetDayIndex = days.indexOf(lower);
    const currentDayIndex = target.getDay();
    let distance = targetDayIndex - currentDayIndex;
    if (distance <= 0) distance += 7;
    target.setDate(target.getDate() + distance);
    target.setHours(17, 0, 0, 0);
  } else {
    // Attempt standard parse or default to 3 days out
    const parsed = Date.parse(dateStr);
    if (!isNaN(parsed)) {
      return new Date(parsed).toISOString();
    }
    target.setDate(target.getDate() + 3);
  }

  return target.toISOString();
}
