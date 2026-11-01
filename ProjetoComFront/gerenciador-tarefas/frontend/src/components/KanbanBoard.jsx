import React from 'react';
import { TaskCard } from './TaskCard';
import { Plus } from 'lucide-react';

const COLUMNS = [
  { id: 'pendente',     title: 'A Fazer',       label: '01', accentColor: '#f59e0b' },
  { id: 'em_andamento', title: 'Em Andamento',  label: '02', accentColor: '#9333ea' },
  { id: 'concluida',    title: 'Concluídas',    label: '03', accentColor: '#16a34a' },
];

export function KanbanBoard({ tasks, onStatusChange, onViewDetails, onEdit, onDelete, onNewTask }) {
  const columns = COLUMNS.map((col) => ({
    ...col,
    items: tasks.filter((t) => t.status === col.id),
  }));

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
      {columns.map((col) => (
        <div key={col.id} className="kanban-col">

          {/* COLUMN HEADER */}
          <div className="flex items-center justify-between pb-3 mb-3 px-1"
               style={{ borderBottom: '1px solid var(--divider)' }}>
            <div className="flex items-center gap-2">
              <span className="font-black text-[9px] tracking-widest opacity-60"
                    style={{ color: col.accentColor }}>
                {col.label}
              </span>
              <div className="w-[3px] h-4 rounded-full"
                   style={{ background: col.accentColor, boxShadow: `0 0 6px ${col.accentColor}88` }} />
              <span className="font-black text-xs" style={{ color: 'var(--text-primary)' }}>
                {col.title}
              </span>
              <span className="font-mono font-bold text-[10px] px-1.5 py-0.5 rounded-md"
                    style={{
                      color: col.accentColor,
                      background: `${col.accentColor}18`,
                      border: `1px solid ${col.accentColor}33`,
                    }}>
                {col.items.length}
              </span>
            </div>

            <button
              onClick={() => onNewTask(col.id)}
              className="p-1 rounded transition-all"
              style={{ color: 'var(--text-muted)' }}
              onMouseEnter={e => { e.currentTarget.style.color = col.accentColor; e.currentTarget.style.background = `${col.accentColor}15`; }}
              onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'transparent'; }}
              title={`Criar tarefa em ${col.title}`}
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* ITEMS */}
          <div className="flex-1 space-y-2.5 overflow-y-auto">
            {col.items.length === 0 ? (
              <div className="h-32 flex flex-col items-center justify-center rounded-lg text-center p-3"
                   style={{ border: '1px dashed var(--border-color)' }}>
                <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                  Nenhuma tarefa
                </span>
                <button
                  onClick={() => onNewTask(col.id)}
                  className="mt-1 text-[11px] font-bold transition-opacity hover:opacity-70"
                  style={{ color: col.accentColor }}
                >
                  + Adicionar item
                </button>
              </div>
            ) : (
              col.items.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onStatusChange={onStatusChange}
                  onViewDetails={onViewDetails}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              ))
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
