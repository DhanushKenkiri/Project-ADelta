import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from 'firebase/auth';
import { onAuthChange, getCurrentUser, signOut, isFirebaseConfigured } from './firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
  isFirebaseInitialized: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFirebaseInitialized, setIsFirebaseInitialized] = useState(isFirebaseConfigured);

  useEffect(() => {
    if (!isFirebaseConfigured) {
      console.warn('Firebase is not configured. Skipping authentication setup.');
      setLoading(false);
      return () => {};
    }

    try {
      // Get initial user state if available
      const initialUser = getCurrentUser();
      if (initialUser) {
        setUser(initialUser);
      }

      // Set up auth change listener
      const unsubscribe = onAuthChange((user) => {
        setUser(user);
        setLoading(false);
      });
      
      return () => unsubscribe();
    } catch (error) {
      console.error('Auth initialization error:', error);
      setIsFirebaseInitialized(false);
      setLoading(false);
      return () => {}; // Return empty cleanup function
    }
  }, []);

  const handleSignOut = async () => {
    if (!isFirebaseInitialized) {
      console.warn('Cannot sign out: Firebase is not initialized');
      return Promise.resolve();
    }
    
    try {
      await signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      signOut: handleSignOut,
      isFirebaseInitialized 
    }}>
      {children}
    </AuthContext.Provider>
  );
} 