import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const ThemeToggle = ({ className = '', size = 'md', showLabel = false }) => {
  const { theme, isDark, toggleTheme } = useTheme();

  const iconSize = size === 'sm' ? 16 : size === 'lg' ? 20 : 18;

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`theme-toggle-btn ${className}`}
      title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
    >
      <div className="theme-toggle-icon-wrap">
        {isDark ? (
          <Sun size={iconSize} className="theme-toggle-icon sun-icon" />
        ) : (
          <Moon size={iconSize} className="theme-toggle-icon moon-icon" />
        )}
      </div>
      {showLabel && (
        <span className="theme-toggle-label">
          {isDark ? 'Light' : 'Dark'}
        </span>
      )}
    </button>
  );
};

export default ThemeToggle;
