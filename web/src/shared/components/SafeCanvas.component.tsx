import React from "react";
import { Canvas as FiberCanvas } from "@react-three/fiber";
import { isWebGLAvailable } from "@shared/utils/webgl";

type SafeCanvasProps = React.ComponentProps<typeof FiberCanvas> & {
	/** Affiché à la place de la scène quand WebGL est indisponible (rien par défaut) */
	fallback?: React.ReactNode;
};

/**
 * <Canvas> de react-three-fiber, rendu seulement si WebGL est disponible.
 * Sans WebGL, la scène (décorative) est simplement omise : la page reste
 * utilisable au lieu de boucler sur des erreurs de contexte.
 */
const SafeCanvas: React.FC<SafeCanvasProps> = ({ fallback = null, ...props }) =>
	isWebGLAvailable() ? <FiberCanvas {...props} /> : <>{fallback}</>;

export default SafeCanvas;
