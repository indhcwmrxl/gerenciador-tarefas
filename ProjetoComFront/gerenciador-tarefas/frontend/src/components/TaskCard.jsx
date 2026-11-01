import React, { useState, useEffect } from 'react';
import { 
  ArrowRight, 
  ArrowLeft, 
  Pencil, 
  Trash2, 
  Check, 
  Calendar, 
  AlertTriangle, 
  Clock, 
  Play, 
  Pause, 
  GripVertical 
} from 'lucide-react';
import confetti from 'canvas-confetti';

export function TaskCard({ 
  task, 
  onStatusChange, 
  onViewDetails, 
  onEdit, 
  onDelete,
  isDragging,
  onDragStart,
  onDragEnd 
}) {
  const [timerSeconds, setTimerSeconds] = useState(25 * 60); // 25 min padrão
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  // Timer para tarefas em andamento
  useEffect(() => {
    let interval = null;
    if (isTimerRunning && task.status === 'em_andamento') {
      interval = setInterval(() => {
        setTimerSeconds((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, task.status]);

  const formatTimer = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const handleMoveStatus = (novoStatus) => {
    if (novoStatus === 'concluida') {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.7 },
        colors: ['#7dd3fc', '#38bdf8', '#c8a0f0', '#0ea5e9'],
        scalar: 1.1,
      });
    }
    onStatusChange(task.id, novoStatus);
  };

  const priorityConfig = {
    baixa: {
      label: 'Baixa',
      badge: 'bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-500/30',
    },
    media: {
      label: 'Média',
      badge: 'bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30',
    },
    alta: {
      label: 'Alta',
      badge: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30',
    },
    urgente: {
      label: 'Urgente',
      badge: 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30 font-bold',
    },
  };

  const prio = priorityConfig[task.prioridade] || priorityConfig.media;

  const formatDateTime = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const hoje = new Date();
    const ehHoje = d.toDateString() === hoje.toDateString();
    const hora = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (ehHoje) return `Hoje às ${hora}`;
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  const prazoVencido = task.prazo && task.status !== 'concluida' && new Date(task.prazo) < new Date();
  const prazoLabel = task.prazo ? formatDateTime(task.prazo) : null;
  const isConcluida = task.status === 'concluida';
  const isEmAndamento = task.status === 'em_andamento';

  return (
    <article
      draggable
      onDragStart={(e) => onDragStart(e, task.id)}
      onDragEnd={onDragEnd}
      className={`glass-card rounded-xl p-4 transition-all duration-200 group relative select-none cursor-grab active:cursor-grabbing ${
        isEmAndamento ? 'glass-active-card' : ''
      } ${isDragging ? 'dragging' : ''}`}
    >
      {/* HEADER: ID, PRIORITY, ESTIMATE & DRAG HANDLE */}
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-2">
          <GripVertical className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 opacity-40 group-hover:opacity-100 transition-opacity" />
          <span className="text-[11px] font-mono text-slate-500 dark:text-on-surface-variant font-medium">
            TSK-{task.id}
          </span>
          <span className={`px-2 py-0.5 rounded text-[10px] font-medium border ${prio.badge}`}>
            {prio.label}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-mono text-slate-600 dark:text-slate-300 bg-sky-500/10 px-1.5 py-0.5 rounded border border-sky-400/20">
            {task.prioridade === 'urgente' ? '30 min' : '45 min'}
          </span>
        </div>
      </div>

      {/* TITLE & DESCRIPTION */}
      <div>
        <h4
          onClick={() => onViewDetails(task.id)}
          className={`text-sm font-semibold leading-snug cursor-pointer transition-colors ${
            isConcluida
              ? 'line-through text-slate-400 dark:text-slate-500'
              : 'text-slate-900 dark:text-slate-100 hover:text-sky-600 dark:hover:text-primary'
          }`}
        >
          {task.titulo}
        </h4>
        {task.descricao && (
          <p className="text-xs text-slate-600 dark:text-on-surface-variant mt-1 line-clamp-2 leading-relaxed">
            {task.descricao}
          </p>
        )}
      </div>

      {/* DEEP WORK TIMER WIDGET (EXIBIDO EM ANDAMENTO) */}
      {isEmAndamento && (
        <div className="mt-3.5 p-3 rounded-lg bg-sky-950/40 dark:bg-[#091326]/80 border border-sky-400/25 space-y-2">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-sky-700 dark:text-sky-300 font-mono flex items-center gap-1 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_#38bdf8] animate-pulse"></span>
              DEEP WORK TIMER
            </span>
            <span className="font-mono text-slate-800 dark:text-cyan-300 font-bold">
              {formatTimer(timerSeconds)} restante
            </span>
          </div>
          <div className="w-full bg-slate-300 dark:bg-[#060c18] rounded-full h-1 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-sky-400 to-cyan-300 transition-all duration-300"
              style={{ width: `${(timerSeconds / (25 * 60)) * 100}%` }}
            />
          </div>
          <div className="flex items-center justify-between pt-1">
            <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
              Ciclo 1 de 4
            </span>
            <button
              onClick={() => setIsTimerRunning(!isTimerRunning)}
              className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-500/20 text-sky-700 dark:text-cyan-300 border border-sky-400/30 hover:bg-sky-500/30 flex items-center gap-1"
            >
              {isTimerRunning ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
              {isTimerRunning ? 'Pausar' : 'Iniciar Foco'}
            </button>
          </div>
        </div>
      )}

      {/* FOOTER: DEADLINE, TRANSITIONS & ACTIONS */}
      <div className="mt-4 pt-3 border-t border-sky-400/15 flex items-center justify-between">
        
        {/* DEADLINE BADGE */}
        {prazoLabel ? (
          <div
            className={`flex items-center gap-1.5 text-[11px] font-mono px-2 py-0.5 rounded border ${
              prazoVencido
                ? 'text-rose-700 dark:text-rose-300 bg-rose-500/15 border-rose-500/30'
                : 'text-slate-600 dark:text-on-surface-variant bg-slate-500/10 border-slate-400/20'
            }`}
          >
            {prazoVencido ? (
              <AlertTriangle className="w-3 h-3 text-rose-500" />
            ) : (
              <Clock className="w-3 h-3" />
            )}
            <span>{prazoLabel}</span>
          </div>
        ) : (
          <div className="flex items-center gap-1 text-[11px] font-mono text-slate-400">
            <Calendar className="w-3 h-3" />
            <span>Sem prazo</span>
          </div>
        )}

        {/* ACTIONS & MOVE BUTTONS */}
        <div className="flex items-center gap-1.5">
          {/* Quick status transition */}
          {task.status === 'pendente' && (
            <button
              onClick={() => handleMoveStatus('em_andamento')}
              className="text-xs font-semibold text-sky-600 dark:text-primary hover:text-sky-500 flex items-center gap-1 transition-transform hover:translate-x-0.5"
            >
              <span>Iniciar</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}

          {task.status === 'em_andamento' && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => handleMoveStatus('pendente')}
                className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-white"
                title="Voltar para A Fazer"
              >
                <ArrowLeft className="w-3 h-3" />
              </button>
              <button
                onClick={() => handleMoveStatus('concluida')}
                className="px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-xs font-semibold hover:bg-emerald-500/30 flex items-center gap-1"
              >
                <Check className="w-3 h-3" />
                <span>Concluir</span>
              </button>
            </div>
          )}

          {task.status === 'concluida' && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => handleMoveStatus('em_andamento')}
                className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-white"
                title="Reabrir tarefa"
              >
                <ArrowLeft className="w-3 h-3" />
              </button>
              <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                <Check className="w-3 h-3" />
                Concluído
              </span>
            </div>
          )}

          {/* Edit & Delete (Hover) */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-1 pl-1 border-l border-sky-400/20">
            <button
              onClick={() => onEdit(task)}
              className="p-1 rounded text-slate-400 hover:text-sky-500 transition-colors"
              title="Editar"
            >
              <Pencil className="w-3 h-3" />
            </button>
            <button
              onClick={() => onDelete(task.id)}
              className="p-1 rounded text-slate-400 hover:text-rose-500 transition-colors"
              title="Excluir"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        </div>

      </div>
    </article>
  );
}
