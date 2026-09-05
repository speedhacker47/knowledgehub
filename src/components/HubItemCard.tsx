"use client";

import React, { useState } from 'react';
import { HubItem } from '../types';
import { useAppContext } from '../context/ThemeContext';
import { useData } from '../context/DataContext';
import { generateGoogleCalendarUrl } from '../utils/googleDrive';
import { useMagicPortal } from '../context/MagicPortalContext';
import styles from './HubItemCard.module.css';

interface HubItemCardProps {
  item: HubItem;
  onTagClick?: (tag: string) => void;
}

export const HubItemCard: React.FC<HubItemCardProps> = ({ item, onTagClick }) => {
  const { layoutView } = useAppContext();
  const { moveToRecycleBin, restoreItem, deletePermanently, togglePin, updateItem } = useData();
  const { startDrag, endDrag } = useMagicPortal();
  const [isCopied, setIsCopied] = useState(false);

  const isGrid = layoutView === 'grid';
  const isDeleted = item.isDeleted;

  const getIconForType = () => {
    switch (item.type) {
      case 'Note': return <NoteIcon />;
      case 'Web Link': return <LinkIcon />;
      case 'PDF': return <PDFIcon />;
      case 'Video': return <VideoIcon />;
      case 'Audio': return <AudioIcon />;
      case 'Task': return <TaskIcon />;
      case 'Document': return <DocIcon />;
      case 'Message': default: return <MessageIcon />;
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

  const handlePin = (e: React.MouseEvent) => {
    e.stopPropagation();
    togglePin(item.id);
  };

  const handleTaskToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    updateItem(item.id, { isCompleted: e.target.checked });
  };

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    const textToCopy = item.noteBody || item.content;
    navigator.clipboard.writeText(textToCopy);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleAddToCalendar = (e: React.MouseEvent) => {
    e.stopPropagation();
    const calUrl = generateGoogleCalendarUrl(item.title, item.content, item.dueDate);
    window.open(calUrl, '_blank');
  };

  const openLink = () => {
    const targetUrl = item.driveWebViewLink || (item.content.startsWith('http') ? item.content : null);
    if (targetUrl) {
      window.open(targetUrl, '_blank');
    }
  };

  const isClickable = Boolean(item.driveWebViewLink || item.content.startsWith('http'));
  const colorClass = item.color && item.color !== 'default' ? styles[`color_${item.color}`] : '';

  return (
    <div 
      className={`${styles.card} ${isGrid ? styles.grid : styles.list} ${colorClass}`}
      draggable={!isDeleted}
      onDragStart={(e) => {
        e.dataTransfer.setData('text/plain', item.id);
        startDrag(item);
      }}
      onDragEnd={() => endDrag()}
    >
      {/* Pinned Indicator */}
      {item.isPinned && (
        <div className={styles.pinnedPin} title="Pinned to top">
          <StarFilledIcon />
        </div>
      )}

      {/* Media / Icon Preview (for non-notes or notes with thumbnail) */}
      {(item.type !== 'Note' || item.previewImage) && (
        <div 
          className={styles.preview} 
          onClick={openLink} 
          style={{ cursor: isClickable ? 'pointer' : 'default' }}
          title={isClickable ? 'Click to open' : undefined}
        >
          {item.previewImage ? (
            <img 
              src={item.previewImage} 
              alt={item.title} 
              className={item.type === 'Web Link' ? styles.faviconImg : undefined} 
            />
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
      )}

      {/* Main Content Area */}
      <div className={styles.content}>
        <div className={styles.header}>
          <h3 
            className={`${styles.title} ${item.isCompleted ? styles.completedTitle : ''}`} 
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

        {/* Note Body */}
        {item.type === 'Note' && (
          <p className={styles.bodyText}>{item.noteBody || item.content}</p>
        )}

        {/* Web Link / Doc URL */}
        {item.type === 'Web Link' && (
          <p className={styles.bodyText} style={{ color: 'var(--accent-color)' }}>{item.content}</p>
        )}

        {/* Audio Player for Voice Memos */}
        {item.type === 'Audio' && (
          <div className={styles.audioPlayerContainer}>
            {item.driveWebViewLink ? (
              <a href={item.driveWebViewLink} target="_blank" rel="noreferrer" style={{ fontSize: '0.8rem', color: 'var(--accent-color)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <AudioIcon /> Play Voice Memo on Google Drive
              </a>
            ) : (
              <p className={styles.bodyText}>{item.fileName || 'Voice Memo Audio'}</p>
            )}
          </div>
        )}

        {/* Task Details & Due Date */}
        {item.type === 'Task' && (
          <div>
            <div className={styles.taskRow}>
              <input
                type="checkbox"
                checked={Boolean(item.isCompleted)}
                onChange={handleTaskToggle}
                style={{ cursor: 'pointer' }}
              />
              <span>{item.content}</span>
            </div>
            {item.dueDate && (
              <div style={{ marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span className={styles.dueDateBadge}>
                  📅 {new Date(item.dueDate).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                </span>
                <button onClick={handleAddToCalendar} className={styles.actionBtn} title="Add to Google Calendar">
                  <CalendarIcon />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Tag Chips */}
        {item.tags && item.tags.length > 0 && (
          <div className={styles.tagsRow}>
            {item.tags.map(tag => (
              <span 
                key={tag} 
                className={styles.tagPill} 
                onClick={(e) => { e.stopPropagation(); onTagClick?.(tag); }}
                style={{ cursor: onTagClick ? 'pointer' : 'default' }}
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Footer Info & Actions */}
        <div className={styles.footer}>
          <span className={styles.date}>{new Date(item.dateAdded).toLocaleDateString()}</span>
          
          <div className={styles.actions}>
            {/* Pin Toggle */}
            {!isDeleted && (
              <button 
                onClick={handlePin} 
                className={`${styles.actionBtn} ${item.isPinned ? styles.pinBtnActive : ''}`} 
                title={item.isPinned ? 'Unpin' : 'Pin to top'}
              >
                {item.isPinned ? <StarFilledIcon /> : <StarOutlineIcon />}
              </button>
            )}

            {/* Copy Content */}
            <button onClick={handleCopy} className={styles.actionBtn} title={isCopied ? 'Copied!' : 'Copy to clipboard'}>
              {isCopied ? <CheckIcon /> : <CopyIcon />}
            </button>

            {/* Open External Link */}
            {isClickable && (
              <button onClick={openLink} className={styles.actionBtn} title="Open link">
                <ExternalLinkIcon />
              </button>
            )}

            {/* Delete / Restore */}
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
      </div>
    </div>
  );
};

// Icons
const NoteIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>;
const LinkIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>;
const VideoIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="23 7 16 12 23 17 23 7"></polygon><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect></svg>;
const PDFIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>;
const DocIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>;
const AudioIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>;
const TaskIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 11 12 14 22 4"></polyline><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>;
const MessageIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>;
const TrashIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>;
const RestoreIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="1 4 1 10 7 10"></polyline><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path></svg>;
const ExternalLinkIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>;
const CopyIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>;
const CheckIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>;
const CalendarIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>;
const StarFilledIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="#f59e0b" stroke="#f59e0b" strokeWidth="1"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>;
const StarOutlineIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>;
const GoogleDriveIcon = () => <svg width="12" height="12" viewBox="0 0 87.3 78" fill="currentColor"><path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8H0c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/><path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44a9.06 9.06 0 0 0 -1.2 4.5h27.5z" fill="#00ac47"/><path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 11.5z" fill="#ea4335"/><path d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d"/><path d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" fill="#2684fc"/><path d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 28h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00"/></svg>;
