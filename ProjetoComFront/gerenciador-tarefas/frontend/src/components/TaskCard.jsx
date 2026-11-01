import React from 'react';
import { ArrowRight, ArrowLeft, Pencil, Trash2, Check, Calendar, AlertTriangle } from 'lucide-react';
import confetti from 'canvas-confetti';

export function TaskCard({ task, onStatusChange, onViewDetails, onEdit, onDelete }) {
  const handleMoveStatus = (novoStatus) => {
    if (novoStatus === 'concluida') {
      confetti({
        particleCount: 70,
        spread: 65,
        origin: { y: 0.75 },
        colors: ['#e8f400', '#9333ea', '#ff2d78', '#39ff14'],
        scalar: 1.1,
      });
    }
    onStatusChange(task.id, novoStatus);
  };

  const priorityConfig = {
    baixa:   { label: 'Baixa',   className: 'prio-baixa',   barColor: '#94a3b8' },
    media:   { label: 'Média',   className: 'prio-media',   barColor: '#9333ea' },
    alta:    { label: 'Alta',    className: 'prio-alta',    barColor: '#fb923c' },
    urgente: { label: 'Urgente', className: 'prio-urgente', barColor: '#ff2d78' },
  };

  const prio = priorityConfig[task.prioridade] || priorityConfig.media;

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  };

  const prazoVencido = task.prazo && task.status !== 'concluida' && new Date(task.prazo) < new Date();
  const prazoLabel = task.prazo ? formatDate(task.prazo) : null;

  return (
    <div className="group layer-card layer-card-interactive rounded-xl p-3.5 space-y-2.5 relative overflow-hidden">

      {/* LEFT PRIORITY BAR */}
      <div className="absolute left-0 top-4 bottom-4 w-[3px] rounded-r-full"
           style={{ background: prio.barColor, boxShadow: `0 0 6px ${prio.barColor}66` }} />

      {/* HEADER */}
      <div className="flex items-center justify-between text-xs pl-2">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] font-semibold" style={{ color: 'var(--text-muted)' }}>
            TSK-{task.id}
          </span>
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${prio.className}`}>
            {prio.label}
          </span>
        </div>
        <span className="text-[10px] flex items-center gap-1 font-medium" style={{ color: prazoVencido ? '#ef4444' : 'var(--text-muted)' }}>
          {prazoLabel ? (
            <>
              {prazoVencido && <AlertTriangle className="w-3 h-3" />}
              <Calendar className="w-3 h-3" />
              {prazoLabel}
            </>
          ) : (
            <>
              <Calendar className="w-3 h-3" />
              {formatDate(task.atualizada_em || task.criada_em)}
            </>
          )}
        </span>
      </div>

      {/* TITLE & DESCRIPTION */}
      <div className="pl-2">
        <h4
          onClick={() => onViewDetails(task.id)}
          className="text-xs font-bold cursor-pointer leading-snug line-clamp-2 transition-colors"
          style={{ color: 'var(--text-primary)' }}
          onMouseEnter={e => e.currentTarget.style.color = '#9333ea'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-primary)'}
        >
          {task.titulo}
        </h4>
        {task.descricao && (
          <p className="text-[11px] mt-1 line-clamp-2 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            {task.descricao}
          </p>
        )}
      </div>

      {/* FOOTER */}
      <div className="pt-2 flex items-center justify-between pl-2"
           style={{ borderTop: '1px solid var(--divider)' }}>

        {/* STATUS TRANSITIONS */}
        <div className="flex items-center gap-1">
          {task.status !== 'pendente' && (
            <button
              onClick={() => handleMoveStatus(task.status === 'concluida' ? 'em_andamento' : 'pendente')}
              className="p-1 rounded transition-all"
              style={{ color: 'var(--text-muted)' }}
              onMouseEnter={e => { e.currentTarget.style.color = '#9333ea'; e.currentTarget.style.background = 'rgba(147,51,234,0.1)'; }}
              onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'transparent'; }}
              title="Voltar status"
            >
              <ArrowLeft className="w-3 h-3" />
            </button>
          )}

          {task.status !== 'concluida' && (
            <button
              onClick={() => handleMoveStatus(task.status === 'pendente' ? 'em_andamento' : 'concluida')}
              className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold transition-all"
              style={{ color: 'var(--text-secondary)' }}
              onMouseEnter={e => { e.currentTarget.style.color = '#7c3aed'; e.currentTarget.style.background = 'rgba(147,51,234,0.08)'; }}
              onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.background = 'transparent'; }}
            >
              <span>{task.status === 'pendente' ? 'Iniciar' : 'Concluir'}</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          )}

          {task.status === 'concluida' && (
            <span className="flex items-center gap-1 text-[10px] font-black" style={{ color: '#16a34a' }}>
              <Check className="w-3 h-3 stroke-[2.5]" />
              Concluído
            </span>
          )}
        </div>

        {/* ACTIONS */}
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onEdit(task)}
            className="p-1 rounded transition-all"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={e => { e.currentTarget.style.color = '#9333ea'; e.currentTarget.style.background = 'rgba(147,51,234,0.1)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'transparent'; }}
            title="Editar"
          >
            <Pencil className="w-3 h-3" />
          </button>
          <button
            onClick={() => onDelete(task.id)}
            className="p-1 rounded transition-all"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={e => { e.currentTarget.style.color = '#dc2626'; e.currentTarget.style.background = 'rgba(220,38,38,0.1)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'transparent'; }}
            title="Excluir"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
}
