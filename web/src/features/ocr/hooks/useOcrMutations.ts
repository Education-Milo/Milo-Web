import { useMutation } from "@tanstack/react-query";
import APIAxios, { APIRoutes } from "@api/axios.api";
import type {
	OcrReportCardResponse,
	OcrExerciseGenerationResponse,
	OcrCourseQcmResponse,
	OcrFreeChatResponse,
} from "../types/ocr.types";

// ─── Helper ────────────────────────────────────────────────────────────────────

const buildFormData = (file: File): FormData => {
	const formData = new FormData();
	formData.append("uploaded_file", file);
	return formData;
};

const buildFreeChatFormData = (file: File, chatRequest: string): FormData => {
	const formData = buildFormData(file);
	formData.append("chat_request", chatRequest);
	formData.append("context", "");
	return formData;
};

const multipartHeaders = { "Content-Type": "multipart/form-data" };

// ─── Mutation Keys ─────────────────────────────────────────────────────────────

export const ocrMutationKeys = {
	reportCard: ["ocr", "report-card"] as const,
	exerciseGeneration: ["ocr", "exercise-generation"] as const,
	courseQcm: ["ocr", "course-qcm"] as const,
	freeChat: ["ocr", "free-chat"] as const,
};

// ─── POST /ocr/report_card ────────────────────────────────────────────────────
// Bulletin scolaire → analyse automatique, pas de choix d'action ensuite

export const useOcrReportCardMutation = () =>
	useMutation<OcrReportCardResponse, Error, File>({
		mutationKey: ocrMutationKeys.reportCard,
		mutationFn: async (file: File) => {
			const { data } = await APIAxios.post<OcrReportCardResponse>(
				APIRoutes.POST_OCR_Report_Card,
				buildFormData(file),
				{ headers: multipartHeaders },
			);
			return data;
		},
	});

// ─── POST /ocr/exercise_generation ───────────────────────────────────────────
// Exercice → Générer un exercice similaire

export const useOcrExerciseGenerationMutation = () =>
	useMutation<OcrExerciseGenerationResponse, Error, File>({
		mutationKey: ocrMutationKeys.exerciseGeneration,
		mutationFn: async (file: File) => {
			const { data } = await APIAxios.post<OcrExerciseGenerationResponse>(
				APIRoutes.POST_OCR_Exercise_generation,
				buildFormData(file),
				{ headers: multipartHeaders },
			);
			return data;
		},
	});

// ─── POST /ocr/course_qcm ─────────────────────────────────────────────────────
// Cours → Générer un QCM

export const useOcrCourseQcmMutation = () =>
	useMutation<OcrCourseQcmResponse, Error, File>({
		mutationKey: ocrMutationKeys.courseQcm,
		mutationFn: async (file: File) => {
			const { data } = await APIAxios.post<OcrCourseQcmResponse>(
				APIRoutes.POST_OCR_Course_qcm,
				buildFormData(file),
				{ headers: multipartHeaders },
			);
			return data;
		},
	});

// ─── POST /chat ──────────────────────────────────────────────────────────────
// Cours / Exercice → Discuter avec Milo à partir du document importé

export const useOcrFreeChatMutation = () =>
	useMutation<OcrFreeChatResponse, Error, { file: File; chatRequest: string }>({
		mutationKey: ocrMutationKeys.freeChat,
		mutationFn: async ({ file, chatRequest }) => {
			const { data } = await APIAxios.post<OcrFreeChatResponse>(
				APIRoutes.POST_Free_Chat,
				buildFreeChatFormData(file, chatRequest),
				{ headers: multipartHeaders },
			);
			return data;
		},
	});
