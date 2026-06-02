import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useOcrStore } from "../store/ocr.store";
import {
	useOcrReportCardMutation,
	useOcrExerciseGenerationMutation,
	useOcrCourseQcmMutation,
	useOcrFreeChatMutation,
} from "./useOcrMutations";
import type { OcrAction, OcrDocumentType } from "../types/ocr.types";
import { ROUTES } from "@shared/constants/routes";
import { useExerciseStore } from "@features/exercices/store/exercise.store";
import { useGeneratedExerciseStore } from "../store/generatedExercise.store";
import { useMiloFreeChatStore } from "@features/milo-scene/store/freeChat.store";

/**
 * Hook principal du workflow OCR.
 * Orchestre le store, les mutations et la navigation.
 */
export const useOcrWorkflow = () => {
	const navigate = useNavigate();
	const store = useOcrStore();
	const setQcmQuestions = useExerciseStore((state) => state.set_qcm);
	const setGeneratedExercise = useGeneratedExerciseStore(
		(state) => state.setGeneratedExercise,
	);
	const setMiloFreeChatSession = useMiloFreeChatStore((state) => state.setSession);

	const reportCardMutation = useOcrReportCardMutation();
	const exerciseMutation = useOcrExerciseGenerationMutation();
	const qcmMutation = useOcrCourseQcmMutation();
	const freeChatMutation = useOcrFreeChatMutation();

	// ─── Sélection du type de document ──────────────────────────────────────────

	const handleTypeSelect = useCallback(
		(type: OcrDocumentType) => {
			store.selectType(type);
		},
		[store],
	);

	// ─── Upload du fichier ───────────────────────────────────────────────────────

	const handleFileChange = useCallback(
		(file: File | null) => {
			store.setFile(file);
		},
		[store],
	);

	// ─── Suppression du fichier ──────────────────────────────────────────────────

	const handleFileDelete = useCallback(() => {
		store.setFile(null);
	}, [store]);

	// ─── Envoi du document → ouvre la modal ou envoie directement (bulletin) ───

	const handleSendDocument = useCallback(() => {
		if (!store.selectedFile || !store.selectedType) return;

		if (store.selectedType === "bulletin") {
			// Bulletin : pas de modal, envoi direct
			reportCardMutation.mutate(store.selectedFile, {
				onSuccess: () => {
					// TODO: naviguer vers la page de résultat bulletin
					navigate("/ocr/result/bulletin");
				},
			});
			return;
		}

		// Cours ou Exercice : ouvrir la modal de choix
		store.openModal();
	}, [store, reportCardMutation, navigate]);

	// ─── Confirmation de l'action depuis la modal ────────────────────────────────

	const handleActionConfirm = useCallback(
		(action: OcrAction) => {
			if (!store.selectedFile) return;

			store.closeModal();

			switch (action) {
				case "generate_qcm":
					qcmMutation.mutate(store.selectedFile, {
						onSuccess: (response) => {
							setQcmQuestions(response.reply);
							navigate(ROUTES.QCM_GENERATED, {
								state: { qcmQuestions: response.reply },
							});
						},
					});
					break;

				case "discuss_milo_cours":
				case "discuss_milo_ex":
					freeChatMutation.mutate(
						{
							file: store.selectedFile,
							chatRequest:
								action === "discuss_milo_cours"
									? "Analyse ce cours et aide-moi à le comprendre. Présente rapidement les notions importantes puis attends mes questions."
									: "Analyse cet exercice et aide-moi à le résoudre sans donner directement toute la réponse. Commence par m'expliquer ce qu'il faut comprendre.",
						},
						{
							onSuccess: (response) => {
								const session = {
									initialReply: response.reply,
									conversationId: response.conversation_id,
									context:
										action === "discuss_milo_cours"
											? "Discussion OCR à partir d'un cours importé."
											: "Discussion OCR à partir d'un exercice importé.",
									sourceLabel:
										action === "discuss_milo_cours"
											? "Cours importé"
											: "Exercice importé",
								};

								setMiloFreeChatSession(session);
								navigate(ROUTES.MILO, { state: { freeChatSession: session } });
							},
						},
					);
					break;

				case "generate_exercise":
					exerciseMutation.mutate(store.selectedFile, {
						onSuccess: (response) => {
							const generatedExercise = {
								exercise: response.reply.exercise,
								answer: response.reply.answer,
								conversationId: response.conversation_id,
							};

							setGeneratedExercise(generatedExercise);
							navigate(ROUTES.GENERATED_EXERCISE, {
								state: { generatedExercise },
							});
						},
					});
					break;
			}
		},
		[
			store,
			qcmMutation,
			exerciseMutation,
			freeChatMutation,
			navigate,
			setQcmQuestions,
			setGeneratedExercise,
			setMiloFreeChatSession,
		],
	);

	// ─── Retour à la sélection de type ──────────────────────────────────────────

	const handleBack = useCallback(() => {
		store.reset();
	}, [store]);

	// ─── État de chargement global ────────────────────────────────────────────────

	const isLoading =
		reportCardMutation.isPending ||
		exerciseMutation.isPending ||
		qcmMutation.isPending ||
		freeChatMutation.isPending;

	const error =
		reportCardMutation.error ??
		exerciseMutation.error ??
		qcmMutation.error ??
		freeChatMutation.error;

	return {
		// State
		step: store.step,
		selectedType: store.selectedType,
		selectedFile: store.selectedFile,
		previewUrl: store.previewUrl,
		isModalOpen: store.isModalOpen,
		isLoading,
		error,

		// Handlers
		handleTypeSelect,
		handleFileChange,
		handleFileDelete,
		handleSendDocument,
		handleActionConfirm,
		handleBack,
		closeModal: store.closeModal,
	};
};
