
"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Division, Section, Location, StatusOption, Position } from '@/lib/types';
import { getSystemData, saveSystemData } from '@/app/actions/db-actions';

interface SystemDataContextType {
  divisions: Division[];
  sections: Section[];
  locations: Location[];
  statusOptions: StatusOption[];
  users: User[];
  positions: Position[];
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
  updateUser: (id: string, user: Partial<User>) => void;
  deleteUser: (id: string) => void;
  addPosition: (name: string) => void;
  updatePosition: (id: string, name: string) => void;
  deletePosition: (id: string) => void;
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
  }>({
    divisions: [],
    sections: [],
    locations: [],
    statusOptions: [],
    users: [],
    positions: []
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const result = await getSystemData();
      setData(result);
      setIsLoading(false);
    }
    load();
  }, []);

  const sync = async (update: any) => {
    const newData = { ...data, ...update };
    setData(newData);
    await saveSystemData(update);
  };

  const addDivision = (name: string) => {
    const newDiv = { id: Math.random().toString(36).substr(2, 9), name };
    sync({ divisions: [...data.divisions, newDiv] });
  };

  const updateDivision = (id: string, name: string) => {
    sync({ divisions: data.divisions.map(d => d.id === id ? { ...d, name } : d) });
  };

  const deleteDivision = (id: string) => {
    sync({ divisions: data.divisions.filter(d => d.id !== id) });
  };

  const addSection = (name: string, divisionId: string) => {
    const newSec = { id: Math.random().toString(36).substr(2, 9), name, divisionId };
    sync({ sections: [...data.sections, newSec] });
  };

  const updateSection = (id: string, name: string, divisionId: string) => {
    sync({ sections: data.sections.map(s => s.id === id ? { ...s, name, divisionId } : s) });
  };

  const deleteSection = (id: string) => {
    sync({ sections: data.sections.filter(s => s.id !== id) });
  };

  const addLocation = (name: string) => {
    const newLoc = { id: Math.random().toString(36).substr(2, 9), name };
    sync({ locations: [...data.locations, newLoc] });
  };

  const updateLocation = (id: string, name: string) => {
    sync({ locations: data.locations.map(l => l.id === id ? { ...l, name } : l) });
  };

  const deleteLocation = (id: string) => {
    sync({ locations: data.locations.filter(l => l.id !== id) });
  };

  const addStatusOption = (name: string) => {
    const newOpt = { id: Math.random().toString(36).substr(2, 9), name };
    sync({ statusOptions: [...data.statusOptions, newOpt] });
  };

  const updateStatusOption = (id: string, name: string) => {
    sync({ statusOptions: data.statusOptions.map(o => o.id === id ? { ...o, name } : o) });
  };

  const deleteStatusOption = (id: string) => {
    sync({ statusOptions: data.statusOptions.filter(o => o.id !== id) });
  };

  const addUser = (userData: Omit<User, 'id'>) => {
    const newUser = { ...userData, id: Math.random().toString(36).substr(2, 9) };
    sync({ users: [...data.users, newUser] });
  };

  const updateUser = (id: string, userData: Partial<User>) => {
    sync({ users: data.users.map(u => u.id === id ? { ...u, ...userData } : u) });
  };

  const deleteUser = (id: string) => {
    sync({ users: data.users.filter(u => u.id !== id) });
  };

  const addPosition = (name: string) => {
    const newPos = { id: Math.random().toString(36).substr(2, 9), name };
    sync({ positions: [...data.positions, newPos] });
  };

  const updatePosition = (id: string, name: string) => {
    sync({ positions: data.positions.map(p => p.id === id ? { ...p, name } : p) });
  };

  const deletePosition = (id: string) => {
    sync({ positions: data.positions.filter(p => p.id !== id) });
  };

  return (
    <SystemDataContext.Provider value={{ 
      ...data, isLoading,
      addDivision, updateDivision, deleteDivision,
      addSection, updateSection, deleteSection,
      addLocation, updateLocation, deleteLocation,
      addStatusOption, updateStatusOption, deleteStatusOption,
      addUser, updateUser, deleteUser,
      addPosition, updatePosition, deletePosition
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
