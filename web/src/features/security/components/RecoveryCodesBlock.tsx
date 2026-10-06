import React, { useState } from "react";
import { AlertTriangle, Check, Copy, Download, Printer } from "lucide-react";

interface RecoveryCodesBlockProps {
	codes: string[];
	acknowledged: boolean;
	onAcknowledge: (value: boolean) => void;
}

const FILE_HEADER = "Milo — codes de secours de la double authentification";

const codesAsText = (codes: string[]) =>
	[
		FILE_HEADER,
		`Générés le ${new Date().toLocaleString("fr-FR")}`,
		"Chaque code ne sert qu'une seule fois. Conserve ce fichier en lieu sûr.",
		"",
		...codes,
	].join("\n");

/**
 * Codes de secours, affichés une seule fois : copie, téléchargement,
 * impression, et confirmation explicite avant de pouvoir fermer.
 */
const RecoveryCodesBlock: React.FC<RecoveryCodesBlockProps> = ({ codes, acknowledged, onAcknowledge }) => {
	const [copied, setCopied] = useState(false);

	const handleCopy = async () => {
		try {
			await navigator.clipboard.writeText(codes.join("\n"));
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch {
			// presse-papiers indisponible : le téléchargement reste possible
		}
	};

	const handleDownload = () => {
		const blob = new Blob([codesAsText(codes)], { type: "text/plain;charset=utf-8" });
		const url = URL.createObjectURL(blob);
		const link = document.createElement("a");
		link.href = url;
		link.download = "milo-codes-de-secours.txt";
		document.body.appendChild(link);
		link.click();
		link.remove();
		URL.revokeObjectURL(url);
	};

	const handlePrint = () => {
		// Iframe isolée : on n'imprime que les codes, pas la page
		const frame = document.createElement("iframe");
		frame.style.position = "fixed";
		frame.style.width = "0";
		frame.style.height = "0";
		frame.style.border = "0";
		document.body.appendChild(frame);
		const doc = frame.contentDocument;
		if (!doc) {
			frame.remove();
			return;
		}
		const pre = doc.createElement("pre");
		pre.textContent = codesAsText(codes);
		pre.style.font = "16px/1.8 monospace";
		doc.body.appendChild(pre);
		frame.contentWindow?.focus();
		frame.contentWindow?.print();
		setTimeout(() => frame.remove(), 1000);
	};

	return (
		<div className="sec-codes">
			<div className="sec-alert sec-alert--warning">
				<AlertTriangle size={18} />
				<div>
					<strong>Ces codes ne seront plus jamais affichés.</strong>
					<span>
						Ils te permettent d'entrer si tu perds ton téléphone. La réinitialisation du mot de passe ne
						contourne pas la double authentification : sans téléphone ni codes de secours, seul un
						administrateur pourra débloquer ton compte.
					</span>
				</div>
			</div>

			<ol className="sec-codes-grid">
				{codes.map((code) => (
					<li key={code}>{code}</li>
				))}
			</ol>

			<div className="sec-codes-actions">
				<button type="button" className="sec-btn sec-btn--ghost" onClick={() => void handleCopy()}>
					{copied ? <Check size={16} /> : <Copy size={16} />} {copied ? "Copiés" : "Copier"}
				</button>
				<button type="button" className="sec-btn sec-btn--ghost" onClick={handleDownload}>
					<Download size={16} /> Télécharger
				</button>
				<button type="button" className="sec-btn sec-btn--ghost" onClick={handlePrint}>
					<Printer size={16} /> Imprimer
				</button>
			</div>

			<label className="sec-check">
				<input type="checkbox" checked={acknowledged} onChange={(e) => onAcknowledge(e.target.checked)} />
				<span>J'ai mis mes codes de secours en lieu sûr</span>
			</label>
		</div>
	);
};

export default RecoveryCodesBlock;
