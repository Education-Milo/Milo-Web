export interface CourseVisuals {
  title: string;
  emoji: string;
  colorTheme: 'orange' | 'blue' | 'green' | 'red' | 'purple' | 'yellow' | 'teal' | 'pink';
}

// Le mapping par ID
export const SUBJECTS_CONFIG: Record<string | number, CourseVisuals> = {
  "1": {
    title: 'Mathématiques',
    emoji: '🧮',
    colorTheme: 'blue'
  },
  "2": {
    title: 'Français',
    emoji: '🇫🇷',
    colorTheme: 'red'
  },
  "3": {
    title: 'Histoire-Géographie',
    emoji: '🏛️',
    colorTheme: 'yellow'
  },
  "4": {
    title: 'Anglais',
    emoji: '🇬🇧',
    colorTheme: 'purple'
  },
  "5": {
    title: 'Physique-Chimie',
    emoji: '🧪',
    colorTheme: 'orange'
  },
  "6" :{
    title: 'SVT',
    emoji: '🌱',
    colorTheme: 'teal'
  },
};

export const DEFAULT_VISUALS: CourseVisuals = {
  title: 'Matière',
  emoji: '📚',
  colorTheme: 'teal'
};