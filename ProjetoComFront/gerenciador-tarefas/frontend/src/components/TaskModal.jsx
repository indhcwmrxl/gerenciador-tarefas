import React, { useState, useEffect } from 'react';
import { X, Loader2, Zap } from 'lucide-react';

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
  const [titulo,    setTitulo]    = useState('');
  const [descricao, setDescricao] = useState('');
  const [status,    setStatus]    = useState('pendente');
  const [prioridade, setPrioridade] = useState('media');
  const [prazo,     setPrazo]     = useState('');
  const [loading,   setLoading]   = useState(false);
  const [erro,      setErro]      = useState('');

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
         style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)',
                  animation: 'fadeIn 0.15s ease' }}>

      <div className="w-full max-w-md rounded-xl p-5 relative overflow-hidden"
           style={{
             background: 'var(--modal-bg)',
             border: '1px solid var(--border-color)',
             boxShadow: 'var(--modal-shadow)',
             animation: 'scaleUp 0.2s cubic-bezier(0.16,1,0.3,1)',
           }}>

        {/* TOP ACCENT */}
        <div className="absolute top-0 left-8 right-8 h-[2px] rounded-full"
             style={{ background: 'linear-gradient(90deg, transparent, #9333ea, #e8f400, transparent)' }} />

        {/* HEADER */}
        <div className="flex items-center justify-between pb-3"
             style={{ borderBottom: '1px solid var(--divider)' }}>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                 style={{ background: 'linear-gradient(135deg, #e8f400, #9333ea)', boxShadow: '0 0 10px rgba(232,244,0,0.25)' }}>
              <Zap className="w-3.5 h-3.5 text-black" strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="text-sm font-black" style={{ color: 'var(--text-primary)' }}>
                {taskToEdit ? 'Editar Tarefa' : 'Nova Tarefa'}
              </h3>
              <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                {taskToEdit ? `Alterando TSK-${taskToEdit.id}` : 'Adicione uma nova demanda'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded transition-all"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={e => { e.currentTarget.style.color = '#dc2626'; e.currentTarget.style.background = 'rgba(220,38,38,0.1)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'transparent'; }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ERROR */}
        {erro && (
          <div className="mt-3 p-2.5 rounded-lg text-xs"
               style={{ background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.25)', color: '#dc2626' }}>
            {erro}
          </div>
        )}

        {/* FORM */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
          <div>
            <label className="block text-[11px] font-black mb-1 tracking-wide uppercase"
                   style={{ color: 'var(--text-muted)' }}>Título</label>
            <input
              type="text" value={titulo} onChange={(e) => setTitulo(e.target.value)}
              placeholder="O que precisa ser feito?"
              className="w-full px-3 py-2 rounded-lg layer-input" autoFocus
            />
          </div>

          <div>
            <label className="block text-[11px] font-black mb-1 tracking-wide uppercase"
                   style={{ color: 'var(--text-muted)' }}>Descrição</label>
            <textarea
              value={descricao} onChange={(e) => setDescricao(e.target.value)}
              placeholder="Adicione contexto, requisitos ou observações..."
              rows={3} className="w-full px-3 py-2 rounded-lg layer-input resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-black mb-1 tracking-wide uppercase"
                     style={{ color: 'var(--text-muted)' }}>Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg layer-input">
                <option value="pendente">A Fazer</option>
                <option value="em_andamento">Em Andamento</option>
                <option value="concluida">Concluída</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-black mb-1 tracking-wide uppercase"
                     style={{ color: 'var(--text-muted)' }}>Prioridade</label>
              <select value={prioridade} onChange={(e) => setPrioridade(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg layer-input">
                <option value="baixa">Baixa</option>
                <option value="media">Média</option>
                <option value="alta">Alta</option>
                <option value="urgente">Urgente</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-black mb-1 tracking-wide uppercase"
                   style={{ color: 'var(--text-muted)' }}>Prazo e Horário (opcional)</label>
            <input
              type="datetime-local"
              value={prazo}
              onChange={(e) => setPrazo(e.target.value)}
              className="w-full px-3 py-2 rounded-lg layer-input"
            />
          </div>

          {/* ACTIONS */}
          <div className="pt-3 flex items-center justify-end gap-2"
               style={{ borderTop: '1px solid var(--divider)' }}>
            <button type="button" onClick={onClose} disabled={loading}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                    style={{ color: 'var(--text-muted)' }}
                    onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
                    onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}>
              Cancelar
            </button>
            <button type="submit" disabled={loading}
                    className="btn-neon px-4 py-1.5 rounded-lg text-xs flex items-center gap-1.5 disabled:opacity-50">
              {loading ? (
                <><Loader2 className="w-3.5 h-3.5 animate-spin" /><span>Salvando...</span></>
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
