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
): Promise<{ reply: string; conversation_id: string }> => {
    const response = await APIAxios.post(APIRoutes.POST_Lesson_Question, {
        part_content: partContent,
        question: question,
        conversation_id: conversation_id
    });
    return response.data;
};