import React from "react";
import { AtSign, Check, Copy, GraduationCap } from "lucide-react";
import MiloWelcome3D from "@features/home/components/MiloWelcome3D.component";
import Emoji3D from "@features/landing/ui/Emoji3D.component";
import { formatMiloros } from "@features/milo-shop/utils/format";
import { XP_PER_LEVEL, levelFromXp } from "@features/stats/utils/stats.format";
import { useCopyToClipboard } from "@features/profile/hooks/useCopyToClipboard";

interface ProfileHeroProps {
	firstName: string;
	lastName: string;
	username: string;
	classeLabel: string;
	/** Absents tant que les statistiques chargent */
	xp?: number;
	coins?: number;
	streak?: number;
}

/** En-tête du profil : identité, pseudo copiable, niveau, et le Milo du joueur en 3D. */
const ProfileHero: React.FC<ProfileHeroProps> = ({ firstName, lastName, username, classeLabel, xp, coins, streak }) => {
	const { copied, copyCount, copy } = useCopyToClipboard();
	const { level, xpIntoLevel, progressPct } = levelFromXp(xp ?? 0);
	const isLoaded = xp !== undefined;

	return (
		<section className="pf-hero">
			<div className="pf-hero-copy">
				<span className="pf-eyebrow">
					<i aria-hidden="true" />
					Mon profil
				</span>

				<h1 className="pf-hero-title">
					{firstName} <span className="pf-hl">{lastName}</span>
				</h1>

				<div className="pf-hero-meta">
					<span className="pf-copy">
						<button
							type="button"
							className={`pf-username ${copied ? "is-copied" : ""}`}
							onClick={() => copy(username)}
							title="Copier mon pseudo"
							aria-label={`Copier mon pseudo ${username}`}
						>
							<AtSign size={16} aria-hidden="true" />
							<span className="pf-username-text">{username}</span>
							<span className="pf-username-icon" aria-hidden="true">
								{copied ? <Check size={15} strokeWidth={3} /> : <Copy size={15} />}
							</span>
						</button>
						{/* La clé rejoue l'animation à chaque copie */}
						{copied && (
							<span key={copyCount} className="pf-copied" aria-hidden="true">
								<Check size={14} strokeWidth={3} />
								Copié !
							</span>
						)}
						<span className="pf-sr-only" role="status">
							{copied ? `Pseudo ${username} copié` : ""}
						</span>
					</span>

					<span className="pf-pill">
						<GraduationCap size={16} aria-hidden="true" />
						{classeLabel}
					</span>
				</div>

				<div className="pf-level">
					<div className="pf-level-head">
						<span className="pf-level-num">Niveau {isLoaded ? level : "…"}</span>
						<span className="pf-level-xp">
							{isLoaded ? `${xpIntoLevel} / ${XP_PER_LEVEL} XP` : "Chargement…"}
						</span>
					</div>
					<div
						className="pf-level-track"
						role="progressbar"
						aria-label="Progression vers le niveau suivant"
						aria-valuemin={0}
						aria-valuemax={XP_PER_LEVEL}
						aria-valuenow={xpIntoLevel}
					>
						<div className="pf-level-fill" style={{ width: `${progressPct}%` }} />
					</div>
				</div>

				<div className="pf-hero-chips">
					<span className="pf-wallet" title="Ton solde de miloros">
						<Emoji3D name="coin" className="pf-wallet-coin" />
						<span className="pf-wallet-amount">{coins !== undefined ? formatMiloros(coins) : "…"}</span>
						<span className="pf-wallet-unit">miloros</span>
					</span>
					<span className="pf-streak" title="Jours d'affilée avec au moins une activité">
						<Emoji3D name="fire" className="pf-streak-icon" />
						<span className="pf-streak-amount">{streak ?? 0}</span>
						<span className="pf-wallet-unit">{(streak ?? 0) > 1 ? "jours de série" : "jour de série"}</span>
					</span>
				</div>
			</div>

			{/* Le Milo du joueur, en 3D, sur le soleil feu de la landing */}
			<div className="pf-hero-art" aria-hidden="true">
				<span className="pf-hero-sun" />
				<Emoji3D name="graduation_cap" className="pf-hero-e pf-hero-e--1" />
				<Emoji3D name="star" className="pf-hero-e pf-hero-e--2" />
				<div className="pf-hero-milo">
					<MiloWelcome3D />
				</div>
			</div>
		</section>
	);
};

export default ProfileHero;
