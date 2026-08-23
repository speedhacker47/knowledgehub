import { HubItem, GoogleUserProfile, DriveStorageQuota } from '../types';

const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '450139185140-m5so5qujpsbup5vu6odqepu6pqis74o8.apps.googleusercontent.com';
const SCOPES = 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email';

const FOLDER_NAME = 'Knowledge Hub Files';
const DB_FILE_NAME = 'knowledge_hub_data.json';

const TOKEN_KEY = 'gdrive_access_token';
const TOKEN_EXPIRY_KEY = 'gdrive_token_expires_at';
const USER_KEY = 'gdrive_user_profile';
const FOLDER_ID_KEY = 'gdrive_folder_id';
const DB_FILE_ID_KEY = 'gdrive_db_file_id';

let tokenClientInstance: any = null;

/**
 * Loads the Google Identity Services script asynchronously
 */
export const loadGoogleScript = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') return resolve();
    if ((window as any).google?.accounts?.oauth2) {
      return resolve();
    }

    const existingScript = document.getElementById('google-gis-script');
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve());
      existingScript.addEventListener('error', () => reject(new Error('Failed to load Google script')));
      return;
    }

    const script = document.createElement('script');
    script.id = 'google-gis-script';
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google Identity Services'));
    document.body.appendChild(script);
  });
};

/**
 * Gets currently stored access token if still valid
 */
export const getStoredAccessToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  const token = localStorage.getItem(TOKEN_KEY);
  const expiresAt = localStorage.getItem(TOKEN_EXPIRY_KEY);
  if (!token || !expiresAt) return null;

  if (Date.now() > parseInt(expiresAt, 10) - 60000) {
    clearGoogleSession();
    return null;
  }
  return token;
};

/**
 * Gets stored user profile
 */
export const getStoredUserProfile = (): GoogleUserProfile | null => {
  if (typeof window === 'undefined') return null;
  const saved = localStorage.getItem(USER_KEY);
  if (!saved) return null;
  try {
    return JSON.parse(saved);
  } catch {
    return null;
  }
};

/**
 * Clear stored Google session
 */
export const clearGoogleSession = () => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(TOKEN_EXPIRY_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(FOLDER_ID_KEY);
  localStorage.removeItem(DB_FILE_ID_KEY);
};

/**
 * Fetch Google User Profile
 */
export const fetchUserProfile = async (token: string): Promise<GoogleUserProfile | null> => {
  try {
    const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Failed to fetch user profile');
    const data = await res.json();
    const profile: GoogleUserProfile = {
      id: data.sub,
      name: data.name,
      email: data.email,
      picture: data.picture,
    };
    localStorage.setItem(USER_KEY, JSON.stringify(profile));
    return profile;
  } catch (err) {
    console.error('Error fetching Google user profile:', err);
    return null;
  }
};

/**
 * Fetch user's Google Drive Storage Quota
 */
export const fetchDriveStorageQuota = async (token: string): Promise<DriveStorageQuota | null> => {
  try {
    const res = await fetch('https://www.googleapis.com/drive/v3/about?fields=storageQuota', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    const data = await res.json();
    const quota = data.storageQuota;
    if (!quota) return null;

    const limitBytes = parseInt(quota.limit || '16106127360', 10); // default 15GB if unlimited
    const usageBytes = parseInt(quota.usage || '0', 10);
    const usageInDriveBytes = parseInt(quota.usageInDrive || '0', 10);
    const usagePercent = limitBytes > 0 ? Math.min(100, Math.round((usageBytes / limitBytes) * 100)) : 0;

    return {
      limitBytes,
      usageBytes,
      usageInDriveBytes,
      usagePercent,
      formattedLimit: formatBytes(limitBytes),
      formattedUsage: formatBytes(usageBytes),
    };
  } catch (err) {
    console.error('Error fetching storage quota:', err);
    return null;
  }
};

/**
 * Request Google OAuth Access Token via popup
 */
export const requestGoogleAuth = async (
  onSuccess: (token: string, profile: GoogleUserProfile | null) => void,
  onError?: (err: any) => void
): Promise<void> => {
  await loadGoogleScript();

  if (!(window as any).google?.accounts?.oauth2) {
    onError?.(new Error('Google Identity Services script not available'));
    return;
  }

  tokenClientInstance = (window as any).google.accounts.oauth2.initTokenClient({
    client_id: CLIENT_ID,
    scope: SCOPES,
    callback: async (response: any) => {
      if (response.error) {
        console.error('Google Auth Error:', response);
        onError?.(response);
        return;
      }

      if (response.access_token) {
        const expiresIn = response.expires_in ? parseInt(response.expires_in, 10) : 3599;
        const expiresAt = Date.now() + expiresIn * 1000;

        localStorage.setItem(TOKEN_KEY, response.access_token);
        localStorage.setItem(TOKEN_EXPIRY_KEY, expiresAt.toString());

        const profile = await fetchUserProfile(response.access_token);
        onSuccess(response.access_token, profile);
      }
    },
  });

  tokenClientInstance.requestAccessToken({ prompt: 'consent' });
};

/**
 * Find or create the dedicated 'Knowledge Hub Files' folder in user's Google Drive
 */
export const getOrCreateHubFolder = async (token: string): Promise<string> => {
  const cachedFolderId = localStorage.getItem(FOLDER_ID_KEY);
  if (cachedFolderId) {
    try {
      const verifyRes = await fetch(`https://www.googleapis.com/drive/v3/files/${cachedFolderId}?fields=id,trashed`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (verifyRes.ok) {
        const data = await verifyRes.json();
        if (!data.trashed) return data.id;
      }
    } catch {
      // ignore
    }
  }

  const query = encodeURIComponent(`name='${FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`);
  const searchRes = await fetch(`https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name)`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  
  if (searchRes.ok) {
    const searchData = await searchRes.json();
    if (searchData.files && searchData.files.length > 0 && searchData.files[0].id) {
      const folderId = searchData.files[0].id as string;
      localStorage.setItem(FOLDER_ID_KEY, folderId);
      return folderId;
    }
  }

  const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: FOLDER_NAME,
      mimeType: 'application/vnd.google-apps.folder',
    }),
  });

  if (!createRes.ok) {
    throw new Error('Failed to create Knowledge Hub folder in Google Drive');
  }

  const folder = await createRes.json();
  if (folder.id) {
    localStorage.setItem(FOLDER_ID_KEY, folder.id);
  }
  return folder.id;
};

/**
 * Save / Update Knowledge Hub database JSON in Google Drive
 */
export const saveDatabaseToDrive = async (token: string, items: HubItem[]): Promise<string> => {
  const folderId = await getOrCreateHubFolder(token);
  let dbFileId = localStorage.getItem(DB_FILE_ID_KEY);

  if (!dbFileId) {
    const query = encodeURIComponent(`name='${DB_FILE_NAME}' and '${folderId}' in parents and trashed=false`);
    const searchRes = await fetch(`https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name)`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (searchRes.ok) {
      const searchData = await searchRes.json();
      if (searchData.files && searchData.files.length > 0 && searchData.files[0].id) {
        dbFileId = searchData.files[0].id as string;
        localStorage.setItem(DB_FILE_ID_KEY, dbFileId);
      }
    }
  }

  const metadata: any = {
    name: DB_FILE_NAME,
    mimeType: 'application/json',
  };

  if (!dbFileId) {
    metadata.parents = [folderId];
  }

  const fileContent = JSON.stringify(items, null, 2);
  const boundary = '-------314159265358979323846';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const multipartRequestBody =
    delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadata) +
    delimiter +
    'Content-Type: application/json\r\n\r\n' +
    fileContent +
    closeDelimiter;

  const url = dbFileId
    ? `https://www.googleapis.com/upload/drive/v3/files/${dbFileId}?uploadType=multipart`
    : `https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart`;

  const method = dbFileId ? 'PATCH' : 'POST';

  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': `multipart/related; boundary=${boundary}`,
    },
    body: multipartRequestBody,
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Failed to save database to Google Drive: ${errText}`);
  }

  const result = await res.json();
  if (result.id) {
    localStorage.setItem(DB_FILE_ID_KEY, result.id);
  }
  return result.id;
};

/**
 * Load Knowledge Hub database JSON from Google Drive
 */
export const loadDatabaseFromDrive = async (token: string): Promise<HubItem[] | null> => {
  const folderId = await getOrCreateHubFolder(token);

  const query = encodeURIComponent(`name='${DB_FILE_NAME}' and '${folderId}' in parents and trashed=false`);
  const searchRes = await fetch(`https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name)`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!searchRes.ok) return null;
  const searchData = await searchRes.json();

  if (!searchData.files || searchData.files.length === 0 || !searchData.files[0].id) {
    return null;
  }

  const fileId = searchData.files[0].id as string;
  localStorage.setItem(DB_FILE_ID_KEY, fileId);

  const downloadRes = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!downloadRes.ok) throw new Error('Failed to download database from Google Drive');

  const data = await downloadRes.json();
  if (Array.isArray(data)) {
    return data;
  }
  return null;
};

/**
 * Upload a binary file or Blob directly into the user's 'Knowledge Hub Files' Google Drive folder
 */
export const uploadFileToDrive = async (
  token: string,
  fileOrBlob: File | Blob,
  customFileName?: string,
  customMimeType?: string
): Promise<{
  id: string;
  name: string;
  mimeType: string;
  size: number;
  webViewLink?: string;
  webContentLink?: string;
  thumbnailLink?: string;
}> => {
  const folderId = await getOrCreateHubFolder(token);
  const fileName = customFileName || (fileOrBlob as File).name || 'uploaded-file';
  const mimeType = customMimeType || fileOrBlob.type || 'application/octet-stream';

  const metadata = {
    name: fileName,
    mimeType: mimeType,
    parents: [folderId],
  };

  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  form.append('file', fileOrBlob, fileName);

  const res = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,size,webViewLink,webContentLink,thumbnailLink',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: form,
    }
  );

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`File upload failed: ${errorText}`);
  }

  const fileData = await res.json();

  // Try to set public read permission if allowed
  try {
    await fetch(`https://www.googleapis.com/drive/v3/files/${fileData.id}/permissions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        role: 'reader',
        type: 'anyone',
      }),
    });
  } catch (e) {
    // ignore
  }

  return {
    id: fileData.id,
    name: fileData.name || fileName,
    mimeType: fileData.mimeType || mimeType,
    size: parseInt(fileData.size || fileOrBlob.size.toString(), 10),
    webViewLink: fileData.webViewLink || `https://drive.google.com/file/d/${fileData.id}/view`,
    webContentLink: fileData.webContentLink,
    thumbnailLink: fileData.thumbnailLink,
  };
};

/**
 * Get high-res Google Favicon URL for a domain
 */
export const getFaviconUrl = (url: string): string => {
  try {
    const hostname = new URL(url).hostname;
    return `https://www.google.com/s2/favicons?domain=${hostname}&sz=128`;
  } catch {
    return `https://www.google.com/s2/favicons?domain=google.com&sz=128`;
  }
};

/**
 * Generate 1-click Google Calendar Event Link
 */
export const generateGoogleCalendarUrl = (title: string, details?: string, dueDate?: string): string => {
  const baseUrl = 'https://calendar.google.com/calendar/render?action=TEMPLATE';
  const encodedTitle = encodeURIComponent(title);
  const encodedDetails = encodeURIComponent(details || 'Created from Knowledge Hub');

  let dateParam = '';
  if (dueDate) {
    const date = new Date(dueDate);
    const startIso = date.toISOString().replace(/-|:|\.\d+/g, '');
    // End date 1 hour later
    const endDate = new Date(date.getTime() + 60 * 60 * 1000);
    const endIso = endDate.toISOString().replace(/-|:|\.\d+/g, '');
    dateParam = `&dates=${startIso}/${endIso}`;
  }

  return `${baseUrl}&text=${encodedTitle}&details=${encodedDetails}${dateParam}`;
};

/**
 * Format bytes to readable string (e.g. 2.4 MB)
 */
export const formatBytes = (bytes: number, decimals = 1): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};
