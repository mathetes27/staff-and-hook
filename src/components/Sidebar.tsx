import { Book, BookOpen, Calendar, CheckSquare, LayoutDashboard, Menu, Sparkles, Users } from 'lucide-react';
import { NavLink } from 'react-router-dom';

interface SidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
}

const navItems = [
  { name: 'Painel Geral', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Membros', path: '/membros', icon: Users },
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
      <nav className="flex-1 p-4 flex flex-col">
        <div className="space-y-2 flex-1">
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
        </div>
        
        <div className="mt-4 pt-4 border-t border-gray-100">
          <NavLink
            to="/assistant"
            className={({ isActive }) =>
              `flex items-center space-x-3 p-3 rounded-xl transition-all duration-300 group ${
                isActive 
                  ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-200/50' 
                  : 'bg-indigo-50/80 text-indigo-700 hover:bg-indigo-100 hover:shadow-sm border border-indigo-100'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Sparkles className={`w-6 h-6 shrink-0 transition-transform duration-500 group-hover:rotate-12 group-hover:scale-110 ${isActive ? 'text-indigo-100' : 'text-indigo-600'}`} />
                {isOpen && <span className="font-bold tracking-wide">Assistente I.A.</span>}
              </>
            )}
          </NavLink>
        </div>
      </nav>
    </aside>
  );
}
