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
    // Structure basée sur le Sommaire (source 17) du document du Ministère de l'Education Nationale (https://eduscol.education.fr/document/64863/download)
    chapters: [
      {
        id: 'fr-c1',
        chapterNumber: 1,
        title: 'Lecture', // (Source 19)
        lessons: [
          // Première leçon en 'in-progress' pour l'exemple
          { id: 'fr-l1a', title: 'Lire avec fluidité', status: 'in-progress' }, // (Source 20)
          { id: 'fr-l1b', title: 'Lire à voix haute avec expressivité', status: 'locked' }, // (Source 22)
          { id: 'fr-l1c', title: 'Comprendre des textes, documents et images', status: 'locked' }, // (Source 24, 27)
          { id: 'fr-l1d', title: 'Lire une œuvre et se l\'approprier', status: 'locked' }, // (Source 31)
        ],
      },
      {
        id: 'fr-c2',
        chapterNumber: 2,
        title: 'Culture littéraire et artistique', // (Source 33)
        lessons: [
          { id: 'fr-l2a', title: 'Récits des origines (Récit, fiction)', status: 'locked' }, // (Source 34)
          { id: 'fr-l2b', title: 'Mots et merveilles (Poésie)', status: 'locked' }, // (Source 62)
          { id: 'fr-l2c', title: 'Ruses en action (Théâtre)', status: 'locked' }, // (Source 94)
          { id: 'fr-l2d', title: 'Partir à l\'aventure ! (Récit, fiction)', status: 'locked' }, // (Source 124)
          { id: 'fr-l2e', title: 'Rencontrer des monstres (Récit, fiction)', status: 'locked' }, // (Source 147)
        ],
      },
      {
        id: 'fr-c3',
        chapterNumber: 3,
        title: 'Écriture', // (Source 179)
        lessons: [
          { id: 'fr-l3a', title: 'Écrire à la main (fluidité et lisibilité)', status: 'locked' }, // (Source 180)
          { id: 'fr-l3b', title: 'Écrire pour réfléchir et apprendre', status: 'locked' }, // (Source 183)
          { id: 'fr-l3c', title: 'Produire des écrits variés', status: 'locked' }, // (Source 185)
        ],
      },
      {
        id: 'fr-c4',
        chapterNumber: 4,
        title: 'Oral', // (Source 189)
        lessons: [
          { id: 'fr-l4a', title: 'Écouter pour comprendre', status: 'locked' }, // (Source 190)
          { id: 'fr-l4b', title: 'Dire pour être compris', status: 'locked' }, // (Source 192)
          { id: 'fr-l4c', title: 'Participer à des échanges verbaux', status: 'locked' }, // (Source 201)
        ],
      },
      {
        id: 'fr-c5',
        chapterNumber: 5,
        title: 'Vocabulaire', // (Source 203)
        lessons: [
          { id: 'fr-l5a', title: 'Enrichir son vocabulaire', status: 'locked' }, // (Source 204)
          { id: 'fr-l5b', title: 'Établir des relations entre les mots', status: 'locked' }, // (Source 207)
          { id: 'fr-l5c', title: 'Réemployer le vocabulaire étudié', status: 'locked' }, // (Source 209)
          { id: 'fr-l5d', title: 'Mémoriser l\'orthographe des mots', status: 'locked' }, // (Source 211)
        ],
      },
      {
        id: 'fr-c6',
        chapterNumber: 6,
        title: 'Grammaire et orthographe', // (Source 214)
        lessons: [
          { id: 'fr-l6a', title: 'Identifier les constituants (phrase simple)', status: 'locked' }, // (Source 215)
          { id: 'fr-l6b', title: 'Se repérer dans la phrase complexe', status: 'locked' }, // (Source 223)
          { id: 'fr-l6c', title: 'Acquérir l\'orthographe grammaticale', status: 'locked' }, // (Source 228)
          { id: 'fr-l6d', title: 'Maîtriser la conjugaison', status: 'locked' }, // (Source 236)
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