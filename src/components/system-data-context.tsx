
"use client";

import React, { createContext, useContext, useMemo } from 'react';
import { User, Division, Section, Location, StatusOption, Position, BrandingConfig } from '@/lib/types';
import { useCollection, useDoc, useFirestore } from '@/firebase';
import { collection, doc, setDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';

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
  const db = useFirestore();

  const { data: divisions = [], loading: ld1 } = useCollection<Division>(db ? collection(db, 'divisions') : null);
  const { data: sections = [], loading: ld2 } = useCollection<Section>(db ? collection(db, 'sections') : null);
  const { data: locations = [], loading: ld3 } = useCollection<Location>(db ? collection(db, 'locations') : null);
  const { data: statusOptions = [], loading: ld4 } = useCollection<StatusOption>(db ? collection(db, 'statusOptions') : null);
  const { data: users = [], loading: ld5 } = useCollection<User>(db ? collection(db, 'users') : null);
  const { data: positions = [], loading: ld6 } = useCollection<Position>(db ? collection(db, 'positions') : null);

  const isLoading = ld1 || ld2 || ld3 || ld4 || ld5 || ld6;

  const handleMutation = (ref: any, data: any, op: 'create' | 'update' | 'delete') => {
    if (op === 'delete') {
      deleteDoc(ref).catch(async () => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({ path: ref.path, operation: op }));
      });
    } else {
      setDoc(ref, data, { merge: op === 'update' }).catch(async () => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({ path: ref.path, operation: op, requestResourceData: data }));
      });
    }
  };

  const addDivision = (name: string) => {
    if (!db) return;
    const ref = doc(collection(db, 'divisions'));
    handleMutation(ref, { id: ref.id, name }, 'create');
  };

  const updateDivision = (id: string, name: string) => {
    if (!db) return;
    handleMutation(doc(db, 'divisions', id), { name }, 'update');
  };

  const deleteDivision = (id: string) => {
    if (!db) return;
    handleMutation(doc(db, 'divisions', id), null, 'delete');
  };

  const addSection = (name: string, divisionId: string) => {
    if (!db) return;
    const ref = doc(collection(db, 'sections'));
    handleMutation(ref, { id: ref.id, name, divisionId }, 'create');
  };

  const updateSection = (id: string, name: string, divisionId: string) => {
    if (!db) return;
    handleMutation(doc(db, 'sections', id), { name, divisionId }, 'update');
  };

  const deleteSection = (id: string) => {
    if (!db) return;
    handleMutation(doc(db, 'sections', id), null, 'delete');
  };

  const addLocation = (name: string) => {
    if (!db) return;
    const ref = doc(collection(db, 'locations'));
    handleMutation(ref, { id: ref.id, name }, 'create');
  };

  const updateLocation = (id: string, name: string) => {
    if (!db) return;
    handleMutation(doc(db, 'locations', id), { name }, 'update');
  };

  const deleteLocation = (id: string) => {
    if (!db) return;
    handleMutation(doc(db, 'locations', id), null, 'delete');
  };

  const addStatusOption = (name: string) => {
    if (!db) return;
    const ref = doc(collection(db, 'statusOptions'));
    handleMutation(ref, { id: ref.id, name }, 'create');
  };

  const updateStatusOption = (id: string, name: string) => {
    if (!db) return;
    handleMutation(doc(db, 'statusOptions', id), { name }, 'update');
  };

  const deleteStatusOption = (id: string) => {
    if (!db) return;
    handleMutation(doc(db, 'statusOptions', id), null, 'delete');
  };

  const addUser = (userData: Omit<User, 'id'>) => {
    if (!db) return;
    const ref = doc(collection(db, 'users'));
    handleMutation(ref, { ...userData, id: ref.id }, 'create');
  };

  const updateUser = (id: string, userData: Partial<User>) => {
    if (!db) return;
    handleMutation(doc(db, 'users', id), userData, 'update');
  };

  const deleteUser = (id: string) => {
    if (!db) return;
    handleMutation(doc(db, 'users', id), null, 'delete');
  };

  const addPosition = (name: string) => {
    if (!db) return;
    const ref = doc(collection(db, 'positions'));
    handleMutation(ref, { id: ref.id, name }, 'create');
  };

  const updatePosition = (id: string, name: string) => {
    if (!db) return;
    handleMutation(doc(db, 'positions', id), { name }, 'update');
  };

  const deletePosition = (id: string) => {
    if (!db) return;
    handleMutation(doc(db, 'positions', id), null, 'delete');
  };

  return (
    <SystemDataContext.Provider value={{ 
      divisions, sections, locations, statusOptions, users, positions, isLoading,
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
