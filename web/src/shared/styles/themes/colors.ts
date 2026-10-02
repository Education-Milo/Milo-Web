// import { useTheme } from '../../contexts/ThemeContext';

// Couleurs pour le mode clair
// Valeurs issues de la charte graphique (brand/charte-graphique.html).
// Garder synchronisé avec src/shared/styles/brand.css.
const lightColors = {
  // Couleurs principales
  primary: '#FF541D', // Orange Milo
  secondary: '#D9400F', // Relief des boutons orange
  tertiary: '#C73A0C', // Braise : orange lisible sur blanc
  board: '#2B4520', // Vert Tableau
  pompon: '#FCB218', // Pompon : récompenses
  placeholder: '#6E5546',
  white_60: 'rgba(255, 255, 255, 0.6)',

  // Couleurs de fond
  background: '#FFFAF3',
  white: '#FFFFFF',
  card: '#FFFFFF',
  black: '#2A1810',

  // Couleurs de texte
  text: {
    title: '#2A1810',
    primary: '#2A1810',
    secondary: '#6E5546',
    tertiary: '#A08A7C',
    white: '#FFFFFF',
    deleted: '#C3253F',
  },

  // Couleurs de bordure et séparateur
  border: {
    light: '#F1DFCB',
    medium: '#F1DFCB',
    dark: '#F1DFCB',
  },

  // Couleurs d'état
  error: '#C3253F',
  success: '#23874B',
  warning: '#FCB218',

  // Couleurs avec transparence
  overlay: 'rgba(42, 24, 16, 0.5)',
  primaryLight: 'rgba(255, 84, 29, 0.1)',

  // Couleurs spécifiques
  notification: '#FF541D',
  progress: {
    background: '#FFF4E5',
    fill: '#FF541D',
  },
  suggestion: {
    background: '#FFF4E5',
  },
  import: {
    background: '#FFF4E5',
    button: '#2B4520',
  },
};

// Hook pour obtenir les couleurs selon le thème
export const useColors = () => {
  // const { isDark } = useTheme();
  return lightColors;
};

// Export par défaut pour la compatibilité
export const colors = lightColors;