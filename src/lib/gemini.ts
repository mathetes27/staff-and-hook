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
  // Agora fazemos a chamada para o nosso próprio backend na Vercel
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      prompt,
      previousInteractionId,
      systemInstruction
    })
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Erro desconhecido ao falar com o backend.");
  }

  return {
    text: data.text,
    interactionId: data.interactionId
  };
}
