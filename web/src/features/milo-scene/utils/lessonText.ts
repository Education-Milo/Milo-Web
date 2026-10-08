/// Mise en forme du texte du tableau. Le cours arrive en texte brut (avec
/// parfois du Markdown léger) : on y repère les paragraphes, les puces, les
/// titres, et les encadrés pédagogiques (exemples, « À retenir », méthodes,
/// pièges), puis chaque phrase devient une zone survolable, avec un index
/// global qui sert aussi à la lecture à voix haute.

export type BoardBlockKind = "paragraph" | "bullet" | "heading" | "spacer";

/** Encadré pédagogique dessiné à la craie autour de quelques lignes */
export type BoxVariant = "example" | "remember" | "method" | "warning" | "definition";

/** Icône 3D de chaque encadré du tableau (/public/landing/emoji) */
export const BOX_EMOJI: Record<BoxVariant, string> = {
	example: "light_bulb",
	remember: "glowing_star",
	method: "brain",
	warning: "high_voltage",
	definition: "books",
};

export interface BoardSentence {
	/** Index global dans la partie (ordre de lecture) */
	index: number;
	text: string;
}

export interface BoardBlock {
	kind: BoardBlockKind;
	/** Marqueur de liste (« 1. », « • ») */
	marker?: string;
	sentences: BoardSentence[];
}

export interface BoardBox {
	kind: "box";
	variant: BoxVariant;
	title: string;
	blocks: BoardBlock[];
}

export type BoardNode = BoardBlock | BoardBox;

const BULLET_PATTERN = /^\s*(?:[-•*]|(\d+)[.)])\s+/;
const HEADING_PATTERN = /^\s*#{1,6}\s+/;

/** Titres de ligne qui ouvrent un encadré, et le titre affiché */
const BOX_HEADINGS: [RegExp, BoxVariant, string][] = [
	[/^(?:[àa] retenir|retiens|l['’]essentiel|r[ée]sum[ée]|ce qu['’]il faut retenir)/i, "remember", "À retenir"],
	[/^(?:par exemple|exemples?|illustration)/i, "example", "Exemple"],
	[/^(?:m[ée]thode|astuce|comment faire|[ée]tapes?|technique)/i, "method", "Méthode"],
	[/^(?:attention|pi[èe]ge|erreur fr[ée]quente|remarque|à noter)/i, "warning", "Attention"],
	[/^(?:d[ée]finition|vocabulaire|on appelle)/i, "definition", "Définition"],
];

/** Une phrase qui commence ainsi est un exemple, même au milieu d'un paragraphe */
const EXAMPLE_START = /^\s*(?:par exemple|exemple\s*:|ex\s*:|prenons|imaginons|considérons)/i;

/// Intl.Segmenter n'est pas dans la lib ES2020 du projet : typage minimal
type SentenceSegmenter = { segment: (input: string) => Iterable<{ segment: string }> };
type SegmenterCtor = new (locale: string, options: { granularity: "sentence" }) => SentenceSegmenter;
const SegmenterImpl = (Intl as unknown as { Segmenter?: SegmenterCtor }).Segmenter;
const segmenter = SegmenterImpl ? new SegmenterImpl("fr", { granularity: "sentence" }) : null;

/** Phrases d'une ligne, espaces de fin conservés pour recoller le texte. */
export const splitSentences = (line: string): string[] => {
	if (!line.trim()) return [];
	if (segmenter) {
		return Array.from(segmenter.segment(line), (s) => s.segment).filter((s) => s.trim());
	}
	return line.split(/(?<=[.!?…])\s+(?=[A-ZÀ-ÖØ-Ý0-9«"(])/).filter((s) => s.trim());
};

const boxFor = (line: string): { variant: BoxVariant; title: string; rest: string } | null => {
	const clean = line.replace(HEADING_PATTERN, "").replace(/\*\*/g, "").trim();
	for (const [pattern, variant, title] of BOX_HEADINGS) {
		const match = clean.match(pattern);
		if (!match) continue;
		// « Exemple : 1/2 = 2/4 » : ce qui suit les deux-points reste dans l'encadré
		const colon = clean.indexOf(":");
		const rest = colon >= 0 && colon < 40 ? clean.slice(colon + 1).trim() : "";
		const isTitleOnly = colon >= 0 ? colon < 40 : clean.length < 40;
		if (!isTitleOnly && variant !== "example") continue;
		return { variant, title, rest: isTitleOnly ? rest : clean };
	}
	return null;
};

export const parseBoardText = (text: string): BoardNode[] => {
	const nodes: BoardNode[] = [];
	let index = 0;
	/// Encadré ouvert par un titre : il dure jusqu'à la ligne vide suivante
	let openBox: BoardBox | null = null;

	const sentencesOf = (line: string) => splitSentences(line).map((s) => ({ index: index++, text: s }));
	const push = (block: BoardBlock) => {
		if (openBox) openBox.blocks.push(block);
		else nodes.push(block);
	};
	const closeBox = () => {
		openBox = null;
	};

	for (const rawLine of text.split("\n")) {
		if (!rawLine.trim()) {
			closeBox();
			const last = nodes[nodes.length - 1];
			if (last && !(last.kind === "spacer")) nodes.push({ kind: "spacer", sentences: [] });
			continue;
		}

		const bullet = rawLine.match(BULLET_PATTERN);
		const isHeading =
			HEADING_PATTERN.test(rawLine) || (!bullet && rawLine.trim().length < 60 && /:\s*$/.test(rawLine));

		// Titre ou ligne « Exemple : … » qui ouvre un encadré
		const box = !bullet ? boxFor(rawLine) : null;
		if (box && (isHeading || box.variant === "example" || /:\s*\S/.test(rawLine))) {
			closeBox();
			const opened: BoardBox = { kind: "box", variant: box.variant, title: box.title, blocks: [] };
			nodes.push(opened);
			if (box.rest) opened.blocks.push({ kind: "paragraph", sentences: sentencesOf(box.rest) });
			// Un titre seul ouvre l'encadré pour les lignes suivantes ; une ligne
			// « Exemple : … » complète se suffit à elle-même
			openBox = isHeading || !box.rest ? opened : null;
			continue;
		}

		if (isHeading) {
			closeBox();
			nodes.push({ kind: "heading", sentences: sentencesOf(rawLine.replace(HEADING_PATTERN, "")) });
			continue;
		}

		if (bullet) {
			push({
				kind: "bullet",
				marker: bullet[1] ? `${bullet[1]}.` : "•",
				sentences: sentencesOf(rawLine.slice(bullet[0].length)),
			});
			continue;
		}

		// Paragraphe : un « Par exemple… » en cours de route part dans un encadré
		const parts = splitSentences(rawLine);
		const exampleAt = openBox ? -1 : parts.findIndex((s) => EXAMPLE_START.test(s));
		if (exampleAt < 0) {
			push({ kind: "paragraph", sentences: parts.map((s) => ({ index: index++, text: s })) });
			continue;
		}
		if (exampleAt > 0) {
			push({ kind: "paragraph", sentences: parts.slice(0, exampleAt).map((s) => ({ index: index++, text: s })) });
		}
		nodes.push({
			kind: "box",
			variant: "example",
			title: "Exemple",
			blocks: [{ kind: "paragraph", sentences: parts.slice(exampleAt).map((s) => ({ index: index++, text: s })) }],
		});
	}

	return nodes;
};

/** Toutes les phrases, dans l'ordre de lecture */
export const flattenSentences = (nodes: BoardNode[]): BoardSentence[] =>
	nodes.flatMap((node) => (node.kind === "box" ? node.blocks.flatMap((b) => b.sentences) : node.sentences));

/** Texte lisible d'une phrase : sans marqueurs Markdown. */
export const plainText = (text: string) => text.replace(/\*\*|__|`/g, "").replace(/\s+/g, " ").trim();

export type InlineKind = "text" | "strong" | "term" | "num";

export interface InlineChunk {
	text: string;
	kind: InlineKind;
}

const LETTER = "A-Za-zÀ-ÖØ-öø-ÿ";
/// « … s'appelle le numérateur », « on appelle fraction… » : le mot défini
const TERM_SOURCE = `(?<lead>(?:s['’]appellen?t?|on appelle|appel(?:é|ée|és|ées)|se nomment?|nomm(?:é|ée|és|ées))\\s+(?:l['’]|le |la |les |un |une |des )?)(?<term>[${LETTER}-]{3,})`;
/// Nombres, fractions et petits calculs : 1/4, 18 ÷ 6 = 3, 50 %
const NUM_SOURCE = `(?<![${LETTER}\\d])(?<num>\\d+(?:[.,]\\d+)?(?:\\s?[/×÷+=−]\\s?\\d+(?:[.,]\\d+)?)*(?:\\s?%)?)(?![${LETTER}\\d])`;
const AUTO_PATTERN = new RegExp(`${TERM_SOURCE}|${NUM_SOURCE}`, "g");

/// Repère dans un texte simple les mots définis et les nombres
/// (dans une question, « comment s'appelle le… » ne définit rien)
const highlightAuto = (text: string, isQuestion: boolean): InlineChunk[] => {
	const chunks: InlineChunk[] = [];
	let last = 0;
	for (const match of text.matchAll(AUTO_PATTERN)) {
		const start = match.index ?? 0;
		const groups = match.groups ?? {};
		if (groups.term && !isQuestion) {
			const termStart = start + groups.lead.length;
			if (termStart > last) chunks.push({ text: text.slice(last, termStart), kind: "text" });
			chunks.push({ text: groups.term, kind: "term" });
			last = termStart + groups.term.length;
		} else if (groups.num) {
			if (start > last) chunks.push({ text: text.slice(last, start), kind: "text" });
			chunks.push({ text: groups.num, kind: "num" });
			last = start + groups.num.length;
		}
	}
	if (last < text.length) chunks.push({ text: text.slice(last), kind: "text" });
	return chunks;
};

/**
 * Découpe en morceaux colorés : le gras Markdown (`**mot**`, les mots clés
 * du cours), les mots définis et les nombres.
 */
export const parseInline = (text: string): InlineChunk[] => {
	const isQuestion = text.trim().endsWith("?");
	return text
		.split(/(\*\*[^*]+\*\*)/)
		.filter(Boolean)
		.flatMap((chunk) =>
			chunk.startsWith("**") && chunk.endsWith("**") && chunk.length > 4
				? [{ text: chunk.slice(2, -2), kind: "strong" as const }]
				: highlightAuto(chunk, isQuestion),
		);
};
