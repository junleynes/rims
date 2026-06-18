
"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { BrandingConfig } from '@/lib/types';
import { getSystemData, saveSystemData } from '@/app/actions/db-actions';

interface BrandingContextType {
  config: BrandingConfig;
  updateConfig: (newConfig: Partial<BrandingConfig>) => Promise<void>;
}

const defaultBranding: BrandingConfig = {
  appName: 'Resource Inventory Management System',
  appAcronym: 'R.I.M.S',
  loginDescription: 'A specialized system for broadcast, media, and engineering departments to manage expenditures and resources with precision.',
  copyright: `© ${new Date().getFullYear()} Resource Inventory Management System. All rights reserved.`,
  logoUrl: '',
  theme: 'oceanic',
  darkMode: false
};

const BrandingContext = createContext<BrandingContextType | undefined>(undefined);

export function BrandingProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<BrandingConfig>(defaultBranding);

  useEffect(() => {
    async function loadConfig() {
      // First try localStorage for immediate UI (optimistic)
      const saved = localStorage.getItem('rims_branding');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setConfig(prev => ({ ...prev, ...parsed }));
          applyBranding(parsed);
        } catch (e) {}
      }

      // Then fetch definitive state from server-db
      try {
        const { branding } = await getSystemData();
        if (branding) {
          setConfig(branding);
          applyBranding(branding);
          localStorage.setItem('rims_branding', JSON.stringify(branding));
        }
      } catch (e) {
        console.error("Failed to sync branding from server", e);
      }
    }
    
    loadConfig();
  }, []);

  const applyBranding = (branding: BrandingConfig) => {
    // Apply Color Theme
    if (branding.theme) {
      document.documentElement.setAttribute('data-theme', branding.theme);
    } else {
      document.documentElement.removeAttribute('data-theme');
    }

    // Apply Dark Mode
    if (branding.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const updateConfig = async (newConfig: Partial<BrandingConfig>) => {
    const updated = { ...config, ...newConfig };
    setConfig(updated);
    localStorage.setItem('rims_branding', JSON.stringify(updated));
    applyBranding(updated);
    // This used to only touch localStorage/React state — it never reached
    // the database. The change looked like it saved (UI updated instantly,
    // survived as long as the tab stayed open) but on the next reload the
    // mount effect's getSystemData() fetch would pull the old DB value back
    // and overwrite both state and localStorage with it.
    await saveSystemData({ branding: updated });
  };

  return (
    <BrandingContext.Provider value={{ config, updateConfig }}>
      {children}
    </BrandingContext.Provider>
  );
}

export const useBranding = () => {
  const context = useContext(BrandingContext);
  if (context === undefined) {
    throw new Error('useBranding must be used within a BrandingProvider');
  }
  return context;
};
