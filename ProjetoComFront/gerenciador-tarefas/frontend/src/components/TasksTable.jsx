import React from 'react';
import { Eye, Pencil, Trash2, AlertTriangle, Clock } from 'lucide-react';
import confetti from 'canvas-confetti';

function isPrazoVencido(prazo, status) {
  if (!prazo || status === 'concluida') return false;
  return new Date(prazo) < new Date();
}

export function TasksTable({ 
  tasks, 
  onStatusChange, 
  onViewDetails, 
  onEdit, 
  onDelete 
}) {
  const handleStatusChange = (taskId, novoStatus) => {
    if (novoStatus === 'concluida') {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#7dd3fc', '#38bdf8', '#c8a0f0', '#34d399'],
      });
    }
    onStatusChange(taskId, novoStatus);
  };

  const statusStyles = {
    pendente: 'text-amber-700 dark:text-amber-300 bg-amber-500/15 border-amber-500/30',
    em_andamento: 'text-sky-700 dark:text-sky-300 bg-sky-500/15 border-sky-500/30 font-semibold',
    concluida: 'text-emerald-700 dark:text-emerald-300 bg-emerald-500/15 border-emerald-500/30',
  };

  const priorityStyles = {
    baixa: 'text-slate-600 dark:text-slate-300 bg-slate-500/15 border-slate-500/30',
    media: 'text-sky-700 dark:text-sky-300 bg-sky-500/15 border-sky-500/30',
    alta: 'text-amber-700 dark:text-amber-300 bg-amber-500/15 border-amber-500/30',
    urgente: 'text-rose-700 dark:text-rose-300 bg-rose-500/15 border-rose-500/30 font-bold',
  };

  if (tasks.length === 0) {
    return (
      <div className="glass-panel rounded-2xl p-10 text-center text-xs text-slate-400 font-mono">
        Nenhuma tarefa encontrada neste filtro.
      </div>
    );
  }

  return (
    <div className="glass-panel rounded-2xl overflow-hidden shadow-xl border border-sky-400/20">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs select-none">
          <thead className="bg-slate-100 dark:bg-[#0c1527]/90 text-slate-600 dark:text-sky-200/70 font-mono text-[11px] border-b border-sky-400/15">
            <tr>
              <th className="py-3 px-4 w-24">ID</th>
              <th className="py-3 px-4">Título & Descrição</th>
              <th className="py-3 px-4 w-28">Prioridade</th>
              <th className="py-3 px-4 w-36">Status</th>
              <th className="py-3 px-4 w-44">Prazo / Horário</th>
              <th className="py-3 px-4 text-right w-24">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-sky-400/10 font-normal">
            {tasks.map((task) => (
              <tr 
                key={task.id} 
                className="hover:bg-sky-500/5 dark:hover:bg-sky-400/5 transition-colors"
              >
                <td className="py-3 px-4 font-mono text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  TSK-{task.id}
                </td>
                <td className="py-3 px-4">
                  <div 
                    onClick={() => onViewDetails(task.id)}
                    className={`font-semibold cursor-pointer transition-colors ${
                      task.status === 'concluida'
                        ? 'line-through text-slate-400 dark:text-slate-500'
                        : 'text-slate-900 dark:text-slate-100 hover:text-sky-600 dark:hover:text-primary'
                    }`}
                  >
                    {task.titulo}
                  </div>
                  {task.descricao && (
                    <div className="text-slate-500 dark:text-on-surface-variant line-clamp-1 text-[11px] mt-0.5">
                      {task.descricao}
                    </div>
                  )}
                </td>
                <td className="py-3 px-4">
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded border capitalize ${priorityStyles[task.prioridade] || priorityStyles.media}`}>
                    {task.prioridade || 'Média'}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <select
                    value={task.status}
                    onChange={(e) => handleStatusChange(task.id, e.target.value)}
                    className={`text-[11px] font-semibold rounded-lg px-2.5 py-1 border cursor-pointer focus:outline-none ${statusStyles[task.status]}`}
                  >
                    <option value="pendente">A Fazer</option>
                    <option value="em_andamento">Em Andamento</option>
                    <option value="concluida">Concluída</option>
                  </select>
                </td>
                <td className="py-3 px-4 text-[11px] font-mono">
                  {task.prazo ? (
                    <span className={`flex items-center gap-1.5 font-medium ${
                      isPrazoVencido(task.prazo, task.status)
                        ? 'text-rose-600 dark:text-rose-400 font-bold'
                        : 'text-slate-600 dark:text-slate-300'
                    }`}>
                      {isPrazoVencido(task.prazo, task.status) ? (
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                      ) : (
                        <Clock className="w-3.5 h-3.5 text-sky-400" />
                      )}
                      {new Date(task.prazo).toLocaleString('pt-BR', { 
                        day: '2-digit', 
                        month: 'short', 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </span>
                  ) : (
                    <span className="text-slate-400">—</span>
                  )}
                </td>
                <td className="py-3 px-4 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => onViewDetails(task.id)}
                      className="p-1 text-slate-400 hover:text-sky-500 rounded"
                      title="Ver detalhes"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onEdit(task)}
                      className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded"
                      title="Editar"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDelete(task.id)}
                      className="p-1 text-slate-400 hover:text-rose-500 rounded"
                      title="Excluir"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
