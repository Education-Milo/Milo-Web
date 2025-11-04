// Définition du type pour nos objets de cours
export interface Course {
  id: string;
  title: string;
  emoji: string;
  description: string;
  progress: number;
  colorTheme: 'orange' | 'blue' | 'green' | 'red' | 'purple' | 'yellow' | 'teal' | 'pink';
}

// Données statiques pour les cours
export const coursesData: Course[] = [
  { 
    id: 'maths', 
    title: 'Mathématiques', 
    emoji: '🧮', 
    description: 'Nombres, algèbre, géométrie et fonctions.', 
    progress: 60,
    colorTheme: 'blue'
  },
  { 
    id: 'francais', 
    title: 'Français', 
    emoji: '🇫🇷', 
    description: 'Grammaire, conjugaison, lecture et écriture.', 
    progress: 45,
    colorTheme: 'red'
  },
  { 
    id: 'histoire', 
    title: 'Histoire', 
    emoji: '🏛️',
    description: 'De l\'Antiquité à l\'époque contemporaine.', 
    progress: 30,
    colorTheme: 'yellow'
  },
  { 
    id: 'geo', 
    title: 'Géographie', 
    emoji: '🗺️',
    description: 'Cartes, pays, climats et phénomènes naturels.', 
    progress: 15,
    colorTheme: 'green'
  },
  { 
    id: 'anglais', 
    title: 'Anglais', 
    emoji: '🇬🇧', 
    description: 'Vocabulaire, verbes irréguliers et discussion.', 
    progress: 75,
    colorTheme: 'purple'
  },
  { 
    id: 'physique', 
    title: 'Physique-Chimie', 
    emoji: '🧪', 
    description: 'Atomes, énergie, réactions et lois de l\'univers.', 
    progress: 10,
    colorTheme: 'orange'
  },
  { 
    id: 'svt', 
    title: 'SVT', 
    emoji: '🌱', 
    description: 'Sciences de la Vie et de la Terre.', 
    progress: 20,
    colorTheme: 'teal'
  },
  { 
    id: 'techno', 
    title: 'Technologie', 
    emoji: '🤖', 
    description: 'Conception, objets techniques et numérique.', 
    progress: 5,
    colorTheme: 'pink'
  },
];