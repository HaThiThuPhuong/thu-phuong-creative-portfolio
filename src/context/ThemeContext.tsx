import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth } from '../lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';

interface ThemeContextType {
  isModelMode: boolean;
  isParticlesEnabled: boolean;
  isMuted: boolean;
  isAdmin: boolean;
  user: User | null;
  toggleMode: () => void;
  toggleParticles: () => void;
  toggleMute: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const ADMIN_EMAIL = 'thuphuong342005@gmail.com';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isModelMode, setIsModelMode] = useState(true);
  const [isParticlesEnabled, setIsParticlesEnabled] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setIsAdmin(firebaseUser?.email === ADMIN_EMAIL);
    });
    return () => unsubscribe();
  }, []);

  const toggleMode = () => {
    setIsModelMode((prev) => !prev);
  };

  const toggleParticles = () => {
    setIsParticlesEnabled((prev) => !prev);
  };

  const toggleMute = () => {
    setIsMuted((prev) => !prev);
  };

  useEffect(() => {
    if (isModelMode) {
      document.body.classList.remove('mode-ba');
      document.body.style.fontFamily = "'Playfair Display', serif";
    } else {
      document.body.classList.add('mode-ba');
      document.body.style.fontFamily = "'Inter', sans-serif";
    }
  }, [isModelMode]);

  return (
    <ThemeContext.Provider value={{ isModelMode, isParticlesEnabled, isMuted, isAdmin, user, toggleMode, toggleParticles, toggleMute }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
