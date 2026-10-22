import { MILO_MODEL_PATH } from "@features/my-milo/utils/miloModel";

export const CLASSROOM_MODEL = "/classroom2.glb";

/// Les gros fichiers de la salle, suivis en octets par l'écran de chargement
/// (le reste — textures de nuit, environnement — ne pèse presque rien)
export const CLASSROOM_DOWNLOADS = [CLASSROOM_MODEL, MILO_MODEL_PATH] as const;
