import { useColors } from '@styles/themes/colors';
import React from 'react';
import Typography from './Typography.component';
import { Loader2 } from 'lucide-react';
import { cn } from '../../../lib/utils';

interface MainButtonComponentProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
  className?: string;
  icon?: React.ReactNode;
}

const MainButtonComponent = (props: MainButtonComponentProps) => {
  const { title, onPress, className, loading, icon } = props;
  const colors = useColors();

  return (
    <button
      className={cn("main-button", className)}
      onClick={onPress}
      disabled={loading}
      style={{
        borderRadius: 9999,
        overflow: 'hidden',
        height: 48,
        width: '100%',
        background: `linear-gradient(135deg, ${colors.tertiary} 0%, ${colors.primary} 50%, ${colors.secondary} 100%)`,
        boxShadow: `0 2px 3.84px rgba(255, 140, 0, 0.25)`,
        border: 'none',
        cursor: loading ? 'not-allowed' : 'pointer',
        opacity: loading ? 0.7 : 1,
        transition: 'all 0.2s ease',
        transform: 'scale(1)'
      }}
      onMouseEnter={(e) => {
        if (!loading) {
          e.currentTarget.style.transform = 'scale(1.05)';
          e.currentTarget.style.boxShadow = `0 4px 8px rgba(255, 140, 0, 0.4)`;
        }
      }}
      onMouseLeave={(e) => {
        if (!loading) {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = `0 2px 3.84px rgba(255, 140, 0, 0.25)`;
        }
      }}
    >
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        borderRadius: 9999
      }}>
        {loading ? (
          <Loader2 size={20} color={colors.white} className="animate-spin" />
        ) : (
          <div style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {icon && (
              <div style={{ marginRight: 8, color: colors.white }}>
                {icon}
              </div>
            )}
            <Typography
              variant='button'
              color={colors.white}
              style={{
                textShadow: '0 1px 2px rgba(0, 0, 0, 0.25)',
                fontWeight: '600'
              }}
            >
              {title}
            </Typography>
          </div>
        )}
      </div>
    </button>
  );
};

export default MainButtonComponent;