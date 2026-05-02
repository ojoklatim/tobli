import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useStore } from '../store/useStore';
import { motion } from 'framer-motion';

export default function ThemeToggle() {
  const { theme, setTheme } = useStore();

  return (
    <button
      id="theme-toggle"
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="p-2.5 rounded-full transition-all duration-300 pointer-events-auto shadow-lg flex items-center justify-center active:scale-90 border border-white/10 dark:border-white/5 bg-white/10 dark:bg-neutral-800/80 backdrop-blur-md text-neutral-800 dark:text-white hover:bg-white/20 dark:hover:bg-neutral-700"
      title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
    >
      <motion.div
        initial={false}
        animate={{ rotate: theme === 'dark' ? 0 : 180, scale: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      >
        {theme === 'dark' ? <Moon size={18} /> : <Sun size={18} />}
      </motion.div>
    </button>
  );
}
