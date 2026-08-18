import { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './pages/Dashboard';
import { Tasks } from './pages/Tasks';
import { Agenda } from './pages/Agenda';
import { Sermons } from './pages/Sermons';
import { Journal } from './pages/Journal';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Landing } from './pages/Landing';
import { Members } from './pages/Members';
import { Assistant } from './pages/Assistant';
import { useAuth } from './contexts/AuthContext';
import { LogOut } from 'lucide-react';

function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const { user, signOut } = useAuth();

  return (
    <div className="flex h-screen w-full bg-gray-50 text-gray-900 font-sans">
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={() => setSidebarOpen(!isSidebarOpen)} />

      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 shrink-0 relative">
          <div className="flex-1"></div>
          <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2">
            <span className="text-xl font-bold text-indigo-700 font-serif tracking-tight">Staff & Hook</span>
          </div>
          <div className="flex-1 flex justify-end items-center space-x-4">
            <span className="text-sm font-medium text-gray-600 hidden sm:block">{user?.email}</span>
            <button onClick={signOut} className="p-2 rounded-full hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors" title="Sair">
              <LogOut className="w-5 h-5" />
            </button>
            <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold border-2 border-white shadow-sm uppercase">
              {user?.email?.substring(0, 2) || 'PR'}
            </div>
          </div>
        </header>

        {/* Routes Content */}
        {children}
      </main>
    </div>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="h-screen w-screen flex items-center justify-center bg-gray-50"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>;
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  return <AuthenticatedLayout>{children}</AuthenticatedLayout>;
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      
      <Route path="/" element={<Landing />} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/agenda" element={<ProtectedRoute><Agenda /></ProtectedRoute>} />
      <Route path="/tarefas" element={<ProtectedRoute><Tasks /></ProtectedRoute>} />
      <Route path="/sermoes" element={<ProtectedRoute><Sermons /></ProtectedRoute>} />
      <Route path="/diario" element={<ProtectedRoute><Journal /></ProtectedRoute>} />
      <Route path="/membros" element={<ProtectedRoute><Members /></ProtectedRoute>} />
      <Route path="/assistant" element={<ProtectedRoute><Assistant /></ProtectedRoute>} />
    </Routes>
  );
}

export default App;
