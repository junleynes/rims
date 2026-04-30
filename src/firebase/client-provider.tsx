'use client';

import React, { useEffect, useState } from 'react';
import { initializeFirebase } from './index';
import { FirebaseProvider } from './provider';
import { type FirebaseApp } from 'firebase/app';
import { type Firestore } from 'firebase/firestore';
import { type Auth } from 'firebase/auth';

export function FirebaseClientProvider({ children }: { children: React.ReactNode }) {
  const [instances, setInstances] = useState<{
    firebaseApp: FirebaseApp;
    db: Firestore;
    auth: Auth;
  } | null>(null);

  useEffect(() => {
    const { firebaseApp, db, auth } = initializeFirebase();
    setInstances({ firebaseApp, db, auth });
  }, []);

  if (!instances) return null;

  return (
    <FirebaseProvider
      firebaseApp={instances.firebaseApp}
      firestore={instances.db}
      auth={instances.auth}
    >
      {children}
    </FirebaseProvider>
  );
}
