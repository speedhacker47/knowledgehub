"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useData } from '../context/DataContext';
import { AIInsight } from '../types';
import { runProactiveAIAnalysis } from '../utils/aiInsights';
import styles from './SmartInsightsBanner.module.css';

export const SmartInsightsBanner: React.FC = () => {
  const { items, addItem, updateItem, moveToRecycleBin } = useData();
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Load dismissed insight IDs from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('hub_dismissed_insights');
      if (saved) {
        setDismissedIds(new Set(JSON.parse(saved)));
      }
    } catch {
      // ignore
    }
  }, []);

  // Proactive Background Worker: Runs whenever items change (debounced 1.5s)
  useEffect(() => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

    debounceTimerRef.current = setTimeout(async () => {
      if (items.length === 0) {
        setInsights([]);
        return;
      }
      try {
        const generated = await runProactiveAIAnalysis(items);
        setInsights(generated);
      } catch (err) {
        console.warn('Background AI insights error:', err);
      }
    }, 1200);

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [items]);

  // Deep AI Scan via API route
  const handleDeepAIScan = async () => {
    setIsScanning(true);
    try {
      const res = await fetch('/api/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      });
      const data = await res.json();
      if (data.insights && Array.isArray(data.insights)) {
        setInsights(data.insights);
        showToast('⚡ AI scan complete! Hub insights updated.');
      }
    } catch (err) {
      console.warn('Deep AI Scan error, running local analysis:', err);
      const fallback = await runProactiveAIAnalysis(items);
      setInsights(fallback);
    } finally {
      setIsScanning(false);
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // ACCEPT ACTION HANDLER
  const handleAccept = (insight: AIInsight) => {
    if (insight.type === 'hidden_deadline' && insight.actionPayload?.taskTitle) {
      // 1. Automatically create task from hidden deadline
      addItem({
        type: 'Task',
        title: insight.actionPayload.taskTitle,
        content: `Extracted from note: ${insight.title}`,
        dueDate: insight.actionPayload.dueDate,
        isCompleted: false,
        tags: ['#ai-extracted', '#deadline'],
      });
      showToast(`✅ Created Task: "${insight.actionPayload.taskTitle}"`);
    } else if ((insight.type === 'duplicate_merge' || insight.type === 'contradiction') && insight.actionPayload?.targetItemId) {
      // 2. Automatically merge notes
      const targetId = insight.actionPayload.targetItemId;
      const sourceId = insight.actionPayload.sourceItemId;
      const mergedBody = insight.actionPayload.mergedNoteBody;

      if (targetId && mergedBody) {
        updateItem(targetId, {
          noteBody: mergedBody,
          content: mergedBody.slice(0, 100),
        });
      }
      if (sourceId) {
        moveToRecycleBin(sourceId);
      }
      showToast('🔀 Merged notes and cleaned duplicate entry!');
    } else if (insight.type === 'briefing') {
      showToast('🌅 Briefing acknowledged for today.');
    }

    // Dismiss after accepting
    handleDismiss(insight.id);
  };

  // DISMISS ACTION HANDLER
  const handleDismiss = (id: string) => {
    const updated = new Set(dismissedIds);
    updated.add(id);
    setDismissedIds(updated);
    localStorage.setItem('hub_dismissed_insights', JSON.stringify(Array.from(updated)));
  };

  // Visible insights (excluding dismissed)
  const visibleInsights = insights.filter((i) => !dismissedIds.has(i.id));

  if (visibleInsights.length === 0 && !isScanning) {
    return null;
  }

  return (
    <section className={styles.bannerContainer} aria-label="AI Proactive Smart Insights">
      <div className={styles.topBar}>
        <div className={styles.brandGroup}>
          <div className={styles.aiIconBadge}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h2 className={styles.bannerTitle}>
            <span>Proactive AI Intelligence</span>
            <span className={styles.insightCountBadge}>
              {visibleInsights.length} {visibleInsights.length === 1 ? 'Insight' : 'Insights'}
            </span>
          </h2>
        </div>

        <div className={styles.actionsHeader}>
          <button
            onClick={handleDeepAIScan}
            disabled={isScanning}
            className={styles.scanBtn}
            title="Trigger full background AI scan"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              style={{ animation: isScanning ? 'spin 1s linear infinite' : 'none' }}
            >
              <polyline points="23 4 23 10 17 10" />
              <polyline points="1 20 1 14 7 14" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
            <span>{isScanning ? 'Analyzing...' : 'Deep AI Scan'}</span>
          </button>
        </div>
      </div>

      {/* Insights Cards Grid */}
      <div className={styles.cardsGrid}>
        {visibleInsights.map((insight) => {
          const isBriefing = insight.type === 'briefing';
          const isDeadline = insight.type === 'hidden_deadline';
          const isMerge = insight.type === 'duplicate_merge';
          const isContradiction = insight.type === 'contradiction';

          return (
            <div key={insight.id} className={styles.insightCard}>
              <div>
                <div className={styles.cardHeader}>
                  <h3 className={styles.cardTitle}>{insight.title}</h3>
                  <span
                    className={`${styles.typeBadge} ${
                      isBriefing
                        ? styles.badgeBriefing
                        : isDeadline
                        ? styles.badgeDeadline
                        : isMerge
                        ? styles.badgeMerge
                        : styles.badgeContradiction
                    }`}
                  >
                    {isBriefing ? 'Briefing' : isDeadline ? 'Action Required' : isMerge ? 'Duplicate' : 'Contradiction'}
                  </span>
                </div>
                <p className={styles.cardDescription}>{insight.description}</p>
              </div>

              {/* Action Chips */}
              <div className={styles.actionChipsRow}>
                {isDeadline && (
                  <button
                    className={styles.acceptChip}
                    onClick={() => handleAccept(insight)}
                  >
                    ⚡ Create Task Reminder
                  </button>
                )}

                {isMerge && (
                  <button
                    className={styles.acceptChip}
                    onClick={() => handleAccept(insight)}
                  >
                    🔀 Merge Notes
                  </button>
                )}

                {isContradiction && (
                  <button
                    className={styles.acceptChip}
                    onClick={() => handleAccept(insight)}
                  >
                    📝 Merge Updates
                  </button>
                )}

                {isBriefing && (
                  <button
                    className={styles.acceptChip}
                    onClick={() => handleAccept(insight)}
                  >
                    ✓ Got it
                  </button>
                )}

                <button
                  className={styles.dismissChip}
                  onClick={() => handleDismiss(insight.id)}
                >
                  ✕ Dismiss
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Toast Notification */}
      {toastMessage && <div className={styles.toastSuccess}>{toastMessage}</div>}
    </section>
  );
};
