"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { HubItem } from '../types';
import { initialDummyData } from '../utils/dummyData';

interface DataContextType {
  items: HubItem[];
  addItem: (item: Omit<HubItem, 'id' | 'dateAdded' | 'isDeleted'>) => void;
  moveToRecycleBin: (id: string) => void;
  restoreItem: (id: string) => void;
  deletePermanently: (id: string) => void;
  exportData: () => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<HubItem[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('hub_data');
    if (saved) {
      setItems(JSON.parse(saved));
    } else {
      setItems(initialDummyData);
      localStorage.setItem('hub_data', JSON.stringify(initialDummyData));
    }
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem('hub_data', JSON.stringify(items));
    }
  }, [items, mounted]);

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
      items, addItem, moveToRecycleBin, restoreItem, deletePermanently, exportData
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
