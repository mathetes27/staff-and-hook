import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
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
  const { user } = useAuth();
  const [pendingTasks, setPendingTasks] = useState(0);
  const [eventsToday, setEventsToday] = useState(0);
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

    return () => {
      unsubTasks();
      unsubEvents();
      unsubSeries();
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {[
          { title: 'Compromissos Hoje', value: loading ? '...' : eventsToday.toString() },
          { title: 'Tarefas Pendentes', value: loading ? '...' : pendingTasks.toString() },
          { title: 'Sermão da Semana', custom: (
            <div className="flex items-center space-x-2 mt-1">
              <span className={`w-3 h-3 ${nextSermonStatus && STATUS_COLORS[nextSermonStatus] ? STATUS_COLORS[nextSermonStatus] : 'bg-gray-300'} rounded-full ${nextSermonStatus === 'Em Preparação' ? 'animate-pulse' : ''}`}></span>
              <p className="text-sm font-medium text-gray-700">{loading ? '...' : (nextSermonStatus || 'Nenhum')}</p>
            </div>
          )}
        ].map((item, idx) => (
          <motion.div 
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: idx * 0.1 + 0.2 }}
            className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:border-indigo-200 hover:shadow-md transition-all cursor-pointer"
          >
            <h3 className="text-gray-500 text-sm font-medium mb-2">{item.title}</h3>
            {item.custom ? item.custom : <p className="text-3xl font-bold text-gray-900">{item.value}</p>}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
