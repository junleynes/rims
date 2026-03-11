
"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Division, Section, Location } from '@/lib/types';
import { DIVISIONS, SECTIONS, MOCK_USERS, DIVISION_SECTIONS_MAP } from '@/lib/mock-data';

interface SystemDataContextType {
  divisions: Division[];
  sections: Section[];
  locations: Location[];
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
  addUser: (user: Omit<User, 'id'>) => void;
  updateUser: (id: string, user: Partial<User>) => void;
  deleteUser: (id: string) => void;
}

const SystemDataContext = createContext<SystemDataContextType | undefined>(undefined);

export function SystemDataProvider({ children }: { children: React.ReactNode }) {
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    // Initial load from local storage or mock data
    const savedDivs = localStorage.getItem('rims_divisions');
    const savedSecs = localStorage.getItem('rims_sections');
    const savedLocs = localStorage.getItem('rims_locations');
    const savedUsers = localStorage.getItem('rims_users');

    if (savedDivs) setDivisions(JSON.parse(savedDivs));
    else {
      const initialDivs = DIVISIONS.map(d => ({ id: d.toLowerCase().replace(/\s+/g, '-'), name: d }));
      setDivisions(initialDivs);
    }

    if (savedSecs) setSections(JSON.parse(savedSecs));
    else {
      const initialSecs: Section[] = [];
      Object.entries(DIVISION_SECTIONS_MAP).forEach(([divName, secNames]) => {
        const divId = divName.toLowerCase().replace(/\s+/g, '-');
        secNames.forEach(s => {
          initialSecs.push({ id: s.toLowerCase().replace(/\s+/g, '-'), name: s, divisionId: divId });
        });
      });
      setSections(initialSecs);
    }

    if (savedLocs) setLocations(JSON.parse(savedLocs));
    else setLocations([{ id: 'main-office', name: 'Main Office' }, { id: 'broadcast-center', name: 'Broadcast Center' }]);

    if (savedUsers) setUsers(JSON.parse(savedUsers));
    else setUsers(MOCK_USERS);
  }, []);

  // Save to local storage on changes
  useEffect(() => {
    if (divisions.length) localStorage.setItem('rims_divisions', JSON.stringify(divisions));
    if (sections.length) localStorage.setItem('rims_sections', JSON.stringify(sections));
    if (locations.length) localStorage.setItem('rims_locations', JSON.stringify(locations));
    if (users.length) localStorage.setItem('rims_users', JSON.stringify(users));
  }, [divisions, sections, locations, users]);

  const addDivision = (name: string) => {
    const newDiv = { id: Math.random().toString(36).substr(2, 9), name };
    setDivisions(prev => [...prev, newDiv]);
  };

  const updateDivision = (id: string, name: string) => {
    setDivisions(prev => prev.map(d => d.id === id ? { ...d, name } : d));
  };

  const deleteDivision = (id: string) => {
    setDivisions(prev => prev.filter(d => d.id !== id));
    setSections(prev => prev.filter(s => s.divisionId !== id));
  };

  const addSection = (name: string, divisionId: string) => {
    const newSec = { id: Math.random().toString(36).substr(2, 9), name, divisionId };
    setSections(prev => [...prev, newSec]);
  };

  const updateSection = (id: string, name: string, divisionId: string) => {
    setSections(prev => prev.map(s => s.id === id ? { ...s, name, divisionId } : s));
  };

  const deleteSection = (id: string) => {
    setSections(prev => prev.filter(s => s.id !== id));
  };

  const addLocation = (name: string) => {
    const newLoc = { id: Math.random().toString(36).substr(2, 9), name };
    setLocations(prev => [...prev, newLoc]);
  };

  const updateLocation = (id: string, name: string) => {
    setLocations(prev => prev.map(l => l.id === id ? { ...l, name } : l));
  };

  const deleteLocation = (id: string) => {
    setLocations(prev => prev.filter(l => l.id !== id));
  };

  const addUser = (user: Omit<User, 'id'>) => {
    const newUser = { ...user, id: Math.random().toString(36).substr(2, 9) };
    setUsers(prev => [...prev, newUser]);
  };

  const updateUser = (id: string, user: Partial<User>) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, ...user } : u));
  };

  const deleteUser = (id: string) => {
    setUsers(prev => prev.filter(u => u.id !== id));
  };

  return (
    <SystemDataContext.Provider value={{ 
      divisions, sections, locations, users,
      addDivision, updateDivision, deleteDivision,
      addSection, updateSection, deleteSection,
      addLocation, updateLocation, deleteLocation,
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
