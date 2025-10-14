import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../../contexts/ThemeContext';
import { useColors } from '@styles/themes/colors';

const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const colors = useColors();

  return (
    <button
      onClick={toggleTheme}
      className="theme-toggle"
      style={{
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        padding: '8px',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.2s ease',
        color: colors.text.secondary,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = colors.primaryLight;
        e.currentTarget.style.color = colors.primary;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'transparent';
        e.currentTarget.style.color = colors.text.secondary;
      }}
      title={`Basculer vers le mode ${theme === 'light' ? 'sombre' : 'clair'}`}
    >
      {theme === 'light' ? (
        <Moon size={20} />
      ) : (
        <Sun size={20} />
      )}
    </button>
  );
};

export default ThemeToggle;

