import React from 'react';

interface AuthErrorMessageProps {
  message: string;
}

export const AuthErrorMessage: React.FC<AuthErrorMessageProps> = ({ message }) => {
  if (!message) return null;

  return (
    <div style={{
      padding: '0.75rem',
      backgroundColor: '#fef2f2',
      border: '1px solid #fecaca',
      borderRadius: '0.5rem',
      marginBottom: '1rem'
    }}>
      <p style={{ color: '#dc2626', fontSize: '0.875rem', margin: 0 }}>
        {message}
      </p>
    </div>
  );
};