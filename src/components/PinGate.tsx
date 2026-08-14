import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Lock, Unlock, ShieldAlert } from 'lucide-react';

export function PinGate({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [hasPin, setHasPin] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [error, setError] = useState('');
  
  // For setting up a new PIN
  const [isSettingUp, setIsSettingUp] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');

  useEffect(() => {
    async function checkPinStatus() {
      if (!user) return;
      try {
        const docRef = doc(db, 'profiles', user.uid);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists() && docSnap.data().membersPin) {
          setHasPin(true);
        } else {
          setHasPin(false);
          setIsSettingUp(true);
        }
      } catch (err) {
        console.error("Erro ao buscar perfil:", err);
      } finally {
        setLoading(false);
      }
    }
    checkPinStatus();
  }, [user]);

  const handleVerifyPin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (pinInput.length !== 4) {
      setError('O PIN deve ter 4 dígitos.');
      return;
    }

    try {
      const docRef = doc(db, 'profiles', user!.uid);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists() && docSnap.data().membersPin === pinInput) {
        setIsUnlocked(true);
      } else {
        setError('PIN incorreto.');
        setPinInput('');
      }
    } catch (err) {
      setError('Erro ao verificar o PIN.');
    }
  };

  const handleSetupPin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPin.length !== 4) {
      setError('O PIN deve ter exatamente 4 dígitos numéricos.');
      return;
    }

    if (newPin !== confirmPin) {
      setError('Os PINs não coincidem.');
      return;
    }

    try {
      await setDoc(doc(db, 'profiles', user!.uid), {
        membersPin: newPin,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      
      setHasPin(true);
      setIsSettingUp(false);
      setIsUnlocked(true);
    } catch (err) {
      setError('Erro ao salvar o PIN.');
    }
  };

  if (loading) {
    return <div className="h-full flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>;
  }

  if (isUnlocked) {
    return <>{children}</>;
  }

  return (
    <div className="w-full flex-1 flex flex-col items-center justify-center p-6 bg-gray-50">
      <div className="w-full max-w-md bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center text-center">
        <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mb-6 border border-indigo-100">
          {isSettingUp ? <ShieldAlert className="w-8 h-8 text-indigo-600" /> : <Lock className="w-8 h-8 text-indigo-600" />}
        </div>
        
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {isSettingUp ? 'Proteger Módulo' : 'Acesso Restrito'}
        </h2>
        <p className="text-gray-500 text-sm mb-8">
          {isSettingUp 
            ? 'O módulo de Membros contém dados sensíveis. Crie um PIN de 4 dígitos para acessá-lo futuramente.' 
            : 'O módulo de Membros exige uma senha adicional para visualizar os históricos pastorais.'}
        </p>

        {error && (
          <div className="w-full bg-red-50 text-red-600 text-sm p-3 rounded-xl mb-6 border border-red-100">
            {error}
          </div>
        )}

        {isSettingUp ? (
          <form onSubmit={handleSetupPin} className="w-full space-y-4">
            <div>
              <input
                type="password"
                maxLength={4}
                required
                value={newPin}
                onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                placeholder="Novo PIN (4 dígitos)"
                className="w-full text-center text-2xl tracking-widest border border-gray-200 rounded-xl px-4 py-4 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              />
            </div>
            <div>
              <input
                type="password"
                maxLength={4}
                required
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                placeholder="Confirmar PIN"
                className="w-full text-center text-2xl tracking-widest border border-gray-200 rounded-xl px-4 py-4 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3.5 rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2 mt-4"
            >
              <Lock className="w-4 h-4" /> Salvar PIN de Segurança
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyPin} className="w-full space-y-6">
            <div>
              <input
                type="password"
                maxLength={4}
                required
                autoFocus
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
                placeholder="••••"
                className="w-full text-center text-4xl tracking-[1em] font-mono border border-gray-200 rounded-2xl px-4 py-6 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-gray-50"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-4 rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2 text-lg"
            >
              <Unlock className="w-5 h-5" /> Desbloquear
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
