import React, { useState } from 'react';
import { TaskCard } from './TaskCard';
import { Plus } from 'lucide-react';
import confetti from 'canvas-confetti';

const COLUMNS = [
  { 
    id: 'pendente',     
    title: 'A FAZER',       
    dotColor: 'bg-amber-400',
    countBadge: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/25',
    accent: '#f59e0b'
  },
  { 
    id: 'em_andamento', 
    title: 'EM ANDAMENTO',  
    dotColor: 'bg-cyan-400 shadow-[0_0_8px_#38bdf8]',
    countBadge: 'bg-sky-500/15 text-sky-700 dark:text-cyan-300 border-sky-400/30',
    accent: '#38bdf8'
  },
  { 
    id: 'concluida',    
    title: 'CONCLUÍDAS',    
    dotColor: 'bg-emerald-400 shadow-[0_0_8px_#34d399]',
    countBadge: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
    accent: '#10b981'
  },
];

export function KanbanBoard({ tasks, onStatusChange, onViewDetails, onEdit, onDelete, onNewTask }) {
  const [draggedTaskId, setDraggedTaskId] = useState(null);
  const [dragOverCol, setDragOverCol] = useState(null);

  const handleDragStart = (e, taskId) => {
    setDraggedTaskId(taskId);
    e.dataTransfer.setData('text/plain', String(taskId));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setDraggedTaskId(null);
    setDragOverCol(null);
  };

  const handleDragOver = (e, colId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverCol !== colId) {
      setDragOverCol(colId);
    }
  };

  const handleDragLeave = (e, colId) => {
    // Evita resetar se estiver arrastando sobre filhos
    if (e.currentTarget.contains(e.relatedTarget)) return;
    if (dragOverCol === colId) {
      setDragOverCol(null);
    }
  };

  const handleDrop = (e, colId) => {
    e.preventDefault();
    const taskIdStr = e.dataTransfer.getData('text/plain') || draggedTaskId;
    const taskId = Number(taskIdStr);

    if (taskId) {
      if (colId === 'concluida') {
        confetti({
          particleCount: 90,
          spread: 75,
          origin: { y: 0.65 },
          colors: ['#7dd3fc', '#38bdf8', '#c8a0f0', '#34d399'],
        });
      }
      onStatusChange(taskId, colId);
    }

    setDraggedTaskId(null);
    setDragOverCol(null);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-start">
      {COLUMNS.map((col) => {
        const columnTasks = tasks.filter((t) => t.status === col.id);
        const isTarget = dragOverCol === col.id;

        return (
          <div
            key={col.id}
            onDragOver={(e) => handleDragOver(e, col.id)}
            onDragLeave={(e) => handleDragLeave(e, col.id)}
            onDrop={(e) => handleDrop(e, col.id)}
            className={`glass-panel rounded-2xl p-4 min-h-[560px] flex flex-col transition-all duration-200 ${
              isTarget ? 'drag-over-col ring-2 ring-sky-400' : ''
            }`}
          >
            {/* COLUMN HEADER */}
            <div className="flex items-center justify-between pb-3.5 mb-3 border-b border-sky-400/15">
              <div className="flex items-center gap-2.5">
                <span className={`w-2 h-2 rounded-full ${col.dotColor}`}></span>
                <span className="text-xs font-bold font-mono tracking-wider text-slate-800 dark:text-slate-100">
                  {col.title}
                </span>
                <span className={`text-[11px] font-mono font-semibold px-2 py-0.5 rounded-full border ${col.countBadge}`}>
                  {columnTasks.length}
                </span>
              </div>

              <button
                onClick={() => onNewTask(col.id)}
                className="p-1 rounded-md text-slate-400 hover:text-sky-500 hover:bg-sky-400/10 transition-colors"
                title={`Adicionar tarefa em ${col.title}`}
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* DROPZONE / CARDS LIST */}
            <div className="flex-1 space-y-3 overflow-y-auto">
              {columnTasks.length === 0 ? (
                <div
                  className={`h-36 flex flex-col items-center justify-center rounded-xl border border-dashed transition-all p-4 text-center ${
                    isTarget
                      ? 'border-sky-400 bg-sky-500/10'
                      : 'border-slate-300 dark:border-sky-400/15'
                  }`}
                >
                  <p className="text-xs text-slate-400 dark:text-slate-500 font-mono">
                    {isTarget ? 'Solte a tarefa aqui ✨' : 'Nenhuma tarefa'}
                  </p>
                  <button
                    onClick={() => onNewTask(col.id)}
                    className="mt-1.5 text-xs font-semibold text-sky-600 dark:text-primary hover:underline"
                  >
                    + Criar item
                  </button>
                </div>
              ) : (
                columnTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onStatusChange={onStatusChange}
                    onViewDetails={onViewDetails}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    isDragging={draggedTaskId === task.id}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                  />
                ))
              )}
            </div>

            {/* HELPER HINT */}
            <div className="pt-2 text-center text-[10px] text-slate-400 dark:text-slate-500 font-mono opacity-60">
              💡 Arraste e solte para mover
            </div>
          </div>
        );
      })}
    </div>
  );
}
