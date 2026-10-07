import APIAxios, { APIRoutes } from "@api/axios.api";
import { refreshAfterServerAction } from "@shared/lib/serverActions";
import { AI_LIMITS, clampText } from "@shared/lib/aiRequests";
import type { LessonPart } from "@features/milo-scene/store/chat.model";

export const fetchLessonParts = async (lessonId: number, context: string = "", signal?: AbortSignal): Promise<LessonPart[]> => {
    const response = await APIAxios.post(
        APIRoutes.POST_Chat_Lesson,
        {
            chat_request: "",
            context: clampText(context, AI_LIMITS.CONTEXT)
        },
        { params: { lesson_id: lessonId }, signal },
    );
    // Le back fait avancer les missions et la streak après /chat_lesson
    refreshAfterServerAction();
    return response.data.parts;
};


export const sendChatMessage = async (
    partContent: string,
    question: string,
    conversation_id?: string
): Promise<string> => {
    const response = await APIAxios.post(APIRoutes.POST_Lesson_Question, {
        part_content: clampText(partContent, AI_LIMITS.PART_CONTENT),
        question: clampText(question, AI_LIMITS.LESSON_QUESTION),
        conversation_id: conversation_id
    });
    // Le back fait avancer les missions après /chat_lesson_question
    refreshAfterServerAction();
    return response.data.reply || response.data.content;
};

export const sendFreeChatMessage = async (
    question: string,
    conversationId: string,
    context: string = ""
): Promise<string> => {
    const formData = new FormData();
    formData.append("chat_request", clampText(question, AI_LIMITS.CHAT_REQUEST));
    formData.append("conversation_id", conversationId);
    formData.append("context", clampText(context, AI_LIMITS.CONTEXT));

    const response = await APIAxios.post(APIRoutes.POST_Free_Chat, formData, {
        headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data.reply || response.data.content || response.data.message;
};

const extractChatText = (data: any) =>
    String(data?.reply ?? data?.content ?? data?.message ?? "").trim();

const extractConversationId = (data: any) =>
    String(data?.conversation_id ?? data?.conversationId ?? "").trim();

/**
 * `chat_request` est borné à 2 000 caractères : le texte du cours passe par
 * `context` (8 000), jamais dans la consigne elle-même.
 */
export const sendOpenQuestionChatMessage = async ({
    chatRequest,
    conversationId,
    context,
}: {
    chatRequest: string;
    conversationId?: string;
    context?: string;
}): Promise<{ text: string; conversationId: string }> => {
    const formData = new FormData();
    formData.append("chat_request", clampText(chatRequest, AI_LIMITS.CHAT_REQUEST));
    if (context) {
        formData.append("context", clampText(context, AI_LIMITS.CONTEXT));
    }

    if (conversationId) {
        formData.append("conversation_id", conversationId);
    }

    const response = await APIAxios.post(APIRoutes.POST_Free_Chat, formData, {
        headers: { "Content-Type": "multipart/form-data" },
    });

    return {
        text: extractChatText(response.data),
        conversationId: extractConversationId(response.data),
    };
};
