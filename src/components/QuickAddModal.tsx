"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { Category } from '../types';
import { formatBytes, getFaviconUrl } from '../utils/googleDrive';
import styles from './QuickAddModal.module.css';

interface QuickAddModalProps {
  onClose: () => void;
  defaultTab?: 'note' | 'link' | 'file' | 'audio' | 'task';
}

const COLOR_OPTIONS = [
  { name: 'Default', value: 'default', bg: 'var(--bg-secondary)', border: 'var(--border-color)' },
  { name: 'Amber', value: 'amber', bg: '#fef3c7', border: '#f59e0b' },
  { name: 'Emerald', value: 'emerald', bg: '#d1fae5', border: '#10b981' },
  { name: 'Blue', value: 'blue', bg: '#dbeafe', border: '#3b82f6' },
  { name: 'Purple', value: 'violet', bg: '#ede9fe', border: '#8b5cf6' },
  { name: 'Rose', value: 'rose', bg: '#ffe4e6', border: '#f43f5e' },
];

export const QuickAddModal: React.FC<QuickAddModalProps> = ({ onClose, defaultTab = 'note' }) => {
  const { addItem, uploadFileItem, uploadAudioMemo, isGoogleConnected, connectGoogle } = useData();
  const [activeTab, setActiveTab] = useState<'note' | 'link' | 'file' | 'audio' | 'task'>(defaultTab);

  // Common metadata
  const [tagInput, setTagInput] = useState('');
  const [isPinned, setIsPinned] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 1. Note State
  const [noteTitle, setNoteTitle] = useState('');
  const [noteBody, setNoteBody] = useState('');
  const [noteColor, setNoteColor] = useState('default');

  // 2. Link State
  const [linkUrl, setLinkUrl] = useState('');
  const [linkTitle, setLinkTitle] = useState('');

  // 3. File Upload State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileTitle, setFileTitle] = useState('');
  const [fileCategory, setFileCategory] = useState<Category>('Document');
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 4. Voice Memo State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioTitle, setAudioTitle] = useState('');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // 5. Task State
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDetails, setTaskDetails] = useState('');
  const [taskDueDate, setTaskDueDate] = useState('');

  // Cleanup audio preview URL & timer
  useEffect(() => {
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [audioUrl]);

  // Parse tags string into array
  const getTagsArray = (): string[] => {
    if (!tagInput.trim()) return [];
    return tagInput
      .split(/[\s,]+/)
      .filter(Boolean)
      .map(t => (t.startsWith('#') ? t : `#${t}`));
  };

  // Auto-detect title on Link input change
  const handleLinkUrlChange = (val: string) => {
    setLinkUrl(val);
    if (!linkTitle && val.trim().startsWith('http')) {
      try {
        const domain = new URL(val.trim()).hostname.replace('www.', '');
        setLinkTitle(domain.charAt(0).toUpperCase() + domain.slice(1));
      } catch {
        // ignore
      }
    }
  };

  // Save Note
  const handleSaveNote = () => {
    if (!noteTitle.trim() && !noteBody.trim()) return;
    const title = noteTitle.trim() || (noteBody.slice(0, 35) + (noteBody.length > 35 ? '...' : ''));
    addItem({
      type: 'Note',
      title,
      content: noteBody.slice(0, 100),
      noteBody: noteBody,
      color: noteColor,
      isPinned,
      tags: getTagsArray(),
    });
    onClose();
  };

  // Save Link
  const handleSaveLink = () => {
    if (!linkUrl.trim()) return;
    let url = linkUrl.trim();
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }
    const title = linkTitle.trim() || new URL(url).hostname.replace('www.', '');
    const preview = getFaviconUrl(url);

    addItem({
      type: 'Web Link',
      title,
      content: url,
      previewImage: preview,
      isPinned,
      tags: getTagsArray(),
    });
    onClose();
  };

  // Save File (Upload to Drive)
  const handleFileSelect = (file: File | null) => {
    if (!file) return;
    setSelectedFile(file);
    setFileTitle(file.name);
    setErrorMessage(null);

    if (file.type.startsWith('video/')) setFileCategory('Video');
    else if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) setFileCategory('PDF');
    else if (file.type.startsWith('audio/')) setFileCategory('Audio');
    else setFileCategory('Document');
  };

  const handleSaveFile = async () => {
    if (!selectedFile) return;
    setIsLoading(true);
    setErrorMessage(null);
    try {
      await uploadFileItem(selectedFile, fileCategory, fileTitle, getTagsArray());
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'File upload failed');
    } finally {
      setIsLoading(false);
    }
  };

  // Voice Recorder Controls
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start(100);
      setIsRecording(true);
      setRecordingSeconds(0);
      timerIntervalRef.current = setInterval(() => {
        setRecordingSeconds(prev => prev + 1);
      }, 1000);
    } catch (err) {
      setErrorMessage('Microphone access was denied or not supported in this browser.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }
  };

  const handleSaveAudio = async () => {
    if (!audioBlob) return;
    setIsLoading(true);
    setErrorMessage(null);
    try {
      await uploadAudioMemo(
        audioBlob,
        audioTitle.trim() || `Voice Memo (${new Date().toLocaleDateString()})`,
        recordingSeconds,
        getTagsArray()
      );
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Audio upload failed');
    } finally {
      setIsLoading(false);
    }
  };

  // Save Task
  const handleSaveTask = () => {
    if (!taskTitle.trim()) return;
    addItem({
      type: 'Task',
      title: taskTitle.trim(),
      content: taskDetails.trim() || 'No additional details',
      dueDate: taskDueDate || undefined,
      isCompleted: false,
      isPinned,
      tags: getTagsArray(),
    });
    onClose();
  };

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>Create New Item</h2>
          <button className={styles.closeBtn} onClick={onClose}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="12" x2="18" y2="12"></line></svg>
          </button>
        </div>

        {/* Tabs */}
        <div className={styles.tabs}>
          <button
            type="button"
            className={`${styles.tab} ${activeTab === 'note' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('note')}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
            Note
          </button>
          <button
            type="button"
            className={`${styles.tab} ${activeTab === 'link' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('link')}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
            Link
          </button>
          <button
            type="button"
            className={`${styles.tab} ${activeTab === 'file' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('file')}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
            Document / Drive
          </button>
          <button
            type="button"
            className={`${styles.tab} ${activeTab === 'audio' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('audio')}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>
            Voice Memo
          </button>
          <button
            type="button"
            className={`${styles.tab} ${activeTab === 'task' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('task')}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 11 12 14 22 4"></polyline><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>
            Task
          </button>
        </div>

        {/* TAB 1: NOTE */}
        {activeTab === 'note' && (
          <div>
            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>Title</label>
              <input
                type="text"
                className={styles.inputField}
                placeholder="Note title..."
                value={noteTitle}
                onChange={e => setNoteTitle(e.target.value)}
                autoFocus
              />
            </div>
            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>Note Content</label>
              <textarea
                className={styles.textarea}
                placeholder="Write your note, idea, meeting summary, or thoughts here..."
                value={noteBody}
                onChange={e => setNoteBody(e.target.value)}
              />
            </div>
            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>Color Theme</label>
              <div className={styles.colorPickerRow}>
                {COLOR_OPTIONS.map(c => (
                  <button
                    key={c.value}
                    type="button"
                    className={`${styles.colorDot} ${noteColor === c.value ? styles.activeColor : ''}`}
                    style={{ backgroundColor: c.border }}
                    onClick={() => setNoteColor(c.value)}
                    title={c.name}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: LINK */}
        {activeTab === 'link' && (
          <div>
            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>URL / Web Address</label>
              <input
                type="url"
                className={styles.inputField}
                placeholder="https://example.com/article"
                value={linkUrl}
                onChange={e => handleLinkUrlChange(e.target.value)}
                autoFocus
              />
            </div>
            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>Title (Optional)</label>
              <input
                type="text"
                className={styles.inputField}
                placeholder="Bookmark title"
                value={linkTitle}
                onChange={e => setLinkTitle(e.target.value)}
              />
            </div>
          </div>
        )}

        {/* TAB 3: FILE UPLOAD */}
        {activeTab === 'file' && (
          <div>
            {!isGoogleConnected && (
              <div className={styles.connectDriveNotice}>
                <p>⚡ Connect your Google Drive to upload files directly into your cloud storage.</p>
                <button type="button" className={styles.googleBtn} onClick={() => connectGoogle()}>
                  Connect Google Drive
                </button>
              </div>
            )}

            <input
              type="file"
              ref={fileInputRef}
              className={styles.fileInput}
              onChange={e => handleFileSelect(e.target.files ? e.target.files[0] : null)}
            />

            {!selectedFile ? (
              <div
                className={`${styles.dropzone} ${isDragOver ? styles.activeDrag : ''}`}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={e => { e.preventDefault(); setIsDragOver(true); }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={e => {
                  e.preventDefault();
                  setIsDragOver(false);
                  if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                    handleFileSelect(e.dataTransfer.files[0]);
                  }
                }}
              >
                <svg className={styles.dropzoneIcon} width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                <div className={styles.dropzoneText}>Click to browse or drop any document</div>
                <div className={styles.dropzoneSubtext}>PDF, Word, Excel, Images, Video, Audio</div>
              </div>
            ) : (
              <div>
                <div className={styles.selectedFileCard}>
                  <div className={styles.fileInfo}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--accent-color)' }}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
                    <div>
                      <div className={styles.fileName}>{selectedFile.name}</div>
                      <div className={styles.fileMeta}>{formatBytes(selectedFile.size)}</div>
                    </div>
                  </div>
                  <button type="button" onClick={() => setSelectedFile(null)} style={{ cursor: 'pointer', color: 'var(--text-secondary)' }}>✕</button>
                </div>

                <div className={styles.inputGroup}>
                  <label className={styles.inputLabel}>Title</label>
                  <input
                    type="text"
                    className={styles.inputField}
                    value={fileTitle}
                    onChange={e => setFileTitle(e.target.value)}
                  />
                </div>

                <div className={styles.inputGroup}>
                  <label className={styles.inputLabel}>Category</label>
                  <select
                    className={styles.inputField}
                    value={fileCategory}
                    onChange={e => setFileCategory(e.target.value as Category)}
                  >
                    <option value="Document">Document</option>
                    <option value="PDF">PDF</option>
                    <option value="Video">Video</option>
                    <option value="Audio">Audio</option>
                    <option value="Web Link">Other File</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: VOICE MEMO */}
        {activeTab === 'audio' && (
          <div>
            <div className={styles.recorderBox}>
              {!audioBlob ? (
                <>
                  <button
                    type="button"
                    className={`${styles.recordBtn} ${isRecording ? styles.recording : ''}`}
                    onClick={isRecording ? stopRecording : startRecording}
                    title={isRecording ? 'Stop Recording' : 'Start Recording'}
                  >
                    {isRecording ? (
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="2"></rect></svg>
                    ) : (
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="8"></circle></svg>
                    )}
                  </button>
                  <div className={styles.timerText}>{formatTimer(recordingSeconds)}</div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    {isRecording ? 'Recording in progress... Click to stop.' : 'Click the microphone to start recording your voice memo.'}
                  </p>
                </>
              ) : (
                <div className={styles.audioPlayerWrapper}>
                  <audio src={audioUrl || ''} controls className={styles.audioElement} />
                  <button
                    type="button"
                    style={{ fontSize: '0.8rem', color: 'var(--accent-rose)', cursor: 'pointer', marginTop: '4px' }}
                    onClick={() => { setAudioBlob(null); setAudioUrl(null); setRecordingSeconds(0); }}
                  >
                    Record Again
                  </button>
                </div>
              )}
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>Memo Title</label>
              <input
                type="text"
                className={styles.inputField}
                placeholder="Voice memo title"
                value={audioTitle}
                onChange={e => setAudioTitle(e.target.value)}
              />
            </div>
          </div>
        )}

        {/* TAB 5: TASK */}
        {activeTab === 'task' && (
          <div>
            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>Task Title</label>
              <input
                type="text"
                className={styles.inputField}
                placeholder="What needs to be done?"
                value={taskTitle}
                onChange={e => setTaskTitle(e.target.value)}
                autoFocus
              />
            </div>
            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>Details / Notes</label>
              <textarea
                className={styles.textarea}
                style={{ minHeight: '80px' }}
                placeholder="Optional details or subtasks..."
                value={taskDetails}
                onChange={e => setTaskDetails(e.target.value)}
              />
            </div>
            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>Due Date & Time</label>
              <input
                type="datetime-local"
                className={styles.inputField}
                value={taskDueDate}
                onChange={e => setTaskDueDate(e.target.value)}
              />
            </div>
          </div>
        )}

        {/* Common Section: Tags & Pin */}
        <div style={{ marginTop: '0.5rem' }}>
          <div className={styles.inputGroup}>
            <label className={styles.inputLabel}>Tags (space or comma separated)</label>
            <input
              type="text"
              className={styles.inputField}
              placeholder="e.g. #work #ideas #finance"
              value={tagInput}
              onChange={e => setTagInput(e.target.value)}
            />
          </div>

          <label className={styles.checkboxRow}>
            <input
              type="checkbox"
              checked={isPinned}
              onChange={e => setIsPinned(e.target.checked)}
            />
            <span>⭐ Pin to top of dashboard</span>
          </label>
        </div>

        {errorMessage && (
          <p style={{ color: 'var(--accent-rose)', fontSize: '0.85rem', marginTop: '8px' }}>{errorMessage}</p>
        )}

        {/* Footer Actions */}
        <div className={styles.footer}>
          <button className={`${styles.btn} ${styles.cancelBtn}`} onClick={onClose} disabled={isLoading}>
            Cancel
          </button>

          {activeTab === 'note' && (
            <button className={`${styles.btn} ${styles.saveBtn}`} onClick={handleSaveNote} disabled={!noteTitle.trim() && !noteBody.trim()}>
              Save Note
            </button>
          )}

          {activeTab === 'link' && (
            <button className={`${styles.btn} ${styles.saveBtn}`} onClick={handleSaveLink} disabled={!linkUrl.trim()}>
              Save Bookmark
            </button>
          )}

          {activeTab === 'file' && (
            <button className={`${styles.btn} ${styles.saveBtn}`} onClick={handleSaveFile} disabled={!selectedFile || isLoading}>
              {isLoading ? <><span className={styles.spinner} /> Uploading to Drive...</> : 'Upload Document'}
            </button>
          )}

          {activeTab === 'audio' && (
            <button className={`${styles.btn} ${styles.saveBtn}`} onClick={handleSaveAudio} disabled={!audioBlob || isLoading}>
              {isLoading ? <><span className={styles.spinner} /> Saving...</> : 'Save Voice Memo'}
            </button>
          )}

          {activeTab === 'task' && (
            <button className={`${styles.btn} ${styles.saveBtn}`} onClick={handleSaveTask} disabled={!taskTitle.trim()}>
              Create Task
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
