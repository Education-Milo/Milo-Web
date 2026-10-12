import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import APIAxios, { APIRoutes } from "@api/axios.api";
import { getErrorStatus } from "@shared/lib/aiRequests";
import type {
	Catalogue,
	CatalogueFilters,
	DeleteNodeResponse,
	ImportMode,
	ImportResponse,
	NodeType,
	RagDocumentsResponse,
} from "@features/admin/store/programmes.model";

export const CATALOGUE_KEY = ["admin", "catalogue"] as const;
const RAG_KEY = ["admin", "rag-documents"] as const;

// ─── Catalogue ───────────────────────────────────────────────────────────────

export const useCatalogue = (filters: CatalogueFilters) =>
	useQuery({
		queryKey: [...CATALOGUE_KEY, filters],
		queryFn: async () => {
			const params: Record<string, string | number> = {};
			if (filters.subject_id) params.subject_id = filters.subject_id;
			if (filters.level) params.level = filters.level;
			return (await APIAxios.get<Catalogue>(APIRoutes.GET_Admin_Catalogue, { params })).data;
		},
		staleTime: 30 * 1000,
	});

/**
 * Toute écriture recharge l'arbre depuis le serveur : pas de mise à jour
 * locale, un import ou une cascade touche des nœuds à plusieurs niveaux.
 */
const useRefreshCatalogue = () => {
	const queryClient = useQueryClient();
	return () => void queryClient.invalidateQueries({ queryKey: CATALOGUE_KEY });
};

export const useCreateNode = () => {
	const refresh = useRefreshCatalogue();
	return useMutation({
		mutationFn: async ({ type, body }: { type: NodeType; body: Record<string, unknown> }) =>
			(await APIAxios.post(APIRoutes.POST_Admin_Catalogue_Node(type), body)).data,
		onSuccess: refresh,
	});
};

/** PATCH : uniquement les champs modifiés (le back applique exclude_unset). */
export const useUpdateNode = () => {
	const refresh = useRefreshCatalogue();
	return useMutation({
		mutationFn: async ({ type, id, changes }: { type: NodeType; id: number; changes: Record<string, unknown> }) =>
			(await APIAxios.patch(APIRoutes.PATCH_Admin_Catalogue_Node(type, id), changes)).data,
		onSuccess: refresh,
		// 404 : l'arbre a changé (autre admin), on le recharge
		onError: (error) => {
			if (getErrorStatus(error) === 404) refresh();
		},
	});
};

/** Jamais de cascade implicite : `cascade` n'est passé qu'après confirmation explicite. */
export const useDeleteNode = () => {
	const refresh = useRefreshCatalogue();
	return useMutation({
		mutationFn: async ({ type, id, cascade }: { type: NodeType; id: number; cascade: boolean }) =>
			(await APIAxios.delete<DeleteNodeResponse>(APIRoutes.DELETE_Admin_Catalogue_Node(type, id), {
				params: cascade ? { cascade: true } : undefined,
			})).data,
		onSuccess: refresh,
		onError: (error) => {
			if (getErrorStatus(error) === 404) refresh();
		},
	});
};

// ─── Import d'un programme ───────────────────────────────────────────────────

export type ImportRequest =
	| { source: "json"; programme: unknown; mode: ImportMode; dryRun: boolean }
	| { source: "pdf"; url: string; filename: string; mode: ImportMode; dryRun: boolean };

export const useImportProgramme = () => {
	const refresh = useRefreshCatalogue();
	return useMutation({
		mutationFn: async (request: ImportRequest) => {
			const params = { mode: request.mode, dry_run: request.dryRun };
			const response =
				request.source === "json"
					? await APIAxios.post<ImportResponse>(APIRoutes.POST_Admin_Programme_Import, request.programme, { params })
					: await APIAxios.post<ImportResponse>(
							APIRoutes.POST_Admin_Programme_Extract_PDF,
							{ url: request.url, filename: request.filename },
							{ params },
						);
			return response.data;
		},
		onSuccess: (_data, request) => {
			if (!request.dryRun) refresh();
		},
	});
};

// ─── Base de connaissances (RAG) ─────────────────────────────────────────────

export const useRagDocuments = () =>
	useQuery({
		queryKey: RAG_KEY,
		queryFn: async () => (await APIAxios.get<RagDocumentsResponse>(APIRoutes.GET_Admin_RAG_Documents)).data,
		staleTime: 30 * 1000,
		// 503 = Qdrant injoignable : pas de réessai en boucle
		retry: (failureCount, error) => {
			const status = getErrorStatus(error);
			if (status === 503 || (status !== undefined && status >= 400 && status < 500)) return false;
			return failureCount < 2;
		},
	});

const useRefreshRag = () => {
	const queryClient = useQueryClient();
	return () => void queryClient.invalidateQueries({ queryKey: RAG_KEY });
};

export const useCreateRagDocument = () => {
	const refresh = useRefreshRag();
	return useMutation({
		mutationFn: async (body: { filename: string; text: string }) =>
			(await APIAxios.post(APIRoutes.POST_Admin_RAG_Documents, body)).data,
		onSuccess: refresh,
	});
};

/** Remplace : retire les anciens fragments puis réindexe (pas d'édition en place). */
export const useReplaceRagDocument = () => {
	const refresh = useRefreshRag();
	return useMutation({
		mutationFn: async (body: { filename: string; text: string }) =>
			(await APIAxios.put(APIRoutes.PUT_Admin_RAG_Document(body.filename), body)).data,
		onSuccess: refresh,
	});
};

export const useDeleteRagDocument = () => {
	const refresh = useRefreshRag();
	return useMutation({
		mutationFn: async (filename: string) => (await APIAxios.delete(APIRoutes.DELETE_Admin_RAG_Document(filename))).data,
		onSuccess: refresh,
		onError: (error) => {
			if (getErrorStatus(error) === 404) refresh();
		},
	});
};

/** Ingestion d'un PDF distant (route existante, hors /admin). */
export const useIngestRagPdf = () => {
	const refresh = useRefreshRag();
	return useMutation({
		mutationFn: async (body: { url: string; filename: string }) =>
			(await APIAxios.post(APIRoutes.POST_Add_Programme_To_RAG, body)).data,
		onSuccess: refresh,
	});
};
