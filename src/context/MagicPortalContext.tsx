"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { HubItem } from '../types';
import { useData } from './DataContext';

export interface MagicAction {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  colorGradient: string;
  glowColor: string;
  applicableTypes: Array<HubItem['type'] | 'All'>;
}

interface MagicActionResult {
  type: 'summary' | 'flashcards' | 'subtasks' | 'tts' | 'drive' | 'task';
  title: string;
  data: any;
}

interface MagicPortalContextType {
  isDragging: boolean;
  draggedItem: HubItem | null;
  activeZoneId: string | null;
  modalResult: MagicActionResult | null;
  startDrag: (item: HubItem) => void;
  endDrag: () => void;
  setActiveZoneId: (id: string | null) => void;
  triggerAction: (actionId: string, item: HubItem) => Promise<void>;
  closeModalResult: () => void;
}

const MagicPortalContext = createContext<MagicPortalContextType | undefined>(undefined);

export const MagicPortalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [draggedItem, setDraggedItem] = useState<HubItem | null>(null);
  const [activeZoneId, setActiveZoneId] = useState<string | null>(null);
  const [modalResult, setModalResult] = useState<MagicActionResult | null>(null);

  const { addItem, updateItem, syncWithDrive } = useData();

  // Listen to global dragend to auto-collapse if user drops outside
  useEffect(() => {
    const handleGlobalDragEnd = () => {
      setIsDragging(false);
      setDraggedItem(null);
      setActiveZoneId(null);
    };

    window.addEventListener('dragend', handleGlobalDragEnd);
    return () => window.removeEventListener('dragend', handleGlobalDragEnd);
  }, []);

  const startDrag = useCallback((item: HubItem) => {
    setDraggedItem(item);
    setIsDragging(true);
    // Haptic vibration feedback
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try { navigator.vibrate(20); } catch {}
    }
  }, []);

  const endDrag = useCallback(() => {
    setIsDragging(false);
    setDraggedItem(null);
    setActiveZoneId(null);
  }, []);

  const closeModalResult = () => {
    setModalResult(null);
  };

  // Execute the selected Smart Magic Action
  const triggerAction = async (actionId: string, item: HubItem) => {
    endDrag();

    // Haptic confirmation vibration
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try { navigator.vibrate([30, 40, 50]); } catch {}
    }

    const content = item.noteBody || item.content || item.title;

    switch (actionId) {
      case 'convert_task': {
        addItem({
          type: 'Task',
          title: `Action: ${item.title}`,
          content: content.slice(0, 120),
          dueDate: new Date(Date.now() + 86400000 * 2).toISOString(),
          isCompleted: false,
          tags: ['#magic-task', '#converted'],
        });
        setModalResult({
          type: 'task',
          title: '✅ Task Created Successfully',
          data: {
            taskTitle: `Action: ${item.title}`,
            dueDate: new Date(Date.now() + 86400000 * 2).toLocaleDateString(),
          },
        });
        break;
      }

      case 'summarize_ai': {
        // Generate quick 3-bullet executive summary
        const bullets = [
          `Key theme: ${item.title}`,
          `Core takeaway: ${content.slice(0, 100)}...`,
          `Category: ${item.type} (Saved on ${new Date(item.dateAdded).toLocaleDateString()})`,
        ];

        setModalResult({
          type: 'summary',
          title: `🧠 AI Summary: ${item.title}`,
          data: {
            originalTitle: item.title,
            bullets,
            fullText: content,
          },
        });
        break;
      }

      case 'generate_flashcards': {
        // Generate interactive flashcard study deck
        const cards = [
          {
            front: `What is the core topic of "${item.title}"?`,
            back: content.slice(0, 140) || 'Main concepts and resources saved in workspace.',
          },
          {
            front: `Why is this ${item.type} relevant to your workspace?`,
            back: `Referenced with tags: ${item.tags?.join(', ') || 'General Knowledge'}.`,
          },
          {
            front: `Key action or memory trigger for ${item.title}:`,
            back: `Review key points from: ${item.content.slice(0, 80)}`,
          },
        ];

        setModalResult({
          type: 'flashcards',
          title: `🗂️ Flashcard Deck: ${item.title}`,
          data: {
            cards,
            itemTitle: item.title,
          },
        });
        break;
      }

      case 'sync_drive': {
        try {
          await syncWithDrive();
          setModalResult({
            type: 'drive',
            title: '☁️ Synced to Google Drive',
            data: {
              itemTitle: item.title,
              status: 'Saved to cloud storage database',
            },
          });
        } catch (err: any) {
          alert('Google Drive sync error: ' + err.message);
        }
        break;
      }

      case 'read_aloud': {
        if ('speechSynthesis' in window) {
          window.speechSynthesis.cancel();
          const utterance = new SpeechSynthesisUtterance(`${item.title}. ${content}`);
          utterance.rate = 1.0;
          utterance.pitch = 1.0;
          window.speechSynthesis.speak(utterance);

          setModalResult({
            type: 'tts',
            title: '🎙️ Reading Aloud',
            data: {
              title: item.title,
              text: content,
            },
          });
        } else {
          alert('Speech synthesis is not supported in this browser.');
        }
        break;
      }

      case 'break_subtasks': {
        const subtasks = [
          `Review requirements for ${item.title}`,
          `Draft initial outline / notes`,
          `Finalize and mark ${item.title} complete`,
        ];

        // Add subtasks
        subtasks.forEach((st, idx) => {
          addItem({
            type: 'Task',
            title: st,
            content: `Subtask of: ${item.title}`,
            dueDate: new Date(Date.now() + 86400000 * (idx + 1)).toISOString(),
            isCompleted: false,
            tags: ['#subtask'],
          });
        });

        setModalResult({
          type: 'subtasks',
          title: `🚀 Decomposed into ${subtasks.length} Subtasks`,
          data: {
            parentTask: item.title,
            subtasks,
          },
        });
        break;
      }

      default:
        console.log('Action triggered:', actionId, item);
    }
  };

  return (
    <MagicPortalContext.Provider
      value={{
        isDragging,
        draggedItem,
        activeZoneId,
        modalResult,
        startDrag,
        endDrag,
        setActiveZoneId,
        triggerAction,
        closeModalResult,
      }}
    >
      {children}
    </MagicPortalContext.Provider>
  );
};

export const useMagicPortal = () => {
  const context = useContext(MagicPortalContext);
  if (!context) {
    throw new Error('useMagicPortal must be used within a MagicPortalProvider');
  }
  return context;
};
