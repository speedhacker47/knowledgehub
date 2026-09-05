"use client";

import React, { useState, useRef, ChangeEvent, DragEvent } from 'react';
import { extractTextFromImage, OcrProgress } from '../utils/ocr';
import styles from './PhotoUploadOCR.module.css';

interface PhotoUploadOCRProps {
  /**
   * Optional callback fired when OCR completes and yields searchable text.
   * Can be used to save to your database as `searchable_content`.
   */
  onTextExtracted?: (searchableContent: string, file: File) => void;
  /**
   * Optional callback when user clicks "Save / Submit" button.
   */
  onSave?: (searchableContent: string, file: File) => void;
  title?: string;
  subtitle?: string;
}

export const PhotoUploadOCR: React.FC<PhotoUploadOCRProps> = ({
  onTextExtracted,
  onSave,
  title = "Photo Upload & OCR Text Extraction",
  subtitle = "Upload any image to automatically extract readable text for searchable content.",
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isExtracting, setIsExtracting] = useState<boolean>(false);
  const [ocrProgress, setOcrProgress] = useState<OcrProgress>({
    status: '',
    progress: 0,
    percent: 0,
  });
  const [extractedText, setExtractedText] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Triggered when an image file is selected or dropped
  const processImageFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please select a valid image file (PNG, JPG, JPEG, WebP, etc.)');
      return;
    }

    setErrorMessage(null);
    setSelectedFile(file);
    setExtractedText('');

    // Generate preview
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);

    // Run OCR extraction
    setIsExtracting(true);
    setOcrProgress({ status: 'Starting OCR...', progress: 0, percent: 0 });

    try {
      const text = await extractTextFromImage(file, (progress) => {
        setOcrProgress(progress);
      });

      setExtractedText(text);

      // Trigger callback with searchable content
      if (onTextExtracted) {
        onTextExtracted(text, file);
      }
    } catch (err: any) {
      console.error('OCR Error:', err);
      setErrorMessage(err?.message || 'Failed to extract text from the image.');
    } finally {
      setIsExtracting(false);
    }
  };

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handleCopy = () => {
    if (!extractedText) return;
    navigator.clipboard.writeText(extractedText);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleSaveToDatabase = () => {
    if (!selectedFile) return;

    // Log the searchable content payload
    const payload = {
      fileName: selectedFile.name,
      fileSize: selectedFile.size,
      mimeType: selectedFile.type,
      searchable_content: extractedText,
      extractedAt: new Date().toISOString(),
    };

    console.log('[Database Payload] Saving searchable_content to database:', payload);

    if (onSave) {
      onSave(extractedText, selectedFile);
    } else {
      alert('Searchable content logged to console and ready to save to database!');
    }
  };

  const handleReset = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setSelectedFile(null);
    setPreviewUrl(null);
    setExtractedText('');
    setErrorMessage(null);
    setIsExtracting(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>{title}</h2>
        <p className={styles.subtitle}>{subtitle}</p>
      </div>

      {/* Upload / Dropzone */}
      <div
        className={`${styles.dropzone} ${isDragOver ? styles.dropzoneActive : ''}`}
        onClick={() => fileInputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className={styles.fileInput}
          onChange={handleFileInputChange}
          disabled={isExtracting}
        />
        <svg
          className={styles.uploadIcon}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <polyline points="21 15 16 10 5 21" />
        </svg>
        <span className={styles.dropzonePrompt}>
          Click or Drag & Drop a photo here
        </span>
        <span className={styles.dropzoneHint}>
          Supports PNG, JPG, JPEG, WebP, screenshots, documents, and receipts
        </span>
      </div>

      {/* Image Preview & Meta */}
      {previewUrl && (
        <div className={styles.previewSection}>
          <div className={styles.imagePreviewWrapper}>
            <img src={previewUrl} alt="Selected preview" className={styles.previewImage} />
          </div>
          {selectedFile && (
            <div className={styles.fileMeta}>
              <span className={styles.fileName}>📁 {selectedFile.name}</span>
              <span className={styles.fileSize}>
                {(selectedFile.size / 1024).toFixed(1)} KB
              </span>
            </div>
          )}
        </div>
      )}

      {/* Loading State with Progress Bar */}
      {isExtracting && (
        <div className={styles.loadingContainer} aria-live="polite">
          <div className={styles.loadingHeader}>
            <div className={styles.spinner} />
            <div>
              <div className={styles.loadingTitle}>Extracting text...</div>
              <div className={styles.statusMessage}>
                {ocrProgress.status ? ocrProgress.status.replace(/_/g, ' ') : 'Processing with Tesseract OCR...'}
              </div>
            </div>
          </div>

          <div className={styles.progressBarTrack}>
            <div
              className={styles.progressBarFill}
              style={{ width: `${Math.max(5, ocrProgress.percent)}%` }}
            />
          </div>

          <div className={styles.progressInfo}>
            <span>Tesseract.js Engine</span>
            <span>{ocrProgress.percent}%</span>
          </div>
        </div>
      )}

      {/* Error Message */}
      {errorMessage && (
        <div className={styles.errorBox}>
          <span>⚠️ {errorMessage}</span>
          <button onClick={() => setErrorMessage(null)} className={styles.secondaryBtn}>
            Dismiss
          </button>
        </div>
      )}

      {/* OCR Result Output */}
      {extractedText && !isExtracting && (
        <div className={styles.resultSection}>
          <div className={styles.resultHeader}>
            <span className={styles.resultTitle}>
              📄 Extracted searchable_content
            </span>
            <span className={styles.resultBadge}>
              {extractedText.length} characters
            </span>
          </div>

          <textarea
            className={styles.extractedTextArea}
            value={extractedText}
            onChange={(e) => setExtractedText(e.target.value)}
            placeholder="Extracted text will appear here..."
          />

          <div className={styles.actionsRow}>
            <button
              type="button"
              className={styles.primaryBtn}
              onClick={handleSaveToDatabase}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                <polyline points="17 21 17 13 7 13 7 21" />
                <polyline points="7 3 7 8 15 8" />
              </svg>
              Save as searchable_content
            </button>

            <button
              type="button"
              className={styles.secondaryBtn}
              onClick={handleCopy}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
              {isCopied ? 'Copied!' : 'Copy Text'}
            </button>

            <button
              type="button"
              className={styles.secondaryBtn}
              onClick={handleReset}
            >
              Upload Another Photo
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
