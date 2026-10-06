/**
 * Nom lisible de l'appareil courant ("Chrome sur Windows"), proposé par
 * défaut pour un appareil de confiance. L'utilisateur peut le modifier.
 */
export const describeThisDevice = (): string =>
	describeUserAgent(typeof navigator !== "undefined" ? navigator.userAgent : "");

/** "Firefox sur macOS" à partir d'un user-agent (liste des sessions). */
export const describeUserAgent = (ua: string | null | undefined): string => {
	if (!ua) return "Appareil inconnu";
	const browser =
		/Edg\//.test(ua) ? "Edge"
		: /OPR\//.test(ua) ? "Opera"
		: /Firefox\//.test(ua) ? "Firefox"
		: /Chrome\//.test(ua) ? "Chrome"
		: /Safari\//.test(ua) ? "Safari"
		: "Navigateur";
	const os =
		/iPhone|iPad|iPod/.test(ua) ? "iOS"
		: /Android/.test(ua) ? "Android"
		: /Windows/.test(ua) ? "Windows"
		: /Mac OS X|Macintosh/.test(ua) ? "macOS"
		: /CrOS/.test(ua) ? "ChromeOS"
		: /Linux/.test(ua) ? "Linux"
		: "";
	return os ? `${browser} sur ${os}` : browser;
};
