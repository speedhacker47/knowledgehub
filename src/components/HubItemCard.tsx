"use client";

import React from 'react';
import { HubItem } from '../types';
import { useAppContext } from '../context/ThemeContext';
import { useData } from '../context/DataContext';
import styles from './HubItemCard.module.css';

interface HubItemCardProps {
  item: HubItem;
}

export const HubItemCard: React.FC<HubItemCardProps> = ({ item }) => {
  const { layoutView } = useAppContext();
  const { moveToRecycleBin, restoreItem, deletePermanently } = useData();

  const isGrid = layoutView === 'grid';
  const isDeleted = item.isDeleted;

  const getIconForType = () => {
    switch (item.type) {
      case 'Video': return <VideoIcon />;
      case 'PDF': return <PDFIcon />;
      case 'Message': return <MessageIcon />;
      case 'Task': return <TaskIcon />;
      case 'Web Link': default: return <LinkIcon />;
    }
  };

  const handleAction = () => {
    if (isDeleted) restoreItem(item.id);
    else moveToRecycleBin(item.id);
  };

  const handleDelete = () => {
    if (isDeleted) deletePermanently(item.id);
  };

  const openLink = () => {
    if (item.content.startsWith('http')) window.open(item.content, '_blank');
  };

  return (
    <div className={`${styles.card} ${isGrid ? styles.grid : styles.list}`}>
      <div className={styles.preview} onClick={openLink} style={{ cursor: item.content.startsWith('http') ? 'pointer' : 'default' }}>
        {item.previewImage ? (
          <img src={item.previewImage} alt={item.title} />
        ) : (
          <div className={styles.iconPlaceholder}>{getIconForType()}</div>
        )}
      </div>

      <div className={styles.content}>
        <div className={styles.header}>
          <h3 className={styles.title} title={item.title}>{item.title}</h3>
          <span className={styles.badge}>{item.type}</span>
        </div>
        <p className={styles.desc}>{item.content}</p>
        
        {isGrid && (
          <div className={styles.footer}>
            <span className={styles.date}>{new Date(item.dateAdded).toLocaleDateString()}</span>
            <div className={styles.actions}>
              {isDeleted ? (
                <>
                  <button onClick={handleAction} className={styles.actionBtn}><RestoreIcon /></button>
                  <button onClick={handleDelete} className={`${styles.actionBtn} ${styles.deleteBtn}`}><TrashIcon /></button>
                </>
              ) : (
                <button onClick={handleAction} className={`${styles.actionBtn} ${styles.deleteBtn}`}><TrashIcon /></button>
              )}
            </div>
          </div>
        )}
      </div>

      {!isGrid && (
        <div className={styles.footer}>
          <span className={styles.date}>{new Date(item.dateAdded).toLocaleDateString()}</span>
          <div className={styles.actions}>
            {isDeleted ? (
              <>
                <button onClick={handleAction} className={styles.actionBtn}><RestoreIcon /></button>
                <button onClick={handleDelete} className={`${styles.actionBtn} ${styles.deleteBtn}`}><TrashIcon /></button>
              </>
            ) : (
              <button onClick={handleAction} className={`${styles.actionBtn} ${styles.deleteBtn}`}><TrashIcon /></button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const VideoIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7"></polygon><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect></svg>;
const PDFIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>;
const MessageIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>;
const TaskIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 11 12 14 22 4"></polyline><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>;
const LinkIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>;
const TrashIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>;
const RestoreIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10"></polyline><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path></svg>;
