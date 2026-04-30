
"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Division, Section, Location, StatusOption } from '@/lib/types';
import { getSystemData, saveSystemData } from '@/app/actions/db-actions';

interface SystemDataContextType {
  divisions: Division[];
  sections: Section[];
  locations: Location[];
  statusOptions: StatusOption[];
  users: User[];
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
  isLoading: boolean;
}

const SystemDataContext = createContext<SystemDataContextType | undefined>(undefined);

export function SystemDataProvider({ children }: { children: React.ReactNode }) {
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [statusOptions, setStatusOptions] = useState<StatusOption[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await getSystemData();
        setDivisions(data.divisions);
        setSections(data.sections);
        setLocations(data.locations);
        setStatusOptions(data.statusOptions);
        setUsers(data.users);
      } catch (e) {
        console.error("Failed to load system data from server", e);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  const addDivision = async (name: string) => {
    const newDiv = { id: Math.random().toString(36).substr(2, 9), name };
    const next = [...divisions, newDiv];
    setDivisions(next);
    await saveSystemData({ divisions: next });
  };

  const updateDivision = async (id: string, name: string) => {
    const next = divisions.map(d => d.id === id ? { ...d, name } : d);
    setDivisions(next);
    await saveSystemData({ divisions: next });
  };

  const deleteDivision = async (id: string) => {
    const nextDivs = divisions.filter(d => d.id !== id);
    const nextSecs = sections.filter(s => s.divisionId !== id);
    setDivisions(nextDivs);
    setSections(nextSecs);
    await saveSystemData({ divisions: nextDivs, sections: nextSecs });
  };

  const addSection = async (name: string, divisionId: string) => {
    const newSec = { id: Math.random().toString(36).substr(2, 9), name, divisionId };
    const next = [...sections, newSec];
    setSections(next);
    await saveSystemData({ sections: next });
  };

  const updateSection = async (id: string, name: string, divisionId: string) => {
    const next = sections.map(s => s.id === id ? { ...s, name, divisionId } : s);
    setSections(next);
    await saveSystemData({ sections: next });
  };

  const deleteSection = async (id: string) => {
    const next = sections.filter(s => s.id !== id);
    setSections(next);
    await saveSystemData({ sections: next });
  };

  const addLocation = async (name: string) => {
    const newLoc = { id: Math.random().toString(36).substr(2, 9), name };
    const next = [...locations, newLoc];
    setLocations(next);
    await saveSystemData({ locations: next });
  };

  const updateLocation = async (id: string, name: string) => {
    const next = locations.map(l => l.id === id ? { ...l, name } : l);
    setLocations(next);
    await saveSystemData({ locations: next });
  };

  const deleteLocation = async (id: string) => {
    const next = locations.filter(l => l.id !== id);
    setLocations(next);
    await saveSystemData({ locations: next });
  };

  const addStatusOption = async (name: string) => {
    const newStatus = { id: Math.random().toString(36).substr(2, 9), name };
    const next = [...statusOptions, newStatus];
    setStatusOptions(next);
    await saveSystemData({ statusOptions: next });
  };

  const updateStatusOption = async (id: string, name: string) => {
    const next = statusOptions.map(s => s.id === id ? { ...s, name } : s);
    setStatusOptions(next);
    await saveSystemData({ statusOptions: next });
  };

  const deleteStatusOption = async (id: string) => {
    const next = statusOptions.filter(s => s.id !== id);
    setStatusOptions(next);
    await saveSystemData({ statusOptions: next });
  };

  const addUser = async (user: Omit<User, 'id'>) => {
    const newUser = { ...user, id: Math.random().toString(36).substr(2, 9) };
    const next = [...users, newUser];
    setUsers(next);
    await saveSystemData({ users: next });
  };

  const updateUser = async (id: string, user: Partial<User>) => {
    const next = users.map(u => u.id === id ? { ...u, ...user } : u);
    setUsers(next);
    await saveSystemData({ users: next });
  };

  const deleteUser = async (id: string) => {
    const next = users.filter(u => u.id !== id);
    setUsers(next);
    await saveSystemData({ users: next });
  };

  return (
    <SystemDataContext.Provider value={{ 
      divisions, sections, locations, statusOptions, users, isLoading,
      addDivision, updateDivision, deleteDivision,
      addSection, updateSection, deleteSection,
      addLocation, updateLocation, deleteLocation,
      addStatusOption, updateStatusOption, deleteStatusOption,
      addUser, updateUser, deleteUser
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
