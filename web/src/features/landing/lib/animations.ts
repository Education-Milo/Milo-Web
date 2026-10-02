import { gsap, SplitText } from "@features/landing/lib/gsap";

/// Révèle un titre lettre par lettre quand il entre à l'écran.
/// Pas de masque SplitText : il rognerait les accents (é, ê, à) de Luckiest Guy.
/// À appeler dans un useGSAP : le split et le tween sont annulés au démontage.
export function revealTitle(el: Element | null) {
	if (!el) return;
	const split = SplitText.create(el, { type: "chars,words" });
	gsap.from(split.chars, {
		y: "0.7em",
		opacity: 0,
		rotate: 10,
		scale: 0.6,
		duration: 0.7,
		stagger: 0.02,
		ease: "back.out(1.6)",
		scrollTrigger: { trigger: el, start: "top 86%", once: true },
	});
}

/// Fait monter un élément quand il entre à l'écran
export function revealUp(targets: gsap.TweenTarget, trigger?: Element | null) {
	gsap.from(targets, {
		y: 30,
		opacity: 0,
		duration: 0.7,
		stagger: 0.08,
		ease: "power3.out",
		scrollTrigger: { trigger: (trigger ?? targets) as gsap.DOMTarget, start: "top 90%", once: true },
	});
}
