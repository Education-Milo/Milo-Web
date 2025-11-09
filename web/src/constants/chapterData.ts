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
    // Structure basée sur le Sommaire (source 18) du document du Ministère de l'Education Nationale (https://eduscol.education.fr/document/64878/download)
    chapters: [
      {
        id: 'ma-c1',
        chapterNumber: 1,
        title: 'Nombres, calcul et résolution de problèmes', // (Inspiré de la source 19)
        lessons: [
          // Première leçon en 'in-progress' pour l'exemple
          { id: 'ma-l1a', title: 'Les nombres entiers et décimaux', status: 'in-progress' }, // (Source 20)
          { id: 'ma-l1b', title: 'Les fractions', status: 'locked' }, // (Source 30)
          { id: 'ma-l1c', title: 'Calculer avec les pourcentages', status: 'locked' }, // (Source 54)
        ],
      },
      {
        id: 'ma-c2',
        chapterNumber: 2,
        title: 'Algèbre', // (Inspiré de la source 76)
        lessons: [
          { id: 'ma-l2a', title: 'Résoudre des problèmes (nombres inconnus)', status: 'locked' }, // (Source 77)
          { id: 'ma-l2b', title: 'Identifier des motifs et régularités', status: 'locked' }, // (Source 82)
        ],
      },
      {
        id: 'ma-c3',
        chapterNumber: 3,
        title: 'Grandeurs et mesures', // (Inspiré de la source 103)
        lessons: [
          { id: 'ma-l3a', title: 'Longueurs, périmètres et cercles', status: 'locked' }, // (Source 106, 108)
          { id: 'ma-l3b', title: 'Aires (carrés, rectangles)', status: 'locked' }, // (Source 131)
          { id: 'ma-l3c', title: 'Volumes (assemblages de cubes)', status: 'locked' }, // (Source 133, 134)
          { id: 'ma-l3d', title: 'Repérage dans le temps et durées', status: 'locked' }, // (Source 135)
        ],
      },
      {
        id: 'ma-c4',
        chapterNumber: 4,
        title: 'Espace et géométrie', // (Inspiré de la source 153)
        lessons: [
          { id: 'ma-l4a', title: 'Configurations planes (points, cercles, médiatrices)', status: 'locked' }, // (Source 161)
          { id: 'ma-l4b', title: 'Les angles', status: 'locked' }, // (Source 172)
          { id: 'ma-l4c', title: 'Triangles et symétrie axiale', status: 'locked' }, // (Source 177, 181)
          { id: 'ma-l4d', title: 'Vision dans l\'espace', status: 'locked' }, // (Source 184)
        ],
      },
      {
        id: 'ma-c5',
        chapterNumber: 5,
        title: 'Organisation et gestion de données, probabilités', // (Inspiré de la source 186)
        lessons: [
          { id: 'ma-l5a', title: 'Organisation et gestion de données (tableaux)', status: 'locked' }, // (Source 187)
          { id: 'ma-l5b', title: 'Introduction aux probabilités', status: 'locked' }, // (Source 225)
          { id: 'ma-l5c', title: 'La proportionnalité', status: 'locked' }, // (Source 229)
        ],
      },
      {
        id: 'ma-c6',
        chapterNumber: 6,
        title: 'Initiation à la pensée informatique', // (Inspiré de la source 233)
        lessons: [
          { id: 'ma-l6a', title: 'Produire une séquence d\'instructions', status: 'locked' }, // (Source 234)
        ],
      },
    ],
  },
  // Ajoutez d'autres matières ici...
};

export default courseChapterData;