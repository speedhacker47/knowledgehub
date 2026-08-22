"use client";

import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { useAppContext } from '../context/ThemeContext';
import { HubItemCard } from '../components/HubItemCard';
import { QuickAddModal } from '../components/QuickAddModal';
import { Category } from '../types';
import styles from './page.module.css';

const CATEGORIES: Category[] = ['All', 'Video', 'PDF', 'Message', 'Web Link', 'Task'];

export default function Dashboard() {
  const { items } = useData();
  const { layoutView } = useAppContext();
  const [activeCategory, setActiveCategory] = useState<Category>('All');
  const [isModalOpen, setIsModalOpen] = useState(false);


  const activeItems = items.filter(item => !item.isDeleted);
  const displayedItems = activeItems.filter(item => activeCategory === 'All' ? true : item.type === activeCategory);

  return (
    <div>
      <header className={styles.header}>
        <h1 className={styles.title}>Knowledge Hub</h1>
        <button className={styles.quickAddBtn} onClick={() => setIsModalOpen(true)}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          Quick Add
        </button>
      </header>

      <div className={styles.filters}>
        {CATEGORIES.map(cat => (
          <button key={cat} className={`${styles.pill} ${activeCategory === cat ? styles.active : ''}`} onClick={() => setActiveCategory(cat)}>
            {cat}
          </button>
        ))}
      </div>

      {displayedItems.length > 0 ? (
        <div className={layoutView === 'grid' ? styles.grid : styles.list}>
          {displayedItems.map(item => <HubItemCard key={item.id} item={item} />)}
        </div>
      ) : (
        <div className={styles.empty}><p>No items found in this category.</p></div>
      )}

      {isModalOpen && <QuickAddModal onClose={() => setIsModalOpen(false)} />}
    </div>
  );
}
