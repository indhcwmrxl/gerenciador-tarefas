import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  LogOut, 
  Sun, 
  Moon, 
  RefreshCw, 
  Plus, 
  Zap, 
  Search, 
  LayoutGrid, 
  List, 
  ChevronDown 
} from 'lucide-react';
import { apiNotifications } from '../services/api';

export function Navbar({ 
  user, 
  onLogout, 
  isDark, 
  onToggleTheme, 
  userTaskIds = [], 
  onNewTask,
  viewMode = 'kanban',
  onViewModeChange,
  searchQuery = '',
  onSearchChange
}) {
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [loadingNotifs, setLoadingNotifs] = useState(false);

  const fetchNotifications = async () => {
    try {
      setLoadingNotifs(true);
      const list = await apiNotifications.list();
      if (Array.isArray(list)) {
        const filtered = list.filter((n) => {
          if (!n.task_id) return true;
          return userTaskIds.includes(n.task_id) || (user?.nome && n.mensagem?.includes(user.nome));
        });
        setNotifications(filtered.reverse().slice(0, 15));
      }
    } catch (e) {
      console.warn('Erro ao atualizar notificações:', e);
    } finally {
      setLoadingNotifs(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, [userTaskIds]);

  const getInitials = (nome) => {
    if (!nome) return 'JL';
    const parts = nome.trim().split(' ');
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  return (
    <header className="h-16 border-b border-sky-400/20 bg-white/80 dark:bg-[#090f1e]/80 backdrop-blur-2xl sticky top-0 z-40 px-4 sm:px-6 flex items-center justify-between frost-sheen">
      
      {/* LEFT: BRAND & WORKSPACE & VIEW MODES */}
      <div className="flex items-center gap-3 sm:gap-5">
        
        {/* Brand */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-sky-500/20 border border-sky-400/40 flex items-center justify-center glow-cyan shadow-[0_0_12px_rgba(125,211,252,0.25)]">
            <Zap className="w-4 h-4 text-sky-600 dark:text-primary fill-current" />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[15px] font-display font-bold tracking-tight text-slate-900 dark:text-white">
              TaskFlow
            </span>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-sky-400/15 text-sky-700 dark:text-primary border border-sky-400/30">
              PRO
            </span>
          </div>
        </div>

        <div className="h-4 w-px bg-slate-300 dark:bg-sky-300/15 hidden md:block"></div>

        {/* Workspace Selector */}
        <div className="hidden md:flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-[#0d1627]/80 border border-slate-300 dark:border-sky-400/15 text-xs font-medium backdrop-blur-sm">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_#38bdf8]"></span>
          <span className="text-slate-700 dark:text-slate-200">Workspace Individual</span>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-1" />
        </div>

        {/* View Toggle */}
        <div className="hidden lg:inline-flex items-center rounded-lg bg-slate-200/80 dark:bg-[#0a1122]/90 p-1 border border-slate-300 dark:border-sky-400/15 text-xs">
          <button
            onClick={() => onViewModeChange && onViewModeChange('kanban')}
            className={`px-2.5 py-1 rounded-md font-medium flex items-center gap-1.5 transition-all ${
              viewMode === 'kanban'
                ? 'text-slate-950 bg-sky-400 dark:bg-sky-300 border border-sky-200/50 shadow-[0_0_12px_rgba(125,211,252,0.4)]'
                : 'text-slate-600 dark:text-on-surface-variant hover:text-sky-500'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Quadro</span>
          </button>
          <button
            onClick={() => onViewModeChange && onViewModeChange('table')}
            className={`px-2.5 py-1 rounded-md font-medium flex items-center gap-1.5 transition-all ${
              viewMode === 'table'
                ? 'text-slate-950 bg-sky-400 dark:bg-sky-300 border border-sky-200/50 shadow-[0_0_12px_rgba(125,211,252,0.4)]'
                : 'text-slate-600 dark:text-on-surface-variant hover:text-sky-500'
            }`}
          >
            <List className="w-3.5 h-3.5" />
            <span>Lista</span>
          </button>
        </div>

      </div>

      {/* CENTER: SEARCH WITH ⌘K */}
      <div className="hidden md:flex items-center w-72 lg:w-96 relative">
        <Search className="w-4 h-4 text-slate-400 dark:text-sky-300/60 absolute left-3 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
          placeholder="Buscar tarefas, prazos ou tags..."
          className="w-full pl-9 pr-14 py-1.5 text-xs bg-slate-100/90 dark:bg-[#0e172a]/70 border border-slate-300 dark:border-sky-400/20 rounded-lg text-slate-900 dark:text-on-surface placeholder-slate-400 dark:placeholder-sky-200/40 focus:outline-none focus:ring-1 focus:ring-sky-400/60 focus:border-sky-400 backdrop-blur-md transition-all shadow-inner"
        />
        <kbd className="absolute right-2.5 px-1.5 py-0.5 text-[10px] font-mono text-slate-500 dark:text-sky-200/70 bg-slate-200 dark:bg-sky-500/10 rounded border border-slate-300 dark:border-sky-400/25">
          ⌘K
        </kbd>
      </div>

      {/* RIGHT: NOVA TAREFA, SYNC, THEME, NOTIF, PROFILE */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        
        {/* Nova Tarefa Button (Ice-Blue Vibrante) */}
        <button
          onClick={() => onNewTask && onNewTask('pendente')}
          className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-1.5 rounded-lg bg-sky-400 text-slate-950 font-semibold text-xs tracking-wide shadow-[0_0_20px_rgba(125,211,252,0.45)] hover:bg-sky-300 hover:shadow-[0_0_28px_rgba(125,211,252,0.65)] transition-all active:scale-95 duration-150"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Nova Tarefa</span>
          <span className="hidden sm:inline text-[10px] text-slate-900 font-mono bg-sky-300/80 px-1 py-0.5 rounded">
            N
          </span>
        </button>

        {/* Sync Status Badge */}
        <div className="hidden xl:flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-[#0e182c]/70 border border-slate-300 dark:border-sky-400/15 text-xs backdrop-blur-sm">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400"></span>
          </span>
          <span className="text-[11px] font-mono text-cyan-600 dark:text-cyan-300">Sincronizado</span>
        </div>

        {/* Theme Toggle */}
        <button
          onClick={onToggleTheme}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 dark:text-on-surface-variant hover:text-sky-500 hover:bg-sky-500/10 transition-colors"
          title={isDark ? 'Tema Claro' : 'Tema Escuro'}
        >
          {isDark ? <Sun className="w-4 h-4 text-sky-300" /> : <Moon className="w-4 h-4 text-slate-700" />}
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 dark:text-on-surface-variant hover:text-sky-500 hover:bg-sky-500/10 relative transition-colors"
            title="Notificações"
          >
            <Bell className="w-4 h-4" />
            {notifications.length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-sky-400 ring-2 ring-white dark:ring-[#080d1a] shadow-[0_0_6px_#38bdf8]"></span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl p-3 z-50 glass-panel shadow-2xl animate-scale-up">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-sky-400/15 px-1">
                <span className="font-bold text-xs text-slate-900 dark:text-white">
                  Notificações do Sistema
                </span>
                <button
                  onClick={fetchNotifications}
                  className="text-[11px] font-semibold text-sky-600 dark:text-primary flex items-center gap-1 hover:underline"
                >
                  <RefreshCw className={`w-3 h-3 ${loadingNotifs ? 'animate-spin' : ''}`} />
                  Atualizar
                </button>
              </div>

              <div className="max-h-64 overflow-y-auto text-xs space-y-1">
                {notifications.length === 0 ? (
                  <div className="py-6 text-center text-slate-400 font-mono text-[11px]">
                    Nenhuma notificação recente.
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className="p-2 rounded-lg bg-slate-50 dark:bg-sky-950/20 border border-slate-200 dark:border-sky-400/10 hover:border-sky-400/30 transition-all"
                    >
                      <div className="flex items-center justify-between text-[10px] mb-1">
                        <span className="font-mono uppercase font-bold text-sky-600 dark:text-cyan-300">
                          {n.tipo.replace('_', ' ')}
                        </span>
                        <span className="text-slate-400 font-mono">
                          {new Date(n.criada_em).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-slate-800 dark:text-slate-200 text-xs font-medium">
                        {n.mensagem}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile */}
        <div className="flex items-center gap-2 pl-1 border-l border-slate-300 dark:border-sky-400/20">
          <div className="w-8 h-8 rounded-lg bg-sky-950/80 border border-sky-400/40 text-primary font-bold text-xs flex items-center justify-center ring-1 ring-sky-300/20 shadow-[0_0_12px_rgba(125,211,252,0.25)]">
            {getInitials(user?.nome)}
          </div>
          <div className="hidden md:flex flex-col text-left">
            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
              {user?.nome || 'Usuário'}
            </span>
            <span className="text-[10px] text-slate-500 dark:text-on-surface-variant font-mono">
              Lead Engineer
            </span>
          </div>

          <button
            onClick={onLogout}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors ml-1"
            title="Encerrar sessão"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>

    </header>
  );
}
