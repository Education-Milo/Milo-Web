// Définition des types
export interface Lesson {
  id: string;
  title: string;
  status: 'completed' | 'in-progress' | 'locked';
  // On pourrait ajouter 'type: "video" | "quiz" | "sheet"' plus tard
}

export interface Chapter {
  id: string;
  chapterNumber: number;
  title: string;
  lessons: Lesson[];
}

export interface CourseDetails {
  title: string;
  emoji: string;
  chapters: Chapter[];
}

// Données statiques
const courseChapterData: Record<string, CourseDetails> = {
  francais: {
    title: 'Français',
    emoji: '🇫🇷',
    chapters: [
      {
        id: 'fr-c1',
        chapterNumber: 1,
        title: 'Grammaire : Les bases',
        lessons: [
          { id: 'fr-l1a', title: 'Les types de phrases', status: 'completed' },
          { id: 'fr-l1b', title: 'Le sujet, le verbe et le complément', status: 'in-progress' },
          { id: 'fr-l1c', title: 'Les accords sujet-verbe', status: 'locked' },
        ],
      },
      {
        id: 'fr-c2',
        chapterNumber: 2,
        title: 'Conjugaison : Le présent',
        lessons: [
          { id: 'fr-l2a', title: 'Le présent de l\'indicatif (1er groupe)', status: 'locked' },
          { id: 'fr-l2b', title: 'Le présent : être et avoir', status: 'locked' },
        ],
      },
      {
        id: 'fr-c3',
        chapterNumber: 3,
        title: 'Lecture : Molière',
        lessons: [
          { id: 'fr-l3a', title: 'Introduction à L\'Avare', status: 'locked' },
        ],
      },
    ],
  },
  maths: {
    title: 'Mathématiques',
    emoji: '🧮',
    chapters: [
      {
        id: 'ma-c1',
        chapterNumber: 1,
        title: 'Nombres et calculs',
        lessons: [
          { id: 'ma-l1a', title: 'Les fractions', status: 'completed' },
          { id: 'ma-l1b', title: 'Les nombres relatifs', status: 'completed' },
          { id: 'ma-l1c', title: 'Puissances de 10', status: 'in-progress' },
        ],
      },
      {
        id: 'ma-c2',
        chapterNumber: 2,
        title: 'Théorème de Pythagore',
        lessons: [
          { id: 'ma-l2a', title: 'Comprendre le théorème', status: 'locked' },
          { id: 'ma-l2b', title: 'Calculer une longueur', status: 'locked' },
          { id: 'ma-l2c', title: 'La réciproque', status: 'locked' },
        ],
      },
    ],
  },
  // Ajoutez d'autres matières ici...
};

export default courseChapterData;