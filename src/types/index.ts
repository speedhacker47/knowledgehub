export type Category = 
  | 'All' 
  | 'Note' 
  | 'Web Link' 
  | 'Document' 
  | 'PDF' 
  | 'Video' 
  | 'Audio' 
  | 'Task' 
  | 'Message';

export interface HubItem {
  id: string;
  type: Category;
  title: string;
  content: string; // URL, short summary, or preview text
  noteBody?: string; // Rich detailed text for Notes
  previewImage?: string; // Optional thumbnail / favicon
  dateAdded: string;
  isDeleted: boolean;
  
  // Customization & Organization
  isPinned?: boolean;
  tags?: string[];
  color?: string; // e.g., 'default' | 'amber' | 'emerald' | 'blue' | 'violet' | 'rose'
  
  // Tasks
  dueDate?: string;
  isCompleted?: boolean;

  // Audio / Voice Memos
  audioDuration?: number; // duration in seconds
  
  // Google Drive Metadata
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

export interface DriveStorageQuota {
  limitBytes: number;
  usageBytes: number;
  usageInDriveBytes: number;
  usagePercent: number;
  formattedLimit: string;
  formattedUsage: string;
}

export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'error' | 'disconnected';

export type InsightType = 
  | 'briefing' 
  | 'duplicate_merge' 
  | 'hidden_deadline' 
  | 'contradiction' 
  | 'priority_link';

export interface AIInsight {
  id: string;
  type: InsightType;
  title: string;
  description: string;
  confidence?: number;
  relatedItemIds: string[];
  actionType: 'create_task' | 'merge_items' | 'dismiss' | 'open_link' | 'view_item';
  actionPayload?: {
    taskTitle?: string;
    dueDate?: string;
    mergedNoteBody?: string;
    targetItemId?: string;
    sourceItemId?: string;
    linkUrl?: string;
  };
  createdAt: string;
  isDismissed?: boolean;
  isApplied?: boolean;
}
