import React, { useState, useEffect, useCallback } from 'react';
import { 
  Search, 
  LayoutGrid, 
  List, 
  RefreshCw, 
  ArrowUpDown,
  Calendar,
  Sparkles
} from 'lucide-react';

import { apiTasks } from './services/api';
import { Navbar } from './components/Navbar';
import { StatsCards } from './components/StatsCards';
import { KanbanBoard } from './components/KanbanBoard';
import { TasksTable } from './components/TasksTable';
import { TaskModal } from './components/TaskModal';
import { TaskDetailModal } from './components/TaskDetailModal';
import { AuthView } from './components/AuthView';
import { ToastContainer } from './components/Toast';

export function App() {
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('taskflow_theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('taskflow_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('taskflow_theme', 'light');
    }
  }, [isDark]);

  const toggleTheme = () => setIsDark((prev) => !prev);

  // Auth state
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('taskflow_user');
    return saved ? JSON.parse(saved) : null;
  });

  // Data states
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);

  // View & Filter states
  const [viewMode, setViewMode] = useState('kanban'); // 'kanban' | 'table'
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [prazoFilter, setPrazoFilter] = useState('');
  const [sortOrder, setSortOrder] = useState('prioridade'); // 'prioridade' | 'prazo' | 'padrao'

  // Modals
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState(null);
  const [initialTaskStatus, setInitialTaskStatus] = useState('pendente');
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState(null);

  // Toasts
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = 'info', title = '') => {
    const id = Date.now() + Math.random().toString(36).substring(2, 6);
    setToasts((prev) => [...prev, { id, message, type, title }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Fetch tasks
  const loadData = useCallback(async (silencioso = false) => {
    if (!user?.id) return;
    if (!silencioso) setLoading(true);

    try {
      const listaTarefas = await apiTasks.list({ userId: user.id });
      setTasks(Array.isArray(listaTarefas) ? listaTarefas : []);
    } catch (err) {
      console.error(err);
      addToast(err.message || 'Falha ao sincronizar tarefas.', 'error');
    } finally {
      if (!silencioso) setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user?.id) {
      loadData();
      const interval = setInterval(() => loadData(true), 25000);
      return () => clearInterval(interval);
    }
  }, [user, loadData]);

  // Global Keyboard Shortcuts (N para nova tarefa, Esc para fechar)
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignora se estiver digitando em input ou textarea
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;

      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        handleOpenNewTask('pendente');
      } else if (e.key === 'Escape') {
        setIsTaskModalOpen(false);
        setIsDetailModalOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    localStorage.setItem('taskflow_user', JSON.stringify(userData));
    addToast(`Bem-vindo ao TaskFlow Pro, ${userData.nome}`, 'success');
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('taskflow_user');
    setTasks([]);
  };

  const handleStatusChange = async (taskId, novoStatus) => {
    try {
      // Atualização otimista imediata na UI
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: novoStatus } : t))
      );
      await apiTasks.update(taskId, { status: novoStatus });
      addToast('Status atualizado.', 'info');
      loadData(true);
    } catch (err) {
      addToast(err.message || 'Erro ao atualizar status.', 'error');
      loadData(true);
    }
  };

  const handleSaveTask = async (taskData) => {
    if (taskData.id) {
      await apiTasks.update(taskData.id, taskData);
      addToast('Demanda atualizada com sucesso.', 'success');
    } else {
      await apiTasks.create({
        ...taskData,
        responsavel_id: user.id,
      });
      addToast('Nova demanda registrada.', 'success');
    }
    loadData(true);
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Deseja excluir esta tarefa definitivamente?')) return;
    try {
      await apiTasks.delete(taskId);
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
      addToast('Tarefa removida.', 'info');
    } catch (err) {
      addToast(err.message || 'Erro ao excluir tarefa.', 'error');
    }
  };

  const handleOpenNewTask = (statusPadrao = 'pendente') => {
    setTaskToEdit(null);
    setInitialTaskStatus(statusPadrao);
    setIsTaskModalOpen(true);
  };

  const handleOpenEditTask = (task) => {
    setTaskToEdit(task);
    setIsTaskModalOpen(true);
  };

  const handleOpenDetails = (taskId) => {
    setSelectedTaskId(taskId);
    setIsDetailModalOpen(true);
  };

  // Filtragem e ordenação das tarefas
  const filteredTasks = tasks.filter((t) => {
    const matchSearch =
      t.titulo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.descricao && t.descricao.toLowerCase().includes(searchQuery.toLowerCase())) ||
      `tsk-${t.id}`.includes(searchQuery.toLowerCase());

    const matchPriority = !priorityFilter || t.prioridade === priorityFilter;

    let matchPrazo = true;
    if (prazoFilter === 'vencidos') {
      matchPrazo = t.prazo && t.status !== 'concluida' && new Date(t.prazo) < new Date();
    } else if (prazoFilter === 'hoje') {
      if (!t.prazo) matchPrazo = false;
      else {
        const d = new Date(t.prazo);
        const hoje = new Date();
        matchPrazo = d.toDateString() === hoje.toDateString();
      }
    } else if (prazoFilter === 'com_prazo') {
      matchPrazo = Boolean(t.prazo);
    }

    return matchSearch && matchPriority && matchPrazo;
  });

  // Ordenação
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (sortOrder === 'prioridade') {
      const order = { urgente: 0, alta: 1, media: 2, baixa: 3 };
      return (order[a.prioridade] ?? 4) - (order[b.prioridade] ?? 4);
    }
    if (sortOrder === 'prazo') {
      if (!a.prazo) return 1;
      if (!b.prazo) return -1;
      return new Date(a.prazo) - new Date(b.prazo);
    }
    return b.id - a.id;
  });

  if (!user) {
    return (
      <>
        <AuthView 
          onLoginSuccess={handleLoginSuccess}
          isDark={isDark}
          onToggleTheme={toggleTheme}
        />
        <ToastContainer toasts={toasts} removeToast={removeToast} />
      </>
    );
  }

  const userTaskIds = tasks.map((t) => t.id);

  return (
    <div className="min-h-screen flex flex-col font-sans select-none overflow-x-hidden">
      
      {/* TOPBAR */}
      <Navbar
        user={user}
        onLogout={handleLogout}
        isDark={isDark}
        onToggleTheme={toggleTheme}
        userTaskIds={userTaskIds}
        onNewTask={handleOpenNewTask}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* MAIN EXECUTIVE WORKSPACE */}
      <main className="flex-1 p-4 sm:p-6 max-w-[1720px] mx-auto w-full flex flex-col gap-6" data-purpose="executive-workspace">
        
        {/* EXECUTIVE HUD METRICS (FROZEN LIGHT STRIP) */}
        <StatsCards tasks={tasks} />

        {/* BOARD CONTROLS (FILTER & SORT TOOLBAR) */}
        <div className="flex flex-wrap items-center justify-between gap-4 py-1" data-purpose="board-filter-toolbar">
          
          {/* SEARCH & SELECT FILTERS */}
          <div className="flex items-center gap-2.5 flex-wrap">
            
            {/* Input Filter */}
            <div className="relative w-64">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filtrar por nome, tag..."
                className="w-full bg-slate-100/90 dark:bg-[#0e172a]/75 border border-slate-300 dark:border-sky-400/15 rounded-lg px-3 py-1.5 text-xs text-slate-900 dark:text-on-surface placeholder-slate-400 dark:placeholder-sky-200/40 focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400/40 backdrop-blur-md transition-all shadow-inner font-sans"
              />
            </div>

            {/* Priority Dropdown */}
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="bg-slate-100/90 dark:bg-[#0e172a]/75 border border-slate-300 dark:border-sky-400/15 text-slate-700 dark:text-on-surface-variant text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-sky-400 cursor-pointer backdrop-blur-md transition-all"
            >
              <option value="">Todas as prioridades</option>
              <option value="urgente">Urgente 🔥</option>
              <option value="alta">Alta</option>
              <option value="media">Média</option>
              <option value="baixa">Baixa</option>
            </select>

            {/* Prazo Dropdown */}
            <select
              value={prazoFilter}
              onChange={(e) => setPrazoFilter(e.target.value)}
              className="bg-slate-100/90 dark:bg-[#0e172a]/75 border border-slate-300 dark:border-sky-400/15 text-slate-700 dark:text-on-surface-variant text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-sky-400 cursor-pointer backdrop-blur-md transition-all"
            >
              <option value="">Todos os prazos</option>
              <option value="hoje">Vence Hoje</option>
              <option value="vencidos">Prazo Vencido ⚠️</option>
              <option value="com_prazo">Com Prazo Definido</option>
            </select>

          </div>

          {/* RIGHT TOOLS: SORT & REFRESH */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setSortOrder((prev) => 
                  prev === 'prioridade' ? 'prazo' : prev === 'prazo' ? 'padrao' : 'prioridade'
                );
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100/90 dark:bg-[#0e172a]/75 border border-slate-300 dark:border-sky-400/15 text-slate-700 dark:text-on-surface-variant text-xs hover:text-sky-500 hover:border-sky-400/40 transition-all font-mono"
              title="Clique para alternar ordenação"
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
              <span>
                {sortOrder === 'prioridade' ? 'Ordenado por prioridade' : sortOrder === 'prazo' ? 'Ordenado por prazo' : 'Ordem de criação'}
              </span>
            </button>

            <button
              onClick={() => loadData()}
              disabled={loading}
              className="p-1.5 rounded-lg bg-slate-100/90 dark:bg-[#0e172a]/75 border border-slate-300 dark:border-sky-400/15 text-slate-600 dark:text-on-surface-variant hover:text-sky-500 hover:border-sky-400/40 transition-colors"
              title="Sincronizar tarefas"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

        </div>

        {/* WORKSPACE VIEW: KANBAN COM DRAG & DROP OU TABELA */}
        {viewMode === 'kanban' ? (
          <KanbanBoard
            tasks={sortedTasks}
            onStatusChange={handleStatusChange}
            onViewDetails={handleOpenDetails}
            onEdit={handleOpenEditTask}
            onDelete={handleDeleteTask}
            onNewTask={handleOpenNewTask}
          />
        ) : (
          <TasksTable
            tasks={sortedTasks}
            onStatusChange={handleStatusChange}
            onViewDetails={handleOpenDetails}
            onEdit={handleOpenEditTask}
            onDelete={handleDeleteTask}
          />
        )}

      </main>

      {/* FOOTER STATUS BAR (FROZEN SYSTEM STRIP) */}
      <footer className="h-9 border-t border-sky-400/15 bg-white/70 dark:bg-[#080d1a]/85 backdrop-blur-md px-6 flex items-center justify-between text-[11px] font-mono text-slate-500 dark:text-on-surface-variant select-none">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-slate-800 dark:text-slate-300">TaskFlow Pro</span>
          <span className="h-3 w-px bg-slate-300 dark:bg-sky-400/20"></span>
          <span className="flex items-center gap-1.5 text-cyan-600 dark:text-cyan-400">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_#38bdf8]"></span>
            Latência: 24ms
          </span>
          <span className="hidden sm:inline">• Sincronizado</span>
        </div>

        {/* KEYBOARD SHORTCUTS HINTS */}
        <div className="hidden md:flex items-center gap-4 text-[10px]">
          <span className="flex items-center gap-1">
            <kbd className="px-1 rounded bg-slate-200 dark:bg-sky-500/10 border border-slate-300 dark:border-sky-400/20">N</kbd> Nova Tarefa
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1 rounded bg-slate-200 dark:bg-sky-500/10 border border-slate-300 dark:border-sky-400/20">⌘K</kbd> Comando
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1 rounded bg-slate-200 dark:bg-sky-500/10 border border-slate-300 dark:border-sky-400/20">Esc</kbd> Fechar
          </span>
        </div>
      </footer>

      {/* MODALS */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        onSave={handleSaveTask}
        taskToEdit={taskToEdit}
        initialStatus={initialTaskStatus}
        currentUser={user}
      />

      <TaskDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        taskId={selectedTaskId}
      />

      {/* TOAST NOTIFICATIONS */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />

    </div>
  );
}
