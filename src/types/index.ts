export type Category = 'All' | 'Video' | 'PDF' | 'Message' | 'Web Link' | 'Task';

export interface HubItem {
  id: string;
  type: Category;
  title: string;
  content: string; // URL, WhatsApp text, or task details / Drive web link
  previewImage?: string; // Optional thumbnail
  dateAdded: string;
  isDeleted: boolean;
  driveFileId?: string; // Google Drive file ID if stored in Drive
  driveWebViewLink?: string; // Direct link to open/preview in Google Drive
  driveWebContentLink?: string; // Direct download link
  fileName?: string; // Original uploaded file name
  fileSize?: string; // Formatted size e.g. "2.4 MB"
  mimeType?: string; // File mime type e.g. "application/pdf"
}

export interface GoogleUserProfile {
  id: string;
  name: string;
  email: string;
  picture: string;
}

export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'error' | 'disconnected';

