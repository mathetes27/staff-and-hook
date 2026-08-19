import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Sparkles, Send, Bot, User, AlertCircle, Loader2 } from 'lucide-react';
import { sendMessageToAssistant, fetchMembersContext } from '../lib/gemini';
import type { ChatMessage } from '../lib/gemini';
import ReactMarkdown from 'react-markdown';

export function Assistant() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [interactionId, setInteractionId] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll para o fim da conversa
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !user) return;

    const userMessage: ChatMessage = { id: Date.now().toString(), role: 'user', content: input.trim() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    setError(null);

    try {
      // Pega o contexto de membros (se for a primeira mensagem, injeta o contexto no system instruction)
      let systemInstruction = undefined;
      if (!interactionId) {
        const membersContext = await fetchMembersContext(user.uid);
        systemInstruction = `Você é o "Staff & Hook Assistente Pastoral", um conselheiro e assistente especializado em auxiliar pastores na organização da igreja, estruturação de sermões e gestão eclesiástica. Mantenha um tom profissional, acolhedor e focado no crescimento espiritual e organizacional da congregação.
        
        Você tem acesso à lista atual de membros da igreja. Use essa informação SOMENTE para fins organizacionais (ex: datas de nascimento, listas, endereços, etc), e não para fofocas ou conselhos invasivos.
        
        CONTEXTO ATUAL DE MEMBROS:
        ${membersContext}`;
      }

      const response = await sendMessageToAssistant(userMessage.content, interactionId, systemInstruction);
      
      const modelMessage: ChatMessage = { 
        id: (Date.now() + 1).toString(), 
        role: 'model', 
        content: response.text || 'Não consegui formular uma resposta.' 
      };
      
      setMessages(prev => [...prev, modelMessage]);
      setInteractionId(response.interactionId);

    } catch (err: any) {
      console.error(err);
      
      // Exibe a mensagem real do erro para debugar
      setError(`Erro: ${err.message}`);
      
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-white relative overflow-hidden">
      <header className="px-8 py-6 border-b border-gray-100 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              Assistente Pastoral
            </h1>
            <p className="text-sm text-gray-500">Inteligência Artificial conectada ao seu ministério.</p>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-gray-50/50">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center max-w-lg mx-auto">
            <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mb-6">
              <Bot className="w-10 h-10 text-indigo-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Como posso ajudar hoje?</h2>
            <p className="text-gray-500 mb-8">
              Estou pronto para ajudar você a estruturar um sermão, analisar relatórios de atividades, criar cronogramas ou buscar informações organizacionais sobre seus membros.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
              <button onClick={() => setInput("Me ajude a estruturar um sermão sobre Esperança em tempos difíceis (Romanos 5).")} className="text-left p-4 bg-white border border-gray-200 rounded-xl hover:border-indigo-300 hover:shadow-sm transition-all text-sm text-gray-600">
                "Estruturar sermão sobre Romanos 5"
              </button>
              <button onClick={() => setInput("Quais são os aniversariantes deste mês baseado na nossa lista de membros?")} className="text-left p-4 bg-white border border-gray-200 rounded-xl hover:border-indigo-300 hover:shadow-sm transition-all text-sm text-gray-600">
                "Aniversariantes do mês"
              </button>
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-4 max-w-4xl mx-auto ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-gray-200' : 'bg-indigo-600 text-white'}`}>
              {msg.role === 'user' ? <User className="w-5 h-5 text-gray-600" /> : <Sparkles className="w-5 h-5" />}
            </div>
            <div className={`flex-1 px-6 py-4 rounded-2xl ${msg.role === 'user' ? 'bg-gray-100 text-gray-800 rounded-tr-sm' : 'bg-white border border-gray-200 shadow-sm rounded-tl-sm'}`}>
              {msg.role === 'model' ? (
                <div className="prose prose-indigo max-w-none text-gray-700">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              ) : (
                <p className="whitespace-pre-wrap">{msg.content}</p>
              )}
            </div>
          </div>
        ))}
        
        {loading && (
          <div className="flex gap-4 max-w-4xl mx-auto">
            <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0">
              <Loader2 className="w-5 h-5 animate-spin" />
            </div>
            <div className="px-6 py-4 rounded-2xl bg-white border border-gray-200 shadow-sm rounded-tl-sm flex items-center">
              <div className="flex gap-1.5">
                <div className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="max-w-4xl mx-auto bg-red-50 text-red-700 p-4 rounded-xl flex items-start gap-3 border border-red-100">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <p className="text-sm">{error}</p>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 sm:p-6 bg-white border-t border-gray-100 shrink-0">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto relative flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
            placeholder="Pergunte ao assistente... (Shift + Enter para quebrar linha)"
            className="w-full bg-gray-50 border border-gray-200 rounded-2xl pl-6 pr-14 py-4 min-h-[60px] max-h-[200px] resize-y focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-gray-700"
            rows={1}
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="absolute right-3 bottom-3 p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:hover:bg-indigo-600"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
        <p className="text-center text-xs text-gray-400 mt-3">A I.A. pode cometer erros. Considere verificar as informações importantes.</p>
      </div>
    </div>
  );
}
