"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { BrandingConfig } from '@/lib/types';

interface BrandingContextType {
  config: BrandingConfig;
  updateConfig: (newConfig: Partial<BrandingConfig>) => void;
}

const defaultBranding: BrandingConfig = {
  appName: 'Resource Inventory Management System',
  appAcronym: 'R.I.M.S',
  loginDescription: 'A specialized system for broadcast, media, and engineering departments to manage expenditures and resources with precision.',
  copyright: `© ${new Date().getFullYear()} Resource Inventory Management System. All rights reserved.`,
  logoUrl: '',
  theme: 'oceanic',
  darkMode: false,
};

const BrandingContext = createContext<BrandingContextType | undefined>(undefined);

export function BrandingProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<BrandingConfig>(defaultBranding);

  useEffect(() => {
    const saved = localStorage.getItem('rims_branding');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setConfig(prev => ({ ...prev, ...parsed }));
        applyBranding(parsed);
      } catch (e) {
        console.error("Failed to parse branding config", e);
      }
    } else {
      // Apply default theme if nothing is saved
      applyBranding(defaultBranding);
    }
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

  const updateConfig = (newConfig: Partial<BrandingConfig>) => {
    const updated = { ...config, ...newConfig };
    setConfig(updated);
    localStorage.setItem('rims_branding', JSON.stringify(updated));
    applyBranding(updated);
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