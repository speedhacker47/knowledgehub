"use client";

import React, { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { Category } from '../types';
import styles from './QuickAddModal.module.css';

interface QuickAddModalProps {
  onClose: () => void;
}

export const QuickAddModal: React.FC<QuickAddModalProps> = ({ onClose }) => {
  const { addItem } = useData();
  const [input, setInput] = useState('');
  const [detectedCategory, setDetectedCategory] = useState<Category | null>(null);

  useEffect(() => {
    const text = input.trim().toLowerCase();
    if (!text) { setDetectedCategory(null); return; }
    if (text.includes('youtube.com') || text.includes('youtu.be')) setDetectedCategory('Video');
    else if (text.includes('.pdf') || text.includes('drive.google.com')) setDetectedCategory('PDF');
    else if (text.startsWith('http')) setDetectedCategory('Web Link');
    else setDetectedCategory('Message');
  }, [input]);

  const handleSave = () => {
    if (!input.trim() || !detectedCategory) return;
    let title = 'Saved Item';
    if (detectedCategory === 'Web Link' || detectedCategory === 'Video') {
      try { title = new URL(input).hostname; } catch (e) { title = 'Web Link'; }
    } else if (detectedCategory === 'Message' || detectedCategory === 'Task') {
      title = input.slice(0, 30) + (input.length > 30 ? '...' : '');
    }
    addItem({ type: detectedCategory, title, content: input });
    onClose();
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>Quick Add</h2>
          <button className={styles.closeBtn} onClick={onClose}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>
        <textarea 
          className={styles.textarea} placeholder="Paste a URL, WhatsApp message, or type a task..."
          value={input} onChange={e => setInput(e.target.value)} autoFocus
        />
        {detectedCategory && (
          <div className={styles.preview}>
            <span className={styles.badge}>{detectedCategory}</span>
            <span style={{color: 'var(--text-secondary)'}}>Auto-classified</span>
          </div>
        )}
        <div className={styles.footer}>
          <button className={`${styles.btn} ${styles.cancelBtn}`} onClick={onClose}>Cancel</button>
          <button className={`${styles.btn} ${styles.saveBtn}`} onClick={handleSave} disabled={!input.trim()}>Save to Hub</button>
        </div>
      </div>
    </div>
  );
};
