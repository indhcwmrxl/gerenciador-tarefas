import React from 'react';
import { Eye, Pencil, Trash2, AlertTriangle } from 'lucide-react';
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
        particleCount: 70,
        spread: 65,
        origin: { y: 0.6 },
        colors: ['#e8f400', '#9333ea', '#ff2d78', '#39ff14'],
        scalar: 1.1,
      });
    }
    onStatusChange(taskId, novoStatus);
  };
  const statusStyles = {
    pendente: 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-900',
    em_andamento: 'text-brand-700 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/60 border-brand-200 dark:border-brand-900',
    concluida: 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-900',
  };

  const priorityStyles = {
    baixa: 'text-slate-500 bg-slate-100 dark:bg-slate-800',
    media: 'text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/60',
    alta: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60',
    urgente: 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 font-bold',
  };

  if (tasks.length === 0) {
    return (
      <div className="layer-card rounded-xl p-8 text-center text-xs text-slate-400">
        Nenhuma tarefa encontrada neste filtro.
      </div>
    );
  }

  return (
    <div className="layer-card rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-500 font-semibold border-b border-border-light dark:border-border-dark">
            <tr>
              <th className="py-2.5 px-3 w-20 font-mono text-[11px]">ID</th>
              <th className="py-2.5 px-3">Título & Detalhes</th>
              <th className="py-2.5 px-3 w-28">Prioridade</th>
              <th className="py-2.5 px-3 w-36">Status</th>
              <th className="py-2.5 px-3 w-28">Prazo</th>
              <th className="py-2.5 px-3 text-right w-24">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-light dark:divide-border-dark font-normal">
            {tasks.map((task) => (
              <tr key={task.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-900/40 transition-colors">
                <td className="py-2.5 px-3 font-mono text-[11px] font-semibold text-slate-400">
                  TSK-{task.id}
                </td>
                <td className="py-2.5 px-3">
                  <div 
                    onClick={() => onViewDetails(task.id)}
                    className="font-medium text-slate-900 dark:text-slate-100 hover:text-brand-600 dark:hover:text-brand-400 cursor-pointer"
                  >
                    {task.titulo}
                  </div>
                  {task.descricao && (
                    <div className="text-slate-400 line-clamp-1 text-[11px] mt-0.5">{task.descricao}</div>
                  )}
                </td>
                <td className="py-2.5 px-3">
                  <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded capitalize ${priorityStyles[task.prioridade] || priorityStyles.media}`}>
                    {task.prioridade || 'Média'}
                  </span>
                </td>
                <td className="py-2.5 px-3">
                  <select
                    value={task.status}
                    onChange={(e) => handleStatusChange(task.id, e.target.value)}
                    className={`text-[11px] font-semibold rounded px-2 py-0.5 border cursor-pointer focus:outline-none ${statusStyles[task.status]}`}
                  >
                    <option value="pendente">A Fazer</option>
                    <option value="em_andamento">Em Andamento</option>
                    <option value="concluida">Concluída</option>
                  </select>
                </td>
                <td className="py-2.5 px-3 text-[11px]">
                  {task.prazo ? (
                    <span className={`flex items-center gap-1 font-medium ${
                      isPrazoVencido(task.prazo, task.status)
                        ? 'text-rose-500'
                        : 'text-slate-400'
                    }`}>
                      {isPrazoVencido(task.prazo, task.status) && (
                        <AlertTriangle className="w-3 h-3 shrink-0" />
                      )}
                      {new Date(task.prazo).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                    </span>
                  ) : (
                    <span className="text-slate-300 dark:text-slate-600">—</span>
                  )}
                </td>
                <td className="py-2.5 px-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => onViewDetails(task.id)}
                      className="p-1 text-slate-400 hover:text-brand-600 rounded"
                      title="Ver detalhes"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onEdit(task)}
                      className="p-1 text-slate-400 hover:text-slate-800 dark:hover:text-white rounded"
                      title="Editar"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDelete(task.id)}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded"
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
