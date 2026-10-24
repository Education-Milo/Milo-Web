import React, { Suspense, useLayoutEffect, useRef } from "react";
import {
	createRoot,
	events as createPointerEvents,
	extend,
	type Frameloop,
	type ReconcilerRoot,
	type RenderProps,
	type RootStore,
} from "@react-three/fiber";
import { QueryClientProvider } from "@tanstack/react-query";
import * as THREE from "three";
import { queryClient } from "@shared/lib/queryClient";

/// Toile 3D de l'accueil qui SURVIT à la navigation.
///
/// Un <Canvas> classique recrée tout à chaque visite : contexte WebGL,
/// compilation des shaders, textures envoyées à la carte graphique… d'où une
/// attente à chaque retour sur l'accueil. Ici la toile, le moteur et la scène
/// sont créés une seule fois : en quittant l'accueil on décroche la toile de
/// la page et on met le rendu en pause ; en revenant, on la raccroche et la
/// scène est là, telle qu'on l'a laissée.

extend(THREE as unknown as Parameters<typeof extend>[0]);

interface Persistent {
	/** Conteneur des événements souris, accroché à la page */
	wrapper: HTMLDivElement;
	root: ReconcilerRoot<HTMLCanvasElement>;
	store: RootStore | null;
	size: { width: number; height: number; top: number; left: number };
}

let persistent: Persistent | null = null;

function getPersistent(): Persistent {
	if (persistent) return persistent;
	const wrapper = document.createElement("div");
	wrapper.className = "ecl-canvas";
	const canvas = document.createElement("canvas");
	canvas.style.display = "block";
	canvas.style.width = "100%";
	canvas.style.height = "100%";
	wrapper.appendChild(canvas);
	persistent = { wrapper, root: createRoot(canvas), store: null, size: { width: 1, height: 1, top: 0, left: 0 } };
	return persistent;
}


/** Une erreur dans la scène 3D ne doit pas emporter l'accueil */
class SceneBoundary extends React.Component<{ children: React.ReactNode }, { failed: boolean }> {
	state = { failed: false };
	static getDerivedStateFromError() {
		return { failed: true };
	}
	componentDidCatch(error: unknown) {
		console.warn("[accueil] scène 3D indisponible", error);
	}
	render() {
		return this.state.failed ? null : this.props.children;
	}
}

export interface MiloSchoolCanvasProps {
	frameloop: Frameloop;
	/** Réglages du moteur : lus à la création seulement (objets constants) */
	config: Omit<RenderProps<HTMLCanvasElement>, "size" | "frameloop" | "events" | "onCreated">;
	onCreated?: (state: Parameters<NonNullable<RenderProps<HTMLCanvasElement>["onCreated"]>>[0]) => void;
	children: React.ReactNode;
}

const MiloSchoolCanvas: React.FC<MiloSchoolCanvasProps> = ({ frameloop, config, onCreated, children }) => {
	const host = useRef<HTMLDivElement>(null);
	const latest = useRef({ frameloop, config, onCreated, children });
	useLayoutEffect(() => {
		latest.current = { frameloop, config, onCreated, children };
	});

	/// Configure (taille, boucle de rendu) puis rend le contenu dans la scène persistante
	const sync = useRef(async (paused = false) => {
		const p = getPersistent();
		const { frameloop: loop, config: base, onCreated: created, children: content } = latest.current;
		await p.root.configure({
			...base,
			size: p.size,
			frameloop: paused ? "never" : loop,
			events: createPointerEvents,
			onCreated: (state) => {
				/// Une seule fois : le conteneur des événements est lui aussi persistant
				state.events.connect?.(p.wrapper);
				created?.(state);
			},
		});
		if (paused) return;
		p.store = p.root.render(
			<QueryClientProvider client={queryClient}>
				<SceneBoundary>
					<Suspense fallback={null}>{content}</Suspense>
				</SceneBoundary>
			</QueryClientProvider>,
		);
		p.store.getState().invalidate();
	});

	/// Accroche la toile à la page, suit sa taille ; la décroche en partant
	useLayoutEffect(() => {
		const element = host.current;
		if (!element) return;
		const p = getPersistent();
		const update = sync.current;
		element.appendChild(p.wrapper);
		const measure = () => {
			const rect = element.getBoundingClientRect();
			if (rect.width < 1 || rect.height < 1) return;
			p.size = { width: rect.width, height: rect.height, top: rect.top, left: rect.left };
			void update();
		};
		const observer = new ResizeObserver(measure);
		observer.observe(element);
		measure();
		return () => {
			observer.disconnect();
			p.wrapper.remove();
			void update(true);
		};
	}, []);

	/// Nouvelles props (nuit, missions, survol…) : on rend à nouveau la scène
	useLayoutEffect(() => {
		if (!host.current?.isConnected) return;
		void sync.current();
	});

	return <div ref={host} className="ecl-canvas-host" />;
};

export default MiloSchoolCanvas;
