import React from "react";
import { useOcrWorkflow } from "../hooks/useOcrWorkflow";
import { OcrTypeSelector } from "@features/ocr/components/OcrTypeSelector/OcrTypeSelector";
import { OcrFileUploader } from "@features/ocr/components/OcrFileUploader/OcrFileUploader";
import { OcrActionModal } from "../components/OcrActionModal/OcrActionModal";
import { useOcrStore } from "../store/ocr.store";
import ScreenLayout from "@shared/components/ScreenLayout.component";
import { Sparkles } from "lucide-react";
import { useEffect } from "react";
import miloGreeting from "/buttonGo.webp";
import "@features/ocr/styles/OcrScreen.css";

/**
 * Page principale du workflow OCR.
 * Orchestre les étapes via le hook useOcrWorkflow.
 *
 * Étapes :
 *  1. select_type   → OcrTypeSelector
 *  2. upload_preview → OcrFileUploader + OcrActionModal (si Cours/Exercice)
 */
const OcrPage: React.FC = () => {
	const resetOcrWorkflow = useOcrStore((state) => state.reset);
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

	return (
		<ScreenLayout>
			<div className="ocr-page">
				<div className="ocr-content">
					{/* ─── Hero ─── */}
					<section className="ocr-hero">
						<div className="ocr-hero-halo" aria-hidden="true" />
						<div className="ocr-hero-left">
							<img src={miloGreeting} alt="Milo" className="ocr-hero-mascot" />
						</div>
						<div className="ocr-hero-center">
							<div className="ocr-hero-chip">
								<Sparkles size={14} />
								<span>Import intelligent</span>
							</div>
							<h1 className="ocr-hero-title">Importer un document</h1>
							<p className="ocr-hero-sub">
								Scanne tes cours, exercices ou bulletins et laisse Milo les
								analyser pour toi.
							</p>
						</div>
					</section>

					{/* ─── Étape 1 : Sélection du type ─── */}
					{step === "select_type" && (
						<OcrTypeSelector onSelect={handleTypeSelect} />
					)}

					{/* ─── Étape 2 : Upload + Prévisualisation ─── */}
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

							{/* ─── Modal de choix d'action (Cours / Exercice uniquement) ─── */}
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
						<div className="ocr-error-banner" role="alert">
							<span>⚠️</span>
							<span>
								{error.message || "Une erreur est survenue lors de l'envoi."}
							</span>
						</div>
					)}
				</div>
			</div>
		</ScreenLayout>
	);
};

export default OcrPage;
