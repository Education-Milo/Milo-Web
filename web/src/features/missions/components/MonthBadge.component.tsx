import React, { useRef } from "react";
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "framer-motion";
import { Lock } from "lucide-react";
import type { MonthlyBadge } from "@shared/types/missions";

interface MonthBadgeProps {
	badge: MonthlyBadge;
	index: number;
	onOpen: (badge: MonthlyBadge) => void;
	/** Dans la pop-up : simple fondu, sans zoom (sinon la fenêtre et les
	 *  badges grossissaient en même temps, effet zoom/dézoom saccadé) */
	calm?: boolean;
}

const STATUS_TEXT: Record<MonthlyBadge["status"], string> = {
	earned: "Obtenu",
	missed: "Manqué",
	"in-progress": "En cours",
	locked: "À venir",
};

/**
 * Badge de la collection : il s'incline en 3D en suivant la souris.
 * Les mois à venir restent en silhouette, les mois manqués en grisé.
 */
const MonthBadge: React.FC<MonthBadgeProps> = ({ badge, index, onOpen, calm = false }) => {
	const reduceMotion = useReducedMotion();
	const ref = useRef<HTMLButtonElement>(null);
	const px = useMotionValue(0);
	const py = useMotionValue(0);
	const rotateX = useSpring(useTransform(py, [-0.5, 0.5], [14, -14]), { stiffness: 220, damping: 16 });
	const rotateY = useSpring(useTransform(px, [-0.5, 0.5], [-16, 16]), { stiffness: 220, damping: 16 });
	const tiltable = !reduceMotion && badge.status !== "locked";

	const onMove = (e: React.PointerEvent) => {
		if (!tiltable || !ref.current) return;
		const r = ref.current.getBoundingClientRect();
		px.set((e.clientX - r.left) / r.width - 0.5);
		py.set((e.clientY - r.top) / r.height - 0.5);
	};
	const reset = () => {
		px.set(0);
		py.set(0);
	};

	return (
		<motion.button
			ref={ref}
			type="button"
			className={`mp-badge is-${badge.status}${calm ? " is-calm" : ""}`}
			onClick={() => onOpen(badge)}
			onPointerMove={onMove}
			onPointerLeave={reset}
			aria-label={`Badge ${badge.month} : ${STATUS_TEXT[badge.status]}`}
			initial={reduceMotion ? false : calm ? { opacity: 0 } : { opacity: 0, y: 30, scale: 0.85 }}
			animate={calm ? { opacity: 1 } : undefined}
			whileInView={calm ? undefined : { opacity: 1, y: 0, scale: 1 }}
			viewport={{ once: true, amount: 0.4 }}
			transition={calm ? { duration: 0.25, delay: 0.1 + 0.025 * index } : { type: "spring", stiffness: 200, damping: 17, delay: 0.04 * index }}
		>
			<motion.span className="mp-badge__art" style={tiltable ? { rotateX, rotateY } : undefined}>
				{/* Taille réservée (320×300) : sans elle, les images arrivaient après
				    coup et la grille grandissait d'un coup à l'ouverture */}
				<img src={badge.imageUrl ?? ""} alt="" draggable={false} width={320} height={300} loading={calm ? "eager" : "lazy"} />
				{badge.status === "locked" && (
					<span className="mp-badge__lock" aria-hidden="true">
						<Lock size={22} strokeWidth={2.6} />
					</span>
				)}
			</motion.span>
			<span className="mp-badge__month">{badge.month}</span>
			<span className="mp-badge__state">{STATUS_TEXT[badge.status]}</span>
		</motion.button>
	);
};

export default MonthBadge;
