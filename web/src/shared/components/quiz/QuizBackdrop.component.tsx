import React from "react";
import "@shared/styles/Quiz.css";

/// Griffonnages d'école (crayon, étoile, éclair, signes de maths, livre,
/// équerre, gribouillis) en un motif de 220 px qui se répète sans couture.
const doodleTile = (color: string) => {
	const s = `fill='none' stroke='${color}' stroke-width='3.2' stroke-linecap='round' stroke-linejoin='round'`;
	const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='220' height='220' viewBox='0 0 220 220'>
<g ${s}>
<path d='M24 58 L52 30 L60 38 L32 66 L20 70 Z M46 36 L54 44'/>
<path d='M118 18 l6 13 14 2 -10 10 2 14 -12 -7 -12 7 2 -14 -10 -10 14 -2 z'/>
<path d='M188 40 h22 M199 29 v22'/>
<path d='M30 120 l14 14 M44 120 l-14 14'/>
<path d='M96 92 l-12 22 h12 l-8 22 20 -28 h-12 l8 -16 z'/>
<path d='M160 108 h26 M160 118 h26'/>
<path d='M150 170 v-24 h30 v24 M150 170 q15 -8 30 0 M165 146 v24'/>
<path d='M64 176 l30 0 -30 -30 z M70 170 l8 0 -8 -8 z'/>
<path d='M8 200 q10 -12 20 0 t20 0 t20 0'/>
<path d='M196 186 l10 10 M206 186 l-10 10 M201 182 v18'/>
<path d='M118 200 h18 M127 191 v0.1 M127 209 v0.1'/>
</g>
</svg>`;
	return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
};

const DOODLES = doodleTile("rgba(199,58,12,0.16)");
const DOODLES_LIGHT = doodleTile("rgba(255,244,229,0.22)");

/// Vague répétée deux fois : en décalant de -50 %, la boucle est invisible
const WAVE_PATH =
	"M0 40 C 150 0, 300 80, 450 40 S 750 0, 900 40 S 1200 80, 1350 40 S 1650 0, 1800 40 V 120 H 0 Z";

interface QuizBackdropProps {
	/// « fete » : écrans de fin, fond feu et motifs crème
	variant?: "qcm" | "duel" | "fete";
}

/// Décor animé derrière le jeu (aucun clic ne l'atteint) : ciel chaud,
/// rayons obliques qui glissent, griffonnages d'école, vagues feu.
/// La variante duel a un ciel plus chaud et des vagues braise ; la variante
/// fête (écrans de fin) passe au dégradé feu avec des vagues crème.
const QuizBackdrop: React.FC<QuizBackdropProps> = ({ variant = "qcm" }) => {
	return (
		<div className={`qz-backdrop qz-backdrop--${variant}`} aria-hidden="true">
			<div className="qz-backdrop-sky" />
			<div className="qz-backdrop-beams" />
			<div className="qz-backdrop-doodles" style={{ backgroundImage: variant === "fete" ? DOODLES_LIGHT : DOODLES }} />
			<div className="qz-backdrop-waves">
				{["sable", "mandarine", "feu"].map((tone) => (
					<svg key={tone} className={`qz-wave qz-wave--${tone}`} viewBox="0 0 1800 120" preserveAspectRatio="none">
						<path d={WAVE_PATH} />
					</svg>
				))}
			</div>
		</div>
	);
};

export default QuizBackdrop;
