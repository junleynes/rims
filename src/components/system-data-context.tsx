
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
  addUser: (user: Omit<User, 'id'>) => void;
  importUsers: (users: Omit<User, 'id'>[]) => void;
  updateUser: (id: string, user: Partial<User>) => void;
  deleteUser: (id: string) => void;
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

  const addDivision = (name: string) => {
    const newDiv = { id: Math.random().toString(36).substr(2, 9), name };
    setData(prev => {
      const updated = { ...prev, divisions: [...prev.divisions, newDiv] };
      saveSystemData({ divisions: updated.divisions });
      return updated;
    });
  };

  const updateDivision = (id: string, name: string) => {
    setData(prev => {
      const updated = { ...prev, divisions: prev.divisions.map(d => d.id === id ? { ...d, name } : d) };
      saveSystemData({ divisions: updated.divisions });
      return updated;
    });
  };

  const deleteDivision = (id: string) => {
    setData(prev => {
      const updated = { ...prev, divisions: prev.divisions.filter(d => d.id !== id) };
      saveSystemData({ divisions: updated.divisions });
      return updated;
    });
  };

  const addSection = (name: string, divisionId: string) => {
    const newSec = { id: Math.random().toString(36).substr(2, 9), name, divisionId };
    setData(prev => {
      const updated = { ...prev, sections: [...prev.sections, newSec] };
      saveSystemData({ sections: updated.sections });
      return updated;
    });
  };

  const updateSection = (id: string, name: string, divisionId: string) => {
    setData(prev => {
      const updated = { ...prev, sections: prev.sections.map(s => s.id === id ? { ...s, name, divisionId } : s) };
      saveSystemData({ sections: updated.sections });
      return updated;
    });
  };

  const deleteSection = (id: string) => {
    setData(prev => {
      const updated = { ...prev, sections: prev.sections.filter(s => s.id !== id) };
      saveSystemData({ sections: updated.sections });
      return updated;
    });
  };

  const addLocation = (name: string) => {
    const newLoc = { id: Math.random().toString(36).substr(2, 9), name };
    setData(prev => {
      const updated = { ...prev, locations: [...prev.locations, newLoc] };
      saveSystemData({ locations: updated.locations });
      return updated;
    });
  };

  const updateLocation = (id: string, name: string) => {
    setData(prev => {
      const updated = { ...prev, locations: prev.locations.map(l => l.id === id ? { ...l, name } : l) };
      saveSystemData({ locations: updated.locations });
      return updated;
    });
  };

  const deleteLocation = (id: string) => {
    setData(prev => {
      const updated = { ...prev, locations: prev.locations.filter(l => l.id !== id) };
      saveSystemData({ locations: updated.locations });
      return updated;
    });
  };

  const addStatusOption = (name: string) => {
    const newOpt = { id: Math.random().toString(36).substr(2, 9), name };
    setData(prev => {
      const updated = { ...prev, statusOptions: [...prev.statusOptions, newOpt] };
      saveSystemData({ statusOptions: updated.statusOptions });
      return updated;
    });
  };

  const updateStatusOption = (id: string, name: string) => {
    setData(prev => {
      const updated = { ...prev, statusOptions: prev.statusOptions.map(o => o.id === id ? { ...o, name } : o) };
      saveSystemData({ statusOptions: updated.statusOptions });
      return updated;
    });
  };

  const deleteStatusOption = (id: string) => {
    setData(prev => {
      const updated = { ...prev, statusOptions: prev.statusOptions.filter(o => o.id !== id) };
      saveSystemData({ statusOptions: updated.statusOptions });
      return updated;
    });
  };

  const addUser = (userData: Omit<User, 'id'>) => {
    const newUser = { ...userData, id: Math.random().toString(36).substr(2, 9) };
    setData(prev => {
      const updated = { ...prev, users: [...prev.users, newUser] };
      saveSystemData({ users: updated.users });
      return updated;
    });
  };

  const importUsers = (newUsersData: Omit<User, 'id'>[]) => {
    setData(prev => {
      const newUsers = newUsersData.map(u => ({ ...u, id: Math.random().toString(36).substr(2, 9) }));
      const updated = { ...prev, users: [...prev.users, ...newUsers] };
      saveSystemData({ users: updated.users });
      return updated;
    });
  };

  const updateUser = (id: string, userData: Partial<User>) => {
    setData(prev => {
      const updated = { ...prev, users: prev.users.map(u => u.id === id ? { ...u, ...userData } : u) };
      saveSystemData({ users: updated.users });
      return updated;
    });
  };

  const deleteUser = (id: string) => {
    setData(prev => {
      const updated = { ...prev, users: prev.users.filter(u => u.id !== id) };
      saveSystemData({ users: updated.users });
      return updated;
    });
  };

  const addPosition = (name: string) => {
    const newPos = { id: Math.random().toString(36).substr(2, 9), name };
    setData(prev => {
      const updated = { ...prev, positions: [...prev.positions, newPos] };
      saveSystemData({ positions: updated.positions });
      return updated;
    });
  };

  const updatePosition = (id: string, name: string) => {
    setData(prev => {
      const updated = { ...prev, positions: prev.positions.map(p => p.id === id ? { ...p, name } : p) };
      saveSystemData({ positions: updated.positions });
      return updated;
    });
  };

  const deletePosition = (id: string) => {
    setData(prev => {
      const updated = { ...prev, positions: prev.positions.filter(p => p.id !== id) };
      saveSystemData({ positions: updated.positions });
      return updated;
    });
  };

  const updateSystemConfig = (newConfig: Partial<SystemConfig>) => {
    setData(prev => {
      const updated = { ...prev, systemConfig: { ...prev.systemConfig, ...newConfig } };
      saveSystemData({ systemConfig: updated.systemConfig });
      return updated;
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
