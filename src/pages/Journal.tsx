import { useState, useEffect } from 'react';
import { BookHeart, Plus, Trash2, Calendar, Edit3, ArrowLeft } from 'lucide-react';

import { db } from '../lib/firebase';
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { RichTextEditor } from '../components/RichTextEditor';

interface JournalEntry {
  id: string;
  title: string;
  content: string;
  date: string;
  tags: string[];
  createdAt?: any;
}

const TAG_COLORS: Record<string, string> = {
  'Devocional': 'bg-blue-100 text-blue-800',
  'Oração': 'bg-purple-100 text-purple-800',
  'Reflexão': 'bg-amber-100 text-amber-800',
  'Confissão': 'bg-rose-100 text-rose-800',
};

const AVAILABLE_TAGS = ['Devocional', 'Oração', 'Reflexão', 'Confissão'];

export function Journal() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  // Local state for the editor
  const [localTitle, setLocalTitle] = useState('');
  const [localContent, setLocalContent] = useState('');
  const [localTags, setLocalTags] = useState<string[]>([]);
  const [localDate, setLocalDate] = useState('');

  useEffect(() => {
    if (!user) return;
    
    const q = query(collection(db, 'journal'), where('userId', '==', user.uid));
    
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      // Mock data injection if empty (for demonstration)
      const hasSeededKey = `has_seeded_journal_${user.uid}`;
      const hasSeeded = localStorage.getItem(hasSeededKey);

      if (snapshot.empty && !hasSeeded) {
        localStorage.setItem(hasSeededKey, 'true');
        try {
          await addDoc(collection(db, 'journal'), {
            title: 'Meu primeiro registro',
            content: '<p>Este é o meu diário espiritual. Aqui posso escrever minhas orações, devocionais e reflexões de forma privada.</p>',
            date: new Date().toISOString().split('T')[0],
            tags: ['Reflexão'],
            userId: user.uid,
            createdAt: serverTimestamp()
          });
        } catch (e) {
          console.error("Erro ao criar mock do diário", e);
        }
        return; 
      }

      const entriesData: JournalEntry[] = [];
      snapshot.forEach((doc) => {
        entriesData.push({ id: doc.id, ...doc.data() } as JournalEntry);
      });
      
      entriesData.sort((a, b) => {
        const timeA = new Date(a.date).getTime();
        const timeB = new Date(b.date).getTime();
        if (timeA !== timeB) return timeB - timeA;
        const ca = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
        const cb = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
        return cb - ca;
      });
      
      setEntries(entriesData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleCreateNew = () => {
    const newEntry: JournalEntry = {
      id: 'new',
      title: '',
      content: '<p>Comece a escrever...</p>',
      date: new Date().toISOString().split('T')[0],
      tags: ['Devocional']
    };
    setSelectedEntry(newEntry);
    setLocalTitle(newEntry.title);
    setLocalContent(newEntry.content);
    setLocalTags(newEntry.tags);
    setLocalDate(newEntry.date);
    setIsEditing(true);
  };

  const handleSelectEntry = (entry: JournalEntry) => {
    setSelectedEntry(entry);
    setLocalTitle(entry.title);
    setLocalContent(entry.content);
    setLocalTags(entry.tags);
    setLocalDate(entry.date);
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (!user || !localTitle.trim()) return;

    try {
      if (selectedEntry?.id === 'new') {
        const docRef = await addDoc(collection(db, 'journal'), {
          title: localTitle,
          content: localContent,
          date: localDate,
          tags: localTags,
          userId: user.uid,
          createdAt: serverTimestamp()
        });
        setSelectedEntry({ id: docRef.id, title: localTitle, content: localContent, date: localDate, tags: localTags });
      } else if (selectedEntry) {
        await updateDoc(doc(db, 'journal', selectedEntry.id), {
          title: localTitle,
          content: localContent,
          date: localDate,
          tags: localTags
        });
        setSelectedEntry({ ...selectedEntry, title: localTitle, content: localContent, date: localDate, tags: localTags });
      }
      setIsEditing(false);
    } catch (err) {
      console.error('Error saving journal entry:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este registro?')) return;
    try {
      await deleteDoc(doc(db, 'journal', id));
      if (selectedEntry?.id === id) {
        setSelectedEntry(null);
      }
    } catch (err) {
      console.error('Error deleting journal entry:', err);
    }
  };

  const toggleTag = (tag: string) => {
    if (localTags.includes(tag)) {
      setLocalTags(localTags.filter(t => t !== tag));
    } else {
      setLocalTags([...localTags, tag]);
    }
  };

  return (
    <div className="flex h-full bg-stone-50 overflow-hidden">
      {/* Sidebar List */}
      <div className={`w-full md:w-80 border-r border-stone-200 bg-white flex-col flex shrink-0 transition-all ${selectedEntry ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-6 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
          <div className="flex items-center gap-2 text-stone-800">
            <BookHeart className="w-5 h-5 text-rose-500" />
            <h2 className="text-xl font-bold font-serif">Diário Espiritual</h2>
          </div>
          <button 
            onClick={handleCreateNew}
            className="p-2 bg-stone-800 text-white rounded-lg hover:bg-stone-700 transition-colors shadow-sm"
            title="Novo Registro"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {entries.map(entry => (
            <div 
              key={entry.id}
              onClick={() => handleSelectEntry(entry)}
              className={`p-4 rounded-xl cursor-pointer transition-all border ${
                selectedEntry?.id === entry.id 
                  ? 'bg-rose-50 border-rose-200 shadow-sm' 
                  : 'bg-white border-stone-100 hover:border-stone-200 hover:shadow-sm'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-stone-800 truncate pr-2 flex-1">{entry.title || 'Sem título'}</h3>
                <span className="text-xs text-stone-400 font-medium whitespace-nowrap">
                  {entry.date.split('-').reverse().join('/')}
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-3">
                {entry.tags.map(tag => (
                  <span key={tag} className={`px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider ${TAG_COLORS[tag] || 'bg-stone-100 text-stone-600'}`}>
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ))}
          {entries.length === 0 && !loading && (
            <div className="text-center p-8 text-stone-400">
              <BookHeart className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p className="text-sm">Nenhum registro encontrado. Comece a escrever seu diário.</p>
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col h-full overflow-hidden ${!selectedEntry ? 'hidden md:flex items-center justify-center bg-stone-50/50' : 'bg-white'}`}>
        {!selectedEntry ? (
          <div className="text-center text-stone-400 max-w-md p-8">
            <BookHeart className="w-16 h-16 mx-auto mb-6 opacity-20" />
            <h3 className="text-xl font-serif text-stone-600 mb-2">Seu espaço pessoal</h3>
            <p className="text-sm leading-relaxed">
              "Mas tu, quando orares, entra no teu aposento e, fechando a tua porta, ora a teu Pai que está em secreto; e teu Pai, que vê em secreto, te recompensará publicamente." <br/><span className="text-xs font-semibold mt-2 block">— Mateus 6:6</span>
            </p>
          </div>
        ) : (
          <div className="flex flex-col h-full">
            {/* Editor Header */}
            <div className="p-6 border-b border-stone-100 flex items-center justify-between bg-white shrink-0">
              <div className="flex items-center gap-4 flex-1">
                <button 
                  onClick={() => setSelectedEntry(null)}
                  className="md:hidden p-2 hover:bg-stone-100 rounded-full transition-colors text-stone-600"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                
                {isEditing ? (
                  <input 
                    type="text" 
                    value={localTitle}
                    onChange={e => setLocalTitle(e.target.value)}
                    placeholder="Título da reflexão..."
                    className="text-2xl font-bold font-serif text-stone-900 border-none outline-none focus:ring-0 w-full placeholder:text-stone-300 bg-transparent"
                    autoFocus
                  />
                ) : (
                  <h2 className="text-2xl font-bold font-serif text-stone-900 truncate">
                    {selectedEntry.title}
                  </h2>
                )}
              </div>

              <div className="flex items-center gap-3 shrink-0 ml-4">
                {isEditing ? (
                  <>
                    <button 
                      onClick={() => setIsEditing(false)}
                      className="px-4 py-2 text-stone-600 font-medium hover:bg-stone-100 rounded-lg transition-colors text-sm"
                    >
                      Cancelar
                    </button>
                    <button 
                      onClick={handleSave}
                      disabled={!localTitle.trim()}
                      className="px-6 py-2 bg-rose-600 text-white font-medium hover:bg-rose-700 rounded-lg transition-colors shadow-sm text-sm disabled:opacity-50"
                    >
                      Salvar
                    </button>
                  </>
                ) : (
                  <>
                    <button 
                      onClick={() => setIsEditing(true)}
                      className="p-2 text-stone-500 hover:bg-stone-100 rounded-lg transition-colors"
                      title="Editar"
                    >
                      <Edit3 className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => handleDelete(selectedEntry.id)}
                      className="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Excluir"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Editor Meta (Date & Tags) */}
            {isEditing && (
              <div className="px-6 py-4 border-b border-stone-50 bg-stone-50/50 flex flex-wrap items-center gap-6 shrink-0">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-stone-400" />
                  <input 
                    type="date" 
                    value={localDate}
                    onChange={e => setLocalDate(e.target.value)}
                    className="bg-transparent border-none text-sm font-medium text-stone-600 focus:ring-0 p-0"
                  />
                </div>
                <div className="w-px h-6 bg-stone-200"></div>
                <div className="flex flex-wrap gap-2">
                  {AVAILABLE_TAGS.map(tag => (
                    <button
                      key={tag}
                      onClick={() => toggleTag(tag)}
                      className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider transition-colors ${
                        localTags.includes(tag) 
                          ? TAG_COLORS[tag] 
                          : 'bg-white border border-stone-200 text-stone-400 hover:border-stone-300'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Editor Body */}
            <div className="flex-1 p-6 overflow-hidden flex flex-col bg-stone-50/30">
              <div className="max-w-3xl w-full mx-auto h-full">
                {isEditing ? (
                  <RichTextEditor 
                    content={localContent} 
                    onChange={setLocalContent} 
                    minHeight="100%"
                    className="border-none shadow-sm rounded-2xl h-full font-serif text-lg leading-relaxed text-stone-800"
                  />
                ) : (
                  <div className="h-full overflow-y-auto pr-4 pb-12">
                    <div className="flex items-center gap-2 mb-8 mt-2 opacity-70">
                      <Calendar className="w-4 h-4 text-stone-500" />
                      <span className="text-sm font-medium text-stone-600">{selectedEntry.date.split('-').reverse().join('/')}</span>
                      <div className="flex gap-2 ml-4">
                        {selectedEntry.tags.map(tag => (
                          <span key={tag} className={`px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider ${TAG_COLORS[tag]}`}>
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div 
                      className="prose prose-stone prose-lg max-w-none font-serif text-stone-800 prose-headings:font-serif prose-a:text-rose-600"
                      dangerouslySetInnerHTML={{ __html: selectedEntry.content }}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
