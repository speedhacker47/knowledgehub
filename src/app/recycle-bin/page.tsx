"use client";

import React from 'react';
import { useData } from '../../context/DataContext';
import { useAppContext } from '../../context/ThemeContext';
import { HubItemCard } from '../../components/HubItemCard';
import styles from '../page.module.css';

export default function RecycleBin() {
  const { items, deletePermanently } = useData();
  const { layoutView } = useAppContext();

  const deletedItems = items.filter(item => item.isDeleted);

  const emptyBin = () => {
    if (confirm('Are you sure you want to permanently delete all items in the recycle bin?')) {
      deletedItems.forEach(item => deletePermanently(item.id));
    }
  };

  return (
    <div>
      <header className={styles.header}>
        <h1 className={styles.title}>Recycle Bin</h1>
        {deletedItems.length > 0 && (
          <button onClick={emptyBin} style={{ padding: '8px 16px', backgroundColor: 'var(--bg-secondary)', color: 'var(--accent-rose)', border: '1px solid rgba(244,63,94,0.3)', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontWeight: 600 }}>
            Empty Bin
          </button>
        )}
      </header>

      {deletedItems.length > 0 ? (
        <div className={layoutView === 'grid' ? styles.grid : styles.list}>
          {deletedItems.map(item => <HubItemCard key={item.id} item={item} />)}
        </div>
      ) : (
        <div className={styles.empty}><p>The recycle bin is empty.</p></div>
      )}
    </div>
  );
}
