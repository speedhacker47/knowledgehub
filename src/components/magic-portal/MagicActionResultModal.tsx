"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMagicPortal } from '../../context/MagicPortalContext';
import { useData } from '../../context/DataContext';

export const MagicActionResultModal: React.FC = () => {
  const { modalResult, closeModalResult } = useMagicPortal();
  const { addItem } = useData();
  const [activeCardIdx, setActiveCardIdx] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  if (!modalResult) return null;

  const { type, title, data } = modalResult;

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const handleSaveSummaryAsNote = () => {
    if (data?.bullets) {
      addItem({
        type: 'Note',
        title: `AI Summary: ${data.originalTitle}`,
        content: data.bullets.join('\n'),
        noteBody: `Executive Summary for: ${data.originalTitle}\n\n${data.bullets.map((b: string) => `• ${b}`).join('\n')}`,
        tags: ['#ai-summary', '#executive-digest'],
      });
      showToast('✅ Saved AI Summary as new Note in Hub!');
      setTimeout(closeModalResult, 1000);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={closeModalResult}
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 10 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative z-10 w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 overflow-hidden font-sans text-slate-800 dark:text-slate-100"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
            <h3 className="text-base font-bold flex items-center gap-2">{title}</h3>
            <button
              onClick={closeModalResult}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              ✕
            </button>
          </div>

          {/* Flashcards View */}
          {type === 'flashcards' && data?.cards && (
            <div className="py-5">
              <div className="flex justify-between items-center text-xs text-slate-500 mb-3">
                <span>Card {activeCardIdx + 1} of {data.cards.length}</span>
                <span>Click card to flip</span>
              </div>

              {/* Flip Card with 3D perspective */}
              <div
                onClick={() => setIsFlipped(!isFlipped)}
                className="h-52 w-full cursor-pointer perspective-1000 select-none"
              >
                <motion.div
                  animate={{ rotateY: isFlipped ? 180 : 0 }}
                  transition={{ duration: 0.4 }}
                  className="w-full h-full rounded-2xl p-6 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-slate-800 dark:to-indigo-950/60 border border-indigo-200 dark:border-indigo-800/60 shadow-lg flex flex-col justify-between"
                  style={{ transformStyle: 'preserve-3d' }}
                >
                  <div className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                    {isFlipped ? '💡 ANSWER / TAKEAWAY' : '❓ QUESTION / CONCEPT'}
                  </div>

                  <p className="text-sm font-semibold text-center text-slate-800 dark:text-slate-100">
                    {isFlipped ? data.cards[activeCardIdx].back : data.cards[activeCardIdx].front}
                  </p>

                  <div className="text-[11px] text-center text-slate-400">
                    {isFlipped ? 'Tap to view question' : 'Tap to reveal answer'}
                  </div>
                </motion.div>
              </div>

              {/* Navigation Controls */}
              <div className="flex items-center justify-between mt-4">
                <button
                  disabled={activeCardIdx === 0}
                  onClick={() => { setActiveCardIdx(i => Math.max(0, i - 1)); setIsFlipped(false); }}
                  className="px-3.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold disabled:opacity-40"
                >
                  ← Previous
                </button>
                <button
                  disabled={activeCardIdx === data.cards.length - 1}
                  onClick={() => { setActiveCardIdx(i => Math.min(data.cards.length - 1, i + 1)); setIsFlipped(false); }}
                  className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold disabled:opacity-40"
                >
                  Next Card →
                </button>
              </div>
            </div>
          )}

          {/* AI Summary View */}
          {type === 'summary' && data?.bullets && (
            <div className="py-4 space-y-3">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-2 text-sm leading-relaxed">
                {data.bullets.map((bullet: string, idx: number) => (
                  <div key={idx} className="flex items-start gap-2">
                    <span className="text-indigo-500 font-bold">•</span>
                    <span>{bullet}</span>
                  </div>
                ))}
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={handleSaveSummaryAsNote}
                  className="flex-1 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md"
                >
                  Save as New Note
                </button>
                <button
                  onClick={() => { navigator.clipboard.writeText(data.bullets.join('\n')); showToast('Copied to clipboard!'); }}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Copy
                </button>
              </div>
            </div>
          )}

          {/* Subtasks View */}
          {type === 'subtasks' && data?.subtasks && (
            <div className="py-4 space-y-3">
              <p className="text-xs text-slate-500">
                Created {data.subtasks.length} actionable subtasks for &quot;{data.parentTask}&quot;:
              </p>
              <div className="space-y-2">
                {data.subtasks.map((st: string, idx: number) => (
                  <div key={idx} className="flex items-center gap-2.5 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 text-xs font-medium border border-slate-200 dark:border-slate-700">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center font-bold text-[10px]">
                      {idx + 1}
                    </span>
                    <span>{st}</span>
                  </div>
                ))}
              </div>
              <button
                onClick={closeModalResult}
                className="w-full py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold mt-2"
              >
                Done
              </button>
            </div>
          )}

          {/* Toast Notification */}
          {toast && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-emerald-600 text-white px-4 py-1.5 rounded-full text-xs font-semibold shadow-lg">
              {toast}
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
