import React from 'react';
import type { UserRole } from '../../../types/auth.types';

interface RoleSelectorProps {
  selectedRole: string;
  onRoleSelect: (role: string) => void;
  error?: string;
  disabled?: boolean;
}

const ROLES: UserRole[] = ['Élève', 'Parent', 'Professeur'];

export const RoleSelector: React.FC<RoleSelectorProps> = ({
  selectedRole,
  onRoleSelect,
  error,
  disabled
}) => {
  return (
    <div style={{ marginTop: '1.5rem' }}>
      <h3 style={{ 
        fontSize: '1rem', 
        fontWeight: '600', 
        color: '#1f2937', 
        marginBottom: '1rem',
        textAlign: 'center'
      }}>
        Sélectionnez votre rôle :
      </h3>
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(3, 1fr)', 
        gap: '0.75rem' 
      }}>
        {ROLES.map((role) => (
          <button
            key={role}
            onClick={() => onRoleSelect(role)}
            disabled={disabled}
            style={{
              padding: '0.75rem',
              borderRadius: '0.75rem',
              border: `2px solid ${selectedRole === role ? '#f97316' : '#e5e7eb'}`,
              backgroundColor: selectedRole === role ? '#fff7ed' : 'white',
              color: selectedRole === role ? '#ea580c' : '#374151',
              fontSize: '0.875rem',
              fontWeight: '500',
              cursor: disabled ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease-in-out',
              opacity: disabled ? 0.7 : 1
            }}
            onMouseEnter={(e) => {
              if (selectedRole !== role && !disabled) {
                (e.target as HTMLButtonElement).style.borderColor = '#d1d5db';
              }
            }}
            onMouseLeave={(e) => {
              if (selectedRole !== role && !disabled) {
                (e.target as HTMLButtonElement).style.borderColor = '#e5e7eb';
              }
            }}
          >
            {role}
          </button>
        ))}
      </div>
      {error && (
        <p className="error-message" style={{ marginTop: '0.5rem' }}>{error}</p>
      )}
    </div>
  );
};