"use client";

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { HubItem, GoogleUserProfile, SyncStatus, Category, DriveStorageQuota } from '../types';
import {
  getStoredAccessToken,
  getStoredUserProfile,
  clearGoogleSession,
  requestGoogleAuth,
  fetchUserProfile,
  saveDatabaseToDrive,
  loadDatabaseFromDrive,
  uploadFileToDrive,
  fetchDriveStorageQuota,
  formatBytes,
  loadGoogleScript,
} from '../utils/googleDrive';

interface DataContextType {
  items: HubItem[];
  addItem: (item: Omit<HubItem, 'id' | 'dateAdded' | 'isDeleted'>) => void;
  updateItem: (id: string, updates: Partial<HubItem>) => void;
  togglePin: (id: string) => void;
  moveToRecycleBin: (id: string) => void;
  restoreItem: (id: string) => void;
  deletePermanently: (id: string) => void;
  exportData: () => void;
  
  // Google Drive & Cloud Sync
  isGoogleConnected: boolean;
  userProfile: GoogleUserProfile | null;
  syncStatus: SyncStatus;
  lastSynced: string | null;
  syncError: string | null;
  storageQuota: DriveStorageQuota | null;
  connectGoogle: () => Promise<void>;
  disconnectGoogle: () => void;
  syncWithDrive: () => Promise<void>;
  refreshStorageQuota: () => Promise<void>;
  uploadFileItem: (file: File, category?: Category, customTitle?: string, tags?: string[]) => Promise<HubItem>;
  uploadAudioMemo: (blob: Blob, title: string, duration?: number, tags?: string[]) => Promise<HubItem>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<HubItem[]>([]);
  const [mounted, setMounted] = useState(false);
  
  // Google Drive states
  const [isGoogleConnected, setIsGoogleConnected] = useState(false);
  const [userProfile, setUserProfile] = useState<GoogleUserProfile | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const [lastSynced, setLastSynced] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [storageQuota, setStorageQuota] = useState<DriveStorageQuota | null>(null);

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialSyncDoneRef = useRef(false);

  // Load Storage Quota
  const refreshStorageQuota = useCallback(async () => {
    const token = getStoredAccessToken();
    if (!token) return;
    try {
      const quota = await fetchDriveStorageQuota(token);
      if (quota) setStorageQuota(quota);
    } catch {
      // ignore
    }
  }, []);

  // 1. Initial Local Data Load & Google Session Check
  useEffect(() => {
    // Load local items (empty array by default, no dummy data)
    const saved = localStorage.getItem('hub_data');
    let loadedItems: HubItem[] = [];
    if (saved) {
      try {
        loadedItems = JSON.parse(saved);
      } catch {
        loadedItems = [];
      }
    }
    setItems(loadedItems);

    const savedLastSynced = localStorage.getItem('gdrive_last_synced');
    if (savedLastSynced) setLastSynced(savedLastSynced);

    // Preload GIS script
    loadGoogleScript().catch(() => {});

    // Check stored Google Token
    const token = getStoredAccessToken();
    const profile = getStoredUserProfile();
    if (token) {
      setIsGoogleConnected(true);
      if (profile) {
        setUserProfile(profile);
      } else {
        fetchUserProfile(token).then(p => {
          if (p) setUserProfile(p);
        });
      }
      
      // Attempt background cloud sync and load quota
      syncCloudData(token, loadedItems);
      fetchDriveStorageQuota(token).then(q => {
        if (q) setStorageQuota(q);
      });
    }

    setMounted(true);
  }, []);

  // 2. Persist to LocalStorage and Auto-Sync to Google Drive on items change
  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem('hub_data', JSON.stringify(items));

    // If Google Drive is connected and initial load is done, debounce auto-sync
    const token = getStoredAccessToken();
    if (token && isInitialSyncDoneRef.current) {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      
      debounceTimerRef.current = setTimeout(() => {
        saveToDriveSilent(token, items);
      }, 1500);
    }
  }, [items, mounted]);

  // Cloud Sync Logic (Bidirectional merge)
  const syncCloudData = async (token: string, localItems: HubItem[]) => {
    try {
      setSyncStatus('syncing');
      setSyncError(null);

      const driveItems = await loadDatabaseFromDrive(token);

      if (driveItems && driveItems.length > 0) {
        const itemMap = new Map<string, HubItem>();
        
        // Add Drive items
        driveItems.forEach(item => itemMap.set(item.id, item));
        
        // Add local items if newer or missing
        localItems.forEach(item => {
          if (!itemMap.has(item.id)) {
            itemMap.set(item.id, item);
          } else {
            const existing = itemMap.get(item.id)!;
            if (new Date(item.dateAdded) > new Date(existing.dateAdded)) {
              itemMap.set(item.id, item);
            }
          }
        });

        const mergedItems = Array.from(itemMap.values()).sort(
          (a, b) => new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime()
        );

        setItems(mergedItems);
        localStorage.setItem('hub_data', JSON.stringify(mergedItems));
        await saveDatabaseToDrive(token, mergedItems);
      } else if (localItems.length > 0) {
        await saveDatabaseToDrive(token, localItems);
      }

      const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setLastSynced(now);
      localStorage.setItem('gdrive_last_synced', now);
      setSyncStatus('synced');
      isInitialSyncDoneRef.current = true;

      // Update storage quota
      const quota = await fetchDriveStorageQuota(token);
      if (quota) setStorageQuota(quota);
    } catch (err: any) {
      console.error('Cloud sync error:', err);
      setSyncStatus('error');
      setSyncError(err.message || 'Sync failed');
    }
  };

  const saveToDriveSilent = async (token: string, currentItems: HubItem[]) => {
    try {
      setSyncStatus('syncing');
      await saveDatabaseToDrive(token, currentItems);
      const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setLastSynced(now);
      localStorage.setItem('gdrive_last_synced', now);
      setSyncStatus('synced');
    } catch (err: any) {
      console.error('Silent save error:', err);
      setSyncStatus('error');
      setSyncError(err.message || 'Failed to save to Drive');
    }
  };

  // Connect Google Account
  const connectGoogle = useCallback(async () => {
    setSyncStatus('syncing');
    setSyncError(null);
    try {
      await requestGoogleAuth(
        async (token, profile) => {
          setIsGoogleConnected(true);
          setUserProfile(profile);
          await syncCloudData(token, items);
        },
        (err) => {
          setSyncStatus('error');
          setSyncError('Google authentication was cancelled or failed.');
        }
      );
    } catch (err: any) {
      setSyncStatus('error');
      setSyncError(err.message || 'Google Auth Error');
    }
  }, [items]);

  // Disconnect Google Account
  const disconnectGoogle = useCallback(() => {
    clearGoogleSession();
    setIsGoogleConnected(false);
    setUserProfile(null);
    setSyncStatus('disconnected');
    setLastSynced(null);
    setStorageQuota(null);
  }, []);

  // Manual Trigger Sync
  const syncWithDrive = useCallback(async () => {
    const token = getStoredAccessToken();
    if (!token) {
      await connectGoogle();
      return;
    }
    await syncCloudData(token, items);
  }, [connectGoogle, items]);

  // Upload a file directly to Google Drive
  const uploadFileItem = async (
    file: File,
    category?: Category,
    customTitle?: string,
    tags?: string[]
  ): Promise<HubItem> => {
    const token = getStoredAccessToken();
    if (!token) {
      throw new Error('Please connect your Google Drive first to upload files.');
    }

    setSyncStatus('syncing');
    try {
      const driveFile = await uploadFileToDrive(token, file);

      let itemType: Category = category || 'Document';
      if (!category || category === 'All') {
        if (file.type.startsWith('video/')) itemType = 'Video';
        else if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) itemType = 'PDF';
        else if (file.type.startsWith('audio/')) itemType = 'Audio';
        else itemType = 'Document';
      }

      const newItem: HubItem = {
        id: crypto.randomUUID(),
        type: itemType,
        title: customTitle?.trim() || file.name,
        content: driveFile.webViewLink || `https://drive.google.com/file/d/${driveFile.id}/view`,
        previewImage: driveFile.thumbnailLink,
        dateAdded: new Date().toISOString(),
        isDeleted: false,
        tags: tags || [],
        driveFileId: driveFile.id,
        driveWebViewLink: driveFile.webViewLink,
        driveWebContentLink: driveFile.webContentLink,
        fileName: file.name,
        fileSize: formatBytes(driveFile.size),
        mimeType: driveFile.mimeType,
      };

      setItems(prev => [newItem, ...prev]);
      setSyncStatus('synced');
      refreshStorageQuota();
      return newItem;
    } catch (err: any) {
      setSyncStatus('error');
      setSyncError(err.message || 'File upload failed');
      throw err;
    }
  };

  // Upload Voice Memo / Audio Blob to Google Drive
  const uploadAudioMemo = async (
    blob: Blob,
    title: string,
    duration?: number,
    tags?: string[]
  ): Promise<HubItem> => {
    const token = getStoredAccessToken();
    const fileName = `Voice-Memo-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.webm`;

    let driveData: any = null;
    if (token) {
      setSyncStatus('syncing');
      try {
        driveData = await uploadFileToDrive(token, blob, fileName, 'audio/webm');
      } catch (err) {
        console.warn('Could not upload audio to Google Drive, saving locally:', err);
      }
    }

    const newItem: HubItem = {
      id: crypto.randomUUID(),
      type: 'Audio',
      title: title.trim() || 'Voice Memo',
      content: driveData?.webViewLink || 'Recorded voice memo',
      dateAdded: new Date().toISOString(),
      isDeleted: false,
      tags: tags || ['#voicememo'],
      audioDuration: duration || 0,
      driveFileId: driveData?.id,
      driveWebViewLink: driveData?.webViewLink,
      fileName: fileName,
      fileSize: formatBytes(blob.size),
      mimeType: 'audio/webm',
    };

    setItems(prev => [newItem, ...prev]);
    if (token) {
      setSyncStatus('synced');
      refreshStorageQuota();
    }
    return newItem;
  };

  const addItem = (item: Omit<HubItem, 'id' | 'dateAdded' | 'isDeleted'>) => {
    const newItem: HubItem = {
      ...item,
      id: crypto.randomUUID(),
      dateAdded: new Date().toISOString(),
      isDeleted: false,
    };
    setItems(prev => [newItem, ...prev]);
  };

  const updateItem = (id: string, updates: Partial<HubItem>) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));
  };

  const togglePin = (id: string) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, isPinned: !item.isPinned } : item));
  };

  const moveToRecycleBin = (id: string) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, isDeleted: true } : item));
  };

  const restoreItem = (id: string) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, isDeleted: false } : item));
  };

  const deletePermanently = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const exportData = () => {
    const dataStr = JSON.stringify(items, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `knowledge-hub-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <DataContext.Provider value={{
      items,
      addItem,
      updateItem,
      togglePin,
      moveToRecycleBin,
      restoreItem,
      deletePermanently,
      exportData,
      isGoogleConnected,
      userProfile,
      syncStatus,
      lastSynced,
      syncError,
      storageQuota,
      connectGoogle,
      disconnectGoogle,
      syncWithDrive,
      refreshStorageQuota,
      uploadFileItem,
      uploadAudioMemo,
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
