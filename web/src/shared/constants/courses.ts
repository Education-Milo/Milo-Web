export interface CourseVisuals {
	title: string;
	emoji: string;
	colorTheme:
		| "orange"
		| "blue"
		| "green"
		| "red"
		| "purple"
		| "yellow"
		| "teal"
		| "pink";
	locked?: boolean;
}

// Le mapping par ID
export const SUBJECTS_CONFIG: Record<string | number, CourseVisuals> = {
	"1": {
		title: "Mathématiques",
		emoji: "🧮",
		colorTheme: "blue",
	},
	"2": {
		title: "Français",
		emoji: "🇫🇷",
		colorTheme: "red",
	},
	"3": {
		title: "Histoire-Géographie",
		emoji: "🏛️",
		colorTheme: "yellow",
		locked: true,
	},
	"4": {
		title: "Anglais",
		emoji: "🇬🇧",
		colorTheme: "purple",
	},
	"5": {
		title: "Physique-Chimie",
		emoji: "🧪",
		colorTheme: "orange",
		locked: true,
	},
	"6": {
		title: "SVT",
		emoji: "🌱",
		colorTheme: "teal",
		locked: true,
	},
};

export const DEFAULT_VISUALS: CourseVisuals = {
	title: "Matière",
	emoji: "📚",
	colorTheme: "teal",
};
