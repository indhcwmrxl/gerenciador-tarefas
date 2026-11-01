import React from 'react';
import { CheckCircle2, Clock, AlertTriangle, TrendingUp, Inbox } from 'lucide-react';

export function StatsCards({ tasks }) {
  const total = tasks.length;
  const pendentes = tasks.filter((t) => t.status === 'pendente').length;
  const emAndamento = tasks.filter((t) => t.status === 'em_andamento').length;
  const concluidas = tasks.filter((t) => t.status === 'concluida').length;
  const ativas = pendentes + emAndamento;
  const taxaConclusao = total > 0 ? Math.round((concluidas / total) * 100) : 0;

  // Encontra a tarefa com deadline mais crítico (próximo ou vencido)
  const tarefasComPrazo = tasks
    .filter((t) => t.prazo && t.status !== 'concluida')
    .sort((a, b) => new Date(a.prazo) - new Date(b.prazo));
  const deadlineCritico = tarefasComPrazo[0] || null;

  const formatDeadline = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const hoje = new Date();
    const ehHoje = d.toDateString() === hoje.toDateString();
    const hora = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (ehHoje) return `Hoje às ${hora}`;
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  // Estimativa de tempo de foco (baseado na quantidade de tarefas ativas, ex: 45m cada)
  const minutosFoco = ativas * 45;
  const horasFoco = Math.floor(minutosFoco / 60);
  const minRestantes = minutosFoco % 60;
  const pctMetaFoco = Math.min(100, Math.round((minutosFoco / 300) * 100)); // meta 5h (300 min)

  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 select-none" data-purpose="productivity-hud">
      
      {/* 1. TAREFAS ATIVAS */}
      <div className="glass-panel rounded-xl p-4 flex items-center justify-between transition-all hover:border-sky-400/40">
        <div className="space-y-1">
          <div className="text-[11px] font-semibold text-sky-600 dark:text-sky-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-500 dark:bg-sky-400 shadow-[0_0_6px_#38bdf8]"></span>
            Tarefas Ativas
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-display text-slate-900 dark:text-white tracking-tight drop-shadow-sm">
              {ativas}
            </span>
            <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
              / {total} no total
            </span>
          </div>
          <p className="text-[11px] text-slate-600 dark:text-slate-400">
            {pendentes} a fazer • {emAndamento} em progresso
          </p>
        </div>
        <div className="w-10 h-10 rounded-lg bg-sky-500/10 border border-sky-400/25 flex items-center justify-center text-sky-600 dark:text-primary shadow-[0_0_12px_rgba(125,211,252,0.15)]">
          <Inbox className="w-5 h-5" />
        </div>
      </div>

      {/* 2. FOCO HOJE */}
      <div className="glass-panel rounded-xl p-4 flex items-center justify-between transition-all hover:border-sky-400/40">
        <div className="space-y-1">
          <div className="text-[11px] font-semibold text-cyan-700 dark:text-cyan-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 dark:bg-cyan-400 shadow-[0_0_6px_#38bdf8]"></span>
            Foco Estimado
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-display text-cyan-600 dark:text-cyan-300 tracking-tight drop-shadow-[0_0_10px_rgba(56,189,248,0.2)]">
              {horasFoco}h {minRestantes}m
            </span>
            <span className="text-xs font-mono text-slate-500 dark:text-slate-400">/ meta 5h</span>
          </div>
          <div className="w-32 bg-slate-200 dark:bg-[#08101e]/80 rounded-full h-1.5 overflow-hidden border border-sky-400/15">
            <div
              className="h-full bg-gradient-to-r from-sky-500 to-cyan-400 rounded-full transition-all duration-500 shadow-[0_0_8px_#38bdf8]"
              style={{ width: `${pctMetaFoco}%` }}
            />
          </div>
        </div>
        <div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-400/25 flex items-center justify-center text-cyan-600 dark:text-cyan-300 shadow-[0_0_12px_rgba(56,189,248,0.15)]">
          <Clock className="w-5 h-5" />
        </div>
      </div>

      {/* 3. DEADLINE CRÍTICO */}
      <div className="glass-panel rounded-xl p-4 flex items-center justify-between transition-all hover:border-sky-400/40">
        <div className="space-y-1">
          <div className="text-[11px] font-semibold text-rose-600 dark:text-rose-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 dark:bg-rose-400 shadow-[0_0_6px_#f43f5e]"></span>
            Deadline Crítico
          </div>
          {deadlineCritico ? (
            <>
              <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate max-w-[150px]">
                TSK-{deadlineCritico.id} {deadlineCritico.titulo}
              </div>
              <div className="flex items-center gap-1.5 text-xs font-mono text-rose-600 dark:text-rose-300">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>{formatDeadline(deadlineCritico.prazo)}</span>
              </div>
            </>
          ) : (
            <>
              <div className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                Sem prazos urgentes
              </div>
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-mono">
                Tudo em dia ✨
              </p>
            </>
          )}
        </div>
        <div className="w-10 h-10 rounded-lg bg-rose-500/10 border border-rose-400/25 flex items-center justify-center text-rose-600 dark:text-rose-300 font-mono text-xs font-bold shadow-[0_0_12px_rgba(244,63,94,0.15)]">
          {deadlineCritico ? 'URG' : 'OK'}
        </div>
      </div>

      {/* 4. TAXA DE CONCLUSÃO */}
      <div className="glass-panel rounded-xl p-4 flex items-center justify-between transition-all hover:border-sky-400/40">
        <div className="space-y-1 w-full mr-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-sky-600 dark:text-sky-300 uppercase tracking-wider font-mono">
              Taxa de Conclusão
            </span>
            <span className="text-xs font-mono font-bold text-sky-600 dark:text-sky-300">
              {taxaConclusao}%
            </span>
          </div>
          <div className="text-2xl font-bold font-display text-slate-900 dark:text-white tracking-tight drop-shadow-sm">
            {concluidas} Concluída{concluidas === 1 ? '' : 's'}
          </div>
          <div className="w-full bg-slate-200 dark:bg-[#08101e]/80 rounded-full h-1.5 overflow-hidden border border-sky-400/15">
            <div
              className="h-full bg-gradient-to-r from-sky-500 to-cyan-400 rounded-full transition-all duration-500 shadow-[0_0_8px_#7dd3fc]"
              style={{ width: `${taxaConclusao}%` }}
            />
          </div>
        </div>
        <div className="w-10 h-10 rounded-lg bg-sky-500/10 border border-sky-400/25 flex items-center justify-center text-sky-600 dark:text-primary shrink-0 shadow-[0_0_12px_rgba(125,211,252,0.15)]">
          <TrendingUp className="w-5 h-5" />
        </div>
      </div>

    </section>
  );
}
