import React from "react";
import { useOcrWorkflow } from "../hooks/useOcrWorkflow";
import { OcrTypeSelector } from "@features/ocr/components/OcrTypeSelector/OcrTypeSelector";
import { OcrFileUploader } from "@features/ocr/components/OcrFileUploader/OcrFileUploader";
import { OcrActionModal } from "../components/OcrActionModal/OcrActionModal";
import ScreenLayout from "@shared/components/ScreenLayout.component";
import styles from "./OcrPage.module.css";

/**
 * Page principale du workflow OCR.
 * Orchestre les étapes via le hook useOcrWorkflow.
 *
 * Étapes :
 *  1. select_type   → OcrTypeSelector
 *  2. upload_preview → OcrFileUploader + OcrActionModal (si Cours/Exercice)
 */
const OcrPage: React.FC = () => {
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

	return (
		<ScreenLayout>
			<section className={styles.page}>
				<div className={styles.content}>
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
						<div className={styles.errorBanner} role="alert">
							<span>⚠️</span>
							<span>
								{error.message || "Une erreur est survenue lors de l'envoi."}
							</span>
						</div>
					)}
				</div>
			</section>
		</ScreenLayout>
	);
};

export default OcrPage;
