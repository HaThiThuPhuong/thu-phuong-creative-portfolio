import React from 'react';
import { motion } from 'motion/react';
import { ModeToggle } from './ModeToggle';
import { useTheme } from '../context/ThemeContext';
import { loginWithGoogle, logout } from '../lib/firebase';
import { LogIn, LogOut, User as UserIcon } from 'lucide-react';

import { BrandLogo } from './BrandLogo';

export const Navigation = () => {
  const { isModelMode, user, isAdmin } = useTheme();

  return (
    <nav className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] w-full max-w-6xl px-4 pointer-events-none">
      <div className="bg-white/20 backdrop-blur-xl px-4 md:px-8 h-[70px] rounded-[30px] flex items-center justify-between border border-white/30 shadow-2xl pointer-events-auto">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center flex-shrink-0"
        >
          <BrandLogo hideStroke={true} className="text-[var(--accent)] scale-[1.3] md:scale-[1.5] -translate-y-2 translate-x-2" />
        </motion.div>

        <div className="hidden lg:flex gap-3 xl:gap-5 items-center text-[9px] xl:text-[10px] font-bold uppercase tracking-[0.1em] xl:tracking-[0.15em] opacity-60">
          <a href="#" className="hover:text-[var(--accent)] transition-colors whitespace-nowrap">Home</a>
          {isModelMode ? (
            <>
              <a href="#visual-diary" className="hover:text-[var(--accent)] transition-colors whitespace-nowrap">Visual Diary</a>
              <a href="#lookbook" className="hover:text-[var(--accent)] transition-colors whitespace-nowrap">Summer Lookbook</a>
              <a href="#availability" className="hover:text-[var(--accent)] transition-colors whitespace-nowrap">Availability</a>
              <a href="#model-services" className="hover:text-[var(--accent)] transition-colors whitespace-nowrap">Services</a>
              <a href="#upcoming-concepts" className="hover:text-[var(--accent)] transition-colors whitespace-nowrap">Upcoming Concepts</a>
            </>
          ) : (
            <>
              <a href="#professional-overview" className="hover:text-[var(--accent)] transition-colors whitespace-nowrap">About BA</a>
              <a href="#experience" className="hover:text-[var(--accent)] transition-colors whitespace-nowrap">Experience</a>
              <a href="#projects" className="hover:text-[var(--accent)] transition-colors whitespace-nowrap">Projects</a>
              <a href="#ba-services" className="hover:text-[var(--accent)] transition-colors whitespace-nowrap">Expertise</a>
              <a href="#ba-memories" className="hover:text-[var(--accent)] transition-colors whitespace-nowrap">Life & Hobbies</a>
            </>
          )}
          <a href="https://zalo.me/0325706636" target="_blank" rel="noopener noreferrer" className="hover:text-[var(--accent)] transition-colors whitespace-nowrap border-l border-white/10 pl-4 xl:pl-8">Contact</a>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            {user ? (
              <div className="flex items-center gap-2">
                {user.photoURL ? (
                  <img src={user.photoURL} alt="User" className="w-8 h-8 rounded-full border border-white/30" />
                ) : (
                  <UserIcon size={18} className="text-white/60" />
                )}
                {isAdmin && <span className="bg-green-500 w-2 h-2 rounded-full" title="Admin Mode" />}
                <button 
                  onClick={() => logout()} 
                  className="text-white/40 hover:text-red-400 transition-colors"
                  title="Logout"
                >
                  <LogOut size={18} />
                </button>
              </div>
            ) : (
              <button 
                onClick={() => loginWithGoogle()}
                className="text-white/40 hover:text-white transition-colors flex items-center gap-2 text-[10px] uppercase font-bold tracking-widest"
                title="Login to edit"
              >
                <LogIn size={18} />
                <span className="hidden sm:inline">Admin</span>
              </button>
            )}
          </div>
          <ModeToggle />
        </div>
      </div>
    </nav>
  );
};
