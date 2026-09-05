"use client";

import React, { useState } from 'react';
import { useAppContext } from '../../context/ThemeContext';
import { useData } from '../../context/DataContext';
import styles from './settings.module.css';

export default function Settings() {
  const { theme, setTheme, accent, setAccent, fontSize, setFontSize, layoutView, setLayoutView } = useAppContext();
  const { 
    exportData, 
    isGoogleConnected, 
    userProfile, 
    syncStatus, 
    lastSynced, 
    syncError, 
    connectGoogle, 
    disconnectGoogle, 
    syncWithDrive 
  } = useData();

  const [isManualSyncing, setIsManualSyncing] = useState(false);

  const handleManualSync = async () => {
    setIsManualSyncing(true);
    try {
      await syncWithDrive();
    } finally {
      setIsManualSyncing(false);
    }
  };

  const handleOpenDriveFolder = () => {
    window.open('https://drive.google.com/drive/my-drive', '_blank');
  };

  const handleWhatsAppSetup = () => {
    window.open('https://wa.me/?text=Hello!%20Save%20this%20to%20my%20Knowledge%20Hub', '_blank');
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Settings</h1>

      <div className={styles.sectionsList}>
        
        {/* Google Drive Serverless Database & Cloud Storage */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionTitleGroup}>
              <GoogleDriveLogo />
              <div>
                <h2 className={styles.sectionTitle}>Google Drive Cloud Storage</h2>
                <p className={styles.sectionSubtitle}>
                  Use your personal Google Drive as your serverless database and file store.
                </p>
              </div>
            </div>
            {isGoogleConnected ? (
              <span className={styles.statusBadgeConnected}>
                ● Connected
              </span>
            ) : (
              <span className={styles.statusBadgeDisconnected}>
                Disconnected
              </span>
            )}
          </div>

          {isGoogleConnected ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className={styles.accountCard}>
                <div className={styles.userInfo}>
                  {userProfile?.picture ? (
                    <img src={userProfile.picture} alt={userProfile.name} className={styles.userAvatar} />
                  ) : (
                    <div className={styles.userAvatarFallback}>
                      {userProfile?.name?.charAt(0) || 'G'}
                    </div>
                  )}
                  <div>
                    <h4 className={styles.userName}>{userProfile?.name || 'Google Account'}</h4>
                    <p className={styles.userEmail}>{userProfile?.email}</p>
                  </div>
                </div>

                <button
                  onClick={disconnectGoogle}
                  className={styles.disconnectBtn}
                >
                  Disconnect
                </button>
              </div>

              <div className={styles.infoGrid}>
                <div className={styles.infoCard}>
                  <span className={styles.infoLabel}>Drive Folder</span>
                  <strong className={styles.infoValue}>📁 dpocket Files</strong>
                </div>
                <div className={styles.infoCard}>
                  <span className={styles.infoLabel}>JSON Database</span>
                  <strong className={styles.infoValue}>📄 knowledge_hub_data.json</strong>
                </div>
                <div className={styles.infoCard}>
                  <span className={styles.infoLabel}>Last Synced</span>
                  <strong className={styles.infoValue}>{lastSynced ? lastSynced : 'Pending sync'}</strong>
                </div>
              </div>

              {syncError && (
                <div style={{ padding: '10px 14px', backgroundColor: 'rgba(244,63,94,0.1)', color: 'var(--accent-rose)', borderRadius: 'var(--radius-md)', fontSize: '0.85rem', border: '1px solid rgba(244,63,94,0.2)' }}>
                  {syncError}
                </div>
              )}

              <div className={styles.actionsRow}>
                <button
                  onClick={handleManualSync}
                  disabled={isManualSyncing || syncStatus === 'syncing'}
                  className={styles.primaryActionBtn}
                  style={{ opacity: (isManualSyncing || syncStatus === 'syncing') ? 0.6 : 1 }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: (isManualSyncing || syncStatus === 'syncing') ? 'spin 1s linear infinite' : 'none' }}><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>
                  {isManualSyncing || syncStatus === 'syncing' ? 'Syncing...' : 'Sync Now with Drive'}
                </button>

                <button
                  onClick={handleOpenDriveFolder}
                  className={styles.secondaryActionBtn}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                  Open Google Drive
                </button>
              </div>
            </div>
          ) : (
            <div style={{ padding: '1.5rem', backgroundColor: 'var(--bg-primary)', borderRadius: 'var(--radius-md)', border: '1px dashed var(--border-color)', textAlign: 'center' }}>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '1.25rem', fontSize: '0.95rem' }}>
                Connect your Google Account to automatically store all your saved links, notes, and uploaded files in your personal Google Drive without any external database.
              </p>
              <button
                onClick={() => connectGoogle()}
                style={{
                  padding: '10px 20px', backgroundColor: '#fff', color: '#374151', border: '1px solid #d1d5db',
                  borderRadius: 'var(--radius-md)', fontWeight: 600, fontSize: '0.95rem', cursor: 'pointer',
                  display: 'inline-flex', alignItems: 'center', gap: '10px', boxShadow: 'var(--shadow-sm)'
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/></svg>
                Connect Google Account
              </button>
            </div>
          )}
        </section>

        {/* Appearance & Theme */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Appearance & Theme</h2>
          
          <div className={styles.formGroup}>
            <label className={styles.groupLabel}>Color Theme</label>
            <div className={styles.optionsRow}>
              <button 
                onClick={() => setTheme('light')} 
                className={`${styles.optionBtn} ${theme === 'light' ? styles.optionBtnActive : ''}`}
              >
                Light Mode
              </button>
              <button 
                onClick={() => setTheme('dark')} 
                className={`${styles.optionBtn} ${theme === 'dark' ? styles.optionBtnActive : ''}`}
                style={theme === 'dark' ? { backgroundColor: '#0f172a', color: '#ffffff' } : {}}
              >
                Dark Mode
              </button>
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.groupLabel}>Accent Color</label>
            <div className={styles.swatchesRow}>
              {(['blue', 'emerald', 'violet', 'rose'] as const).map(color => (
                <button 
                  key={color} 
                  onClick={() => setAccent(color)}
                  className={`${styles.swatchBtn} ${accent === color ? styles.swatchActive : ''}`}
                  style={{ backgroundColor: `var(--accent-${color})` }}
                  title={color}
                  aria-label={`Select ${color} accent`}
                />
              ))}
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.groupLabel}>Font Size</label>
            <div className={styles.optionsRow}>
              {(['small', 'medium', 'large'] as const).map(size => (
                <button 
                  key={size} 
                  onClick={() => setFontSize(size)}
                  className={`${styles.optionBtn} ${fontSize === size ? styles.optionBtnActive : ''}`}
                  style={{ textTransform: 'capitalize' }}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.groupLabel}>Dashboard Layout</label>
            <div className={styles.optionsRow}>
              <button 
                onClick={() => setLayoutView('grid')} 
                className={`${styles.optionBtn} ${layoutView === 'grid' ? styles.optionBtnActive : ''}`}
              >
                Visual Grid View
              </button>
              <button 
                onClick={() => setLayoutView('list')} 
                className={`${styles.optionBtn} ${layoutView === 'list' ? styles.optionBtnActive : ''}`}
              >
                Compact List View
              </button>
            </div>
          </div>
        </section>

        {/* Integrations */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Integrations</h2>
          <div className={styles.integrationCard}>
            <div>
              <h3 className={styles.integrationTitle}>WhatsApp Direct Setup</h3>
              <p className={styles.integrationDesc}>Quickly forward messages to your Hub.</p>
            </div>
            <button onClick={handleWhatsAppSetup} className={styles.whatsAppBtn}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
              Share to WhatsApp
            </button>
          </div>
        </section>

        {/* Local Data Backup */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Local Data Export</h2>
          <p className={styles.sectionSubtitle}>Download a manual JSON backup file to your computer or phone.</p>
          <div className={styles.actionsRow}>
            <button onClick={exportData} className={styles.secondaryActionBtn}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
              Export / Backup Data (JSON)
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

const GoogleDriveLogo = () => (
  <svg width="32" height="32" viewBox="0 0 87.3 78" fill="currentColor">
    <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8H0c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/>
    <path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44a9.06 9.06 0 0 0 -1.2 4.5h27.5z" fill="#00ac47"/>
    <path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 11.5z" fill="#ea4335"/>
    <path d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d"/>
    <path d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" fill="#2684fc"/>
    <path d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 28h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00"/>
  </svg>
);
