import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";

/// Point d'entrée unique de GSAP pour la landing : les plugins ne sont
/// enregistrés qu'une fois, et chaque composant importe depuis ce fichier.
gsap.registerPlugin(ScrollTrigger, SplitText, useGSAP);

/// Breakpoints des animations « épinglées » (pin) : en dessous, les sections
/// défilent normalement et gardent des animations plus légères.
export const MEDIA_DESKTOP_PIN = "(min-width: 961px) and (min-height: 700px)";
export const MEDIA_NO_PIN = "(max-width: 960px), (max-height: 699px)";

export const prefersReducedMotion = () =>
	typeof window !== "undefined" &&
	window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export { gsap, ScrollTrigger, SplitText, useGSAP };
