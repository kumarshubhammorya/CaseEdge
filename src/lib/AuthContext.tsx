import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth } from './firebase';
import { onAuthStateChanged, User, GoogleAuthProvider, signInWithPopup, signOut, signInAnonymously, linkWithPopup } from 'firebase/auth';

const AuthContext = createContext<{ 
  user: User | null; 
  accessToken: string | null;
  loading: boolean;
  signIn: () => Promise<void>; 
  logout: () => Promise<void>; 
}>({ 
  user: null, 
  accessToken: null,
  loading: true,
  signIn: async () => {}, 
  logout: async () => {} 
});

let cachedAccessToken: string | null = null;
export const getAccessToken = () => cachedAccessToken;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (!u) {
        cachedAccessToken = null;
        setAccessToken(null);
        setLoading(true);
        // Automatically establish silent anonymous session if not logged in
        signInAnonymously(auth).catch((err) => {
          console.error("Failed silent anonymous sign in", err);
          setLoading(false);
        });
      } else {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const signIn = async () => {
    const provider = new GoogleAuthProvider();
    provider.addScope('https://www.googleapis.com/auth/presentations');
    provider.addScope('https://www.googleapis.com/auth/drive.file');
    provider.setCustomParameters({ prompt: 'select_account' });
    try {
      let result;
      if (auth.currentUser && auth.currentUser.isAnonymous) {
        try {
          result = await linkWithPopup(auth.currentUser, provider);
        } catch (linkError: any) {
          if (linkError.code === 'auth/credential-already-in-use' || linkError.code === 'auth/email-already-in-use') {
            console.warn("Google account already linked to another user. Logging in directly.");
            result = await signInWithPopup(auth, provider);
          } else {
            throw linkError;
          }
        }
      } else {
        result = await signInWithPopup(auth, provider);
      }
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (credential?.accessToken) {
        cachedAccessToken = credential.accessToken;
        setAccessToken(credential.accessToken);
      }
    } catch (error) {
      console.error("Sign in failed", error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      cachedAccessToken = null;
      setAccessToken(null);
    } catch (error) {
      console.error("Sign out failed", error);
    }
  };

  return <AuthContext.Provider value={{ user, accessToken, loading, signIn, logout }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
