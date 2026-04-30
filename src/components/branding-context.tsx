
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
  logoUrl: '',
  theme: 'default',
};

const BrandingContext = createContext<BrandingContextType | undefined>(undefined);

export function BrandingProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<BrandingConfig>(defaultBranding);

  useEffect(() => {
    const saved = localStorage.getItem('rims_branding');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setConfig(parsed);
        if (parsed.theme) {
          document.documentElement.setAttribute('data-theme', parsed.theme);
        }
      } catch (e) {
        console.error("Failed to parse branding config", e);
      }
    }
  }, []);

  const updateConfig = (newConfig: Partial<BrandingConfig>) => {
    const updated = { ...config, ...newConfig };
    setConfig(updated);
    localStorage.setItem('rims_branding', JSON.stringify(updated));
    
    if (updated.theme) {
      document.documentElement.setAttribute('data-theme', updated.theme);
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
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
