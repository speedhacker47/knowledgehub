"use client";

import React from 'react';
import { Sidebar } from './Sidebar';
import styles from './MainLayout.module.css';

export const MainLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className={styles.layout}>
      <Sidebar />
      <main className={styles.main}>
        {children}
      </main>
    </div>
  );
};
