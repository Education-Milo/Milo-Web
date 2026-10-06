import { isAxiosError } from "axios";

/** Les dates du back peuvent arriver sans fuseau : elles sont en UTC. */
const parseServerDate = (value: string) => {
	const hasZone = /(Z|[+-]\d{2}:?\d{2})$/.test(value);
	return new Date(hasZone ? value : `${value}Z`);
};

export const formatDateTime = (value: string | null | undefined) => {
	if (!value) return "—";
	const date = parseServerDate(value);
	return Number.isNaN(date.getTime())
		? value
		: date.toLocaleString("fr-FR", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
};

export const formatDate = (value: string | null | undefined) => {
	if (!value) return "—";
	const date = parseServerDate(value);
	return Number.isNaN(date.getTime())
		? value
		: date.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
};

/** Message lisible : `detail` du back (texte, ou liste pydantic pour un 422). */
export const getSecurityErrorMessage = (error: unknown): string => {
	if (isAxiosError(error)) {
		const status = error.response?.status;
		const detail = error.response?.data?.detail;
		if (typeof detail === "string") return detail;
		if (Array.isArray(detail)) {
			const text = detail.map((d) => (typeof d === "string" ? d : d?.msg)).filter(Boolean).join(" · ");
			if (text) return text;
		}
		if (status === 403) return "Cette opération n'est pas disponible pour ce compte.";
		if (status === 429) return "Trop de tentatives. Patiente un instant avant de réessayer.";
	}
	return "Une erreur est survenue, réessaie dans un instant.";
};
