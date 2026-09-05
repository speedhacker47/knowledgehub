"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMagicPortal, MagicAction } from '../../context/MagicPortalContext';
import { HubItem } from '../../types';

export const MagicPortalDock: React.FC = () => {
  const {
    isDragging,
    draggedItem,
    activeZoneId,
    setActiveZoneId,
    triggerAction,
  } = useMagicPortal();

  // Define smart action zones according to dragged item type
  const getActionZones = (item: HubItem | null): MagicAction[] => {
    if (!item) return [];

    const isNote = item.type === 'Note' || item.type === 'Document' || item.type === 'Message';
    const isLink = item.type === 'Web Link';
    const isTask = item.type === 'Task';

    const zones: MagicAction[] = [];

    if (isNote) {
      zones.push(
        {
          id: 'summarize_ai',
          title: 'Summarize with AI',
          subtitle: 'Extract 3 core key takeaways',
          icon: '🧠',
          colorGradient: 'from-purple-600 to-indigo-600',
          glowColor: 'rgba(168, 85, 247, 0.45)',
          applicableTypes: ['Note', 'Document', 'Message'],
        },
        {
          id: 'generate_flashcards',
          title: 'Generate Flashcards',
          subtitle: 'Create study & review deck',
          icon: '🗂️',
          colorGradient: 'from-pink-500 to-rose-600',
          glowColor: 'rgba(244, 63, 94, 0.45)',
          applicableTypes: ['Note', 'Document'],
        },
        {
          id: 'convert_task',
          title: 'Convert to Task',
          subtitle: 'Add to actionable checklist',
          icon: '⚡',
          colorGradient: 'from-amber-500 to-orange-600',
          glowColor: 'rgba(245, 158, 11, 0.45)',
          applicableTypes: ['Note', 'Document', 'Message'],
        },
        {
          id: 'read_aloud',
          title: 'Read Aloud (TTS)',
          subtitle: 'Listen with speech audio',
          icon: '🎙️',
          colorGradient: 'from-cyan-500 to-blue-600',
          glowColor: 'rgba(6, 182, 212, 0.45)',
          applicableTypes: ['Note', 'Document'],
        },
        {
          id: 'sync_drive',
          title: 'Sync to Google Drive',
          subtitle: 'Backup note to cloud storage',
          icon: '☁️',
          colorGradient: 'from-emerald-500 to-teal-600',
          glowColor: 'rgba(16, 185, 129, 0.45)',
          applicableTypes: ['All'],
        }
      );
    } else if (isLink) {
      zones.push(
        {
          id: 'summarize_ai',
          title: 'AI Link Digest',
          subtitle: 'Synthesize web resource notes',
          icon: '🌐',
          colorGradient: 'from-indigo-600 to-blue-600',
          glowColor: 'rgba(99, 102, 241, 0.45)',
          applicableTypes: ['Web Link'],
        },
        {
          id: 'convert_task',
          title: 'Schedule Reading Task',
          subtitle: 'Set a reading deadline',
          icon: '⚡',
          colorGradient: 'from-amber-500 to-orange-600',
          glowColor: 'rgba(245, 158, 11, 0.45)',
          applicableTypes: ['Web Link'],
        },
        {
          id: 'sync_drive',
          title: 'Backup to Drive',
          subtitle: 'Save bookmark in cloud',
          icon: '☁️',
          colorGradient: 'from-emerald-500 to-teal-600',
          glowColor: 'rgba(16, 185, 129, 0.45)',
          applicableTypes: ['All'],
        }
      );
    } else if (isTask) {
      zones.push(
        {
          id: 'break_subtasks',
          title: 'Break into Subtasks',
          subtitle: 'AI decomposes task into 3 steps',
          icon: '🚀',
          colorGradient: 'from-violet-600 to-purple-600',
          glowColor: 'rgba(139, 92, 246, 0.45)',
          applicableTypes: ['Task'],
        },
        {
          id: 'summarize_ai',
          title: 'AI Task Briefing',
          subtitle: 'Outline context & goals',
          icon: '🧠',
          colorGradient: 'from-indigo-600 to-blue-600',
          glowColor: 'rgba(99, 102, 241, 0.45)',
          applicableTypes: ['Task'],
        },
        {
          id: 'sync_drive',
          title: 'Sync Task to Cloud',
          subtitle: 'Update database record',
          icon: '☁️',
          colorGradient: 'from-emerald-500 to-teal-600',
          glowColor: 'rgba(16, 185, 129, 0.45)',
          applicableTypes: ['All'],
        }
      );
    } else {
      // Default fallback actions
      zones.push(
        {
          id: 'summarize_ai',
          title: 'Analyze with AI',
          subtitle: 'Extract summary insights',
          icon: '🧠',
          colorGradient: 'from-purple-600 to-indigo-600',
          glowColor: 'rgba(168, 85, 247, 0.45)',
          applicableTypes: ['All'],
        },
        {
          id: 'convert_task',
          title: 'Create Task Reminder',
          subtitle: 'Track this item as a todo',
          icon: '⚡',
          colorGradient: 'from-amber-500 to-orange-600',
          glowColor: 'rgba(245, 158, 11, 0.45)',
          applicableTypes: ['All'],
        },
        {
          id: 'sync_drive',
          title: 'Sync to Google Drive',
          subtitle: 'Backup file to cloud storage',
          icon: '☁️',
          colorGradient: 'from-emerald-500 to-teal-600',
          glowColor: 'rgba(16, 185, 129, 0.45)',
          applicableTypes: ['All'],
        }
      );
    }

    return zones;
  };

  const actionZones = getActionZones(draggedItem);

  return (
    <AnimatePresence>
      {isDragging && (
        <>
          {/* Backdrop overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 bg-slate-950/30 backdrop-blur-[2px] z-40 pointer-events-none"
          />

          {/* Sliding Glassmorphic Dock */}
          <motion.aside
            initial={{ x: '100%', opacity: 0.5 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{
              type: 'spring',
              damping: 24,
              stiffness: 240,
              mass: 0.8,
            }}
            className="fixed top-0 right-0 h-full w-full max-w-[340px] sm:max-w-[380px] z-50 p-4 sm:p-6 flex flex-col justify-between overflow-y-auto bg-slate-900/85 dark:bg-slate-950/90 text-white backdrop-blur-2xl border-l border-white/20 shadow-[-10px_0_40px_rgba(0,0,0,0.5)] font-sans"
          >
            {/* Background Luminous Ambient Glow */}
            <div className="absolute -top-24 -right-24 w-72 h-72 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />

            {/* Dock Header */}
            <div className="relative z-10">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-sm shadow-md animate-pulse">
                    ✨
                  </div>
                  <div>
                    <h3 className="font-bold text-base tracking-tight text-white flex items-center gap-1.5">
                      Magic Portal
                    </h3>
                    <p className="text-[11px] text-slate-300">
                      Drop into a zone to transform
                    </p>
                  </div>
                </div>

                <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                  Active
                </span>
              </div>

              {/* Dragged Item Thumbnail Preview */}
              {draggedItem && (
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="mt-3.5 p-3 rounded-xl bg-white/10 border border-white/15 backdrop-blur-md flex items-center space-x-3"
                >
                  <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center text-sm flex-shrink-0">
                    {draggedItem.type === 'Note' ? '📝' : draggedItem.type === 'Web Link' ? '🔗' : draggedItem.type === 'Task' ? '✅' : '📁'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-white truncate">
                      {draggedItem.title}
                    </p>
                    <p className="text-[10px] text-slate-300 capitalize">
                      {draggedItem.type}
                    </p>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Smart Action Drop Zones */}
            <div className="my-auto py-4 space-y-3 relative z-10">
              {actionZones.map((zone, idx) => {
                const isActive = activeZoneId === zone.id;

                return (
                  <motion.div
                    key={zone.id}
                    initial={{ x: 50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: idx * 0.04, duration: 0.2 }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.dataTransfer.dropEffect = 'copy';
                    }}
                    onDragEnter={() => {
                      setActiveZoneId(zone.id);
                      if (typeof window !== 'undefined' && 'vibrate' in navigator) {
                        try { navigator.vibrate(15); } catch {}
                      }
                    }}
                    onDragLeave={() => {
                      if (activeZoneId === zone.id) {
                        setActiveZoneId(null);
                      }
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (draggedItem) {
                        triggerAction(zone.id, draggedItem);
                      }
                    }}
                    whileHover={{ scale: 1.02 }}
                    className={`relative p-3.5 rounded-2xl border transition-all duration-200 cursor-pointer overflow-hidden ${
                      isActive
                        ? `bg-gradient-to-r ${zone.colorGradient} border-white shadow-[0_0_25px_${zone.glowColor}] scale-[1.03]`
                        : 'bg-white/5 hover:bg-white/10 border-white/10'
                    }`}
                  >
                    {/* Pulsing ring on active hover */}
                    {isActive && (
                      <motion.div
                        layoutId="activeGlow"
                        className="absolute inset-0 bg-white/20 pointer-events-none animate-pulse"
                      />
                    )}

                    <div className="flex items-center space-x-3 relative z-10">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 shadow-md ${
                          isActive
                            ? 'bg-white text-slate-900'
                            : `bg-gradient-to-br ${zone.colorGradient} text-white`
                        }`}
                      >
                        {zone.icon}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-white tracking-wide">
                            {zone.title}
                          </h4>
                          {isActive && (
                            <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-white text-slate-900 animate-bounce">
                              Drop Here
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-300 truncate mt-0.5">
                          {zone.subtitle}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Footer Hint */}
            <div className="pt-3 border-t border-white/10 text-center relative z-10">
              <span className="text-[11px] text-slate-400 font-medium flex items-center justify-center gap-1">
                <span>Release anywhere outside to cancel</span>
              </span>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};
