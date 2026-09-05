"use client";

import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { useAppContext } from '../context/ThemeContext';
import { HubItemCard } from '../components/HubItemCard';
import { QuickAddModal } from '../components/QuickAddModal';
import { SmartInsightsBanner } from '../components/SmartInsightsBanner';
import { Category } from '../types';
import styles from './page.module.css';

const CATEGORIES: Category[] = [
  'All',
  'Note',
  'Web Link',
  'Document',
  'PDF',
  'Video',
  'Audio',
  'Task',
  'Message',
];

export default function Dashboard() {
  const { items } = useData();
  const { layoutView, setLayoutView } = useAppContext();
  const [activeCategory, setActiveCategory] = useState<Category>('All');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalDefaultTab, setModalDefaultTab] = useState<'note' | 'link' | 'file' | 'audio' | 'task'>('note');

  // Active items (not in trash)
  const activeItems = useMemo(() => items.filter(item => !item.isDeleted), [items]);

  // Extract all unique tags
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    activeItems.forEach(item => {
      item.tags?.forEach(tag => tagSet.add(tag));
    });
    return Array.from(tagSet);
  }, [activeItems]);

  // Filtered items based on Category, Search, and Tag
  const filteredItems = useMemo(() => {
    return activeItems.filter(item => {
      const matchesCategory = activeCategory === 'All' ? true : item.type === activeCategory;
      const matchesTag = !selectedTag || (item.tags && item.tags.includes(selectedTag));
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q ||
        item.title.toLowerCase().includes(q) ||
        item.content.toLowerCase().includes(q) ||
        (item.noteBody && item.noteBody.toLowerCase().includes(q)) ||
        (item.fileName && item.fileName.toLowerCase().includes(q)) ||
        (item.tags && item.tags.some(t => t.toLowerCase().includes(q)));

      return matchesCategory && matchesTag && matchesSearch;
    });
  }, [activeItems, activeCategory, selectedTag, searchQuery]);

  // Separate pinned and unpinned
  const pinnedItems = useMemo(() => {
    return filteredItems.filter(item => item.isPinned);
  }, [filteredItems]);

  const regularItems = useMemo(() => {
    return filteredItems.filter(item => !item.isPinned);
  }, [filteredItems]);

  const openAddModal = (tab: 'note' | 'link' | 'file' | 'audio' | 'task' = 'note') => {
    setModalDefaultTab(tab);
    setIsModalOpen(true);
  };

  return (
    <div className={styles.pageWrapper}>
      {/* Top Header */}
      <header className={styles.header}>
        <div className={styles.headerTitleGroup}>
          <h1 className={styles.title}>dpocket</h1>
          <p className={styles.subtitle}>
            {activeItems.length} {activeItems.length === 1 ? 'item' : 'items'} saved in your workspace
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
          <button className={styles.quickAddBtn} onClick={() => openAddModal('note')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            <span>Create Item</span>
          </button>
        </div>
      </header>

      {/* Proactive Background AI Intelligence Banner */}
      <SmartInsightsBanner />

      {/* Search Bar */}
      <div className={styles.searchContainer}>
        <div className={styles.searchInputWrapper}>
          <svg className={styles.searchIcon} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          <input 
            type="text" 
            placeholder="Search notes, bookmarks, documents, tasks, or tags..." 
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
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Category Pills & Tag Chips */}
      <div className={styles.filtersWrapper}>
        <div className={styles.filters}>
          {CATEGORIES.map(cat => (
            <button 
              key={cat} 
              className={`${styles.pill} ${activeCategory === cat ? styles.active : ''}`} 
              onClick={() => { setActiveCategory(cat); setSelectedTag(null); }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Tag Filters Row */}
        {allTags.length > 0 && (
          <div className={styles.tagsFilterRow}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Tags:</span>
            {selectedTag && (
              <button className={`${styles.tagChip} ${styles.activeTag}`} onClick={() => setSelectedTag(null)}>
                All Tags ✕
              </button>
            )}
            {allTags.map(tag => (
              <button
                key={tag}
                className={`${styles.tagChip} ${selectedTag === tag ? styles.activeTag : ''}`}
                onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
              >
                {tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Display Pinned Items (if any) */}
      {pinnedItems.length > 0 && (
        <section className={styles.sectionBlock}>
          <h2 className={styles.sectionHeaderTitle}>
            <span>⭐ Pinned Items</span>
          </h2>
          <div className={layoutView === 'grid' ? styles.grid : styles.list}>
            {pinnedItems.map(item => (
              <HubItemCard 
                key={item.id} 
                item={item} 
                onTagClick={tag => setSelectedTag(tag)} 
              />
            ))}
          </div>
        </section>
      )}

      {/* Regular Items */}
      {regularItems.length > 0 ? (
        <section className={styles.sectionBlock}>
          {pinnedItems.length > 0 && (
            <h2 className={styles.sectionHeaderTitle}>
              <span>All {activeCategory === 'All' ? 'Items' : activeCategory}</span>
            </h2>
          )}
          <div className={layoutView === 'grid' ? styles.grid : styles.list}>
            {regularItems.map(item => (
              <HubItemCard 
                key={item.id} 
                item={item} 
                onTagClick={tag => setSelectedTag(tag)} 
              />
            ))}
          </div>
        </section>
      ) : pinnedItems.length === 0 && (
        /* Empty State */
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>
            <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
          </div>
          <h3>Your Hub is Empty</h3>
          <p>{searchQuery ? `No matches found for "${searchQuery}".` : 'Start organizing your thoughts, links, and documents in one place.'}</p>
          
          <div className={styles.emptyActionsRow}>
            <button className={styles.emptyActionChip} onClick={() => openAddModal('note')}>
              📝 New Note
            </button>
            <button className={styles.emptyActionChip} onClick={() => openAddModal('link')}>
              🔗 Bookmark Link
            </button>
            <button className={styles.emptyActionChip} onClick={() => openAddModal('file')}>
              📁 Upload to Drive
            </button>
            <button className={styles.emptyActionChip} onClick={() => openAddModal('audio')}>
              🎙️ Voice Memo
            </button>
            <button className={styles.emptyActionChip} onClick={() => openAddModal('task')}>
              ✅ Create Task
            </button>
          </div>
        </div>
      )}

      {/* Mobile Floating Action Button */}
      <button 
        className={styles.fabBtn} 
        onClick={() => openAddModal('note')}
        aria-label="Add item"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
      </button>

      {/* Modal */}
      {isModalOpen && (
        <QuickAddModal 
          defaultTab={modalDefaultTab} 
          onClose={() => setIsModalOpen(false)} 
        />
      )}
    </div>
  );
}
