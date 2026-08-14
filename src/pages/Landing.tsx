import { Link } from 'react-router-dom';
import { BookHeart, CheckSquare, Calendar, Users, ArrowRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export function Landing() {
  const { user } = useAuth();

  return (
    <div className="w-full min-h-screen bg-gray-50 flex flex-col font-sans selection:bg-indigo-200">
      {/* Navbar */}
      <nav className="w-full bg-white border-b border-gray-100 py-4 px-6 sm:px-12 flex justify-between items-center shrink-0 sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-indigo-50 rounded-full flex items-center justify-center border border-indigo-100">
            <img src="/favicon.svg" alt="Staff & Hook Logo" className="w-6 h-6" />
          </div>
          <span className="text-xl font-bold text-indigo-700 font-serif tracking-tight">Staff & Hook</span>
        </div>
        <div>
          {user ? (
            <Link to="/dashboard" className="bg-indigo-600 text-white px-5 py-2 rounded-full font-medium hover:bg-indigo-700 transition-colors shadow-sm flex items-center gap-2">
              Ir para o Dashboard <ArrowRight className="w-4 h-4" />
            </Link>
          ) : (
            <div className="flex items-center gap-4">
              <Link to="/login" className="text-gray-600 font-medium hover:text-indigo-600 transition-colors">Entrar</Link>
              <Link to="/register" className="bg-indigo-600 text-white px-5 py-2 rounded-full font-medium hover:bg-indigo-700 transition-colors shadow-sm">Cadastre-se</Link>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center">
        <section className="w-full max-w-6xl mx-auto px-6 py-20 md:py-32 flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-sm font-semibold mb-8">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
            </span>
            Gestão Pastoral Simplificada
          </div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold text-gray-900 tracking-tight leading-tight max-w-4xl mb-6">
            O cuidado com o rebanho <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-500">começa na organização.</span>
          </h1>
          
          <p className="text-lg md:text-xl text-gray-600 max-w-2xl mb-12 font-serif italic text-balance leading-relaxed">
            "Cuidai de vós mesmos, para que o vosso exemplo não contradiga a vossa doutrina [...] Não é suficiente ser um homem de bem; deveis ser um homem dedicado ao bem dos outros." <br />
            <span className="text-sm font-sans font-semibold text-gray-400 mt-2 block">— Richard Baxter</span>
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            {user ? (
              <Link to="/dashboard" className="bg-indigo-600 text-white px-8 py-4 rounded-full font-semibold text-lg hover:bg-indigo-700 transition-all shadow-lg hover:shadow-indigo-200 flex items-center justify-center gap-2 hover:-translate-y-0.5">
                Acessar meu ministério
              </Link>
            ) : (
              <>
                <Link to="/register" className="bg-indigo-600 text-white px-8 py-4 rounded-full font-semibold text-lg hover:bg-indigo-700 transition-all shadow-lg hover:shadow-indigo-200 flex items-center justify-center gap-2 hover:-translate-y-0.5">
                  Começar agora gratuitamente
                </Link>
                <Link to="/login" className="bg-white text-gray-700 border border-gray-200 px-8 py-4 rounded-full font-semibold text-lg hover:bg-gray-50 transition-all flex items-center justify-center">
                  Já tenho uma conta
                </Link>
              </>
            )}
          </div>
        </section>

        {/* Features Grid */}
        <section className="w-full bg-white border-t border-gray-100 py-24">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Tudo que você precisa em um só lugar</h2>
              <p className="text-gray-500">Projetado com minimalismo para evitar distrações e focar no que importa.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <FeatureCard 
                icon={<BookHeart className="w-6 h-6 text-rose-500" />}
                title="Diário Espiritual"
                desc="Um espaço seguro e focado para suas reflexões pessoais, orações e devocionais com categorização inteligente."
                color="bg-rose-50 border-rose-100"
              />
              <FeatureCard 
                icon={<CheckSquare className="w-6 h-6 text-emerald-500" />}
                title="Gestão de Tarefas"
                desc="Organize sua rotina, do administrativo ao ministério, com datas e alertas visuais."
                color="bg-emerald-50 border-emerald-100"
              />
              <FeatureCard 
                icon={<Users className="w-6 h-6 text-blue-500" />}
                title="Cuidado de Membros"
                desc="Acompanhe o rebanho de perto. Histórico de aconselhamentos e dados protegidos por senha dupla."
                color="bg-blue-50 border-blue-100"
              />
              <FeatureCard 
                icon={<Calendar className="w-6 h-6 text-amber-500" />}
                title="Agenda Integrada"
                desc="Tenha clareza dos seus compromissos da semana com um calendário visual elegante."
                color="bg-amber-50 border-amber-100"
              />
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full bg-gray-900 py-12 px-6 text-center shrink-0">
        <div className="flex items-center justify-center gap-2 mb-6 opacity-80">
          <img src="/favicon.svg" alt="Logo" className="w-6 h-6 brightness-0 invert" />
          <span className="text-xl font-bold text-white font-serif tracking-tight">Staff & Hook</span>
        </div>
        <p className="text-gray-400 text-sm">
          Criado para servir aqueles que servem. &copy; {new Date().getFullYear()} Staff & Hook.
        </p>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, desc, color }: { icon: React.ReactNode, title: string, desc: string, color: string }) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow flex flex-col items-start group">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center border mb-5 ${color} group-hover:scale-110 transition-transform duration-300`}>
        {icon}
      </div>
      <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
    </div>
  );
}
