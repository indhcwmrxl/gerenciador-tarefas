import React, { useState, useEffect, useCallback } from 'react';
import { 
  Plus, 
  Search, 
  LayoutGrid, 
  List, 
  RefreshCw, 
  Filter,
  CheckCircle2,
  SlidersHorizontal
} from 'lucide-react';

import { 
  apiTasks 
} from './services/api';

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
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');

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

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    localStorage.setItem('taskflow_user', JSON.stringify(userData));
    addToast(`Bem-vindo, ${userData.nome}`, 'success');
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('taskflow_user');
    setTasks([]);
  };

  const handleStatusChange = async (taskId, novoStatus) => {
    try {
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: novoStatus } : t))
      );
      await apiTasks.update(taskId, { status: novoStatus });
      loadData(true);
    } catch (err) {
      addToast(err.message || 'Erro ao atualizar status.', 'error');
      loadData(true);
    }
  };

  const handleSaveTask = async (taskData) => {
    if (taskData.id) {
      await apiTasks.update(taskData.id, taskData);
      addToast('Tarefa atualizada.', 'success');
    } else {
      await apiTasks.create({
        ...taskData,
        responsavel_id: user.id,
      });
      addToast('Tarefa criada.', 'success');
    }
    loadData(true);
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Excluir esta tarefa?')) return;
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

  // Filter tasks
  const filteredTasks = tasks.filter((t) => {
    const matchSearch =
      t.titulo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.descricao && t.descricao.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchStatus = !statusFilter || t.status === statusFilter;
    const matchPriority = !priorityFilter || t.prioridade === priorityFilter;

    return matchSearch && matchStatus && matchPriority;
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
    <div className="min-h-screen flex flex-col font-sans"
         style={{ background: 'var(--bg-canvas)', color: 'var(--text-primary)' }}>
      
      {/* BACKGROUND LAYERS */}
      <div className="fixed inset-0 bg-grid-pattern opacity-60 pointer-events-none" style={{ zIndex: 0 }} />
      <div className="fixed inset-0 pointer-events-none hero-glow" style={{ zIndex: 0 }} />

      {/* NAVBAR */}
      <div style={{ position: 'relative', zIndex: 10 }}>
        <Navbar
          user={user}
          onLogout={handleLogout}
          isDark={isDark}
          onToggleTheme={toggleTheme}
          userTaskIds={userTaskIds}
          onNewTask={handleOpenNewTask}
        />
      </div>

      {/* MAIN VIEW */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-5" style={{ position: 'relative', zIndex: 1 }}>
        
        {/* COMPACT STATS STRIP */}
        <StatsCards tasks={tasks} />

      {/* COMMAND TOOLBAR (SEARCH & FILTERS) */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
          
          {/* SEARCH */}
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute inset-y-0 left-0 pl-2.5 flex items-center w-3.5 h-3.5 pointer-events-none"
                    style={{ color: 'var(--text-muted)' }} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filtrar tarefas..."
              className="w-full pl-8 pr-3 py-1.5 rounded-lg layer-input"
            />
          </div>

          {/* CONTROLS */}
          <div className="flex flex-wrap items-center gap-2">
            
            {/* STATUS FILTER */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg layer-input"
            >
              <option value="">Todos os status</option>
              <option value="pendente">A Fazer</option>
              <option value="em_andamento">Em Andamento</option>
              <option value="concluida">Concluídas</option>
            </select>

            {/* PRIORITY FILTER */}
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg layer-input"
            >
              <option value="">Prioridades</option>
              <option value="baixa">Baixa</option>
              <option value="media">Média</option>
              <option value="alta">Alta</option>
              <option value="urgente">Urgente</option>
            </select>

            {/* REFRESH BUTTON */}
            <button
              onClick={() => loadData()}
              disabled={loading}
              className="p-1.5 rounded-lg transition-all"
              style={{
                border: '1px solid var(--border-color)',
                background: 'var(--bg-surface)',
                color: 'var(--text-muted)',
              }}
              onMouseEnter={e => { e.currentTarget.style.color = '#9333ea'; e.currentTarget.style.borderColor = 'rgba(147,51,234,0.4)'; }}
              onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--border-color)'; }}
              title="Recarregar"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>

            {/* VIEW MODE TOGGLE */}
            <div className="flex items-center rounded-lg p-0.5"
                 style={{ background: 'var(--bg-canvas)', border: '1px solid var(--border-color)' }}>
              <button
                onClick={() => setViewMode('kanban')}
                className="p-1 rounded transition-all"
                style={viewMode === 'kanban' ? {
                  background: 'linear-gradient(135deg, rgba(232,244,0,0.12), rgba(147,51,234,0.18))',
                  color: '#9333ea',
                } : { color: 'var(--text-muted)' }}
                title="Quadro"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className="p-1 rounded transition-all"
                style={viewMode === 'table' ? {
                  background: 'linear-gradient(135deg, rgba(232,244,0,0.12), rgba(147,51,234,0.18))',
                  color: '#9333ea',
                } : { color: 'var(--text-muted)' }}
                title="Tabela"
              >
                <List className="w-3.5 h-3.5" />
              </button>
            </div>

          </div>

        </div>

        {/* WORKSPACE CONTENT */}
        {viewMode === 'kanban' ? (
          <KanbanBoard
            tasks={filteredTasks}
            onStatusChange={handleStatusChange}
            onViewDetails={handleOpenDetails}
            onEdit={handleOpenEditTask}
            onDelete={handleDeleteTask}
            onNewTask={handleOpenNewTask}
          />
        ) : (
          <TasksTable
            tasks={filteredTasks}
            onStatusChange={handleStatusChange}
            onViewDetails={handleOpenDetails}
            onEdit={handleOpenEditTask}
            onDelete={handleDeleteTask}
          />
        )}

      </main>

      {/* FOOTER */}
      <footer className="py-4 text-center text-[11px] mt-auto" style={{
        borderTop: '1px solid var(--divider)',
        color: 'var(--text-muted)',
        position: 'relative', zIndex: 1,
      }}>
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
          <span>TaskFlow • Gestão de Tarefas</span>
          <span>Workspace Individual</span>
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

      {/* TOAST SYSTEM */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />

    </div>
  );
}
