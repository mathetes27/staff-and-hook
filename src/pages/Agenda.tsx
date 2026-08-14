import { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Clock, MapPin, User, Plus, X } from 'lucide-react';
import { format, addDays, startOfWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../lib/firebase';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';

type EventType = 'Culto' | 'Aconselhamento' | 'Reunião' | 'Visita' | 'Pessoal';

interface Event {
  id: string;
  title: string;
  date: Date;
  time: string;
  type: EventType;
  location?: string;
  person?: string;
}

const EVENT_COLORS = {
  'Culto': 'bg-indigo-100 text-indigo-800 border-indigo-200',
  'Aconselhamento': 'bg-emerald-100 text-emerald-800 border-emerald-200',
  'Reunião': 'bg-blue-100 text-blue-800 border-blue-200',
  'Visita': 'bg-orange-100 text-orange-800 border-orange-200',
  'Pessoal': 'bg-gray-100 text-gray-800 border-gray-200',
};

export function Agenda() {
  const today = new Date();
  const [events, setEvents] = useState<Event[]>([]);
  const { user } = useAuth();
  
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'events'), where('userId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const eventsData: Event[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        eventsData.push({ 
          id: doc.id, 
          ...data,
          date: data.date?.toDate ? data.date.toDate() : new Date(data.date) 
        } as Event);
      });
      setEvents(eventsData);
    });
    return () => unsubscribe();
  }, [user]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newEvent, setNewEvent] = useState<Partial<Event>>({
    title: '',
    type: 'Reunião',
    time: '12:00',
    location: '',
    person: ''
  });
  const [newEventDateStr, setNewEventDateStr] = useState(format(today, 'yyyy-MM-dd'));

  const weekStart = startOfWeek(today, { locale: ptBR });
  const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i));

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEvent.title || !user) return;

    try {
      await addDoc(collection(db, 'events'), {
        title: newEvent.title,
        type: newEvent.type as EventType,
        date: new Date(newEventDateStr + 'T12:00:00'),
        time: newEvent.time || '',
        location: newEvent.location || '',
        person: newEvent.person || '',
        userId: user.uid,
        createdAt: serverTimestamp()
      });
      setIsModalOpen(false);
      setNewEvent({ title: '', type: 'Reunião', time: '12:00', location: '', person: '' });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-8 bg-gray-50 h-full relative">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Agenda</h2>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <Plus className="w-5 h-5" /> Novo Compromisso
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Próximos Eventos List */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-6 flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-indigo-500" /> Próximos Dias
              </h3>
              
              <div className="space-y-6">
                {[...events].sort((a,b) => a.date.getTime() - b.date.getTime()).map(event => (
                  <div key={event.id} className="flex gap-4 group">
                    <div className="flex flex-col items-center min-w-[60px]">
                      <span className="text-sm font-semibold text-gray-500 uppercase">{format(event.date, 'EEE', { locale: ptBR })}</span>
                      <span className="text-2xl font-bold text-gray-900">{format(event.date, 'dd')}</span>
                    </div>
                    
                    <div className={`flex-1 p-4 rounded-xl border-l-4 ${EVENT_COLORS[event.type].split(' ')[0].replace('bg-', 'border-')} bg-white shadow-sm border border-gray-100 transition-all hover:shadow-md`}>
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold text-gray-900">{event.title}</h4>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${EVENT_COLORS[event.type]}`}>
                          {event.type}
                        </span>
                      </div>
                      
                      <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>{event.time}</span>
                        </div>
                        {event.location && (
                          <div className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            <span>{event.location}</span>
                          </div>
                        )}
                        {event.person && (
                          <div className="flex items-center gap-1">
                            <User className="w-4 h-4" />
                            <span>{event.person}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Mini Calendar Widget */}
          <div className="space-y-6">
             <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 capitalize">
                  {format(today, 'MMMM yyyy', { locale: ptBR })}
                </h3>
                <div className="grid grid-cols-7 gap-1 text-center mb-2">
                  {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((day, i) => (
                    <div key={i} className="text-xs font-semibold text-gray-400">{day}</div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1 text-center">
                  {weekDays.map((date, i) => {
                    const isToday = date.getDate() === today.getDate() && date.getMonth() === today.getMonth();
                    return (
                      <div 
                        key={i} 
                        className={`aspect-square flex items-center justify-center rounded-lg text-sm
                          ${isToday ? 'bg-indigo-600 text-white font-bold shadow-md' : 'text-gray-700 hover:bg-gray-100 cursor-pointer'}
                        `}
                      >
                        {format(date, 'd')}
                      </div>
                    );
                  })}
                </div>
             </div>

             <div className="bg-indigo-50 rounded-2xl border border-indigo-100 p-6">
                <h3 className="font-semibold text-indigo-900 mb-2">Dica de Produtividade</h3>
                <p className="text-sm text-indigo-700 leading-relaxed">
                  Agrupe aconselhamentos em dias específicos para evitar quebras de contexto e ter mais foco no preparo de sermões.
                </p>
             </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setIsModalOpen(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col relative z-10 border border-white/20"
            >
              <div className="flex justify-between items-center p-6 border-b border-gray-100/50">
                <h3 className="text-xl font-bold text-gray-900">Novo Compromisso</h3>
                <button type="button" onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors bg-gray-100/50 p-2 rounded-full hover:bg-gray-200/50">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <form onSubmit={handleAddEvent} className="p-6 flex flex-col gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
                  <input 
                    type="text" 
                    required
                    value={newEvent.title}
                    onChange={(e) => setNewEvent({...newEvent, title: e.target.value})}
                    className="w-full border border-gray-200/80 bg-white/50 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                    placeholder="Ex: Reunião com Jovens"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Data</label>
                    <input 
                      type="date" 
                      required
                      value={newEventDateStr}
                      onChange={(e) => setNewEventDateStr(e.target.value)}
                      className="w-full border border-gray-200/80 bg-white/50 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none text-gray-700 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Horário</label>
                    <input 
                      type="time" 
                      value={newEvent.time}
                      onChange={(e) => setNewEvent({...newEvent, time: e.target.value})}
                      className="w-full border border-gray-200/80 bg-white/50 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none text-gray-700 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                  <select 
                    value={newEvent.type}
                    onChange={(e) => setNewEvent({...newEvent, type: e.target.value as EventType})}
                    className="w-full border border-gray-200/80 bg-white/50 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  >
                    <option value="Culto">Culto</option>
                    <option value="Aconselhamento">Aconselhamento</option>
                    <option value="Reunião">Reunião</option>
                    <option value="Visita">Visita</option>
                    <option value="Pessoal">Pessoal</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Local <span className="text-gray-400 font-normal">(opcional)</span></label>
                  <input 
                    type="text" 
                    value={newEvent.location}
                    onChange={(e) => setNewEvent({...newEvent, location: e.target.value})}
                    className="w-full border border-gray-200/80 bg-white/50 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    placeholder="Ex: Sala 2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Pessoa <span className="text-gray-400 font-normal">(opcional)</span></label>
                  <input 
                    type="text" 
                    value={newEvent.person}
                    onChange={(e) => setNewEvent({...newEvent, person: e.target.value})}
                    className="w-full border border-gray-200/80 bg-white/50 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    placeholder="Ex: Irmão João"
                  />
                </div>
                
                <div className="mt-4 pt-4 border-t border-gray-100/50 flex justify-end gap-3">
                  <button 
                    type="button" 
                    onClick={() => setIsModalOpen(false)}
                    className="px-5 py-2.5 text-gray-600 font-medium hover:bg-gray-100/80 rounded-xl transition-colors"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    className="px-5 py-2.5 bg-indigo-600 text-white font-medium hover:bg-indigo-700 rounded-xl transition-colors shadow-sm hover:shadow-indigo-200/50"
                  >
                    Salvar Compromisso
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
