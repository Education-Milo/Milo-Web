import { cameraDistanceFor } from "@features/my-milo/utils/miloModel";

/// Cadrage du Milo des duels (et des cartes d'amis) : haut du corps, focale longue
export const DUEL_MILO_FIT_HEIGHT = 2.1;
export const DUEL_MILO_FRAME_TOP = 1.3;
export const DUEL_MILO_FRAME_HEIGHT = 1.9;
export const DUEL_MILO_FOV = 20;
export const DUEL_MILO_FOCUS_Y = DUEL_MILO_FRAME_TOP - DUEL_MILO_FRAME_HEIGHT / 2;
export const DUEL_MILO_CAMERA_DISTANCE = cameraDistanceFor(DUEL_MILO_FRAME_HEIGHT, DUEL_MILO_FOV);
