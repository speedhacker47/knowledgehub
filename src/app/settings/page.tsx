"use client";

import React from 'react';
import { useAppContext } from '../../context/ThemeContext';
import { useData } from '../../context/DataContext';

export default function Settings() {
  const { theme, setTheme, accent, setAccent, fontSize, setFontSize, layoutView, setLayoutView } = useAppContext();
  const { exportData } = useData();

  const handleWhatsAppSetup = () => {
    window.open('https://wa.me/?text=Hello!%20Save%20this%20to%20my%20Knowledge%20Hub', '_blank');
  };

  return (
    <div style={{ maxWidth: '800px' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '2rem' }}>Settings</h1>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <section style={{ backgroundColor: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '1rem' }}>Appearance & Theme</h2>
          
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Color Theme</label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setTheme('light')} style={{ padding: '8px 16px', borderRadius: 'var(--radius-md)', border: theme === 'light' ? '2px solid var(--accent-color)' : '1px solid var(--border-color)', cursor: 'pointer', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>Light Mode</button>
              <button onClick={() => setTheme('dark')} style={{ padding: '8px 16px', borderRadius: 'var(--radius-md)', border: theme === 'dark' ? '2px solid var(--accent-color)' : '1px solid var(--border-color)', cursor: 'pointer', backgroundColor: '#0f172a', color: '#fff' }}>Dark Mode</button>
            </div>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Accent Color</label>
            <div style={{ display: 'flex', gap: '15px' }}>
              {(['blue', 'emerald', 'violet', 'rose'] as const).map(color => (
                <button 
                  key={color} onClick={() => setAccent(color)}
                  style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: `var(--accent-${color})`, border: accent === color ? '3px solid var(--text-primary)' : 'none', boxShadow: 'var(--shadow-sm)', cursor: 'pointer' }}
                  title={color}
                />
              ))}
            </div>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Font Size</label>
            <div style={{ display: 'flex', gap: '10px' }}>
              {(['small', 'medium', 'large'] as const).map(size => (
                <button 
                  key={size} onClick={() => setFontSize(size)}
                  style={{ padding: '8px 16px', borderRadius: 'var(--radius-md)', textTransform: 'capitalize', border: fontSize === size ? '2px solid var(--accent-color)' : '1px solid var(--border-color)', backgroundColor: fontSize === size ? 'rgba(var(--accent-color), 0.1)' : 'transparent', color: fontSize === size ? 'var(--accent-color)' : 'var(--text-primary)', cursor: 'pointer' }}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Dashboard Layout</label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setLayoutView('grid')} style={{ padding: '8px 16px', borderRadius: 'var(--radius-md)', border: layoutView === 'grid' ? '2px solid var(--accent-color)' : '1px solid var(--border-color)', backgroundColor: layoutView === 'grid' ? 'rgba(var(--accent-color), 0.1)' : 'transparent', color: layoutView === 'grid' ? 'var(--accent-color)' : 'var(--text-primary)', cursor: 'pointer' }}>Visual Grid View</button>
              <button onClick={() => setLayoutView('list')} style={{ padding: '8px 16px', borderRadius: 'var(--radius-md)', border: layoutView === 'list' ? '2px solid var(--accent-color)' : '1px solid var(--border-color)', backgroundColor: layoutView === 'list' ? 'rgba(var(--accent-color), 0.1)' : 'transparent', color: layoutView === 'list' ? 'var(--accent-color)' : 'var(--text-primary)', cursor: 'pointer' }}>Compact List View</button>
            </div>
          </div>
        </section>

        <section style={{ backgroundColor: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '1rem' }}>Integrations</h2>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', backgroundColor: 'var(--bg-primary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <div>
              <h3 style={{ fontWeight: 600, color: 'var(--accent-emerald)' }}>WhatsApp Direct Setup</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9em' }}>Quickly forward messages to your Hub.</p>
            </div>
            <button onClick={handleWhatsAppSetup} style={{ padding: '8px 16px', backgroundColor: 'var(--accent-emerald)', color: '#fff', borderRadius: 'var(--radius-md)', fontWeight: 600, cursor: 'pointer', border: 'none' }}>Share to WhatsApp</button>
          </div>
        </section>

        <section style={{ backgroundColor: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '1rem' }}>Data Management</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem', fontSize: '0.9em' }}>Export your knowledge hub data for safekeeping.</p>
          <button onClick={exportData} style={{ padding: '10px 20px', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
            Export / Backup Data (JSON)
          </button>
        </section>
      </div>
    </div>
  );
}
