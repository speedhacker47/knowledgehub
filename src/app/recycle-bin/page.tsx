"use client";

import React from 'react';
import { useData } from '../../context/DataContext';
import { useAppContext } from '../../context/ThemeContext';
import { HubItemCard } from '../../components/HubItemCard';
import styles from '../page.module.css';

export default function RecycleBin() {
  const { items, deletePermanently } = useData();
  const { layoutView, setLayoutView } = useAppContext();

  const deletedItems = items.filter(item => item.isDeleted);

  const emptyBin = () => {
    if (confirm('Are you sure you want to permanently delete all items in the recycle bin?')) {
      deletedItems.forEach(item => deletePermanently(item.id));
    }
  };

  return (
    <div className={styles.pageWrapper}>
      <header className={styles.header}>
        <div className={styles.headerTitleGroup}>
          <h1 className={styles.title}>Recycle Bin</h1>
          <p className={styles.subtitle}>
            {deletedItems.length} {deletedItems.length === 1 ? 'item' : 'items'} in trash
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

          {deletedItems.length > 0 && (
            <button 
              onClick={emptyBin} 
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '9px 16px',
                backgroundColor: 'rgba(244, 63, 94, 0.1)',
                color: 'var(--accent-rose)',
                border: '1px solid rgba(244, 63, 94, 0.25)',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.9rem',
                minHeight: '38px',
                transition: 'all 0.2s ease',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
              <span>Empty Bin</span>
            </button>
          )}
        </div>
      </header>

      {deletedItems.length > 0 ? (
        <div className={layoutView === 'grid' ? styles.grid : styles.list}>
          {deletedItems.map(item => <HubItemCard key={item.id} item={item} />)}
        </div>
      ) : (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
          </div>
          <h3>Recycle bin is empty</h3>
          <p>Deleted items will appear here where you can restore or permanently delete them.</p>
        </div>
      )}
    </div>
  );
}
