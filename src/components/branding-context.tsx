
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
};

const BrandingContext = createContext<BrandingContextType | undefined>(undefined);

export function BrandingProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<BrandingConfig>(defaultBranding);

  useEffect(() => {
    const saved = localStorage.getItem('rims_branding');
    if (saved) {
      try {
        setConfig(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse branding config", e);
      }
    }
  }, []);

  const updateConfig = (newConfig: Partial<BrandingConfig>) => {
    const updated = { ...config, ...newConfig };
    setConfig(updated);
    localStorage.setItem('rims_branding', JSON.stringify(updated));
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
