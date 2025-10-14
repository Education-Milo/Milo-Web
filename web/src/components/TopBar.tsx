import React from 'react';

// Props pour le composant TopBar
interface TopBarProps {
  searchPlaceholder?: string;
  energyPoints?: number;
  streakDays?: number;
  onSearch?: (query: string) => void;
  onNotificationClick?: () => void;
  onSettingsClick?: () => void;
}

const TopBar: React.FC<TopBarProps> = ({ 
  searchPlaceholder = "Rechercher des cours, missions, amis...",
  energyPoints = 450,
  streakDays = 3,
  onSearch,
  onNotificationClick,
  onSettingsClick
}) => {
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (onSearch) {
      onSearch(event.target.value);
    }
  };

  return (
    <header className="top-bar">
      <div className="search-bar">
        <span className="search-icon">🔍</span>
        <input 
          type="text" 
          className="search-input" 
          placeholder={searchPlaceholder}
          onChange={handleSearchChange}
        />
      </div>

      <div className="top-bar-actions">
        <div className="stats-badges">
          <div className="stat-badge yellow">
            <span>⚡</span>
            <span>{energyPoints}</span>
          </div>
          <div className="stat-badge orange">
            <span>🔥</span>
            <span>{streakDays}</span>
          </div>
        </div>

        <button className="action-button" onClick={onNotificationClick}>🔔</button>
        <button className="action-button" onClick={onSettingsClick}>⚙️</button>
      </div>
    </header>
  );
};

export default TopBar;
