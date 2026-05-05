
"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Division, Section, Location, StatusOption, Position, SystemConfig } from '@/lib/types';
import { getSystemData, saveSystemData } from '@/app/actions/db-actions';

interface SystemDataContextType {
  divisions: Division[];
  sections: Section[];
  locations: Location[];
  statusOptions: StatusOption[];
  users: User[];
  positions: Position[];
  systemConfig: SystemConfig;
  addDivision: (name: string) => void;
  updateDivision: (id: string, name: string) => void;
  deleteDivision: (id: string) => void;
  addSection: (name: string, divisionId: string) => void;
  updateSection: (id: string, name: string, divisionId: string) => void;
  deleteSection: (id: string) => void;
  addLocation: (name: string) => void;
  updateLocation: (id: string, name: string) => void;
  deleteLocation: (id: string) => void;
  addStatusOption: (name: string) => void;
  updateStatusOption: (id: string, name: string) => void;
  deleteStatusOption: (id: string) => void;
  addUser: (user: Omit<User, 'id'>) => Promise<void>;
  importUsers: (users: Omit<User, 'id'>[]) => Promise<void>;
  updateUser: (id: string, user: Partial<User>) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  addPosition: (name: string) => void;
  updatePosition: (id: string, name: string) => void;
  deletePosition: (id: string) => void;
  updateSystemConfig: (config: Partial<SystemConfig>) => void;
  isLoading: boolean;
}

const SystemDataContext = createContext<SystemDataContextType | undefined>(undefined);

export function SystemDataProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<{
    divisions: Division[];
    sections: Section[];
    locations: Location[];
    statusOptions: StatusOption[];
    users: User[];
    positions: Position[];
    systemConfig: SystemConfig;
  }>({
    divisions: [],
    sections: [],
    locations: [],
    statusOptions: [],
    users: [],
    positions: [],
    systemConfig: { maxUploadSize: 20 }
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const result = await getSystemData();
        setData(result);
      } catch (err) {
        console.error("Failed to load system data:", err);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  const addDivision = async (name: string) => {
    const newDiv = { id: Math.random().toString(36).substr(2, 9), name };
    setData(prev => {
      const updated = [...prev.divisions, newDiv];
      saveSystemData({ divisions: updated });
      return { ...prev, divisions: updated };
    });
  };

  const updateDivision = async (id: string, name: string) => {
    setData(prev => {
      const updated = prev.divisions.map(d => d.id === id ? { ...d, name } : d);
      saveSystemData({ divisions: updated });
      return { ...prev, divisions: updated };
    });
  };

  const deleteDivision = async (id: string) => {
    setData(prev => {
      const updated = prev.divisions.filter(d => d.id !== id);
      saveSystemData({ divisions: updated });
      return { ...prev, divisions: updated };
    });
  };

  const addSection = async (name: string, divisionId: string) => {
    const newSec = { id: Math.random().toString(36).substr(2, 9), name, divisionId };
    setData(prev => {
      const updated = [...prev.sections, newSec];
      saveSystemData({ sections: updated });
      return { ...prev, sections: updated };
    });
  };

  const updateSection = async (id: string, name: string, divisionId: string) => {
    setData(prev => {
      const updated = prev.sections.map(s => s.id === id ? { ...s, name, divisionId } : s);
      saveSystemData({ sections: updated });
      return { ...prev, sections: updated };
    });
  };

  const deleteSection = async (id: string) => {
    setData(prev => {
      const updated = prev.sections.filter(s => s.id !== id);
      saveSystemData({ sections: updated });
      return { ...prev, sections: updated };
    });
  };

  const addLocation = async (name: string) => {
    const newLoc = { id: Math.random().toString(36).substr(2, 9), name };
    setData(prev => {
      const updated = [...prev.locations, newLoc];
      saveSystemData({ locations: updated });
      return { ...prev, locations: updated };
    });
  };

  const updateLocation = async (id: string, name: string) => {
    setData(prev => {
      const updated = prev.locations.map(l => l.id === id ? { ...l, name } : l);
      saveSystemData({ locations: updated });
      return { ...prev, locations: updated };
    });
  };

  const deleteLocation = async (id: string) => {
    setData(prev => {
      const updated = prev.locations.filter(l => l.id !== id);
      saveSystemData({ locations: updated });
      return { ...prev, locations: updated };
    });
  };

  const addStatusOption = async (name: string) => {
    const newOpt = { id: Math.random().toString(36).substr(2, 9), name };
    setData(prev => {
      const updated = [...prev.statusOptions, newOpt];
      saveSystemData({ statusOptions: updated });
      return { ...prev, statusOptions: updated };
    });
  };

  const updateStatusOption = async (id: string, name: string) => {
    setData(prev => {
      const updated = prev.statusOptions.map(o => o.id === id ? { ...o, name } : o);
      saveSystemData({ statusOptions: updated });
      return { ...prev, statusOptions: updated };
    });
  };

  const deleteStatusOption = async (id: string) => {
    setData(prev => {
      const updated = prev.statusOptions.filter(o => o.id !== id);
      saveSystemData({ statusOptions: updated });
      return { ...prev, statusOptions: updated };
    });
  };

  const addUser = async (userData: Omit<User, 'id'>) => {
    const newUser = { ...userData, id: Math.random().toString(36).substr(2, 9) };
    setData(prev => {
      const updated = [...prev.users, newUser];
      saveSystemData({ users: updated });
      return { ...prev, users: updated };
    });
  };

  const importUsers = async (newUsersData: Omit<User, 'id'>[]) => {
    setData(prev => {
      const newUsers = newUsersData.map(u => ({ ...u, id: Math.random().toString(36).substr(2, 9) }));
      const updated = [...prev.users, ...newUsers];
      saveSystemData({ users: updated });
      return { ...prev, users: updated };
    });
  };

  const updateUser = async (id: string, userData: Partial<User>) => {
    setData(prev => {
      const updated = prev.users.map(u => u.id === id ? { ...u, ...userData } : u);
      saveSystemData({ users: updated });
      return { ...prev, users: updated };
    });
  };

  const deleteUser = async (id: string) => {
    setData(prev => {
      const updated = prev.users.filter(u => u.id !== id);
      saveSystemData({ users: updated });
      return { ...prev, users: updated };
    });
  };

  const addPosition = async (name: string) => {
    const newPos = { id: Math.random().toString(36).substr(2, 9), name };
    setData(prev => {
      const updated = [...prev.positions, newPos];
      saveSystemData({ positions: updated });
      return { ...prev, positions: updated };
    });
  };

  const updatePosition = async (id: string, name: string) => {
    setData(prev => {
      const updated = prev.positions.map(p => p.id === id ? { ...p, name } : p);
      saveSystemData({ positions: updated });
      return { ...prev, positions: updated };
    });
  };

  const deletePosition = async (id: string) => {
    setData(prev => {
      const updated = prev.positions.filter(p => p.id !== id);
      saveSystemData({ positions: updated });
      return { ...prev, positions: updated };
    });
  };

  const updateSystemConfig = async (newConfig: Partial<SystemConfig>) => {
    setData(prev => {
      const updated = { ...prev.systemConfig, ...newConfig };
      saveSystemData({ systemConfig: updated });
      return { ...prev, systemConfig: updated };
    });
  };

  return (
    <SystemDataContext.Provider value={{ 
      ...data, isLoading,
      addDivision, updateDivision, deleteDivision,
      addSection, updateSection, deleteSection,
      addLocation, updateLocation, deleteLocation,
      addStatusOption, updateStatusOption, deleteStatusOption,
      addUser, importUsers, updateUser, deleteUser,
      addPosition, updatePosition, deletePosition,
      updateSystemConfig
    }}>
      {children}
    </SystemDataContext.Provider>
  );
}

export const useSystemData = () => {
  const context = useContext(SystemDataContext);
  if (context === undefined) {
    throw new Error('useSystemData must be used within a SystemDataProvider');
  }
  return context;
};
