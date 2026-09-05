"use client";

import React, { useEffect, useState } from 'react';
import styles from './LoadingScreen.module.css';

export const LoadingScreen = () => {
  const [visible, setVisible] = useState(true);
  const [render, setRender] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(() => setRender(false), 500);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  if (!render) return null;

  return (
    <div className={styles.container} style={{ opacity: visible ? 1 : 0 }}>
      <div className={styles.butterfly}>
        <div className={styles.wing} />
        <div className={styles.body} />
        <div className={`${styles.wing} ${styles.wingRight}`} />
      </div>
      <h2 className={styles.text}>Loading your dpocket...</h2>
    </div>
  );
};
