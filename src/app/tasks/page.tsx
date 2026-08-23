"use client";

import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { useAppContext } from '../../context/ThemeContext';
import { HubItemCard } from '../../components/HubItemCard';
import { QuickAddModal } from '../../components/QuickAddModal';
import styles from '../page.module.css';

export default function TasksPage() {
  const { items } = useData();
  const { layoutView, setLayoutView } = useAppContext();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const taskItems = items.filter(item => !item.isDeleted && item.type === 'Task');

  return (
    <div className={styles.pageWrapper}>
      <header className={styles.header}>
        <div className={styles.headerTitleGroup}>
          <h1 className={styles.title}>My Tasks</h1>
          <p className={styles.subtitle}>
            {taskItems.length} {taskItems.length === 1 ? 'task' : 'tasks'} pending
          </p>
        </div>

        <div className={styles.headerActions}>
          <div className={styles.viewToggleGroup}>
            <button
              className={`${styles.viewToggleBtn} ${layoutView === 'grid' ? styles.activeView : ''}`}
              onClick={() => setLayoutView('grid')}
              aria-label="Grid view"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
            </button>
            <button
              className={`${styles.viewToggleBtn} ${layoutView === 'list' ? styles.activeView : ''}`}
              onClick={() => setLayoutView('list')}
              aria-label="List view"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
            </button>
          </div>

          <button className={styles.quickAddBtn} onClick={() => setIsModalOpen(true)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            <span>Add Task</span>
          </button>
        </div>
      </header>

      {taskItems.length > 0 ? (
        <div className={layoutView === 'grid' ? styles.grid : styles.list}>
          {taskItems.map(item => <HubItemCard key={item.id} item={item} />)}
        </div>
      ) : (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="9 11 12 14 22 4"></polyline><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>
          </div>
          <h3>All caught up!</h3>
          <p>No active tasks right now. Create a new task to stay organized.</p>
          <button className={styles.emptyAddBtn} onClick={() => setIsModalOpen(true)}>
            + Create New Task
          </button>
        </div>
      )}

      {/* Mobile Floating Action Button (FAB) */}
      <button 
        className={styles.fabBtn} 
        onClick={() => setIsModalOpen(true)}
        aria-label="Add task"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
      </button>

      {isModalOpen && <QuickAddModal defaultTab="task" onClose={() => setIsModalOpen(false)} />}
    </div>
  );
}
