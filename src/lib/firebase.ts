
// Firebase stands in as a local mock since we are moving completely to SQLite
// to avoid Quota Exceeded errors.
import { getMe, login as apiLogin, logout as apiLogout } from '../services/api';

export let currentUser: any = null;
let authStateListener: ((user: any) => void) | null = null;

export const auth = {
  get currentUser() {
    return currentUser;
  }
};

// Mock Auth functions
export const setLocalUser = (user: any) => {
  currentUser = user;
  if (authStateListener) authStateListener(currentUser);
};

export const loginWithGoogle = async () => {
  // This is now handled by LoginModal, but keep as fallback or trigger
  console.log('Login triggered');
};

export const logout = async () => {
  await apiLogout();
  currentUser = null;
  if (authStateListener) authStateListener(null);
};

// Mock Auth listener
export const onAuthStateChanged = (_authObj: any, callback: (user: any) => void) => {
  authStateListener = callback;
  
  // Initialize by checking current token
  getMe().then(user => {
    currentUser = user;
    callback(user);
  }).catch(() => {
    currentUser = null;
    callback(null);
  });
  
  return () => { 
    if (authStateListener === callback) authStateListener = null; 
  };
};

export const db = {};
