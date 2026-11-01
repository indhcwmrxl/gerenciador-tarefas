import React, { useState, useEffect } from 'react';
import { X, Loader2, Zap, Calendar, Flag, AlignLeft } from 'lucide-react';

function formatForDateTimeLocal(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export function TaskModal({ isOpen, onClose, onSave, taskToEdit, initialStatus, currentUser }) {
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [status, setStatus] = useState('pendente');
  const [prioridade, setPrioridade] = useState('media');
  const [prazo, setPrazo] = useState('');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');

  useEffect(() => {
    if (taskToEdit) {
      setTitulo(taskToEdit.titulo || '');
      setDescricao(taskToEdit.descricao || '');
      setStatus(taskToEdit.status || 'pendente');
      setPrioridade(taskToEdit.prioridade || 'media');
      setPrazo(formatForDateTimeLocal(taskToEdit.prazo));
    } else {
      setTitulo('');
      setDescricao('');
      setStatus(initialStatus || 'pendente');
      setPrioridade('media');
      setPrazo('');
    }
    setErro('');
  }, [taskToEdit, initialStatus, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!titulo.trim()) { setErro('Informe o título da tarefa.'); return; }
    try {
      setLoading(true);
      setErro('');
      await onSave({
        id: taskToEdit?.id,
        titulo: titulo.trim(),
        descricao: descricao.trim() || null,
        status,
        prioridade,
        prazo: prazo ? new Date(prazo).toISOString() : null,
        responsavel_id: currentUser?.id,
      });
      onClose();
    } catch (err) {
      setErro(err.message || 'Erro ao salvar tarefa.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 dark:bg-black/75 backdrop-blur-md animate-fade-in select-none">
      
      <div className="w-full max-w-lg glass-panel rounded-2xl p-6 relative overflow-hidden shadow-2xl border border-sky-400/30 frost-sheen animate-scale-up">
        
        {/* HEADER */}
        <div className="flex items-center justify-between pb-4 border-b border-sky-400/15">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-500/20 border border-sky-400/40 flex items-center justify-center text-primary shadow-[0_0_12px_rgba(125,211,252,0.3)]">
              <Zap className="w-4 h-4 fill-current text-sky-600 dark:text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-bold font-display text-slate-900 dark:text-white">
                {taskToEdit ? 'Editar Tarefa Executiva' : 'Nova Demanda'}
              </h3>
              <p className="text-[11px] font-mono text-slate-500 dark:text-on-surface-variant">
                {taskToEdit ? `Alterando item TSK-${taskToEdit.id}` : 'Adicione uma nova tarefa ao workspace'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ERROR */}
        {erro && (
          <div className="mt-3 p-3 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs font-mono">
            {erro}
          </div>
        )}

        {/* FORM */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          
          {/* TÍTULO */}
          <div>
            <label className="block text-[11px] font-mono font-semibold mb-1 text-slate-600 dark:text-sky-200/80 uppercase tracking-wider">
              Título da Tarefa
            </label>
            <input
              type="text"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ex: Refatorar pipeline de deploy..."
              className="w-full px-3.5 py-2 rounded-lg bg-slate-100 dark:bg-[#0e172a]/80 border border-slate-300 dark:border-sky-400/20 text-xs text-slate-900 dark:text-on-surface placeholder-slate-400 dark:placeholder-sky-200/40 focus:outline-none focus:ring-1 focus:ring-sky-400/60 focus:border-sky-400 transition-all"
              autoFocus
            />
          </div>

          {/* DESCRIÇÃO */}
          <div>
            <label className="block text-[11px] font-mono font-semibold mb-1 text-slate-600 dark:text-sky-200/80 uppercase tracking-wider">
              Contexto / Descrição (opcional)
            </label>
            <textarea
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Adicione notas, dependências ou alinhamentos..."
              rows={3}
              className="w-full px-3.5 py-2 rounded-lg bg-slate-100 dark:bg-[#0e172a]/80 border border-slate-300 dark:border-sky-400/20 text-xs text-slate-900 dark:text-on-surface placeholder-slate-400 dark:placeholder-sky-200/40 focus:outline-none focus:ring-1 focus:ring-sky-400/60 focus:border-sky-400 transition-all resize-none"
            />
          </div>

          {/* STATUS & PRIORIDADE */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-mono font-semibold mb-1 text-slate-600 dark:text-sky-200/80 uppercase tracking-wider">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-100 dark:bg-[#0e172a]/80 border border-slate-300 dark:border-sky-400/20 text-xs text-slate-900 dark:text-on-surface focus:outline-none focus:ring-1 focus:ring-sky-400/60 focus:border-sky-400 cursor-pointer"
              >
                <option value="pendente">A Fazer</option>
                <option value="em_andamento">Em Andamento</option>
                <option value="concluida">Concluída</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-mono font-semibold mb-1 text-slate-600 dark:text-sky-200/80 uppercase tracking-wider">
                Prioridade
              </label>
              <select
                value={prioridade}
                onChange={(e) => setPrioridade(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-100 dark:bg-[#0e172a]/80 border border-slate-300 dark:border-sky-400/20 text-xs text-slate-900 dark:text-on-surface focus:outline-none focus:ring-1 focus:ring-sky-400/60 focus:border-sky-400 cursor-pointer"
              >
                <option value="baixa">Baixa</option>
                <option value="media">Média</option>
                <option value="alta">Alta</option>
                <option value="urgente">Urgente 🔥</option>
              </select>
            </div>
          </div>

          {/* PRAZO E HORÁRIO */}
          <div>
            <label className="block text-[11px] font-mono font-semibold mb-1 text-slate-600 dark:text-sky-200/80 uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-sky-400" />
              <span>Prazo e Horário de Cumprimento</span>
            </label>
            <input
              type="datetime-local"
              value={prazo}
              onChange={(e) => setPrazo(e.target.value)}
              className="w-full px-3.5 py-2 rounded-lg bg-slate-100 dark:bg-[#0e172a]/80 border border-slate-300 dark:border-sky-400/20 text-xs text-slate-900 dark:text-on-surface focus:outline-none focus:ring-1 focus:ring-sky-400/60 focus:border-sky-400 transition-all font-mono"
            />
          </div>

          {/* ACTIONS */}
          <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-sky-400/15">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 rounded-lg bg-sky-400 text-slate-950 font-bold text-xs shadow-[0_0_16px_rgba(125,211,252,0.45)] hover:bg-sky-300 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Salvando...</span>
                </>
              ) : (
                <span>{taskToEdit ? 'Salvar Alterações' : 'Criar Tarefa'}</span>
              )}
            </button>
          </div>

        </form>

      </div>

    </div>
  );
}
