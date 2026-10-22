import { useEffect, useState } from "react";
import * as THREE from "three";

/// Avancée réelle (0 → 1) du téléchargement des gros fichiers de la scène, en
/// octets. `useProgress` (drei) ne compte que les fichiers terminés : avec deux
/// .glb qui font l'essentiel du poids, la barre restait bloquée puis sautait.
///
/// Pas de double téléchargement : le FileLoader de three regroupe les requêtes
/// en cours sur une même URL, celle du GLTFLoader rejoint la nôtre (ou
/// l'inverse) et chacun reçoit la progression.
export function useDownloadProgress(urls: readonly string[]) {
	const [progress, setProgress] = useState(0);

	useEffect(() => {
		const files = urls.map(() => ({ loaded: 0, total: 0, done: false }));
		let cancelled = false;

		const update = () => {
			if (cancelled) return;
			/// Taille encore inconnue (en-têtes pas reçus, ou pas de Content-Length) :
			/// on suppose la taille moyenne des autres fichiers
			const known = files.filter((file) => file.total > 0);
			const fallbackSize = known.length ? known.reduce((sum, file) => sum + file.total, 0) / known.length : 1;
			let loaded = 0;
			let total = 0;
			for (const file of files) {
				const size = file.total || fallbackSize;
				total += size;
				loaded += file.done ? size : Math.min(file.loaded, size);
			}
			/// Arrondi : évite un rendu par paquet réseau pour des écarts invisibles
			setProgress(Math.round((loaded / total) * 200) / 200);
		};

		const loader = new THREE.FileLoader().setResponseType("arraybuffer");
		urls.forEach((url, index) => {
			const file = files[index];
			const finish = () => {
				file.done = true;
				update();
			};
			loader.load(
				url,
				finish,
				(event) => {
					if (!event.lengthComputable) return;
					file.loaded = event.loaded;
					file.total = event.total;
					update();
				},
				/// L'erreur est affichée par la scène : la barre ne reste pas bloquée
				finish,
			);
		});

		return () => {
			cancelled = true;
		};
	}, [urls]);

	return progress;
}
