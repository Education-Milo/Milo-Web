/** Apparition d'une tuile du bento, l'une après l'autre */
export const tileMotion = (index: number, reduceMotion: boolean | null) =>
	reduceMotion
		? {}
		: {
				initial: { opacity: 0, y: 24, scale: 0.98 },
				animate: { opacity: 1, y: 0, scale: 1 },
				transition: { type: "spring" as const, stiffness: 150, damping: 18, delay: 0.06 * index },
			};
