import { useState, useEffect } from 'react';
import { Check, Plus, Trash2, Calendar, Clock, Edit3 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../lib/firebase';
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';

type TaskCategory = 'Administrativo' | 'Ministério' | 'Estudo' | 'Pessoal';

interface Task {
  id: string;
  title: string;
  category: TaskCategory;
  completed: boolean;
  date?: string;
  time?: string;
  createdAt?: any;
}

const CATEGORY_COLORS = {
  'Administrativo': 'bg-blue-100 text-blue-800',
  'Ministério': 'bg-purple-100 text-purple-800',
  'Estudo': 'bg-amber-100 text-amber-800',
  'Pessoal': 'bg-green-100 text-green-800',
};

export function Tasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskCategory, setNewTaskCategory] = useState<TaskCategory>('Ministério');
  const [newTaskDate, setNewTaskDate] = useState('');
  const [newTaskTime, setNewTaskTime] = useState('');
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    
    const q = query(collection(db, 'tasks'), where('userId', '==', user.uid));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const tasksData: Task[] = [];
      snapshot.forEach((doc) => {
        tasksData.push({ id: doc.id, ...doc.data() } as Task);
      });
      
      tasksData.sort((a, b) => {
        const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
        const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
        return timeB - timeA;
      });
      
      setTasks(tasksData);
    });

    return () => unsubscribe();
  }, [user]);

  const addTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim() || !user) return;
    
    const title = newTaskTitle;
    setNewTaskTitle('');
    
    try {
      await addDoc(collection(db, 'tasks'), {
        title,
        category: newTaskCategory,
        date: newTaskDate,
        time: newTaskTime,
        completed: false,
        userId: user.uid,
        createdAt: serverTimestamp()
      });
    } catch (err) {
      console.error('Error adding task:', err);
      setNewTaskTitle(title);
    }
    setNewTaskDate('');
    setNewTaskTime('');
  };

  const toggleTask = async (id: string, currentCompleted: boolean) => {
    try {
      await updateDoc(doc(db, 'tasks', id), {
        completed: !currentCompleted
      });
    } catch (err) {
      console.error('Error updating task:', err);
    }
  };

  const deleteTask = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'tasks', id));
    } catch (err) {
      console.error('Error deleting task:', err);
    }
  };

  const saveTaskEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask || !editingTask.title.trim()) return;
    
    try {
      await updateDoc(doc(db, 'tasks', editingTask.id), {
        title: editingTask.title,
        category: editingTask.category,
        date: editingTask.date || '',
        time: editingTask.time || ''
      });
      setEditingTask(null);
    } catch (err) {
      console.error('Error saving task edit:', err);
    }
  };

  const pendingTasks = tasks.filter(t => !t.completed);
  const completedTasks = tasks.filter(t => t.completed);

  return (
    <div className="flex-1 overflow-y-auto p-8 bg-gray-50 h-full">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Gestão de Tarefas</h2>

        {/* Add Task Form */}
        <form onSubmit={addTask} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 mb-8 flex flex-col gap-4 transition-all hover:shadow-md">
          <div className="flex gap-4">
            <input
              type="text"
              placeholder="O que você precisa fazer?"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors font-medium text-gray-800 placeholder:text-gray-400"
            />
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 flex-1 md:flex-none">
              <Calendar className="text-indigo-500 w-4 h-4" />
              <input 
                type="date" 
                value={newTaskDate}
                onChange={(e) => setNewTaskDate(e.target.value)}
                className="bg-transparent border-none p-0 focus:ring-0 text-sm font-medium text-gray-700 outline-none w-[110px]"
              />
              <div className="w-px h-5 bg-gray-300 mx-1"></div>
              <Clock className="text-indigo-500 w-4 h-4" />
              <input 
                type="time" 
                value={newTaskTime}
                onChange={(e) => setNewTaskTime(e.target.value)}
                className="bg-transparent border-none p-0 focus:ring-0 text-sm font-medium text-gray-700 outline-none w-[80px]"
              />
            </div>
            
            <select 
              value={newTaskCategory}
              onChange={(e) => setNewTaskCategory(e.target.value as TaskCategory)}
              className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors text-sm font-medium text-gray-700 flex-1 md:flex-none"
            >
              <option value="Administrativo">Administrativo</option>
              <option value="Ministério">Ministério</option>
              <option value="Estudo">Estudo</option>
              <option value="Pessoal">Pessoal</option>
            </select>
            
            <div className="flex-1 flex justify-end">
              <button 
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl font-medium transition-all flex items-center gap-2 shadow-sm hover:shadow-indigo-200 active:scale-95"
              >
                <Plus className="w-5 h-5" /> Adicionar
              </button>
            </div>
          </div>
        </form>

        {/* Task List */}
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
              Pendentes <span className="bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full text-xs">{pendingTasks.length}</span>
            </h3>
            <div className="space-y-3">
              <AnimatePresence>
                {pendingTasks.map(task => (
                  <motion.div 
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    key={task.id} 
                    className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4 group hover:shadow-md transition-shadow"
                  >
                    {editingTask?.id === task.id ? (
                      <form onSubmit={saveTaskEdit} className="w-full flex flex-col gap-3 py-1">
                         <div className="flex gap-3">
                            <input 
                               type="text" 
                               value={editingTask.title} 
                               onChange={(e) => setEditingTask({...editingTask, title: e.target.value})}
                               className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-gray-800"
                            />
                         </div>
                         <div className="flex flex-wrap items-center gap-3">
                            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 flex-1 md:flex-none">
                              <Calendar className="text-indigo-500 w-4 h-4" />
                              <input 
                                type="date" 
                                value={editingTask.date || ''}
                                onChange={(e) => setEditingTask({...editingTask, date: e.target.value})}
                                className="bg-transparent border-none p-0 focus:ring-0 text-sm font-medium text-gray-700 outline-none w-[110px]"
                              />
                              <div className="w-px h-4 bg-gray-300 mx-1"></div>
                              <Clock className="text-indigo-500 w-4 h-4" />
                              <input 
                                type="time" 
                                value={editingTask.time || ''}
                                onChange={(e) => setEditingTask({...editingTask, time: e.target.value})}
                                className="bg-transparent border-none p-0 focus:ring-0 text-sm font-medium text-gray-700 outline-none w-[80px]"
                              />
                            </div>
                            <select 
                              value={editingTask.category}
                              onChange={(e) => setEditingTask({...editingTask, category: e.target.value as TaskCategory})}
                              className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium text-gray-700 flex-1 md:flex-none"
                            >
                              <option value="Administrativo">Administrativo</option>
                              <option value="Ministério">Ministério</option>
                              <option value="Estudo">Estudo</option>
                              <option value="Pessoal">Pessoal</option>
                            </select>
                            <div className="flex-1 flex justify-end gap-2">
                              <button type="button" onClick={() => setEditingTask(null)} className="px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-100 rounded-lg font-medium transition-colors">Cancelar</button>
                              <button type="submit" className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm">Salvar</button>
                            </div>
                         </div>
                      </form>
                    ) : (
                      <>
                        <button 
                          onClick={() => toggleTask(task.id, task.completed)}
                          className="w-6 h-6 rounded-md border-2 border-gray-300 flex items-center justify-center hover:border-indigo-500 transition-colors"
                        >
                        </button>
                        <span className="flex-1 font-medium text-gray-800">{task.title}</span>
                        
                        {(task.date || task.time) && (
                          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-[11px] font-semibold tracking-wide border border-indigo-100/50">
                            {task.date && (
                              <div className="flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5 opacity-70" />
                                <span>{task.date.split('-').reverse().join('/')}</span>
                              </div>
                            )}
                            {task.date && task.time && <div className="w-1 h-1 bg-indigo-300 rounded-full mx-0.5" />}
                            {task.time && (
                              <div className="flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5 opacity-70" />
                                <span>{task.time}</span>
                              </div>
                            )}
                          </div>
                        )}

                        <span className={`px-3 py-1.5 rounded-xl text-xs font-semibold ${CATEGORY_COLORS[task.category]}`}>
                          {task.category}
                        </span>
                        
                        <button 
                          onClick={() => setEditingTask(task)}
                          className="text-gray-400 hover:text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Editar tarefa"
                        >
                          <Edit3 className="w-5 h-5" />
                        </button>
                        
                        <button 
                          onClick={() => deleteTask(task.id)}
                          className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Excluir tarefa"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
              {pendingTasks.length === 0 && <p className="text-gray-500 text-sm italic">Nenhuma tarefa pendente!</p>}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2 mt-8">
              Concluídas <span className="bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full text-xs">{completedTasks.length}</span>
            </h3>
            <div className="space-y-3 opacity-60">
              <AnimatePresence>
                {completedTasks.map(task => (
                  <motion.div 
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    key={task.id} 
                    className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4 group"
                  >
                    {editingTask?.id === task.id ? (
                      <form onSubmit={saveTaskEdit} className="w-full flex flex-col gap-3 py-1">
                         <div className="flex gap-3">
                            <input 
                               type="text" 
                               value={editingTask.title} 
                               onChange={(e) => setEditingTask({...editingTask, title: e.target.value})}
                               className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-gray-800"
                            />
                         </div>
                         <div className="flex flex-wrap items-center gap-3">
                            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 flex-1 md:flex-none">
                              <Calendar className="text-indigo-500 w-4 h-4" />
                              <input 
                                type="date" 
                                value={editingTask.date || ''}
                                onChange={(e) => setEditingTask({...editingTask, date: e.target.value})}
                                className="bg-transparent border-none p-0 focus:ring-0 text-sm font-medium text-gray-700 outline-none w-[110px]"
                              />
                              <div className="w-px h-4 bg-gray-300 mx-1"></div>
                              <Clock className="text-indigo-500 w-4 h-4" />
                              <input 
                                type="time" 
                                value={editingTask.time || ''}
                                onChange={(e) => setEditingTask({...editingTask, time: e.target.value})}
                                className="bg-transparent border-none p-0 focus:ring-0 text-sm font-medium text-gray-700 outline-none w-[80px]"
                              />
                            </div>
                            <select 
                              value={editingTask.category}
                              onChange={(e) => setEditingTask({...editingTask, category: e.target.value as TaskCategory})}
                              className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium text-gray-700 flex-1 md:flex-none"
                            >
                              <option value="Administrativo">Administrativo</option>
                              <option value="Ministério">Ministério</option>
                              <option value="Estudo">Estudo</option>
                              <option value="Pessoal">Pessoal</option>
                            </select>
                            <div className="flex-1 flex justify-end gap-2">
                              <button type="button" onClick={() => setEditingTask(null)} className="px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-100 rounded-lg font-medium transition-colors">Cancelar</button>
                              <button type="submit" className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm">Salvar</button>
                            </div>
                         </div>
                      </form>
                    ) : (
                      <>
                        <button 
                          onClick={() => toggleTask(task.id, task.completed)}
                          className="w-6 h-6 rounded-md bg-indigo-500 flex items-center justify-center transition-colors"
                        >
                          <Check className="w-4 h-4 text-white" />
                        </button>
                        <span className="flex-1 font-medium text-gray-500 line-through">{task.title}</span>
                        
                        {(task.date || task.time) && (
                          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 text-gray-500 rounded-lg text-[11px] font-semibold tracking-wide">
                            {task.date && (
                              <div className="flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5 opacity-50" />
                                <span>{task.date.split('-').reverse().join('/')}</span>
                              </div>
                            )}
                            {task.time && (
                              <div className="flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5 opacity-50" />
                                <span>{task.time}</span>
                              </div>
                            )}
                          </div>
                        )}

                        <span className={`px-3 py-1.5 rounded-xl text-xs font-semibold opacity-70 ${CATEGORY_COLORS[task.category]}`}>
                          {task.category}
                        </span>
                        
                        <button 
                          onClick={() => setEditingTask(task)}
                          className="text-gray-400 hover:text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Editar tarefa"
                        >
                          <Edit3 className="w-5 h-5" />
                        </button>
                        
                        <button 
                          onClick={() => deleteTask(task.id)}
                          className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Excluir tarefa"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
