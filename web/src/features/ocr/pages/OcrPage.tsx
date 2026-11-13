import React, { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useOcrWorkflow } from "../hooks/useOcrWorkflow";
import { OcrTypeSelector } from "@features/ocr/components/OcrTypeSelector/OcrTypeSelector";
import { OcrFileUploader } from "@features/ocr/components/OcrFileUploader/OcrFileUploader";
import { OcrActionModal } from "../components/OcrActionModal/OcrActionModal";
import { useOcrStore } from "../store/ocr.store";
import ScreenLayout from "@shared/components/ScreenLayout.component";
import Emoji3D from "@features/landing/ui/Emoji3D.component";
import DuelMilo3D, { type DuelDance } from "@features/duels/components/DuelMilo3D.component";
import { useEquippedMeshNames } from "@features/cosmetics/hooks/useEquippedMeshNames";
import { getAiErrorMessage } from "@shared/lib/aiRequests";
import "@features/ocr/styles/OcrImport.css";

const STEPS = ["Choisis le type", "Dépose ton fichier", "Milo s'occupe du reste"];
/// Danses jouées quand on clique sur Milo
const TAUNTS = ["Hello", "67", "HatLook"];

/**
 * Page principale du workflow OCR, dans la charte de la landing.
 * Orchestre les étapes via le hook useOcrWorkflow.
 *
 * Étapes :
 *  1. select_type    → OcrTypeSelector
 *  2. upload_preview → OcrFileUploader + OcrActionModal (si Cours/Exercice)
 */
const OcrPage: React.FC = () => {
	const resetOcrWorkflow = useOcrStore((state) => state.reset);
	const reduceMotion = useReducedMotion();
	const { equippedMeshNames } = useEquippedMeshNames();
	const [dance, setDance] = useState<DuelDance | null>(null);
	const seq = useRef(0);
	const taunt = () => {
		seq.current += 1;
		setDance({ clip: TAUNTS[seq.current % TAUNTS.length], seq: seq.current });
	};
	const {
		step,
		selectedType,
		selectedFile,
		previewUrl,
		isModalOpen,
		isLoading,
		error,
		handleTypeSelect,
		handleFileChange,
		handleFileDelete,
		handleSendDocument,
		handleActionConfirm,
		handleBack,
		closeModal,
	} = useOcrWorkflow();

	useEffect(() => {
		return () => {
			resetOcrWorkflow();
		};
	}, [resetOcrWorkflow]);

	// Étape affichée dans le fil : 1 type, 2 fichier, 3 envoi en cours ou choix de l'action
	const current = step === "select_type" ? 0 : isLoading || isModalOpen ? 2 : 1;

	return (
		<ScreenLayout>
			<div className="oi">
				{/* ─── En-tête : carte blanche, aplat feu avec Milo ─── */}
				<motion.section
					className="oi-hero"
					initial={reduceMotion ? false : { opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ type: "spring", stiffness: 200, damping: 20 }}
				>
					<div className="oi-hero__copy">
						<div className="oi-hero__titles">
							<h1 className="oi-hero__title">
								Importe tes <span className="oi-hl">documents</span>
							</h1>
							<p className="oi-hero__lead">
								Prends en photo un cours, un exercice ou ton bulletin : Milo le lit et t'aide à réviser.
							</p>
						</div>
						<ol className="oi-steps" aria-label="Étapes">
							{STEPS.map((label, i) => (
								<li
									key={label}
									className={`oi-step${i === current ? " is-current" : ""}${i < current ? " is-done" : ""}`}
									aria-current={i === current ? "step" : undefined}
								>
									<span className="oi-step__num">{i + 1}</span>
									<span className="oi-step__label">{label}</span>
								</li>
							))}
						</ol>
					</div>
					{/* Ton Milo en 3D, dans sa tenue : un clic le fait danser */}
					<button type="button" className="oi-hero__art" onClick={taunt} aria-label="Faire danser Milo">
						<span className="oi-hero__sun" aria-hidden="true" />
						<span className="oi-hero__loader" aria-hidden="true" />
						<DuelMilo3D equippedMeshNames={equippedMeshNames ?? []} state="waiting" dance={dance} facing="right" className="oi-hero__milo3d" />
						<Emoji3D name="books" className="oi-hero__float oi-hero__float--1" />
						<Emoji3D name="light_bulb" className="oi-hero__float oi-hero__float--2" />
						<Emoji3D name="sparkles" className="oi-hero__float oi-hero__float--3" />
					</button>
				</motion.section>

				{/* ─── Étape 1 : type de document ─── */}
				{step === "select_type" && <OcrTypeSelector onSelect={handleTypeSelect} />}

				{/* ─── Étape 2 : fichier, puis choix de l'action (Cours / Exercice) ─── */}
				{step === "upload_preview" && selectedType && (
					<>
						<OcrFileUploader
							documentType={selectedType}
							selectedFile={selectedFile}
							previewUrl={previewUrl}
							isLoading={isLoading}
							onFileChange={handleFileChange}
							onDelete={handleFileDelete}
							onSend={handleSendDocument}
							onBack={handleBack}
						/>
						<OcrActionModal
							isOpen={isModalOpen}
							documentType={selectedType}
							onConfirm={handleActionConfirm}
							onClose={closeModal}
						/>
					</>
				)}

				{/* ─── Erreur globale ─── */}
				{error && (
					<div className="oi-error" role="alert">
						<img src="/popups/milo-attention.webp" alt="" className="oi-error__milo" draggable={false} />
						<p>
							{/* 400 : image refusée par la modération, `detail` affiché tel quel */}
							{getAiErrorMessage(error, {
								fallback: "Une erreur est survenue lors de l'envoi.",
								showDetailOn400: true,
							})}
						</p>
					</div>
				)}
			</div>
		</ScreenLayout>
	);
};

export default OcrPage;
