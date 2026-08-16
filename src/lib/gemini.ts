import { GoogleGenAI } from '@google/genai';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from './firebase';

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
}

export async function fetchMembersContext(userId: string) {
  try {
    const q = query(collection(db, 'members'), where('userId', '==', userId));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) return "Nenhum membro cadastrado ainda.";

    let context = "Lista de membros atuais da igreja:\n\n";
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      context += `- Nome: ${data.name || 'Desconhecido'}\n`;
      if (data.phone) context += `  Telefone: ${data.phone}\n`;
      if (data.birthdate) context += `  Data de Nascimento: ${data.birthdate}\n`;
      if (data.joinedAt) context += `  Membro desde: ${data.joinedAt}\n`;
      if (data.pastoralHistory) {
        // Remove HTML tags for AI context
        const cleanHistory = data.pastoralHistory.replace(/<[^>]*>?/gm, '');
        context += `  Histórico Pastoral/Observações: ${cleanHistory}\n`;
      }
      context += '\n';
    });

    return context;
  } catch (error) {
    console.error("Erro ao buscar contexto de membros:", error);
    return "Erro ao carregar lista de membros.";
  }
}

export async function sendMessageToAssistant(
  prompt: string, 
  previousInteractionId: string | null = null,
  systemInstruction?: string
) {
  if (!import.meta.env.VITE_GEMINI_API_KEY) {
    throw new Error("A chave VITE_GEMINI_API_KEY não está configurada no arquivo .env.local.");
  }

  const aiClient = new GoogleGenAI({ 
    apiKey: import.meta.env.VITE_GEMINI_API_KEY 
  });

  const payload: any = {
    model: "gemini-3.6-flash",
    input: prompt,
  };

  if (previousInteractionId) {
    payload.previous_interaction_id = previousInteractionId;
  }

  if (systemInstruction) {
    payload.system_instruction = systemInstruction;
  }

  const response = await aiClient.interactions.create(payload);
  return {
    text: response.output_text,
    interactionId: response.id
  };
}
