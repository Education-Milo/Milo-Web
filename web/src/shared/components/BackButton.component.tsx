import React from 'react';
import { ArrowLeft } from 'lucide-react';

interface BackButtonProps {
  onClick: () => void;
  disabled?: boolean;
}

export const BackButton: React.FC<BackButtonProps> = ({ onClick, disabled }) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        background: 'none',
        border: 'none',
        cursor: disabled ? 'not-allowed' : 'pointer',
        padding: '0.5rem',
        borderRadius: '0.5rem',
        transition: 'background-color 0.2s',
        opacity: disabled ? 0.5 : 1
      }}
      onMouseEnter={(e) => {
        if (!disabled) (e.target as HTMLButtonElement).style.backgroundColor = '#f3f4f6';
      }}
      onMouseLeave={(e) => {
        if (!disabled) (e.target as HTMLButtonElement).style.backgroundColor = 'transparent';
      }}
    >
      <ArrowLeft size={24} style={{ color: '#374151' }} />
    </button>
  );
};