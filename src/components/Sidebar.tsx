import { Book, BookOpen, Calendar, CheckSquare, LayoutDashboard, Menu, Sparkles, Users } from 'lucide-react';
import { NavLink } from 'react-router-dom';

interface SidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
}

const navItems = [
  { name: 'Painel Geral', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Membros', path: '/membros', icon: Users },
  { name: 'Assistente I.A.', path: '/assistant', icon: Sparkles },
  { name: 'Agenda', path: '/agenda', icon: Calendar },
  { name: 'Tarefas', path: '/tarefas', icon: CheckSquare },
  { name: 'Sermões', path: '/sermoes', icon: BookOpen },
  { name: 'Diário', path: '/diario', icon: Book },
];

export function Sidebar({ isOpen, toggleSidebar }: SidebarProps) {
  return (
    <aside className={`bg-white border-r border-gray-200 transition-all duration-300 ${isOpen ? 'w-64' : 'w-20'} flex flex-col shrink-0`}>
      <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200">
        {isOpen && (
          <div className="flex items-center gap-2">
            <img src="/favicon.svg" alt="Logo" className="w-6 h-6" />
            <span className="text-xl font-bold text-indigo-600 font-serif">Staff & Hook</span>
          </div>
        )}
        <button onClick={toggleSidebar} className="p-2 rounded-md hover:bg-gray-100 mx-auto">
          <Menu className="w-6 h-6 text-gray-600" />
        </button>
      </div>
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                isActive ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-gray-600 hover:bg-gray-50 hover:text-indigo-600'
              }`
            }
          >
            <item.icon className="w-6 h-6 shrink-0" />
            {isOpen && <span>{item.name}</span>}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
