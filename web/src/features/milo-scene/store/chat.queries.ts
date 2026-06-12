import APIAxios, { APIRoutes } from "@api/axios.api";
import type { LessonPart } from "@features/milo-scene/store/chat.model";

export const fetchLessonParts = async (lessonId: number, context: string = "", signal?: AbortSignal): Promise<LessonPart[]> => {
    const response = await APIAxios.post(
        APIRoutes.POST_Chat_Lesson,
        {
            chat_request: "",
            context: context
        },
        { params: { lesson_id: lessonId }, signal },
    );
    return response.data.parts;
};


export const sendChatMessage = async (
    partContent: string,
    question: string,
    conversation_id?: string
): Promise<string> => {
    const response = await APIAxios.post(APIRoutes.POST_Lesson_Question, {
        part_content: partContent,
        question: question,
        conversation_id: conversation_id
    });
    return response.data.reply || response.data.content;
};

export const sendFreeChatMessage = async (
    question: string,
    conversationId: string,
    context: string = ""
): Promise<string> => {
    const formData = new FormData();
    formData.append("chat_request", question);
    formData.append("conversation_id", conversationId);
    formData.append("context", context);

    const response = await APIAxios.post(APIRoutes.POST_Free_Chat, formData, {
        headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data.reply || response.data.content || response.data.message;
};

const extractChatText = (data: any) =>
    String(data?.reply ?? data?.content ?? data?.message ?? "").trim();

const extractConversationId = (data: any) =>
    String(data?.conversation_id ?? data?.conversationId ?? "").trim();

export const sendOpenQuestionChatMessage = async ({
    chatRequest,
    conversationId,
}: {
    chatRequest: string;
    conversationId?: string;
}): Promise<{ text: string; conversationId: string }> => {
    const formData = new FormData();
    formData.append("chat_request", chatRequest);

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
