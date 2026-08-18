import { GoogleGenAI } from '@google/genai';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Na Vercel, as variáveis de ambiente normais (sem VITE_) ficam no process.env
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ 
      error: 'A chave GEMINI_API_KEY não está configurada no painel da Vercel.' 
    });
  }

  try {
    const aiClient = new GoogleGenAI({ apiKey });
    
    const { prompt, previousInteractionId, systemInstruction } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

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

    return res.status(200).json({
      text: response.output_text,
      interactionId: response.id
    });
    
  } catch (error: any) {
    console.error("Erro no servidor da Vercel:", error);
    return res.status(500).json({ error: error.message || 'Erro interno do servidor ao contatar o Gemini' });
  }
}
