
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
    const updated = [...data.divisions, newDiv];
    setData(prev => ({ ...prev, divisions: updated }));
    await saveSystemData({ divisions: updated });
  };

  const updateDivision = async (id: string, name: string) => {
    const updated = data.divisions.map(d => d.id === id ? { ...d, name } : d);
    setData(prev => ({ ...prev, divisions: updated }));
    await saveSystemData({ divisions: updated });
  };

  const deleteDivision = async (id: string) => {
    const updated = data.divisions.filter(d => d.id !== id);
    setData(prev => ({ ...prev, divisions: updated }));
    await saveSystemData({ divisions: updated });
  };

  const addSection = async (name: string, divisionId: string) => {
    const newSec = { id: Math.random().toString(36).substr(2, 9), name, divisionId };
    const updated = [...data.sections, newSec];
    setData(prev => ({ ...prev, sections: updated }));
    await saveSystemData({ sections: updated });
  };

  const updateSection = async (id: string, name: string, divisionId: string) => {
    const updated = data.sections.map(s => s.id === id ? { ...s, name, divisionId } : s);
    setData(prev => ({ ...prev, sections: updated }));
    await saveSystemData({ sections: updated });
  };

  const deleteSection = async (id: string) => {
    const updated = data.sections.filter(s => s.id !== id);
    setData(prev => ({ ...prev, sections: updated }));
    await saveSystemData({ sections: updated });
  };

  const addLocation = async (name: string) => {
    const newLoc = { id: Math.random().toString(36).substr(2, 9), name };
    const updated = [...data.locations, newLoc];
    setData(prev => ({ ...prev, locations: updated }));
    await saveSystemData({ locations: updated });
  };

  const updateLocation = async (id: string, name: string) => {
    const updated = data.locations.map(l => l.id === id ? { ...l, name } : l);
    setData(prev => ({ ...prev, locations: updated }));
    await saveSystemData({ locations: updated });
  };

  const deleteLocation = async (id: string) => {
    const updated = data.locations.filter(l => l.id !== id);
    setData(prev => ({ ...prev, locations: updated }));
    await saveSystemData({ locations: updated });
  };

  const addStatusOption = async (name: string) => {
    const newOpt = { id: Math.random().toString(36).substr(2, 9), name };
    const updated = [...data.statusOptions, newOpt];
    setData(prev => ({ ...prev, statusOptions: updated }));
    await saveSystemData({ statusOptions: updated });
  };

  const updateStatusOption = async (id: string, name: string) => {
    const updated = data.statusOptions.map(o => o.id === id ? { ...o, name } : o);
    setData(prev => ({ ...prev, statusOptions: updated }));
    await saveSystemData({ statusOptions: updated });
  };

  const deleteStatusOption = async (id: string) => {
    const updated = data.statusOptions.filter(o => o.id !== id);
    setData(prev => ({ ...prev, statusOptions: updated }));
    await saveSystemData({ statusOptions: updated });
  };

  const addUser = async (userData: Omit<User, 'id'>) => {
    const newUser = { ...userData, id: Math.random().toString(36).substr(2, 9) };
    const updated = [...data.users, newUser];
    setData(prev => ({ ...prev, users: updated }));
    await saveSystemData({ users: updated });
  };

  const importUsers = async (newUsersData: Omit<User, 'id'>[]) => {
    const newUsers = newUsersData.map(u => ({ ...u, id: Math.random().toString(36).substr(2, 9) }));
    const updated = [...data.users, ...newUsers];
    setData(prev => ({ ...prev, users: updated }));
    await saveSystemData({ users: updated });
  };

  const updateUser = async (id: string, userData: Partial<User>) => {
    const updated = data.users.map(u => u.id === id ? { ...u, ...userData } : u);
    setData(prev => ({ ...prev, users: updated }));
    await saveSystemData({ users: updated });
  };

  const deleteUser = async (id: string) => {
    const updated = data.users.filter(u => u.id !== id);
    setData(prev => ({ ...prev, users: updated }));
    await saveSystemData({ users: updated });
  };

  const addPosition = async (name: string) => {
    const newPos = { id: Math.random().toString(36).substr(2, 9), name };
    const updated = [...data.positions, newPos];
    setData(prev => ({ ...prev, positions: updated }));
    await saveSystemData({ positions: updated });
  };

  const updatePosition = async (id: string, name: string) => {
    const updated = data.positions.map(p => p.id === id ? { ...p, name } : p);
    setData(prev => ({ ...prev, positions: updated }));
    await saveSystemData({ positions: updated });
  };

  const deletePosition = async (id: string) => {
    const updated = data.positions.filter(p => p.id !== id);
    setData(prev => ({ ...prev, positions: updated }));
    await saveSystemData({ positions: updated });
  };

  const updateSystemConfig = async (newConfig: Partial<SystemConfig>) => {
    const updated = { ...data.systemConfig, ...newConfig };
    setData(prev => ({ ...prev, systemConfig: updated }));
    await saveSystemData({ systemConfig: updated });
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
