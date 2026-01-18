import React, { useState, useEffect } from 'react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
}

const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose, imageUrl }) => {
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  if (!isOpen && !isClosing) return null;

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 250);
  };

  return (
    <>
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(0,0,0,0.85)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          animation: isClosing 
            ? 'fadeOut 0.2s ease-out forwards' 
            : 'fadeIn 0.25s ease-out',
          cursor: 'pointer',
          willChange: 'opacity',
        }}
        onClick={handleClose}
      >
        <div
          style={{
            position: 'relative',
            maxWidth: '90%',
            maxHeight: '90%',
            background: 'white',
            borderRadius: '16px',
            padding: '8px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
            animation: isClosing 
              ? 'scaleOut 0.25s ease-out forwards' 
              : 'scaleIn 0.3s cubic-bezier(0.34, 1.3, 0.64, 1)',
            cursor: 'default',
            willChange: 'transform, opacity',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Bouton de fermeture */}
          <button
            onClick={handleClose}
            style={{
              position: 'absolute',
              top: '-18px',
              right: '-18px',
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              background: '#ff0000',
              color: 'white',
              border: '3px solid white',
              fontSize: '42px',
              fontWeight: 'bold',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 101,
              boxShadow: '0 4px 15px rgba(255, 0, 0, 0.4)',
              transition: 'transform 0.2s ease, background 0.2s ease',
              willChange: 'transform',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.1) rotate(90deg)';
              e.currentTarget.style.background = '#ff3333';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1) rotate(0deg)';
              e.currentTarget.style.background = '#ff0000';
            }}
          >
            ×
          </button>

          {/* Image */}
          <img
            src={imageUrl}
            alt="Instructions"
            style={{
              maxWidth: '100%',
              maxHeight: '80vh',
              display: 'block',
              borderRadius: '8px',
            }}
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              const parent = e.currentTarget.parentElement;
              if (parent) {
                parent.innerHTML += '<p style="padding: 60px; text-align: center; color: #666; font-size: 18px;">Image non trouvée. Veuillez placer votre fichier dans le dossier public.</p>';
              }
            }}
          />
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes fadeOut {
          from { opacity: 1; }
          to { opacity: 0; }
        }

        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.85);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes scaleOut {
          from {
            opacity: 1;
            transform: scale(1);
          }
          to {
            opacity: 0;
            transform: scale(0.9);
          }
        }
      `}</style>
    </>
  );
};

export default HelpModal;