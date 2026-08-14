import { useState, useEffect } from 'react';
import { BookOpen, Calendar, Plus, ChevronRight, ArrowLeft, Trash2, Maximize2, Minimize2, X, AlertTriangle, Edit3 } from 'lucide-react';
import { RichTextEditor } from '../components/RichTextEditor';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../lib/firebase';
import { collection, query, where, onSnapshot, doc, updateDoc, writeBatch, deleteDoc, addDoc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';

interface Sermon {
  id: string;
  title: string;
  date: string;
  status: 'Ideia' | 'Em Preparação' | 'Pronto' | 'Pregado';
  content: string;
}

interface Series {
  id: string;
  title: string;
  theme: string;
  imageColor: string;
  context?: string;
  sermons: Sermon[];
}

const mockSeries: Omit<Series, 'id'>[] = [
  {
    title: 'Sermão do Monte',
    theme: 'Mateus 5-7',
    imageColor: 'from-blue-500 to-indigo-600',
    sermons: [
      { id: '1', title: 'As Bem-Aventuranças', date: '2026-08-16', status: 'Em Preparação', content: '<p>Esboço inicial: O caráter do Reino de Deus...</p>' },
      { id: '2', title: 'Sal da Terra e Luz do Mundo', date: '2026-08-23', status: 'Ideia', content: '' },
    ]
  },
  {
    title: 'Vida de Davi',
    theme: '1 Samuel',
    imageColor: 'from-amber-500 to-orange-600',
    sermons: [
      { id: '3', title: 'Um Coração Segundo Deus', date: '2026-07-10', status: 'Pregado', content: '<p>A escolha de Davi sobre seus irmãos...</p>' },
      { id: '4', title: 'Davi e Golias', date: '2026-07-17', status: 'Pregado', content: '<p>Enfrentando gigantes com fé...</p>' },
    ]
  }
];

const STATUS_COLORS = {
  'Ideia': 'bg-gray-100 text-gray-700',
  'Em Preparação': 'bg-yellow-100 text-yellow-800',
  'Pronto': 'bg-green-100 text-green-800',
  'Pregado': 'bg-blue-100 text-blue-800',
};

export function Sermons() {
  const [series, setSeries] = useState<Series[]>([]);
  const [selectedSermon, setSelectedSermon] = useState<{sermon: Sermon, seriesId: string} | null>(null);
  
  // States for New Sermon Modal
  const [isNewSermonModalOpen, setIsNewSermonModalOpen] = useState(false);
  const [activeSeriesForNewSermon, setActiveSeriesForNewSermon] = useState<string | null>(null);
  const [newSermon, setNewSermon] = useState({ title: '', date: new Date().toISOString().split('T')[0] });

  // States for New Series Modal
  const [isNewSeriesModalOpen, setIsNewSeriesModalOpen] = useState(false);
  const [newSeries, setNewSeries] = useState({ title: '', theme: '', context: '', imageColor: 'from-blue-500 to-indigo-600' });

  // States for Edit Series Modal
  const [editSeries, setEditSeries] = useState<{ isOpen: boolean, id: string, title: string, theme: string, context: string, imageColor: string }>({ isOpen: false, id: '', title: '', theme: '', context: '', imageColor: '' });

  // State for Delete Confirmation
  const [deleteConfirmation, setDeleteConfirmation] = useState<{isOpen: boolean, type: 'series' | 'sermon', seriesId?: string, sermonId?: string}>({ isOpen: false, type: 'sermon' });

  const { user } = useAuth();
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'series'), where('userId', '==', user.uid));
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const hasSeededKey = `has_seeded_series_${user.uid}`;
      const hasSeeded = localStorage.getItem(hasSeededKey);

      if (snapshot.empty && !hasSeeded) {
        localStorage.setItem(hasSeededKey, 'true');
        const batch = writeBatch(db);
        mockSeries.forEach(s => {
          const docRef = doc(collection(db, 'series'));
          batch.set(docRef, { ...s, userId: user.uid, id: docRef.id });
        });
        await batch.commit();
        return; 
      }

      const seriesData: Series[] = [];
      snapshot.forEach((doc) => {
        seriesData.push({ id: doc.id, ...doc.data() } as Series);
      });
      setSeries(seriesData);
    });
    return () => unsubscribe();
  }, [user]);

  const handleSaveSermon = async (seriesId: string, updatedSermon: Sermon) => {
    const s = series.find(s => s.id === seriesId);
    if (!s) return;
    
    const updatedSermons = s.sermons.map(srmn => srmn.id === updatedSermon.id ? updatedSermon : srmn);
    
    try {
      await updateDoc(doc(db, 'series', seriesId), {
        sermons: updatedSermons
      });
      // Remoção do setSelectedSermon(null) para manter o editor aberto
    } catch (err: any) {
      console.error(err);
      alert('Erro ao salvar sermão: ' + err.message);
    }
  };

  const handleDeleteSermon = (e: React.MouseEvent, seriesId: string, sermonId: string) => {
    e.stopPropagation();
    setDeleteConfirmation({ isOpen: true, type: 'sermon', seriesId, sermonId });
  };

  const handleDeleteSeries = (seriesId: string) => {
    setDeleteConfirmation({ isOpen: true, type: 'series', seriesId });
  };

  const confirmDelete = async () => {
    if (deleteConfirmation.type === 'series' && deleteConfirmation.seriesId) {
      try {
        await deleteDoc(doc(db, 'series', deleteConfirmation.seriesId));
        if (selectedSermon?.seriesId === deleteConfirmation.seriesId) {
           setSelectedSermon(null);
        }
      } catch (error) { console.error(error); }
    } else if (deleteConfirmation.type === 'sermon' && deleteConfirmation.seriesId && deleteConfirmation.sermonId) {
      const s = series.find(ser => ser.id === deleteConfirmation.seriesId);
      if (s) {
        try {
          await updateDoc(doc(db, 'series', deleteConfirmation.seriesId), {
            sermons: s.sermons.filter(srmn => srmn.id !== deleteConfirmation.sermonId)
          });
          if (selectedSermon?.sermon.id === deleteConfirmation.sermonId) {
             setSelectedSermon(null);
          }
        } catch (error) { console.error(error); }
      }
    }
    setDeleteConfirmation({ isOpen: false, type: 'sermon' });
  };

  const handleOpenNewSermonModal = (seriesId: string) => {
    setActiveSeriesForNewSermon(seriesId);
    setNewSermon({ title: '', date: new Date().toISOString().split('T')[0] });
    setIsNewSermonModalOpen(true);
  };

  const handleAddSermon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSeriesForNewSermon || !newSermon.title) return;
    
    const s = series.find(ser => ser.id === activeSeriesForNewSermon);
    if (!s) return;

    const newSrmn: Sermon = {
      id: Date.now().toString(),
      title: newSermon.title,
      date: newSermon.date,
      status: 'Ideia',
      content: '<p>Comece a escrever seu esboço aqui...</p>'
    };

    try {
      await updateDoc(doc(db, 'series', activeSeriesForNewSermon), {
        sermons: [...s.sermons, newSrmn]
      });
      setIsNewSermonModalOpen(false);
    } catch (error: any) {
      console.error(error);
      alert('Erro ao adicionar sermão: ' + error.message);
    }
  };

  const handleAddSeries = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSeries.title || !user) return;
    
    try {
      await addDoc(collection(db, 'series'), {
        title: newSeries.title,
        theme: newSeries.theme,
        context: newSeries.context || '',
        imageColor: newSeries.imageColor,
        sermons: [],
        userId: user.uid
      });
      setIsNewSeriesModalOpen(false);
      setNewSeries({ title: '', theme: '', context: '', imageColor: 'from-blue-500 to-indigo-600' });
    } catch (error: any) {
      console.error(error);
      alert('Erro ao criar série: ' + error.message);
    }
  };

  const handleOpenEditSeriesModal = (s: Series) => {
    setEditSeries({ isOpen: true, id: s.id, title: s.title, theme: s.theme, context: s.context || '', imageColor: s.imageColor });
  };

  const handleEditSeriesSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editSeries.title || !editSeries.id) return;
    
    try {
      await updateDoc(doc(db, 'series', editSeries.id), {
        title: editSeries.title,
        theme: editSeries.theme,
        context: editSeries.context,
        imageColor: editSeries.imageColor,
      });
      setEditSeries({ isOpen: false, id: '', title: '', theme: '', context: '', imageColor: '' });
    } catch (error: any) {
      console.error(error);
      alert('Erro ao editar série: ' + error.message);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-8 bg-gray-50 h-full relative">
      <div className="max-w-5xl mx-auto">
        
        {!selectedSermon ? (
          <>
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-gray-900">Séries e Sermões</h2>
              <button 
                onClick={() => setIsNewSeriesModalOpen(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                <Plus className="w-5 h-5" /> Nova Série
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {series.map(s => (
                <div key={s.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden group flex flex-col h-full">
                  <div className={`relative min-h-[7rem] bg-gradient-to-r ${s.imageColor} p-6 flex flex-col justify-end`}>
                    <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => handleOpenEditSeriesModal(s)}
                        className="text-white/70 hover:text-white hover:bg-white/20 p-1.5 rounded-lg transition-all"
                        title="Editar série"
                      >
                        <Edit3 className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={() => handleDeleteSeries(s.id)}
                        className="text-white/70 hover:text-white hover:bg-white/20 p-1.5 rounded-lg transition-all"
                        title="Excluir série inteira"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                    <h3 className="text-xl md:text-2xl font-bold text-white drop-shadow-sm leading-tight line-clamp-2 break-words pr-16">{s.title}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-white/80 text-sm font-medium line-clamp-1">{s.theme}</p>
                      {s.context && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-white/20 text-white border border-white/30 uppercase tracking-wide">
                          {s.context}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="p-4 flex-1 flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Sermões ({s.sermons.length})</span>
                      <button 
                        onClick={() => handleOpenNewSermonModal(s.id)}
                        className="text-indigo-600 hover:text-indigo-800 text-sm font-medium flex items-center bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        <Plus className="w-4 h-4 mr-1" /> Adicionar
                      </button>
                    </div>
                    <div className="space-y-3">
                      {s.sermons.length === 0 && <p className="text-gray-400 text-sm italic py-2">Nenhum sermão nesta série.</p>}
                      {s.sermons.map(sermon => (
                        <div 
                          key={sermon.id} 
                          onClick={() => setSelectedSermon({ sermon, seriesId: s.id })}
                          className="group/sermon flex items-center justify-between p-3 rounded-xl border border-gray-100 hover:border-indigo-300 hover:shadow-sm cursor-pointer transition-all bg-gray-50/50 hover:bg-white"
                        >
                          <div className="flex items-center gap-3">
                            <BookOpen className="w-5 h-5 text-gray-400 group-hover/sermon:text-indigo-500 transition-colors" />
                            <div>
                              <div className="flex items-center">
                                <p className="font-medium text-gray-900">{sermon.title}</p>
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                <Calendar className="w-3 h-3 text-gray-500" />
                                <span className="text-xs text-gray-500">{new Date(sermon.date).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className={`px-2 py-1 rounded-md text-xs font-semibold ${STATUS_COLORS[sermon.status]}`}>
                              {sermon.status}
                            </span>
                            <button 
                              onClick={(e) => handleDeleteSermon(e, s.id, sermon.id)}
                              className="opacity-0 group-hover/sermon:opacity-100 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                              title="Excluir sermão"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                            <ChevronRight className="w-4 h-4 text-gray-300 group-hover/sermon:text-gray-500" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <SermonEditor 
            sermon={selectedSermon.sermon} 
            onBack={() => setSelectedSermon(null)} 
            onSave={(updated) => handleSaveSermon(selectedSermon.seriesId, updated)} 
          />
        )}
      </div>

      {/* Modal Novo Sermão */}
      <AnimatePresence>
        {isNewSermonModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setIsNewSermonModalOpen(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col relative z-10 border border-white/20"
            >
              <div className="flex justify-between items-center p-6 border-b border-gray-100/50">
                <h3 className="text-xl font-bold text-gray-900">Novo Sermão</h3>
                <button type="button" onClick={() => setIsNewSermonModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors bg-gray-100/50 p-2 rounded-full hover:bg-gray-200/50">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <form onSubmit={handleAddSermon} className="p-6 flex flex-col gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Título do Sermão</label>
                  <input 
                    type="text" 
                    required
                    autoFocus
                    value={newSermon.title}
                    onChange={(e) => setNewSermon({...newSermon, title: e.target.value})}
                    className="w-full border border-gray-200/80 bg-white/50 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                    placeholder="Ex: O Bom Samaritano"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Data Prevista</label>
                  <input 
                    type="date" 
                    required
                    value={newSermon.date}
                    onChange={(e) => setNewSermon({...newSermon, date: e.target.value})}
                    className="w-full border border-gray-200/80 bg-white/50 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none text-gray-700 transition-all"
                  />
                </div>
                
                <div className="mt-4 pt-4 border-t border-gray-100/50 flex justify-end gap-3">
                  <button 
                    type="button" 
                    onClick={() => setIsNewSermonModalOpen(false)}
                    className="px-5 py-2.5 text-gray-600 font-medium hover:bg-gray-100/80 rounded-xl transition-colors"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    className="px-5 py-2.5 bg-indigo-600 text-white font-medium hover:bg-indigo-700 rounded-xl transition-colors shadow-sm hover:shadow-indigo-200/50"
                  >
                    Criar Sermão
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Nova Série */}
      <AnimatePresence>
        {isNewSeriesModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setIsNewSeriesModalOpen(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col relative z-10 border border-white/20"
            >
              <div className="flex justify-between items-center p-6 border-b border-gray-100/50">
                <h3 className="text-xl font-bold text-gray-900">Nova Série</h3>
                <button type="button" onClick={() => setIsNewSeriesModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors bg-gray-100/50 p-2 rounded-full hover:bg-gray-200/50">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <form onSubmit={handleAddSeries} className="p-6 flex flex-col gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Título da Série</label>
                  <input 
                    type="text" 
                    required
                    autoFocus
                    value={newSeries.title}
                    onChange={(e) => setNewSeries({...newSeries, title: e.target.value})}
                    className="w-full border border-gray-200/80 bg-white/50 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                    placeholder="Ex: Fruto do Espírito"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tema / Referência</label>
                    <input 
                      type="text" 
                      required
                      value={newSeries.theme}
                      onChange={(e) => setNewSeries({...newSeries, theme: e.target.value})}
                      className="w-full border border-gray-200/80 bg-white/50 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none text-gray-700 transition-all"
                      placeholder="Ex: Gálatas 5:22-23"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contexto / Ocasião</label>
                    <input 
                      type="text" 
                      list="seriesContextOptions"
                      value={newSeries.context}
                      onChange={(e) => setNewSeries({...newSeries, context: e.target.value})}
                      className="w-full border border-gray-200/80 bg-white/50 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none text-gray-700 transition-all"
                      placeholder="Ex: Jovens, Culto Dominical..."
                    />
                    <datalist id="seriesContextOptions">
                      <option value="Culto Dominical" />
                      <option value="Jovens" />
                      <option value="Reunião de Oração" />
                      <option value="Mulheres" />
                      <option value="Casais" />
                      <option value="Congresso" />
                    </datalist>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Cor da Capa</label>
                  <div className="flex gap-3">
                    {[
                      { name: 'Azul', value: 'from-blue-500 to-indigo-600' },
                      { name: 'Laranja', value: 'from-amber-500 to-orange-600' },
                      { name: 'Verde', value: 'from-emerald-400 to-teal-500' },
                      { name: 'Roxo', value: 'from-fuchsia-500 to-purple-600' },
                    ].map(color => (
                      <button
                        key={color.value}
                        type="button"
                        onClick={() => setNewSeries({...newSeries, imageColor: color.value})}
                        className={`w-8 h-8 rounded-full bg-gradient-to-br ${color.value} ${newSeries.imageColor === color.value ? 'ring-2 ring-offset-2 ring-gray-800 scale-110' : ''} transition-all`}
                        title={color.name}
                      />
                    ))}
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t border-gray-100/50 flex justify-end gap-3">
                  <button 
                    type="button" 
                    onClick={() => setIsNewSeriesModalOpen(false)}
                    className="px-5 py-2.5 text-gray-600 font-medium hover:bg-gray-100/80 rounded-xl transition-colors"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    className="px-5 py-2.5 bg-indigo-600 text-white font-medium hover:bg-indigo-700 rounded-xl transition-colors shadow-sm hover:shadow-indigo-200/50"
                  >
                    Criar Série
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Editar Série */}
      <AnimatePresence>
        {editSeries.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setEditSeries({ ...editSeries, isOpen: false })}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col relative z-10 border border-white/20"
            >
              <div className="flex justify-between items-center p-6 border-b border-gray-100/50">
                <h3 className="text-xl font-bold text-gray-900">Editar Série</h3>
                <button type="button" onClick={() => setEditSeries({ ...editSeries, isOpen: false })} className="text-gray-400 hover:text-gray-600 transition-colors bg-gray-100/50 p-2 rounded-full hover:bg-gray-200/50">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <form onSubmit={handleEditSeriesSubmit} className="p-6 flex flex-col gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Título da Série</label>
                  <input 
                    type="text" 
                    required
                    autoFocus
                    value={editSeries.title}
                    onChange={(e) => setEditSeries({...editSeries, title: e.target.value})}
                    className="w-full border border-gray-200/80 bg-white/50 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tema / Referência</label>
                    <input 
                      type="text" 
                      required
                      value={editSeries.theme}
                      onChange={(e) => setEditSeries({...editSeries, theme: e.target.value})}
                      className="w-full border border-gray-200/80 bg-white/50 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none text-gray-700 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contexto / Ocasião</label>
                    <input 
                      type="text" 
                      list="editSeriesContextOptions"
                      value={editSeries.context}
                      onChange={(e) => setEditSeries({...editSeries, context: e.target.value})}
                      className="w-full border border-gray-200/80 bg-white/50 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none text-gray-700 transition-all"
                    />
                    <datalist id="editSeriesContextOptions">
                      <option value="Culto Dominical" />
                      <option value="Jovens" />
                      <option value="Reunião de Oração" />
                      <option value="Mulheres" />
                      <option value="Casais" />
                      <option value="Congresso" />
                    </datalist>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Cor da Capa</label>
                  <div className="flex gap-3">
                    {[
                      { name: 'Azul', value: 'from-blue-500 to-indigo-600' },
                      { name: 'Laranja', value: 'from-amber-500 to-orange-600' },
                      { name: 'Verde', value: 'from-emerald-400 to-teal-500' },
                      { name: 'Roxo', value: 'from-fuchsia-500 to-purple-600' },
                    ].map(color => (
                      <button
                        key={color.value}
                        type="button"
                        onClick={() => setEditSeries({...editSeries, imageColor: color.value})}
                        className={`w-8 h-8 rounded-full bg-gradient-to-br ${color.value} ${editSeries.imageColor === color.value ? 'ring-2 ring-offset-2 ring-gray-800 scale-110' : ''} transition-all`}
                        title={color.name}
                      />
                    ))}
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t border-gray-100/50 flex justify-end gap-3">
                  <button 
                    type="button" 
                    onClick={() => setEditSeries({ ...editSeries, isOpen: false })}
                    className="px-5 py-2.5 text-gray-600 font-medium hover:bg-gray-100/80 rounded-xl transition-colors"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    className="px-5 py-2.5 bg-indigo-600 text-white font-medium hover:bg-indigo-700 rounded-xl transition-colors shadow-sm hover:shadow-indigo-200/50"
                  >
                    Salvar Alterações
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Confirmação de Exclusão */}
      <AnimatePresence>
        {deleteConfirmation.isOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setDeleteConfirmation({ isOpen: false, type: 'sermon' })}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col relative z-10 p-6 text-center"
            >
              <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Confirmar Exclusão</h3>
              <p className="text-gray-500 mb-6 text-sm">
                Tem certeza que deseja excluir 
                <strong className="text-gray-700"> {deleteConfirmation.type === 'series' ? 'esta série inteira e todos os seus sermões' : 'este sermão'}</strong> permanentemente?
                <br />Esta ação não pode ser desfeita.
              </p>
              
              <div className="flex justify-center gap-3 w-full">
                <button 
                  onClick={() => setDeleteConfirmation({ isOpen: false, type: 'sermon' })}
                  className="flex-1 py-2.5 text-gray-600 font-medium hover:bg-gray-100 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  onClick={confirmDelete}
                  className="flex-1 py-2.5 bg-red-600 text-white font-medium hover:bg-red-700 rounded-xl transition-colors shadow-sm"
                >
                  Excluir
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SermonEditor({ sermon, onBack, onSave }: { sermon: Sermon; onBack: () => void; onSave: (sermon: Sermon) => Promise<void> | void }) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [localContent, setLocalContent] = useState(sermon.content || '<p>Comece a escrever seu esboço aqui...</p>');

  const handleSaveClick = async () => {
    setSaveState('saving');
    await onSave({
      ...sermon,
      content: localContent
    });
    setSaveState('saved');
    setTimeout(() => setSaveState('idle'), 2000);
  };

  return (
    <div className={`bg-white shadow-sm flex flex-col transition-all duration-300 ${isFullscreen ? 'fixed inset-0 z-[100] h-screen w-screen rounded-none' : 'rounded-2xl border border-gray-100 min-h-[80vh]'}`}>
      {/* Editor Header */}
      <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
        <div className="flex items-center gap-4">
          <button 
            onClick={isFullscreen ? () => setIsFullscreen(false) : onBack}
            className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-600"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center">
              {sermon.title}
            </h2>
            {!isFullscreen && (
              <div className="flex items-center gap-3 mt-1 text-sm">
                <span className="text-gray-500 flex items-center gap-1"><Calendar className="w-4 h-4"/> {new Date(sermon.date).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}</span>
                <span className={`px-2 py-0.5 rounded text-xs font-semibold ${STATUS_COLORS[sermon.status]}`}>{sermon.status}</span>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className={`flex items-center gap-2 px-4 py-2 font-medium rounded-lg transition-colors ${isFullscreen ? 'bg-amber-100 text-amber-800 hover:bg-amber-200' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            {isFullscreen ? (
              <><Minimize2 className="w-5 h-5" /> Sair da Pregação</>
            ) : (
              <><Maximize2 className="w-5 h-5" /> Modo Pregação</>
            )}
          </button>
          {!isFullscreen && (
            <button 
              onClick={handleSaveClick}
              disabled={saveState !== 'idle'}
              className={`px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                saveState === 'saved' ? 'bg-emerald-500 text-white' : 
                saveState === 'saving' ? 'bg-indigo-400 text-white cursor-wait' : 
                'bg-indigo-600 hover:bg-indigo-700 text-white'
              }`}
            >
              {saveState === 'saving' && 'Salvando...'}
              {saveState === 'saved' && 'Salvo! ✓'}
              {saveState === 'idle' && 'Salvar'}
            </button>
          )}
        </div>
      </div>

      {/* Editor Content */}
      <div className={`p-8 flex-1 overflow-y-auto ${isFullscreen ? 'bg-white' : ''}`}>
        <div className={isFullscreen ? 'max-w-4xl mx-auto pb-32' : ''}>
          <RichTextEditor 
            content={localContent} 
            onChange={setLocalContent} 
            minHeight={isFullscreen ? "800px" : "400px"}
            className={isFullscreen ? "border-none shadow-none p-0 prose-xl" : ""}
          />
        </div>
      </div>
    </div>
  );
}
