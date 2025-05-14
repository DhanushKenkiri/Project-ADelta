import { initializeApp, FirebaseApp } from 'firebase/app';
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged,
  User,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';

// Firebase configuration - removing storage bucket which is limited on Spark plan
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Variables to track initialization status
let app: FirebaseApp | undefined;
let isInitialized = false;

// Initialize Firebase
try {
  if (
    firebaseConfig.apiKey &&
    firebaseConfig.authDomain &&
    firebaseConfig.projectId
  ) {
    app = initializeApp(firebaseConfig);
    isInitialized = true;
    console.log('Firebase initialized successfully');
  } else {
    console.warn('Firebase config is incomplete. Authentication is disabled.');
  }
} catch (error) {
  console.error('Firebase initialization error:', error);
}

/**
 * Check if Firebase is properly configured and initialized
 */
export const isFirebaseConfigured = isInitialized;

// Authentication Functions

/**
 * Register a new user with email and password
 * @param email User email
 * @param password User password
 * @param displayName Optional display name
 * @returns Firebase user
 */
export const registerUser = async (email: string, password: string, displayName?: string): Promise<User> => {
  if (!isInitialized) {
    console.error('Firebase is not initialized. Cannot register user.');
    throw new Error('Firebase not initialized');
  }
  
  try {
    const auth = getAuth(app);
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    // Update profile if display name is provided
    if (displayName && userCredential.user) {
      await updateProfile(userCredential.user, { displayName });
    }
    
    return userCredential.user;
  } catch (error: any) {
    console.error('Registration error:', error);
    throw new Error(error.message || 'Failed to register user');
  }
};

/**
 * Sign in with email and password
 * @param email User email
 * @param password User password
 * @returns Firebase user
 */
export const signInWithEmail = async (email: string, password: string): Promise<User> => {
  if (!isInitialized) {
    console.error('Firebase is not initialized. Cannot sign in.');
    throw new Error('Firebase not initialized');
  }
  
  try {
    const auth = getAuth(app);
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error: any) {
    console.error('Login error:', error);
    throw new Error(error.message || 'Failed to sign in');
  }
};

/**
 * Sign in with Google
 * @returns Firebase user
 */
export const signInWithGoogle = async (): Promise<User> => {
  if (!isInitialized) {
    console.error('Firebase is not initialized. Cannot sign in with Google.');
    throw new Error('Firebase not initialized');
  }
  
  try {
    const auth = getAuth(app);
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    return result.user;
  } catch (error: any) {
    console.error('Google sign in error:', error);
    throw new Error(error.message || 'Failed to sign in with Google');
  }
};

/**
 * Sign out the current user
 */
export const signOut = async (): Promise<void> => {
  if (!isInitialized) {
    console.error('Firebase is not initialized. Cannot sign out.');
    throw new Error('Firebase not initialized');
  }
  
  try {
    const auth = getAuth(app);
    await firebaseSignOut(auth);
  } catch (error: any) {
    console.error('Sign out error:', error);
    throw new Error(error.message || 'Failed to sign out');
  }
};

/**
 * Send password reset email
 * @param email User email
 */
export const resetPassword = async (email: string): Promise<void> => {
  if (!isInitialized) {
    console.error('Firebase is not initialized. Cannot reset password.');
    throw new Error('Firebase not initialized');
  }
  
  try {
    const auth = getAuth(app);
    await sendPasswordResetEmail(auth, email);
  } catch (error: any) {
    console.error('Password reset error:', error);
    throw new Error(error.message || 'Failed to send password reset email');
  }
};

/**
 * Get the current authenticated user
 * @returns Current user or null if not authenticated
 */
export const getCurrentUser = (): User | null => {
  if (!isInitialized) {
    console.warn('Firebase is not initialized. Cannot get current user.');
    return null;
  }
  
  const auth = getAuth(app);
  return auth.currentUser;
};

/**
 * Set up an observer for auth state changes
 * @param callback Function to call when auth state changes
 * @returns Unsubscribe function
 */
export const onAuthChange = (callback: (user: User | null) => void): (() => void) => {
  if (!isInitialized) {
    console.warn('Firebase is not initialized. Auth change listener not set up.');
    // Call the callback immediately with null user to indicate not authenticated
    callback(null);
    // Return a dummy unsubscribe function
    return () => {};
  }
  
  const auth = getAuth(app);
  return onAuthStateChanged(auth, callback);
};

export { app }; 