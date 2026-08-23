"use client";

import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { useAppContext } from '../context/ThemeContext';
import { HubItemCard } from '../components/HubItemCard';
import { QuickAddModal } from '../components/QuickAddModal';
import { Category } from '../types';
import styles from './page.module.css';

const CATEGORIES: Category[] = ['All', 'Video', 'PDF', 'Message', 'Web Link', 'Task'];

export default function Dashboard() {
  const { items } = useData();
  const { layoutView, setLayoutView } = useAppContext();
  const [activeCategory, setActiveCategory] = useState<Category>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const activeItems = useMemo(() => items.filter(item => !item.isDeleted), [items]);

  const displayedItems = useMemo(() => {
    return activeItems.filter(item => {
      const matchesCat = activeCategory === 'All' ? true : item.type === activeCategory;
      const matchesSearch = !searchQuery.trim() || 
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        item.content.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCat && matchesSearch;
    });
  }, [activeItems, activeCategory, searchQuery]);

  return (
    <div className={styles.pageWrapper}>
      {/* Top Header */}
      <header className={styles.header}>
        <div className={styles.headerTitleGroup}>
          <h1 className={styles.title}>Knowledge Hub</h1>
          <p className={styles.subtitle}>
            {activeItems.length} {activeItems.length === 1 ? 'item' : 'items'} saved in your library
          </p>
        </div>

        <div className={styles.headerActions}>
          {/* Grid / List view toggle */}
          <div className={styles.viewToggleGroup}>
            <button
              className={`${styles.viewToggleBtn} ${layoutView === 'grid' ? styles.activeView : ''}`}
              onClick={() => setLayoutView('grid')}
              aria-label="Grid view"
              title="Grid view"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
            </button>
            <button
              className={`${styles.viewToggleBtn} ${layoutView === 'list' ? styles.activeView : ''}`}
              onClick={() => setLayoutView('list')}
              aria-label="List view"
              title="List view"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
            </button>
          </div>

          {/* Desktop Quick Add Button */}
          <button className={styles.quickAddBtn} onClick={() => setIsModalOpen(true)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            <span>Quick Add</span>
          </button>
        </div>
      </header>

      {/* Search Bar on Mobile / Desktop */}
      <div className={styles.searchContainer}>
        <div className={styles.searchInputWrapper}>
          <svg className={styles.searchIcon} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          <input 
            type="text" 
            placeholder="Search links, messages, notes..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
          />
          {searchQuery && (
            <button 
              className={styles.clearSearchBtn}
              onClick={() => setSearchQuery('')}
              aria-label="Clear search"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          )}
        </div>
      </div>

      {/* Category Horizontal Filter Pills */}
      <div className={styles.filtersWrapper}>
        <div className={`${styles.filters} no-scrollbar`}>
          {CATEGORIES.map(cat => (
            <button 
              key={cat} 
              className={`${styles.pill} ${activeCategory === cat ? styles.active : ''}`} 
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Item Collection */}
      {displayedItems.length > 0 ? (
        <div className={layoutView === 'grid' ? styles.grid : styles.list}>
          {displayedItems.map(item => (
            <HubItemCard key={item.id} item={item} />
          ))}
        </div>
      ) : (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
          </div>
          <h3>No items found</h3>
          <p>{searchQuery ? `No matches for "${searchQuery}" in ${activeCategory}.` : 'No items saved in this category yet.'}</p>
          <button className={styles.emptyAddBtn} onClick={() => setIsModalOpen(true)}>
            + Add New Item
          </button>
        </div>
      )}

      {/* Mobile Floating Action Button (FAB) */}
      <button 
        className={styles.fabBtn} 
        onClick={() => setIsModalOpen(true)}
        aria-label="Add item"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
      </button>

      {/* Quick Add Modal / Bottom Sheet */}
      {isModalOpen && <QuickAddModal onClose={() => setIsModalOpen(false)} />}
    </div>
  );
}
