/**
 * Dernière page visitée hors de la salle de classe.
 *
 * « Quitter » faisait `navigate(-1)` : changer de leçon depuis la classe
 * ajoute une entrée d'historique, et revenir d'un cran ramenait donc à la
 * leçon précédente, toujours en classe (il fallait cliquer deux fois).
 * On retient ici la page d'où l'élève est entré, et on y retourne.
 */
const CLASSROOM_PATHS = [/^\/milo\/?$/, /^\/course-milo\//];

let lastOutsidePath: string | null = null;

export const isClassroomPath = (pathname: string) => CLASSROOM_PATHS.some((re) => re.test(pathname));

export const rememberPath = (pathname: string, search = "") => {
	if (!isClassroomPath(pathname)) lastOutsidePath = pathname + search;
};

export const getClassroomExitPath = () => lastOutsidePath;
