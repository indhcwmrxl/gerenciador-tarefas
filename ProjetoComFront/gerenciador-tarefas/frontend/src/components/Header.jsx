import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  Search, 
  Plus, 
  RefreshCw, 
  Clock, 
  SlidersHorizontal,
  Layers,
  Sparkles
} from 'lucide-react';
import { apiNotifications } from '../services/api';

export function Header({ 
  activeTab, 
  searchQuery, 
  setSearchQuery, 
  onNewTask, 
  userTaskIds = [],
  user,
  onRefresh,
  loading
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

  const titles = {
    kanban: { title: 'Quadro Kanban', desc: 'Gerencie fluxos e transições de status em tempo real' },
    table: { title: 'Tabela de Demandas', desc: 'Visão detalhada e listagem de todas as tarefas cadastradas' },
    insights: { title: 'Métricas & Insights', desc: 'Indicadores de produtividade e taxa de resolução do workspace' },
  };

  const current = titles[activeTab] || titles.kanban;

  return (
    <header className="h-16 px-6 bg-white dark:bg-[#0c101a] border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4 sticky top-0 z-20 transition-colors">
      
      {/* SECTION TITLE & BREADCRUMB */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight">
            {current.title}
          </h1>
        </div>
        <p className="text-[11px] text-slate-400 hidden sm:block font-medium">
          {current.desc}
        </p>
      </div>

      {/* RIGHT TOOLS: SEARCH, REFRESH, NOTIFICATIONS, CTA */}
      <div className="flex items-center gap-2.5">
        
        {/* SEARCH BAR */}
        {activeTab !== 'insights' && (
          <div className="relative w-44 sm:w-64">
            <Search className="absolute inset-y-0 left-0 pl-2.5 flex items-center w-3.5 h-3.5 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar tarefas..."
              className="w-full pl-8 pr-3 py-1.5 rounded-lg layer-input"
            />
          </div>
        )}

        {/* REFRESH BUTTON */}
        <button
          onClick={onRefresh}
          disabled={loading}
          className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#080c14] text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
          title="Recarregar dados"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-600' : ''}`} />
        </button>

        {/* NOTIFICATIONS */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#080c14] text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
            title="Notificações"
          >
            <Bell className="w-4 h-4" />
            {notifications.length > 0 && (
              <span className="absolute 1.5 top-1.5 right-1.5 w-2 h-2 bg-blue-600 rounded-full ring-2 ring-white dark:ring-slate-900" />
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-[#0c101a] rounded-xl p-3 z-50 shadow-xl border border-slate-200 dark:border-slate-800 animate-scale-up">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 dark:border-slate-800 px-1">
                <span className="font-bold text-xs text-slate-900 dark:text-white">
                  Eventos Recentes
                </span>
                <button
                  onClick={fetchNotifications}
                  className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-semibold"
                >
                  <RefreshCw className={`w-3 h-3 ${loadingNotifs ? 'animate-spin' : ''}`} />
                  Atualizar
                </button>
              </div>

              <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
                {notifications.length === 0 ? (
                  <div className="py-6 text-center text-slate-400 text-xs">
                    Nenhuma notificação registrada.
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div key={n.id} className="py-2 px-1 hover:bg-slate-50 dark:hover:bg-slate-800/40 rounded-lg transition-colors">
                      <div className="flex items-center justify-between text-[10px] text-slate-400 mb-0.5">
                        <span className="font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                          {n.tipo.replace('_', ' ')}
                        </span>
                        <span>
                          {new Date(n.criada_em).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-xs text-slate-800 dark:text-slate-200 font-medium">
                        {n.mensagem}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* PRIMARY CTA: NOVA TAREFA */}
        <button
          onClick={() => onNewTask('pendente')}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:scale-[0.98] transition-all shadow-md shadow-blue-600/25 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Nova Tarefa</span>
        </button>

      </div>

    </header>
  );
}
