"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useData } from '../context/DataContext';
import { Category } from '../types';
import { formatBytes } from '../utils/googleDrive';
import styles from './QuickAddModal.module.css';

interface QuickAddModalProps {
  onClose: () => void;
}

export const QuickAddModal: React.FC<QuickAddModalProps> = ({ onClose }) => {
  const { addItem, uploadFileItem, isGoogleConnected, connectGoogle } = useData();
  const [activeTab, setActiveTab] = useState<'text' | 'file'>('text');

  // Text/Link Mode State
  const [input, setInput] = useState('');
  const [detectedCategory, setDetectedCategory] = useState<Category | null>(null);

  // File Upload Mode State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileTitle, setFileTitle] = useState('');
  const [fileCategory, setFileCategory] = useState<Category>('Web Link');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const text = input.trim().toLowerCase();
    if (!text) { setDetectedCategory(null); return; }
    if (text.includes('youtube.com') || text.includes('youtu.be')) setDetectedCategory('Video');
    else if (text.includes('.pdf') || text.includes('drive.google.com')) setDetectedCategory('PDF');
    else if (text.startsWith('http')) setDetectedCategory('Web Link');
    else setDetectedCategory('Message');
  }, [input]);

  const handleSaveText = () => {
    if (!input.trim() || !detectedCategory) return;
    let title = 'Saved Item';
    if (detectedCategory === 'Web Link' || detectedCategory === 'Video') {
      try { 
        title = new URL(input).hostname.replace('www.', ''); 
      } catch (e) { 
        title = 'Web Link'; 
      }
    } else if (detectedCategory === 'Message' || detectedCategory === 'Task') {
      title = input.slice(0, 35) + (input.length > 35 ? '...' : '');
    }
    addItem({ type: detectedCategory, title, content: input });
    onClose();
  };

  const handleFileChange = (file: File | null) => {
    if (!file) return;
    setSelectedFile(file);
    setFileTitle(file.name);
    setUploadError(null);

    // Auto classify category
    if (file.type.startsWith('video/')) setFileCategory('Video');
    else if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) setFileCategory('PDF');
    else setFileCategory('Web Link');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleSaveFile = async () => {
    if (!selectedFile) return;
    setIsUploading(true);
    setUploadError(null);

    try {
      await uploadFileItem(selectedFile, fileCategory, fileTitle);
      onClose();
    } catch (err: any) {
      setUploadError(err.message || 'Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        {/* Mobile Bottom Sheet Grab Handle */}
        <div className={styles.grabHandle} />

        <div className={styles.header}>
          <h2>Add to Knowledge Hub</h2>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close modal">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="12" x2="18" y2="12"></line></svg>
          </button>
        </div>

        {/* Mode Navigation Tabs */}
        <div className={styles.tabs}>
          <button
            type="button"
            className={`${styles.tab} ${activeTab === 'text' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('text')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
            Link / Text
          </button>
          <button
            type="button"
            className={`${styles.tab} ${activeTab === 'file' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('file')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
            Upload File to Drive
          </button>
        </div>

        {/* TAB 1: Link & Text Input */}
        {activeTab === 'text' && (
          <>
            <textarea
              className={styles.textarea}
              placeholder="Paste a URL, YouTube video, WhatsApp message, or type a task..."
              value={input}
              onChange={e => setInput(e.target.value)}
              autoFocus
            />
            {detectedCategory && (
              <div className={styles.preview}>
                <span className={styles.badge}>{detectedCategory}</span>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Auto-classified content</span>
              </div>
            )}
            <div className={styles.footer}>
              <button className={`${styles.btn} ${styles.cancelBtn}`} onClick={onClose}>Cancel</button>
              <button
                className={`${styles.btn} ${styles.saveBtn}`}
                onClick={handleSaveText}
                disabled={!input.trim()}
              >
                Save to Hub
              </button>
            </div>
          </>
        )}

        {/* TAB 2: Google Drive File Upload */}
        {activeTab === 'file' && (
          <>
            {!isGoogleConnected ? (
              <div className={styles.connectDriveBanner}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: 'var(--accent-blue)', marginBottom: '8px' }}><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '6px' }}>Connect Google Drive</h3>
                <p>Connect your Google account to upload PDFs, videos, and documents directly to your Google Drive.</p>
                <button
                  type="button"
                  className={styles.googleBtn}
                  onClick={() => connectGoogle()}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/></svg>
                  Connect with Google
                </button>
              </div>
            ) : (
              <>
                <input
                  type="file"
                  ref={fileInputRef}
                  className={styles.fileInput}
                  onChange={e => handleFileChange(e.target.files ? e.target.files[0] : null)}
                />

                {!selectedFile ? (
                  <div
                    className={`${styles.dropzone} ${isDragOver ? styles.activeDrag : ''}`}
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={e => { e.preventDefault(); setIsDragOver(true); }}
                    onDragLeave={() => setIsDragOver(false)}
                    onDrop={handleDrop}
                  >
                    <svg className={styles.dropzoneIcon} width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                    <div className={styles.dropzoneText}>Click to browse or drag & drop a file</div>
                    <div className={styles.dropzoneSubtext}>PDFs, MP4 videos, images, or documents</div>
                  </div>
                ) : (
                  <div>
                    <div className={styles.selectedFileCard}>
                      <div className={styles.fileInfo}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--accent-color)' }}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
                        <div className={styles.fileDetails}>
                          <span className={styles.fileName}>{selectedFile.name}</span>
                          <span className={styles.fileMeta}>{formatBytes(selectedFile.size)} • {selectedFile.type || 'File'}</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedFile(null)}
                        style={{ color: 'var(--text-secondary)', cursor: 'pointer', padding: '4px' }}
                        title="Remove file"
                      >
                        ✕
                      </button>
                    </div>

                    <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Title in Hub</label>
                    <input
                      type="text"
                      className={styles.inputField}
                      value={fileTitle}
                      onChange={e => setFileTitle(e.target.value)}
                      placeholder="Title for this file"
                    />

                    <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Category</label>
                    <select
                      className={styles.inputField}
                      value={fileCategory}
                      onChange={e => setFileCategory(e.target.value as Category)}
                      style={{ cursor: 'pointer' }}
                    >
                      <option value="PDF">PDF</option>
                      <option value="Video">Video</option>
                      <option value="Web Link">Document / File</option>
                      <option value="Task">Task Attachment</option>
                    </select>
                  </div>
                )}

                {uploadError && (
                  <p style={{ color: 'var(--accent-rose)', fontSize: '0.85rem', marginBottom: '12px' }}>{uploadError}</p>
                )}

                <div className={styles.footer}>
                  <button className={`${styles.btn} ${styles.cancelBtn}`} onClick={onClose} disabled={isUploading}>Cancel</button>
                  <button
                    className={`${styles.btn} ${styles.saveBtn}`}
                    onClick={handleSaveFile}
                    disabled={!selectedFile || isUploading}
                  >
                    {isUploading ? (
                      <>
                        <span className={styles.spinner} />
                        Uploading to Drive...
                      </>
                    ) : (
                      'Upload to Google Drive'
                    )}
                  </button>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};
