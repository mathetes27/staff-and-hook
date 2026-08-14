import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs, addDoc, updateDoc, doc, orderBy } from 'firebase/firestore';
import { Plus, Search, User, Phone, Calendar, Edit3, X, Save } from 'lucide-react';
import { PinGate } from '../components/PinGate';
import { RichTextEditor } from '../components/RichTextEditor';

interface Member {
  id: string;
  name: string;
  birthdate: string;
  phone: string;
  pastoralHistory: string;
  joinedAt: string;
}

export function Members() {
  const { user } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form State
  const [name, setName] = useState('');
  const [birthdate, setBirthdate] = useState('');
  const [phone, setPhone] = useState('');
  const [joinedAt, setJoinedAt] = useState('');
  const [pastoralHistory, setPastoralHistory] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchMembers();
  }, [user]);

  const fetchMembers = async () => {
    if (!user) return;
    try {
      const q = query(collection(db, 'members'), where('userId', '==', user.uid), orderBy('name', 'asc'));
      const querySnapshot = await getDocs(q);
      const membersData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Member));
      setMembers(membersData);
    } catch (err) {
      console.error("Erro ao buscar membros:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenNew = () => {
    setEditingId(null);
    setName('');
    setBirthdate('');
    setPhone('');
    setJoinedAt('');
    setPastoralHistory('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (member: Member) => {
    setEditingId(member.id);
    setName(member.name || '');
    setBirthdate(member.birthdate || '');
    setPhone(member.phone || '');
    setJoinedAt(member.joinedAt || '');
    setPastoralHistory(member.pastoralHistory || '');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    setSaving(true);
    try {
      if (editingId) {
        await updateDoc(doc(db, 'members', editingId), {
          name, birthdate, phone, joinedAt, pastoralHistory
        });
        setMembers(members.map(m => m.id === editingId ? { ...m, name, birthdate, phone, joinedAt, pastoralHistory } : m));
        if (selectedMember?.id === editingId) {
          setSelectedMember({ ...selectedMember, name, birthdate, phone, joinedAt, pastoralHistory });
        }
      } else {
        const newDoc = await addDoc(collection(db, 'members'), {
          userId: user!.uid,
          name, birthdate, phone, joinedAt, pastoralHistory,
          createdAt: new Date().toISOString()
        });
        setMembers([...members, { id: newDoc.id, name, birthdate, phone, joinedAt, pastoralHistory }].sort((a, b) => a.name.localeCompare(b.name)));
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error("Erro ao salvar:", err);
    } finally {
      setSaving(false);
    }
  };

  const filteredMembers = members.filter(m => m.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <PinGate>
      <div className="p-8 h-full flex flex-col">
        <header className="flex justify-between items-center mb-8 shrink-0">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Membros</h1>
            <p className="text-gray-500 mt-1">Cuidado pastoral e histórico do rebanho.</p>
          </div>
          <button 
            onClick={handleOpenNew}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-medium transition-colors shadow-sm flex items-center gap-2"
          >
            <Plus className="w-5 h-5" /> Adicionar Membro
          </button>
        </header>

        <div className="flex flex-1 overflow-hidden gap-6">
          {/* List Sidebar */}
          <div className="w-1/3 min-w-[300px] flex flex-col bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-gray-100">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar membro..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="p-8 text-center text-gray-400">Carregando...</div>
              ) : filteredMembers.length === 0 ? (
                <div className="p-8 text-center text-gray-400">Nenhum membro encontrado.</div>
              ) : (
                <ul className="divide-y divide-gray-50">
                  {filteredMembers.map(member => (
                    <li key={member.id}>
                      <button
                        onClick={() => setSelectedMember(member)}
                        className={`w-full text-left p-4 hover:bg-gray-50 transition-colors flex items-center gap-3 ${selectedMember?.id === member.id ? 'bg-indigo-50/50' : ''}`}
                      >
                        <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm shrink-0">
                          {member.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="overflow-hidden">
                          <p className="font-medium text-gray-900 truncate">{member.name}</p>
                          <p className="text-xs text-gray-500 truncate">{member.phone || 'Sem telefone'}</p>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Details View */}
          <div className="flex-1 bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
            {selectedMember ? (
              <>
                <div className="p-6 border-b border-gray-100 flex justify-between items-start">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-2xl">
                      {selectedMember.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">{selectedMember.name}</h2>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                        {selectedMember.phone && <span className="flex items-center gap-1"><Phone className="w-4 h-4" /> {selectedMember.phone}</span>}
                        {selectedMember.birthdate && <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> Nasc: {selectedMember.birthdate}</span>}
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleOpenEdit(selectedMember)}
                    className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                    title="Editar informações"
                  >
                    <Edit3 className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="flex-1 p-6 overflow-y-auto bg-gray-50/30">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Histórico Pastoral & Observações</h3>
                  <div className="prose prose-indigo max-w-none bg-white p-6 rounded-xl border border-gray-100 shadow-sm min-h-[300px]">
                    {selectedMember.pastoralHistory ? (
                      <div dangerouslySetInnerHTML={{ __html: selectedMember.pastoralHistory }} />
                    ) : (
                      <p className="text-gray-400 italic text-center mt-10">Nenhum histórico registrado ainda.</p>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-8 text-center">
                <User className="w-16 h-16 mb-4 text-gray-300" />
                <p className="text-lg">Selecione um membro para visualizar os detalhes</p>
                <p className="text-sm mt-2">Os dados aqui são confidenciais e protegidos.</p>
              </div>
            )}
          </div>
        </div>

        {/* Modal form */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                <h3 className="text-lg font-bold text-gray-900">{editingId ? 'Editar Membro' : 'Novo Membro'}</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-1">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto flex-1">
                <form id="member-form" onSubmit={handleSave} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo *</label>
                      <input type="text" required value={name} onChange={e => setName(e.target.value)} className="w-full border border-gray-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Telefone / WhatsApp</label>
                      <input type="text" value={phone} onChange={e => setPhone(e.target.value)} className="w-full border border-gray-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Data de Nascimento</label>
                      <input type="date" value={birthdate} onChange={e => setBirthdate(e.target.value)} className="w-full border border-gray-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Data de Entrada/Batismo</label>
                      <input type="date" value={joinedAt} onChange={e => setJoinedAt(e.target.value)} className="w-full border border-gray-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none" />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Histórico Pastoral & Observações confidenciais</label>
                    <div className="border border-gray-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-indigo-500">
                      <RichTextEditor content={pastoralHistory} onChange={setPastoralHistory} />
                    </div>
                  </div>
                </form>
              </div>
              
              <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 font-medium text-gray-600 hover:text-gray-900 transition-colors">
                  Cancelar
                </button>
                <button type="submit" form="member-form" disabled={saving} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-medium transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2">
                  {saving ? 'Salvando...' : <><Save className="w-4 h-4" /> Salvar</>}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PinGate>
  );
}
