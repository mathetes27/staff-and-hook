import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BookOpen, BookHeart, PlusCircle } from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';

const STATUS_COLORS: Record<string, string> = {
  'Ideia': 'bg-gray-400',
  'Em Preparação': 'bg-yellow-400',
  'Pronto': 'bg-green-400',
  'Pregado': 'bg-blue-400',
};

export function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [pendingTasks, setPendingTasks] = useState(0);
  const [eventsToday, setEventsToday] = useState(0);
  const [birthdaysToday, setBirthdaysToday] = useState(0);
  const [nextSermonStatus, setNextSermonStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const qTasks = query(collection(db, 'tasks'), where('userId', '==', user.uid));
    const unsubTasks = onSnapshot(qTasks, (snapshot) => {
      let count = 0;
      snapshot.forEach(doc => {
        if (!doc.data().completed) count++;
      });
      setPendingTasks(count);
    });

    const qEvents = query(collection(db, 'events'), where('userId', '==', user.uid));
    const unsubEvents = onSnapshot(qEvents, (snapshot) => {
      let count = 0;
      const todayDateStr = new Date().toISOString().split('T')[0];
      snapshot.forEach(doc => {
        const data = doc.data();
        const eventDate = data.date?.toDate ? data.date.toDate() : new Date(data.date);
        if (eventDate.toISOString().split('T')[0] === todayDateStr) {
          count++;
        }
      });
      setEventsToday(count);
    });

    const qSeries = query(collection(db, 'series'), where('userId', '==', user.uid));
    const unsubSeries = onSnapshot(qSeries, (snapshot) => {
      let closestSermon: any = null;
      let closestDiff = Infinity;
      const todayStr = new Date().toISOString().split('T')[0];

      snapshot.forEach(doc => {
        const data = doc.data();
        if (data.sermons && Array.isArray(data.sermons)) {
          data.sermons.forEach((sermon: any) => {
             // Consider anything today or in the future
             if (sermon.date >= todayStr) {
                const diff = new Date(sermon.date).getTime() - new Date(todayStr).getTime();
                if (diff < closestDiff) {
                   closestDiff = diff;
                   closestSermon = sermon;
                }
             }
          });
        }
      });
      
      if (closestSermon) {
        setNextSermonStatus(closestSermon.status);
      } else {
        setNextSermonStatus('Nenhum agendado');
      }
      setLoading(false);
    });

    const qMembers = query(collection(db, 'members'), where('userId', '==', user.uid));
    const unsubMembers = onSnapshot(qMembers, (snapshot) => {
      let count = 0;
      const today = new Date();
      const todayMonth = today.getMonth() + 1;
      const todayDay = today.getDate();
      
      snapshot.forEach(doc => {
        const data = doc.data();
        if (data.birthdate) {
           const parts = data.birthdate.split('-');
           if (parts.length === 3) {
             const month = parseInt(parts[1], 10);
             const day = parseInt(parts[2], 10);
             if (month === todayMonth && day === todayDay) {
               count++;
             }
           }
        }
      });
      setBirthdaysToday(count);
    });

    return () => {
      unsubTasks();
      unsubEvents();
      unsubSeries();
      unsubMembers();
    };
  }, [user]);

  return (
    <div className="flex-1 overflow-y-auto p-8 bg-gray-50 h-full">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8 p-6 bg-white rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between"
      >
        <div>
          <p className="text-sm text-gray-500 font-medium mb-1">Versículo do Dia</p>
          <p className="text-lg font-serif italic text-gray-800">"Tudo posso naquele que me fortalece." - Filipenses 4:13</p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[
          { title: 'Compromissos Hoje', value: loading ? '...' : eventsToday.toString(), link: '/agenda' },
          { title: 'Tarefas Pendentes', value: loading ? '...' : pendingTasks.toString(), link: '/tarefas' },
          { title: 'Aniversariantes', value: loading ? '...' : birthdaysToday.toString(), link: '/membros' },
          { title: 'Sermão da Semana', link: '/sermoes', custom: (
            <div className="flex items-center space-x-2 mt-1">
              <span className={`w-3 h-3 ${nextSermonStatus && STATUS_COLORS[nextSermonStatus] ? STATUS_COLORS[nextSermonStatus] : 'bg-gray-300'} rounded-full ${nextSermonStatus === 'Em Preparação' ? 'animate-pulse' : ''}`}></span>
              <p className="text-sm font-medium text-gray-700 truncate">{loading ? '...' : (nextSermonStatus || 'Nenhum')}</p>
            </div>
          )}
        ].map((item, idx) => (
          <motion.div 
            key={idx}
            onClick={() => navigate(item.link)}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: idx * 0.1 + 0.2 }}
            className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer flex flex-col justify-center relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
              <PlusCircle className="w-4 h-4 text-indigo-400" />
            </div>
            <h3 className="text-gray-500 text-sm font-medium mb-2">{item.title}</h3>
            {item.custom ? item.custom : <p className="text-3xl font-bold text-gray-900">{item.value}</p>}
          </motion.div>
        ))}
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Acesso Rápido</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <motion.button 
            onClick={() => navigate('/sermoes')}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.5 }}
            className="flex items-center gap-3 p-4 bg-indigo-50 border border-indigo-100 rounded-xl hover:bg-indigo-100 transition-colors text-left shadow-sm hover:shadow"
          >
            <div className="bg-indigo-600 text-white p-3 rounded-xl shadow-sm">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <p className="font-semibold text-indigo-900">Criar Novo Sermão</p>
              <p className="text-xs text-indigo-700 mt-0.5">Ir direto para a escrita da pregação</p>
            </div>
          </motion.button>
          
          <motion.button 
            onClick={() => navigate('/diario')}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.6 }}
            className="flex items-center gap-3 p-4 bg-rose-50 border border-rose-100 rounded-xl hover:bg-rose-100 transition-colors text-left shadow-sm hover:shadow"
          >
            <div className="bg-rose-500 text-white p-3 rounded-xl shadow-sm">
              <BookHeart className="w-5 h-5" />
            </div>
            <div>
              <p className="font-semibold text-rose-900">Novo Devocional/Estudo</p>
              <p className="text-xs text-rose-700 mt-0.5">Registrar reflexão ou estudo no diário</p>
            </div>
          </motion.button>
        </div>
      </div>
    </div>
  );
}
