import * as THREE from "three";

/// Textures de la cour de l'école, dessinées une fois dans des canvas :
/// rien à télécharger hormis la porte et l'intérieur de la classe (images).

function canvasTexture(width: number, height: number, draw: (ctx: CanvasRenderingContext2D) => void) {
	const canvas = document.createElement("canvas");
	canvas.width = width;
	canvas.height = height;
	const ctx = canvas.getContext("2d");
	if (ctx) draw(ctx);
	const texture = new THREE.CanvasTexture(canvas);
	texture.colorSpace = THREE.SRGBColorSpace;
	texture.anisotropy = 4;
	return texture;
}

/// Pseudo-hasard reproductible : la cour est la même à chaque visite
function seeded(seed: number) {
	let s = seed;
	return () => {
		s = (s * 16807) % 2147483647;
		return (s - 1) / 2147483646;
	};
}

const repeat = (texture: THREE.Texture, x: number, y: number) => {
	texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
	texture.repeat.set(x, y);
	return texture;
};

/** Enduit crème de la façade, à peine moucheté */
export function plasterTexture() {
	const texture = canvasTexture(256, 256, (ctx) => {
		ctx.fillStyle = "#FFEBD2";
		ctx.fillRect(0, 0, 256, 256);
		const rand = seeded(3);
		for (let i = 0; i < 900; i++) {
			ctx.fillStyle = rand() > 0.5 ? "rgba(255, 255, 255, 0.35)" : "rgba(214, 160, 110, 0.12)";
			ctx.fillRect(rand() * 256, rand() * 256, 1 + rand() * 2, 1 + rand() * 2);
		}
	});
	return repeat(texture, 4, 2);
}

/** Soubassement en pierres arrondies */
export function stoneTexture() {
	const texture = canvasTexture(256, 64, (ctx) => {
		ctx.fillStyle = "#B99B7E";
		ctx.fillRect(0, 0, 256, 64);
		const rand = seeded(11);
		for (let row = 0; row < 2; row++) {
			let x = row ? -20 : 0;
			while (x < 256) {
				const w = 34 + rand() * 26;
				const shade = 190 + Math.round(rand() * 30);
				ctx.fillStyle = `rgb(${shade}, ${shade - 22}, ${shade - 48})`;
				ctx.beginPath();
				ctx.roundRect(x + 2, row * 32 + 2, w - 4, 28, 9);
				ctx.fill();
				x += w;
			}
		}
	});
	return repeat(texture, 6, 1);
}

/** Tuiles de terre cuite, en rangées décalées */
export function roofTexture() {
	const texture = canvasTexture(256, 256, (ctx) => {
		ctx.fillStyle = "#B8461E";
		ctx.fillRect(0, 0, 256, 256);
		const rand = seeded(17);
		for (let row = 0; row < 8; row++) {
			const y = row * 32;
			for (let col = -1; col < 9; col++) {
				const x = col * 32 + (row % 2 ? 16 : 0);
				const tone = rand();
				ctx.fillStyle = tone > 0.66 ? "#E0662F" : tone > 0.33 ? "#D45A26" : "#C9511F";
				ctx.beginPath();
				ctx.roundRect(x + 1, y + 1, 30, 30, [2, 2, 14, 14]);
				ctx.fill();
				ctx.fillStyle = "rgba(255, 210, 170, 0.25)";
				ctx.fillRect(x + 5, y + 4, 20, 4);
			}
		}
	});
	return repeat(texture, 8, 2);
}

/** Pelouse : un vert franc, mille brins plus clairs ou plus sombres */
export function grassTexture() {
	const texture = canvasTexture(256, 256, (ctx) => {
		ctx.fillStyle = "#8DBB52";
		ctx.fillRect(0, 0, 256, 256);
		const rand = seeded(23);
		for (let i = 0; i < 2600; i++) {
			const x = rand() * 256;
			const y = rand() * 256;
			const light = rand();
			ctx.strokeStyle =
				light > 0.6 ? "rgba(190, 230, 120, 0.55)" : light > 0.3 ? "rgba(96, 150, 50, 0.5)" : "rgba(120, 175, 70, 0.6)";
			ctx.lineWidth = 1.2;
			ctx.beginPath();
			ctx.moveTo(x, y);
			ctx.lineTo(x + (rand() - 0.5) * 3, y - 3 - rand() * 4);
			ctx.stroke();
		}
	});
	return repeat(texture, 14, 7);
}

export type SkyKind = "day" | "dusk" | "night";

/** Ciel en dégradé (le soleil et la lune sont des objets à part) */
export function skyTexture(kind: SkyKind) {
	return canvasTexture(16, 256, (ctx) => {
		const gradient = ctx.createLinearGradient(0, 0, 0, 256);
		if (kind === "day") {
			gradient.addColorStop(0, "#5FB4F0");
			gradient.addColorStop(0.75, "#BFE4FA");
			gradient.addColorStop(1, "#E4F4FF");
		} else if (kind === "dusk") {
			gradient.addColorStop(0, "#5B4A9E");
			gradient.addColorStop(0.6, "#FF8A5B");
			gradient.addColorStop(1, "#FFD08A");
		} else {
			gradient.addColorStop(0, "#0B1238");
			gradient.addColorStop(1, "#2B3577");
		}
		ctx.fillStyle = gradient;
		ctx.fillRect(0, 0, 16, 256);
	});
}

/** Étoiles sur fond transparent, par-dessus le ciel de nuit */
export function starsTexture() {
	return canvasTexture(512, 256, (ctx) => {
		const rand = seeded(42);
		for (let i = 0; i < 140; i++) {
			const x = rand() * 512;
			const y = rand() * 200;
			const r = 0.6 + rand() * 1.4;
			ctx.fillStyle = `rgba(255, 255, 235, ${0.4 + rand() * 0.6})`;
			ctx.beginPath();
			ctx.arc(x, y, r, 0, Math.PI * 2);
			ctx.fill();
		}
	});
}

/** Nuages blancs sur fond transparent, à faire défiler (texture répétée en X) */
export function cloudsTexture() {
	const texture = canvasTexture(1024, 256, (ctx) => {
		const rand = seeded(5);
		const puff = (x: number, y: number, r: number) => {
			const gradient = ctx.createRadialGradient(x, y, r * 0.2, x, y, r);
			gradient.addColorStop(0, "rgba(255, 255, 255, 0.95)");
			gradient.addColorStop(0.7, "rgba(255, 255, 255, 0.85)");
			gradient.addColorStop(1, "rgba(255, 255, 255, 0)");
			ctx.fillStyle = gradient;
			ctx.beginPath();
			ctx.arc(x, y, r, 0, Math.PI * 2);
			ctx.fill();
		};
		for (const [cx, cy, size] of [
			[110, 120, 1],
			[420, 70, 0.75],
			[700, 140, 0.9],
			[930, 85, 0.7],
		] as const) {
			for (let i = 0; i < 7; i++) {
				puff(cx + (rand() - 0.5) * 120 * size, cy + (rand() - 0.5) * 26 * size, (24 + rand() * 22) * size);
			}
		}
	});
	texture.wrapS = THREE.RepeatWrapping;
	return texture;
}

/** Halo lumineux (soleil, lune, lanterne, fenêtres, lucioles) */
export function glowTexture() {
	return canvasTexture(64, 64, (ctx) => {
		const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
		gradient.addColorStop(0, "rgba(255, 255, 255, 1)");
		gradient.addColorStop(0.25, "rgba(255, 255, 255, 0.55)");
		gradient.addColorStop(1, "rgba(255, 255, 255, 0)");
		ctx.fillStyle = gradient;
		ctx.fillRect(0, 0, 64, 64);
	});
}

/** Lune en croissant, sur fond transparent */
export function moonTexture() {
	return canvasTexture(128, 128, (ctx) => {
		ctx.fillStyle = "#FFF3C4";
		ctx.beginPath();
		ctx.arc(64, 64, 40, 0, Math.PI * 2);
		ctx.fill();
		ctx.globalCompositeOperation = "destination-out";
		ctx.beginPath();
		ctx.arc(84, 50, 36, 0, Math.PI * 2);
		ctx.fill();
	});
}

/** Flaque de lumière qui sort de la porte ouverte et s'étale sur l'herbe */
export function lightSpillTexture() {
	return canvasTexture(128, 256, (ctx) => {
		const gradient = ctx.createLinearGradient(0, 0, 0, 256);
		gradient.addColorStop(0, "rgba(255, 220, 150, 1)");
		gradient.addColorStop(1, "rgba(255, 220, 150, 0)");
		ctx.fillStyle = gradient;
		/// Trapèze : étroit côté porte, large côté pelouse
		ctx.beginPath();
		ctx.moveTo(34, 0);
		ctx.lineTo(94, 0);
		ctx.lineTo(128, 256);
		ctx.lineTo(0, 256);
		ctx.closePath();
		ctx.fill();
	});
}

/** Aile de papillon (une seule, symétrisée par la géométrie) */
export function wingTexture(color: string) {
	return canvasTexture(64, 64, (ctx) => {
		ctx.fillStyle = color;
		ctx.beginPath();
		ctx.ellipse(28, 24, 26, 20, -0.5, 0, Math.PI * 2);
		ctx.fill();
		ctx.beginPath();
		ctx.ellipse(22, 46, 16, 14, 0.4, 0, Math.PI * 2);
		ctx.fill();
		ctx.fillStyle = "rgba(42, 24, 16, 0.85)";
		ctx.beginPath();
		ctx.arc(34, 20, 5, 0, Math.PI * 2);
		ctx.fill();
		ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
		ctx.beginPath();
		ctx.arc(16, 18, 3, 0, Math.PI * 2);
		ctx.fill();
	});
}

const SIGN_FONT = "'Luckiest Guy', 'Fredoka', system-ui, sans-serif";

/** Ardoise « Classe de Milo » au-dessus de la porte, écrite à la craie */
export function signTexture(text: string) {
	const draw = (ctx: CanvasRenderingContext2D) => {
		const { width, height } = ctx.canvas;
		ctx.clearRect(0, 0, width, height);
		ctx.fillStyle = "#2B4520";
		ctx.fillRect(0, 0, width, height);
		/// Traces de craie effacée
		const rand = seeded(31);
		for (let i = 0; i < 14; i++) {
			ctx.strokeStyle = `rgba(255, 255, 255, ${0.03 + rand() * 0.04})`;
			ctx.lineWidth = 10 + rand() * 18;
			ctx.beginPath();
			const y = rand() * height;
			ctx.moveTo(rand() * 60, y);
			ctx.quadraticCurveTo(width / 2, y + (rand() - 0.5) * 40, width - rand() * 60, y + (rand() - 0.5) * 30);
			ctx.stroke();
		}
		ctx.fillStyle = "#FFFDF2";
		ctx.textAlign = "center";
		ctx.textBaseline = "middle";
		ctx.font = `64px ${SIGN_FONT}`;
		ctx.shadowColor = "rgba(255, 255, 255, 0.35)";
		ctx.shadowBlur = 6;
		ctx.fillText(text, width / 2, height / 2 + 4);
		ctx.shadowBlur = 0;
		/// Petit soulignement orange
		ctx.strokeStyle = "#FF8A4C";
		ctx.lineWidth = 5;
		ctx.lineCap = "round";
		ctx.beginPath();
		ctx.moveTo(width * 0.3, height - 22);
		ctx.quadraticCurveTo(width * 0.5, height - 14, width * 0.7, height - 22);
		ctx.stroke();
	};
	const texture = canvasTexture(640, 150, draw);
	/// La police d'affichage arrive parfois après le premier dessin : on
	/// redessine l'ardoise dès qu'elle est prête
	if (typeof document !== "undefined" && document.fonts) {
		void document.fonts.load(`64px ${SIGN_FONT}`).then(() => {
			const ctx = (texture.image as HTMLCanvasElement).getContext("2d");
			if (!ctx) return;
			draw(ctx);
			texture.needsUpdate = true;
		});
	}
	return texture;
}

/** Redessine une texture dès que la police d'affichage est chargée */
function redrawWhenFontReady(texture: THREE.CanvasTexture, draw: (ctx: CanvasRenderingContext2D) => void) {
	if (typeof document === "undefined" || !document.fonts) return;
	void document.fonts.load(`40px ${SIGN_FONT}`).then(() => {
		const ctx = (texture.image as HTMLCanvasElement).getContext("2d");
		if (!ctx) return;
		draw(ctx);
		texture.needsUpdate = true;
	});
}

export interface MissionsBoardState {
	done: number;
	total: number;
}

/**
 * Panneau de bois « Missions » : titre, compteur fait / total, étoiles.
 * `update` le redessine quand les missions avancent.
 */
export function missionsBoardTexture(initial: MissionsBoardState) {
	let state = initial;
	const draw = (ctx: CanvasRenderingContext2D) => {
		const { width, height } = ctx.canvas;
		const allDone = state.total > 0 && state.done >= state.total;
		/// Planches de bois
		ctx.fillStyle = "#D98E4F";
		ctx.fillRect(0, 0, width, height);
		const rand = seeded(53);
		for (let row = 0; row < 3; row++) {
			const y = (row * height) / 3;
			ctx.fillStyle = row % 2 ? "#D38548" : "#DE9656";
			ctx.fillRect(0, y + 2, width, height / 3 - 4);
			for (let i = 0; i < 9; i++) {
				ctx.strokeStyle = rand() > 0.5 ? "rgba(120, 55, 20, 0.18)" : "rgba(255, 220, 170, 0.18)";
				ctx.lineWidth = 1 + rand() * 2;
				ctx.beginPath();
				const ly = y + 8 + rand() * (height / 3 - 16);
				ctx.moveTo(0, ly);
				ctx.quadraticCurveTo(width / 2, ly + (rand() - 0.5) * 10, width, ly + (rand() - 0.5) * 6);
				ctx.stroke();
			}
			ctx.fillStyle = "rgba(90, 40, 12, 0.35)";
			ctx.fillRect(0, y, width, 3);
		}
		/// Clous
		ctx.fillStyle = "#6B3A1A";
		for (const [x, y] of [
			[22, 22],
			[width - 22, 22],
			[22, height - 22],
			[width - 22, height - 22],
		]) {
			ctx.beginPath();
			ctx.arc(x, y, 6, 0, Math.PI * 2);
			ctx.fill();
		}
		ctx.textAlign = "center";
		ctx.textBaseline = "middle";
		/// Titre gravé
		ctx.font = `62px ${SIGN_FONT}`;
		ctx.fillStyle = "rgba(90, 35, 8, 0.55)";
		ctx.fillText("MISSIONS", width / 2 + 2, 76 + 3);
		ctx.fillStyle = "#FFF7EC";
		ctx.fillText("MISSIONS", width / 2, 76);
		/// Compteur dans une pastille
		const label = allDone ? "Bravo !" : `${state.done} / ${state.total}`;
		ctx.fillStyle = allDone ? "#4FA34A" : "#FF541D";
		ctx.beginPath();
		ctx.roundRect(width / 2 - 150, 128, 300, 104, 52);
		ctx.fill();
		ctx.fillStyle = "rgba(0, 0, 0, 0.18)";
		ctx.fillRect(width / 2 - 120, 222, 240, 6);
		ctx.font = `72px ${SIGN_FONT}`;
		ctx.fillStyle = "#FFFFFF";
		ctx.fillText(label, width / 2, 184);
		ctx.font = `30px ${SIGN_FONT}`;
		ctx.fillStyle = "#5E2E12";
		ctx.fillText("du jour", width / 2, 272);
	};
	const texture = canvasTexture(512, 320, draw);
	redrawWhenFontReady(texture, draw);
	return {
		texture,
		update(next: MissionsBoardState) {
			if (next.done === state.done && next.total === state.total) return;
			state = next;
			const ctx = (texture.image as HTMLCanvasElement).getContext("2d");
			if (!ctx) return;
			draw(ctx);
			texture.needsUpdate = true;
		},
	};
}

/** Pastille ronde avec un chiffre (missions restantes) */
export function countBadgeTexture() {
	let value = "";
	const draw = (ctx: CanvasRenderingContext2D) => {
		ctx.clearRect(0, 0, 128, 128);
		ctx.fillStyle = "#D9400F";
		ctx.beginPath();
		ctx.arc(64, 68, 54, 0, Math.PI * 2);
		ctx.fill();
		ctx.fillStyle = "#FF541D";
		ctx.beginPath();
		ctx.arc(64, 62, 54, 0, Math.PI * 2);
		ctx.fill();
		ctx.strokeStyle = "#FFFFFF";
		ctx.lineWidth = 7;
		ctx.stroke();
		ctx.fillStyle = "#FFFFFF";
		ctx.textAlign = "center";
		ctx.textBaseline = "middle";
		ctx.font = `64px ${SIGN_FONT}`;
		ctx.fillText(value, 64, 68);
	};
	const texture = canvasTexture(128, 128, draw);
	redrawWhenFontReady(texture, draw);
	return {
		texture,
		update(next: string) {
			if (next === value) return;
			value = next;
			const ctx = (texture.image as HTMLCanvasElement).getContext("2d");
			if (!ctx) return;
			draw(ctx);
			texture.needsUpdate = true;
		},
	};
}

/** Enveloppe (face avant) : papier crème, rabat, timbre orange */
export function letterTexture() {
	return canvasTexture(256, 160, (ctx) => {
		ctx.fillStyle = "#FFFDF6";
		ctx.fillRect(0, 0, 256, 160);
		ctx.strokeStyle = "rgba(200, 160, 120, 0.7)";
		ctx.lineWidth = 4;
		ctx.beginPath();
		ctx.moveTo(4, 6);
		ctx.lineTo(128, 92);
		ctx.lineTo(252, 6);
		ctx.stroke();
		ctx.fillStyle = "#FF541D";
		ctx.fillRect(196, 18, 42, 48);
		ctx.strokeStyle = "#FFFFFF";
		ctx.setLineDash([4, 4]);
		ctx.lineWidth = 3;
		ctx.strokeRect(199, 21, 36, 42);
	});
}

/** Flanc de la boîte aux lettres : enveloppe blanche peinte sur l'orange */
export function mailboxSideTexture() {
	return canvasTexture(256, 128, (ctx) => {
		ctx.fillStyle = "#E8492A";
		ctx.fillRect(0, 0, 256, 128);
		ctx.fillStyle = "#FFF7EC";
		ctx.beginPath();
		ctx.roundRect(88, 34, 80, 54, 6);
		ctx.fill();
		ctx.strokeStyle = "#E8492A";
		ctx.lineWidth = 5;
		ctx.beginPath();
		ctx.moveTo(92, 40);
		ctx.lineTo(128, 66);
		ctx.lineTo(164, 40);
		ctx.stroke();
	});
}
