import React from 'react';
import type { DailyMission } from '@types/missions';
import './MissionItem.css';

interface MissionItemProps {
  mission: DailyMission;
  animationDelay: string;
}

const MissionItem: React.FC<MissionItemProps> = ({ mission, animationDelay }) => {
  const progressPercent = (mission.progressCurrent / mission.progressTotal) * 100;

  return (
    <div className="mission-item" style={{ animationDelay }}>
      <div className="mission-item-icon">{mission.icon}</div>
      <div className="mission-item-info">
        <h4>{mission.title}</h4>
        <div className="mission-progress-container">
          <div className="mission-progress-bar">
            <div 
              className="mission-progress-fill" 
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
          <span>{mission.progressCurrent}/{mission.progressTotal}</span>
        </div>
      </div>
      <div className="mission-item-reward">
        <span>+{mission.rewardPoints} pts</span>
      </div>
    </div>
  );
};

export default MissionItem;