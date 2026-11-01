import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Table, 
  BarChart3, 
  CheckCircle2, 
  Clock, 
  PlayCircle, 
  Flame, 
  Sun, 
  Moon, 
  LogOut, 
  Layers, 
  Briefcase, 
  ChevronRight,
  ShieldCheck,
  Search,
  Sparkles
} from 'lucide-react';

export function Sidebar({ 
  user, 
  onLogout, 
  activeTab, 
  setActiveTab, 
  isDark, 
  onToggleTheme, 
  tasks = [],
  quickFilter,
  setQuickFilter
}) {
  const [collapsed, setCollapsed] = useState(false);

  const total = tasks.length;
  const pendentes = tasks.filter((t) => t.status === 'pendente').length;
  const emAndamento = tasks.filter((t) => t.status === 'em_andamento').length;
  const concluidas = tasks.filter((t) => t.status === 'concluida').length;
  const urgentes = tasks.filter((t) => t.prioridade === 'urgente' || t.prioridade === 'alta').length;

  const getInitials = (nome) => {
    if (!nome) return 'U';
    const parts = nome.trim().split(' ');
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const navItems = [
    { id: 'kanban', label: 'Quadro Kanban', icon: LayoutDashboard, count: total },
    { id: 'table', label: 'Tabela de Demandas', icon: Table, count: total },
    { id: 'insights', label: 'Métricas & Insights', icon: BarChart3, badge: 'Analytics' },
  ];

  return (
    <aside className="w-64 bg-white dark:bg-[#0c101a] border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between shrink-0 h-screen sticky top-0 transition-colors select-none z-30">
      
      {/* TOP: BRAND & WORKSPACE */}
      <div>
        {/* APP BRAND */}
        <div className="h-16 px-5 flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-black text-sm shadow-sm shadow-blue-600/30">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-sm tracking-tight text-slate-900 dark:text-white">
                  TaskFlow
                </span>
                <span className="px-1.5 py-0.2 text-[9px] font-bold uppercase rounded bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                  PRO
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium">Gestão Comercial</p>
            </div>
          </div>
        </div>

        {/* WORKSPACE CHIP */}
        <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800/60">
          <div className="p-2 rounded-xl bg-slate-50 dark:bg-[#080c14] border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="w-6 h-6 rounded-md bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold text-xs flex items-center justify-center shrink-0">
                <Briefcase className="w-3.5 h-3.5" />
              </div>
              <div className="truncate text-left">
                <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                  {user?.nome || 'Meu Workspace'}
                </div>
                <div className="text-[10px] text-slate-400 truncate">
                  Plano Comercial Ativo
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* MAIN NAVIGATION */}
        <div className="px-3 py-4 space-y-1">
          <div className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Navegação Principal
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  if (item.id === 'kanban' || item.id === 'table') {
                    setQuickFilter('all');
                  }
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/20'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>

                {item.count !== undefined && (
                  <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                    isActive ? 'bg-blue-700 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                  }`}>
                    {item.count}
                  </span>
                )}

                {item.badge && (
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                    isActive ? 'bg-blue-700 text-white' : 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* QUICK FILTERS */}
        <div className="px-3 pt-2 space-y-1">
          <div className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Filtros do Workspace
          </div>

          <button
            onClick={() => setQuickFilter('all')}
            className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              quickFilter === 'all'
                ? 'bg-slate-100 dark:bg-slate-800/80 text-blue-600 dark:text-blue-400 font-bold'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/40'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
              <span>Todas as Demandas</span>
            </div>
            <span className="text-[10px] font-mono">{total}</span>
          </button>

          <button
            onClick={() => setQuickFilter('pendente')}
            className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              quickFilter === 'pendente'
                ? 'bg-slate-100 dark:bg-slate-800/80 text-amber-600 dark:text-amber-400 font-bold'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/40'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              <span>Pendentes / A Fazer</span>
            </div>
            <span className="text-[10px] font-mono">{pendentes}</span>
          </button>

          <button
            onClick={() => setQuickFilter('em_andamento')}
            className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              quickFilter === 'em_andamento'
                ? 'bg-slate-100 dark:bg-slate-800/80 text-blue-600 dark:text-blue-400 font-bold'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/40'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              <span>Em Andamento</span>
            </div>
            <span className="text-[10px] font-mono">{emAndamento}</span>
          </button>

          <button
            onClick={() => setQuickFilter('concluida')}
            className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              quickFilter === 'concluida'
                ? 'bg-slate-100 dark:bg-slate-800/80 text-emerald-600 dark:text-emerald-400 font-bold'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/40'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>Concluídas</span>
            </div>
            <span className="text-[10px] font-mono">{concluidas}</span>
          </button>

          <button
            onClick={() => setQuickFilter('urgente')}
            className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              quickFilter === 'urgente'
                ? 'bg-slate-100 dark:bg-slate-800/80 text-rose-600 dark:text-rose-400 font-bold'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/40'
            }`}
          >
            <div className="flex items-center gap-2">
              <Flame className="w-3.5 h-3.5 text-rose-500" />
              <span>Prioridade Alta / Urgente</span>
            </div>
            <span className="text-[10px] font-mono">{urgentes}</span>
          </button>
        </div>
      </div>

      {/* BOTTOM: THEME & USER CARD */}
      <div className="p-3 border-t border-slate-200/80 dark:border-slate-800/80 space-y-2">
        {/* THEME TOGGLE ROW */}
        <div className="flex items-center justify-between px-2 py-1.5 rounded-lg bg-slate-50 dark:bg-[#080c14] border border-slate-200/80 dark:border-slate-800 text-xs">
          <span className="text-slate-500 font-medium">Modo Noturno</span>
          <button
            onClick={onToggleTheme}
            className="p-1 rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
            title="Alternar Modo Claro / Noturno"
          >
            {isDark ? <Moon className="w-4 h-4 text-blue-400" /> : <Sun className="w-4 h-4 text-amber-500" />}
          </button>
        </div>

        {/* LOGGED IN USER */}
        <div className="p-2 rounded-xl flex items-center justify-between gap-2 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-sm">
              {getInitials(user?.nome)}
            </div>
            <div className="truncate text-left">
              <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                {user?.nome}
              </div>
              <div className="text-[10px] text-slate-400 truncate">
                {user?.email}
              </div>
            </div>
          </div>

          <button
            onClick={onLogout}
            className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Sair da conta"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

    </aside>
  );
}
