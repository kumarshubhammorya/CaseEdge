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
  getRedirectResult,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  linkWithCredential,
  EmailAuthProvider
} from 'firebase/auth';

const AuthContext = createContext<{ 
  user: User | null; 
  emailVerified: boolean;
  accessToken: string | null;
  loading: boolean;
  signIn: () => Promise<void>; 
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  sendVerificationEmail: () => Promise<void>;
  checkVerificationStatus: () => Promise<boolean>;
  logout: () => Promise<void>; 
  requestSlidesAccess: () => Promise<string>;
}>({ 
  user: null, 
  emailVerified: false,
  accessToken: null,
  loading: true,
  signIn: async () => {}, 
  signUpWithEmail: async () => {},
  signInWithEmail: async () => {},
  sendVerificationEmail: async () => {},
  checkVerificationStatus: async () => false,
  logout: async () => {},
  requestSlidesAccess: async () => ""
});

let cachedAccessToken: string | null = null;
export const getAccessToken = () => cachedAccessToken;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [emailVerified, setEmailVerified] = useState(false);
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
      .catch(async (err) => {
        console.error("Google OAuth redirect resolution error:", err);
        if (err.code === 'auth/credential-already-in-use' || err.code === 'auth/email-already-in-use') {
          console.warn("Credential already in use during redirect resolution. Attempting direct redirect sign-in.");
          const provider = new GoogleAuthProvider();
          provider.setCustomParameters({ prompt: 'select_account' });
          try {
            await signInWithRedirect(auth, provider);
          } catch (signInErr) {
            console.error("Direct redirect sign-in failed:", signInErr);
          }
        }
      });

    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setEmailVerified(u ? u.emailVerified : false);
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
    provider.setCustomParameters({ prompt: 'select_account' });
    
    try {
      if (auth.currentUser && auth.currentUser.isAnonymous) {
        console.log("Redirect linking anonymous user...");
        await linkWithRedirect(auth.currentUser, provider);
      } else {
        console.log("Redirect signing in user...");
        await signInWithRedirect(auth, provider);
      }
    } catch (error) {
      console.error("Sign in initialization failed", error);
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

  const signUpWithEmail = async (email: string, password: string) => {
    try {
      if (auth.currentUser && auth.currentUser.isAnonymous) {
        // Link the anonymous account to avoid losing data
        const credential = EmailAuthProvider.credential(email, password);
        await linkWithCredential(auth.currentUser, credential);
        await sendEmailVerification(auth.currentUser);
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await sendEmailVerification(userCredential.user);
      }
    } catch (error) {
      console.error("Email sign up failed", error);
      throw error;
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error("Email sign in failed", error);
      throw error;
    }
  };

  const sendVerificationEmail = async () => {
    try {
      if (auth.currentUser) {
        await sendEmailVerification(auth.currentUser);
      }
    } catch (error) {
      console.error("Resending verification email failed", error);
      throw error;
    }
  };

  const checkVerificationStatus = async (): Promise<boolean> => {
    try {
      if (auth.currentUser) {
        await auth.currentUser.reload();
        const updatedUser = auth.currentUser;
        setUser(updatedUser);
        setEmailVerified(updatedUser.emailVerified);
        return updatedUser.emailVerified;
      }
      return false;
    } catch (error) {
      console.error("Checking verification status failed", error);
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

  return (
    <AuthContext.Provider
      value={{
        user,
        emailVerified,
        accessToken,
        loading,
        signIn,
        signUpWithEmail,
        signInWithEmail,
        sendVerificationEmail,
        checkVerificationStatus,
        logout,
        requestSlidesAccess,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
