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
      <div className="h-16 flex items-center justify-center relative border-b border-gray-200">
        <div className="flex items-center justify-center w-full">
          <img src="/favicon.svg" alt="Logo" className="w-8 h-8 drop-shadow-sm transition-transform duration-300 hover:scale-105" />
        </div>
        {isOpen && (
          <button onClick={toggleSidebar} className="absolute right-3 p-2 rounded-md hover:bg-gray-100 text-gray-500 hover:text-indigo-600 transition-colors">
            <Menu className="w-5 h-5" />
          </button>
        )}
        {!isOpen && (
          <button onClick={toggleSidebar} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" title="Expandir menu" />
        )}
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
