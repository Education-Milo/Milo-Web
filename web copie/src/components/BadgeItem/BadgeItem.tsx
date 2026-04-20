import React from 'react';
import type { MonthlyBadge } from '../../types/missions';
import './BadgeItem.css';

interface BadgeItemProps {
  badge: MonthlyBadge;
  animationDelay: string;
}

const BadgeItem: React.FC<BadgeItemProps> = ({ badge, animationDelay }) => {
  return (
    <div className={`badge-item ${badge.status}`} style={{ animationDelay }}>
      <div className="badge-circle">
        {badge.status === 'locked' ? (
          <span className="badge-lock-icon">🔒</span>
        ) : (
          <img 
            src={badge.imageUrl || '/badges/badge-default-missed.png'} 
            alt={badge.month} 
          />
        )}
      </div>
      <span className="badge-month-label">{badge.month}</span>
    </div>
  );
};

export default BadgeItem;