"use client";

import React from 'react';
import { useData } from '../../context/DataContext';
import { useAppContext } from '../../context/ThemeContext';
import { HubItemCard } from '../../components/HubItemCard';
import styles from '../page.module.css';

export default function TasksPage() {
  const { items } = useData();
  const { layoutView } = useAppContext();

  const taskItems = items.filter(item => !item.isDeleted && item.type === 'Task');

  return (
    <div>
      <header className={styles.header}>
        <h1 className={styles.title}>My Tasks</h1>
      </header>

      {taskItems.length > 0 ? (
        <div className={layoutView === 'grid' ? styles.grid : styles.list}>
          {taskItems.map(item => <HubItemCard key={item.id} item={item} />)}
        </div>
      ) : (
        <div className={styles.empty}><p>No tasks found. Use Quick Add to create one!</p></div>
      )}
    </div>
  );
}
