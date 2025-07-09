import { authService } from './authService';

class ChatService {
    private apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
    
    // Créer un QCM
    async createQCM(chatRequest: string): Promise<any> {
        const response = await fetch(`${this.apiBaseUrl}/qcm`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authService.getToken()}`,
            },
            body: JSON.stringify({ chat_request: chatRequest }),
        });
    
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Erreur lors de la création du QCM');
        }
    
        return response.json();
    }


    // Créer un FillIn
    async createFillIn(chatRequest: string): Promise<any> {
        const response = await fetch(`${this.apiBaseUrl}/fill_in`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authService.getToken()}`,
            },
            body: JSON.stringify({ chat_request: chatRequest }),
        });
    
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Erreur lors de la création du Fill In');
        }
    
        return response.json();
    }
}

export const chatService = new ChatService();