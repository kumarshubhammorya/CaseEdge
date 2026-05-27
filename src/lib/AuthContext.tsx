import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth } from './firebase';
import { 
  onAuthStateChanged, 
  User, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithRedirect,
  signOut, 
  signInAnonymously, 
  linkWithPopup,
  linkWithRedirect,
  getRedirectResult
} from 'firebase/auth';

const AuthContext = createContext<{ 
  user: User | null; 
  accessToken: string | null;
  loading: boolean;
  signIn: () => Promise<void>; 
  logout: () => Promise<void>; 
  requestSlidesAccess: () => Promise<string>;
}>({ 
  user: null, 
  accessToken: null,
  loading: true,
  signIn: async () => {}, 
  logout: async () => {},
  requestSlidesAccess: async () => ""
});

let cachedAccessToken: string | null = null;
export const getAccessToken = () => cachedAccessToken;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Process redirect sign-in outcome on mount
    getRedirectResult(auth)
      .then((result) => {
        if (result) {
          const credential = GoogleAuthProvider.credentialFromResult(result);
          if (credential?.accessToken) {
            cachedAccessToken = credential.accessToken;
            setAccessToken(credential.accessToken);
          }
        }
      })
      .catch((err) => {
        console.error("Google OAuth redirect resolution error:", err);
      });

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
    // Request only public, non-sensitive scopes for standard login to bypass "Unverified App" screen
    provider.setCustomParameters({ prompt: 'select_account' });
    
    try {
      let result;
      if (auth.currentUser && auth.currentUser.isAnonymous) {
        try {
          result = await linkWithPopup(auth.currentUser, provider);
        } catch (linkError: any) {
          if (linkError.code === 'auth/popup-blocked') {
            console.warn("Google popup blocked. Falling back to redirect linking...");
            await linkWithRedirect(auth.currentUser, provider);
            return;
          }
          if (linkError.code === 'auth/credential-already-in-use' || linkError.code === 'auth/email-already-in-use') {
            console.warn("Google account already linked to another user. Logging in directly.");
            try {
              result = await signInWithPopup(auth, provider);
            } catch (signInError: any) {
              if (signInError.code === 'auth/popup-blocked') {
                console.warn("Google popup blocked. Falling back to redirect sign-in...");
                await signInWithRedirect(auth, provider);
                return;
              }
              throw signInError;
            }
          } else {
            throw linkError;
          }
        }
      } else {
        try {
          result = await signInWithPopup(auth, provider);
        } catch (signInError: any) {
          if (signInError.code === 'auth/popup-blocked') {
            console.warn("Google popup blocked. Falling back to redirect sign-in...");
            await signInWithRedirect(auth, provider);
            return;
          }
          throw signInError;
        }
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

  const requestSlidesAccess = async (): Promise<string> => {
    const provider = new GoogleAuthProvider();
    // Request Slides and Drive scopes incrementally when needed
    provider.addScope('https://www.googleapis.com/auth/presentations');
    provider.addScope('https://www.googleapis.com/auth/drive.file');
    provider.setCustomParameters({ prompt: 'select_account' });
    
    try {
      let result;
      if (auth.currentUser) {
        try {
          result = await linkWithPopup(auth.currentUser, provider);
        } catch (linkError: any) {
          if (linkError.code === 'auth/popup-blocked') {
            console.warn("Popup blocked for slides scope. Redirecting...");
            await linkWithRedirect(auth.currentUser, provider);
            return "";
          }
          if (linkError.code === 'auth/credential-already-in-use' || linkError.code === 'auth/email-already-in-use') {
            try {
              result = await signInWithPopup(auth, provider);
            } catch (signInError: any) {
              if (signInError.code === 'auth/popup-blocked') {
                console.warn("Popup blocked for slides scope. Redirecting...");
                await signInWithRedirect(auth, provider);
                return "";
              }
              throw signInError;
            }
          } else {
            throw linkError;
          }
        }
      } else {
        try {
          result = await signInWithPopup(auth, provider);
        } catch (signInError: any) {
          if (signInError.code === 'auth/popup-blocked') {
            console.warn("Popup blocked for slides scope. Redirecting...");
            await signInWithRedirect(auth, provider);
            return "";
          }
          throw signInError;
        }
      }
      
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (credential?.accessToken) {
        cachedAccessToken = credential.accessToken;
        setAccessToken(credential.accessToken);
        return credential.accessToken;
      }
      throw new Error("No access token obtained");
    } catch (error) {
      console.error("Incremental authorization for slides failed:", error);
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

  return <AuthContext.Provider value={{ user, accessToken, loading, signIn, logout, requestSlidesAccess }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
