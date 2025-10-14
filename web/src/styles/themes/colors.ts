import { useTheme } from '../../contexts/ThemeContext';

// Couleurs pour le mode clair
const lightColors = {
  // Couleurs principales
  primary: '#FF8C00',
  secondary: '#FF6B00',
  tertiary: '#FF4500',
  placeholder: '#333',
  white_60: 'rgba(255, 255, 255, 0.6)',

  // Couleurs de fond
  background: '#FFF8F1',
  white: '#FFFFFF',
  card: '#FFFFFF',
  black: '#000000',

  // Couleurs de texte
  text: {
    title: '#666',
    primary: '#11181C',
    secondary: '#666666',
    tertiary: '#8E8E93',
    white: '#FFFFFF',
    deleted: '#FF3B30',
  },

  // Couleurs de bordure et séparateur
  border: {
    light: '#DDD',
    medium: '#E5E5E5',
    dark: '#E0E0E0',
  },

  // Couleurs d'état
  error: '#ff3b30',
  success: '#34C759',
  warning: '#FF9500',

  // Couleurs avec transparence
  overlay: 'rgba(0,0,0,0.5)',
  primaryLight: 'rgba(255, 140, 0, 0.1)',

  // Couleurs spécifiques
  notification: '#FF4500',
  progress: {
    background: '#EFEFEF',
    fill: '#FF8C00',
  },
  suggestion: {
    background: '#FFECE0',
  },
  import: {
    background: '#f0f8ff',
    button: '#6200ee',
  },
};

// Couleurs pour le mode sombre
const darkColors = {
  // Couleurs principales (gardées identiques pour la cohérence)
  primary: '#FF8C00',
  secondary: '#FF6B00',
  tertiary: '#FF4500',
  placeholder: '#999',
  white_60: 'rgba(255, 255, 255, 0.6)',

  // Couleurs de fond
  background: '#1a1a1a',
  white: '#FFFFFF',
  card: '#2d2d2d',
  black: '#000000',

  // Couleurs de texte
  text: {
    title: '#e0e0e0',
    primary: '#ffffff',
    secondary: '#b0b0b0',
    tertiary: '#888888',
    white: '#FFFFFF',
    deleted: '#FF3B30',
  },

  // Couleurs de bordure et séparateur
  border: {
    light: '#404040',
    medium: '#333333',
    dark: '#2a2a2a',
  },

  // Couleurs d'état
  error: '#ff3b30',
  success: '#34C759',
  warning: '#FF9500',

  // Couleurs avec transparence
  overlay: 'rgba(0,0,0,0.7)',
  primaryLight: 'rgba(255, 140, 0, 0.2)',

  // Couleurs spécifiques
  notification: '#FF4500',
  progress: {
    background: '#404040',
    fill: '#FF8C00',
  },
  suggestion: {
    background: '#2a1a0a',
  },
  import: {
    background: '#1a1a2e',
    button: '#6200ee',
  },
};

// Hook pour obtenir les couleurs selon le thème
export const useColors = () => {
  const { isDark } = useTheme();
  return isDark ? darkColors : lightColors;
};

// Export par défaut pour la compatibilité
export const colors = lightColors;