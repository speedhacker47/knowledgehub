"use client";

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { HubItem, GoogleUserProfile, SyncStatus, Category } from '../types';
import { initialDummyData } from '../utils/dummyData';
import {
  getStoredAccessToken,
  getStoredUserProfile,
  clearGoogleSession,
  requestGoogleAuth,
  fetchUserProfile,
  saveDatabaseToDrive,
  loadDatabaseFromDrive,
  uploadFileToDrive,
  formatBytes,
  loadGoogleScript,
} from '../utils/googleDrive';

interface DataContextType {
  items: HubItem[];
  addItem: (item: Omit<HubItem, 'id' | 'dateAdded' | 'isDeleted'>) => void;
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
  connectGoogle: () => Promise<void>;
  disconnectGoogle: () => void;
  syncWithDrive: () => Promise<void>;
  uploadFileItem: (file: File, category?: Category, customTitle?: string) => Promise<HubItem>;
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

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialSyncDoneRef = useRef(false);

  // 1. Initial Local Data Load & Google Session Check
  useEffect(() => {
    // Load local items
    const saved = localStorage.getItem('hub_data');
    let loadedItems: HubItem[] = [];
    if (saved) {
      try {
        loadedItems = JSON.parse(saved);
      } catch {
        loadedItems = initialDummyData;
      }
    } else {
      loadedItems = initialDummyData;
      localStorage.setItem('hub_data', JSON.stringify(initialDummyData));
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
      
      // Attempt background cloud sync on app start
      syncCloudData(token, loadedItems);
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
        // Merge driveItems and localItems by ID (most recent wins)
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
        
        // Also ensure drive has the latest merged state
        await saveDatabaseToDrive(token, mergedItems);
      } else {
        // Drive has no file yet, push local items to Drive
        await saveDatabaseToDrive(token, localItems);
      }

      const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setLastSynced(now);
      localStorage.setItem('gdrive_last_synced', now);
      setSyncStatus('synced');
      isInitialSyncDoneRef.current = true;
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
          // Sync with drive
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
  const uploadFileItem = async (file: File, category?: Category, customTitle?: string): Promise<HubItem> => {
    const token = getStoredAccessToken();
    if (!token) {
      throw new Error('Please connect your Google Drive first to upload files.');
    }

    setSyncStatus('syncing');
    try {
      const driveFile = await uploadFileToDrive(token, file);

      // Determine category if not explicitly provided
      let itemType: Category = category || 'Web Link';
      if (!category || category === 'All') {
        if (file.type.startsWith('video/')) itemType = 'Video';
        else if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) itemType = 'PDF';
        else if (file.type.startsWith('image/')) itemType = 'Web Link';
        else itemType = 'Web Link';
      }

      const newItem: HubItem = {
        id: crypto.randomUUID(),
        type: itemType,
        title: customTitle?.trim() || file.name,
        content: driveFile.webViewLink || `https://drive.google.com/file/d/${driveFile.id}/view`,
        previewImage: driveFile.thumbnailLink || (file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined),
        dateAdded: new Date().toISOString(),
        isDeleted: false,
        driveFileId: driveFile.id,
        driveWebViewLink: driveFile.webViewLink,
        driveWebContentLink: driveFile.webContentLink,
        fileName: file.name,
        fileSize: formatBytes(driveFile.size),
        mimeType: driveFile.mimeType,
      };

      setItems(prev => [newItem, ...prev]);
      setSyncStatus('synced');
      return newItem;
    } catch (err: any) {
      setSyncStatus('error');
      setSyncError(err.message || 'File upload failed');
      throw err;
    }
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
      moveToRecycleBin,
      restoreItem,
      deletePermanently,
      exportData,
      isGoogleConnected,
      userProfile,
      syncStatus,
      lastSynced,
      syncError,
      connectGoogle,
      disconnectGoogle,
      syncWithDrive,
      uploadFileItem,
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
