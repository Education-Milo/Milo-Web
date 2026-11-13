import React, { useEffect, useState } from "react";
import { useProgress } from "@react-three/drei";
import QuizLoader from "@shared/components/quiz/QuizLoader.component";
import { useDownloadProgress } from "@features/milo-scene/hooks/useDownloadProgress";
import { CLASSROOM_DOWNLOADS } from "@features/milo-scene/utils/classroomAssets";

const DEFAULT_LINES = [
	"Milo range ses craies…",
	"Il efface le tableau…",
	"Il installe ton bureau…",
	"Presque prêt !",
];

interface ClassroomLoadingProps {
	done: boolean;
	title?: string;
	highlight?: string;
	messages?: string[];
}

/// Écran d'attente de la charte : soleil feu, Milo, objets 3D en orbite
const ClassroomLoading: React.FC<ClassroomLoadingProps> = ({
	done,
	title = "On entre en classe !",
	highlight = "classe",
	messages = DEFAULT_LINES,
}) => {
	/// L'essentiel : les octets des deux .glb. Le reste (textures de nuit,
	/// environnement, décodage) se lit dans le décompte de fichiers de drei.
	const downloaded = useDownloadProgress(CLASSROOM_DOWNLOADS);
	const { progress: filesDone } = useProgress();
	const progress = downloaded * 92 + (filesDone / 100) * 8;
	/// La progression peut repartir en arrière quand un nouveau fichier démarre :
	/// on n'affiche que la valeur la plus haute atteinte. 100 % : la scène est
	/// vraiment affichée, pas seulement téléchargée.
	const [shown, setShown] = useState(0);
	useEffect(() => setShown((current) => Math.max(current, progress)), [progress]);
	const value = done ? 100 : Math.min(Math.round(shown), 99);

	return (
		<div className={`cls-loading${done ? " is-done" : ""}`}>
			<QuizLoader title={title} highlight={highlight} messages={messages} progress={value}>
				<span className="cls-loading-pct">
					{value < 100 ? `Chargement de la salle · ${value} %` : "C'est prêt !"}
				</span>
			</QuizLoader>
		</div>
	);
};

export default ClassroomLoading;
