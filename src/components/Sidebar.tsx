"use client";

import React, { useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useData } from '../context/DataContext';
import styles from './Sidebar.module.css';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen = false, onClose }) => {
  const pathname = usePathname();
  const { 
    items, 
    isGoogleConnected, 
    userProfile, 
    syncStatus, 
    lastSynced, 
    storageQuota,
    connectGoogle, 
    syncWithDrive 
  } = useData();

  const activeTasksCount = items.filter(item => !item.isDeleted && item.type === 'Task' && !item.isCompleted).length;
  const deletedCount = items.filter(item => item.isDeleted).length;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && onClose) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const navItems = [
    { name: 'All Hub', path: '/', icon: <HomeIcon /> },
    { 
      name: 'Tasks', 
      path: '/tasks', 
      icon: <CheckCircleIcon />, 
      badge: activeTasksCount > 0 ? activeTasksCount : null 
    },
    { 
      name: 'Recycle Bin', 
      path: '/recycle-bin', 
      icon: <TrashIcon />, 
      badge: deletedCount > 0 ? deletedCount : null 
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className={styles.backdrop} 
          onClick={onClose} 
          aria-hidden="true" 
        />
      )}

      <aside className={`${styles.sidebar} ${isOpen ? styles.open : ''}`}>
        <div className={styles.topHeader}>
          <div className={styles.logo}>
            <h1>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
              <span>Knowledge Hub</span>
            </h1>
          </div>

          {onClose && (
            <button 
              className={styles.closeBtn} 
              onClick={onClose}
              aria-label="Close navigation drawer"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          )}
        </div>

        <nav className={styles.nav}>
          {navItems.map(item => {
            const isActive = pathname === item.path;
            return (
              <Link 
                key={item.name} 
                href={item.path} 
                className={`${styles.navItem} ${isActive ? styles.active : ''}`}
                onClick={onClose}
              >
                <div className={styles.itemContent}>
                  {item.icon}
                  <span>{item.name}</span>
                </div>
                {item.badge !== null && (
                  <span className={`${styles.navBadge} ${isActive ? styles.badgeActive : ''}`}>
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Google Drive Status & Storage Quota Widget */}
        <div className={styles.cloudSection}>
          {isGoogleConnected ? (
            <>
              <div className={styles.cloudHeader}>
                <div className={styles.userBadge}>
                  {userProfile?.picture ? (
                    <img src={userProfile.picture} alt={userProfile.name} className={styles.avatar} />
                  ) : (
                    <div className={styles.avatarPlaceholder}>
                      {userProfile?.name?.charAt(0) || 'G'}
                    </div>
                  )}
                  <div className={styles.userInfo}>
                    <span className={styles.userName}>{userProfile?.name || 'Google Account'}</span>
                    <span className={styles.syncStatusText}>
                      <span className={`${styles.syncDot} ${syncStatus === 'syncing' ? styles.syncing : syncStatus === 'error' ? styles.error : ''}`} />
                      {syncStatus === 'syncing' ? 'Syncing...' : syncStatus === 'error' ? 'Sync error' : lastSynced ? `Synced ${lastSynced}` : 'Drive Synced'}
                    </span>
                  </div>
                </div>
                <button 
                  type="button"
                  className={styles.syncBtn} 
                  onClick={() => syncWithDrive()} 
                  title="Sync now with Google Drive"
                >
                  <SyncIcon isSpinning={syncStatus === 'syncing'} />
                </button>
              </div>

              {/* Storage Quota Meter */}
              {storageQuota && (
                <div className={styles.quotaBox}>
                  <div className={styles.quotaLabelRow}>
                    <span>Drive Storage</span>
                    <span>{storageQuota.formattedUsage} / {storageQuota.formattedLimit}</span>
                  </div>
                  <div className={styles.quotaProgressTrack}>
                    <div 
                      className={styles.quotaProgressBar} 
                      style={{ width: `${Math.min(100, storageQuota.usagePercent)}%` }} 
                    />
                  </div>
                </div>
              )}
            </>
          ) : (
            <button
              type="button"
              className={styles.connectDriveBtn}
              onClick={() => connectGoogle()}
            >
              <GoogleDriveSmallIcon />
              <span>Connect Google Drive</span>
            </button>
          )}
        </div>

        <div className={styles.bottomSection}>
          <Link 
            href="/settings" 
            className={`${styles.navItem} ${pathname === '/settings' ? styles.active : ''}`}
            onClick={onClose}
          >
            <div className={styles.itemContent}>
              <SettingsIcon />
              <span>Settings</span>
            </div>
          </Link>
        </div>
      </aside>
    </>
  );
};

const HomeIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>;
const CheckCircleIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>;
const TrashIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>;
const SettingsIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>;
const SyncIcon = ({ isSpinning }: { isSpinning?: boolean }) => (
  <svg 
    width="16" 
    height="16" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    style={{ animation: isSpinning ? 'spin 1s linear infinite' : 'none' }}
  >
    <polyline points="23 4 23 10 17 10"></polyline>
    <polyline points="1 20 1 14 7 14"></polyline>
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
  </svg>
);
const GoogleDriveSmallIcon = () => (
  <svg width="16" height="16" viewBox="0 0 87.3 78" fill="currentColor">
    <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8H0c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/>
    <path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44a9.06 9.06 0 0 0 -1.2 4.5h27.5z" fill="#00ac47"/>
    <path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 11.5z" fill="#ea4335"/>
    <path d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d"/>
    <path d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" fill="#2684fc"/>
    <path d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 28h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00"/>
  </svg>
);
