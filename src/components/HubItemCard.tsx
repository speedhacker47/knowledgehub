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

  const handleAction = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isDeleted) restoreItem(item.id);
    else moveToRecycleBin(item.id);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isDeleted) deletePermanently(item.id);
  };

  const openLink = () => {
    const targetUrl = item.driveWebViewLink || (item.content.startsWith('http') ? item.content : null);
    if (targetUrl) {
      window.open(targetUrl, '_blank');
    }
  };

  const isClickable = Boolean(item.driveWebViewLink || item.content.startsWith('http'));

  return (
    <div className={`${styles.card} ${isGrid ? styles.grid : styles.list}`}>
      <div 
        className={styles.preview} 
        onClick={openLink} 
        style={{ cursor: isClickable ? 'pointer' : 'default' }}
        title={isClickable ? 'Click to open' : undefined}
      >
        {item.previewImage ? (
          <img src={item.previewImage} alt={item.title} />
        ) : (
          <div className={styles.iconPlaceholder}>{getIconForType()}</div>
        )}

        {item.driveFileId && (
          <span className={styles.driveBadge} title="Stored in Google Drive">
            <GoogleDriveIcon />
            Drive
          </span>
        )}
      </div>

      <div className={styles.content}>
        <div className={styles.header}>
          <h3 
            className={styles.title} 
            title={item.title} 
            onClick={isClickable ? openLink : undefined}
            style={{ cursor: isClickable ? 'pointer' : 'default' }}
          >
            {item.title}
          </h3>
          <div className={styles.badgeGroup}>
            {item.fileSize && <span className={styles.fileSizeBadge}>{item.fileSize}</span>}
            <span className={styles.badge}>{item.type}</span>
          </div>
        </div>
        
        <p className={styles.desc}>{item.fileName || item.content}</p>
        
        {isGrid && (
          <div className={styles.footer}>
            <span className={styles.date}>{new Date(item.dateAdded).toLocaleDateString()}</span>
            <div className={styles.actions}>
              {isClickable && (
                <button onClick={openLink} className={styles.actionBtn} title="Open link">
                  <ExternalLinkIcon />
                </button>
              )}
              {isDeleted ? (
                <>
                  <button onClick={handleAction} className={styles.actionBtn} title="Restore"><RestoreIcon /></button>
                  <button onClick={handleDelete} className={`${styles.actionBtn} ${styles.deleteBtn}`} title="Delete permanently"><TrashIcon /></button>
                </>
              ) : (
                <button onClick={handleAction} className={`${styles.actionBtn} ${styles.deleteBtn}`} title="Move to trash"><TrashIcon /></button>
              )}
            </div>
          </div>
        )}
      </div>

      {!isGrid && (
        <div className={styles.footer}>
          <span className={styles.date}>{new Date(item.dateAdded).toLocaleDateString()}</span>
          <div className={styles.actions}>
            {isClickable && (
              <button onClick={openLink} className={styles.actionBtn} title="Open link">
                <ExternalLinkIcon />
              </button>
            )}
            {isDeleted ? (
              <>
                <button onClick={handleAction} className={styles.actionBtn} title="Restore"><RestoreIcon /></button>
                <button onClick={handleDelete} className={`${styles.actionBtn} ${styles.deleteBtn}`} title="Delete permanently"><TrashIcon /></button>
              </>
            ) : (
              <button onClick={handleAction} className={`${styles.actionBtn} ${styles.deleteBtn}`} title="Move to trash"><TrashIcon /></button>
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
const ExternalLinkIcon = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>;
const GoogleDriveIcon = () => <svg width="12" height="12" viewBox="0 0 87.3 78" fill="currentColor"><path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8H0c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/><path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44a9.06 9.06 0 0 0 -1.2 4.5h27.5z" fill="#00ac47"/><path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 11.5z" fill="#ea4335"/><path d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d"/><path d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" fill="#2684fc"/><path d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 28h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00"/></svg>;
