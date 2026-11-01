import React from 'react';

export function StatsCards({ tasks }) {
  const total      = tasks.length;
  const pendentes  = tasks.filter((t) => t.status === 'pendente').length;
  const emAndamento = tasks.filter((t) => t.status === 'em_andamento').length;
  const concluidas = tasks.filter((t) => t.status === 'concluida').length;
  const pct = total > 0 ? Math.round((concluidas / total) * 100) : 0;

  const stats = [
    { label: 'Total',       value: total,       color: 'var(--text-primary)',   dot: '#9333ea' },
    { label: 'A Fazer',     value: pendentes,   color: '#f59e0b',               dot: '#f59e0b' },
    { label: 'Andamento',   value: emAndamento, color: '#9333ea',               dot: '#9333ea' },
    { label: 'Concluídas',  value: concluidas,  color: '#16a34a',               dot: '#16a34a' },
  ];

  return (
    <div className="layer-card rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">

      {/* KPI METRICS */}
      <div className="flex flex-wrap items-center gap-5 text-xs">
        {stats.map((s, i) => (
          <React.Fragment key={s.label}>
            {i > 0 && <div className="h-8 w-[1px] hidden sm:block" style={{ background: 'var(--divider)' }} />}
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-8 rounded-full"
                   style={{ background: s.dot, boxShadow: `0 0 6px ${s.dot}66` }} />
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider block mb-0.5"
                      style={{ color: 'var(--text-muted)' }}>
                  {s.label}
                </span>
                <span className="font-black text-2xl leading-none" style={{ color: s.color }}>
                  {s.value}
                </span>
              </div>
            </div>
          </React.Fragment>
        ))}
      </div>

      {/* PROGRESS BAR */}
      <div className="sm:w-56 flex flex-col gap-2">
        <div className="flex justify-between items-center text-[11px] font-bold">
          <span style={{ color: 'var(--text-muted)' }}>Resolução</span>
          <span className="font-mono" style={{ color: '#9333ea' }}>{pct}%</span>
        </div>
        <div className="h-2 w-full rounded-full overflow-hidden" style={{ background: 'var(--border-color)' }}>
          <div
            className="h-full rounded-full transition-all duration-700 ease-out"
            style={{
              width: `${pct}%`,
              background: 'linear-gradient(90deg, #9333ea, #e8f400)',
              boxShadow: pct > 0 ? '0 0 8px rgba(147,51,234,0.4)' : 'none',
            }}
          />
        </div>
      </div>
    </div>
  );
}
