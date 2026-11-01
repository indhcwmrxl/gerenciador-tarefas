import React, { useState, useEffect } from 'react';
import { X, Loader2, AlertCircle, Clock, Calendar, CheckCircle2, History } from 'lucide-react';
import { apiTasks, apiNotifications } from '../services/api';

export function TaskDetailModal({ isOpen, onClose, taskId }) {
  const [taskCompleta, setTaskCompleta] = useState(null);
  const [notificacoes, setNotificacoes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');

  useEffect(() => {
    if (!isOpen || !taskId) {
      setTaskCompleta(null);
      setNotificacoes([]);
      setErro('');
      return;
    }

    let isMounted = true;
    setLoading(true);
    setErro('');

    Promise.all([
      apiTasks.getById(taskId),
      apiNotifications.list(taskId).catch(() => []),
    ])
      .then(([dadosTask, dadosNotifs]) => {
        if (!isMounted) return;
        setTaskCompleta(dadosTask);
        setNotificacoes(Array.isArray(dadosNotifs) ? dadosNotifs : []);
      })
      .catch((err) => {
        if (!isMounted) return;
        setErro(err.message || 'Erro ao carregar os detalhes da tarefa.');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, taskId]);

  if (!isOpen) return null;

  const statusMap = {
    pendente: { label: 'A Fazer', badge: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30' },
    em_andamento: { label: 'Em Andamento', badge: 'bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30 font-semibold' },
    concluida: { label: 'Concluída', badge: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30' },
  };

  const priorityStyles = {
    baixa: 'bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-500/30',
    media: 'bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30',
    alta: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30',
    urgente: 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30 font-bold',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 dark:bg-black/75 backdrop-blur-md animate-fade-in select-none">
      <div className="w-full max-w-xl glass-panel rounded-2xl p-6 shadow-2xl border border-sky-400/30 frost-sheen animate-scale-up max-h-[90vh] overflow-y-auto">
        
        {/* HEADER */}
        <div className="flex items-center justify-between pb-3.5 border-b border-sky-400/15">
          <div className="flex items-center gap-2.5 text-xs">
            <span className="font-mono font-bold text-slate-500 dark:text-slate-400">
              TSK-{taskId}
            </span>
            {taskCompleta?.status && (
              <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${statusMap[taskCompleta.status]?.badge}`}>
                {statusMap[taskCompleta.status]?.label || taskCompleta.status}
              </span>
            )}
            {taskCompleta?.prioridade && (
              <span className={`px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider border ${priorityStyles[taskCompleta.prioridade]}`}>
                {taskCompleta.prioridade}
              </span>
            )}
          </div>

          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-500/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* LOADING & ERROR */}
        {loading && (
          <div className="py-16 flex flex-col items-center justify-center gap-2 text-slate-400 text-xs font-mono">
            <Loader2 className="w-6 h-6 animate-spin text-sky-500" />
            <span>Consultando microsserviços...</span>
          </div>
        )}

        {erro && (
          <div className="my-4 p-3 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2 font-mono">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{erro}</span>
          </div>
        )}

        {/* CONTENT */}
        {!loading && taskCompleta && (
          <div className="mt-4 space-y-5 text-xs">
            
            {/* TITLE & DESCRIPTION */}
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white mb-2 leading-snug font-display">
                {taskCompleta.titulo}
              </h2>
              {taskCompleta.descricao ? (
                <div className="text-slate-700 dark:text-slate-300 text-xs leading-relaxed bg-slate-100/90 dark:bg-[#080e1b]/80 p-3.5 rounded-xl border border-sky-400/15 whitespace-pre-wrap font-sans">
                  {taskCompleta.descricao}
                </div>
              ) : (
                <p className="text-slate-400 italic">Sem descrição registrada.</p>
              )}
            </div>

            {/* TIMELINE / ACTIVITIES */}
            <div>
              <span className="font-semibold font-mono text-[11px] text-slate-700 dark:text-sky-200/90 uppercase tracking-wider block mb-2.5 flex items-center gap-1.5">
                <History className="w-3.5 h-3.5 text-sky-400" />
                <span>Histórico de Eventos & Avisos</span>
              </span>

              {notificacoes.length === 0 ? (
                <div className="text-slate-400 text-[11px] italic font-mono">
                  Nenhum registro de alteração para este item.
                </div>
              ) : (
                <div className="space-y-2 border-l border-sky-400/25 pl-3.5 ml-1.5">
                  {notificacoes.map((n) => (
                    <div key={n.id} className="relative text-[11px]">
                      <span className="absolute -left-[18px] top-1 w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_6px_#38bdf8]" />
                      <div className="font-medium text-slate-800 dark:text-slate-200">
                        {n.mensagem}
                      </div>
                      <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                        {new Date(n.criada_em).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* METADATA */}
            <div className="pt-3 border-t border-sky-400/15 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-slate-500 dark:text-slate-400">
              <span>Criado: {new Date(taskCompleta.criada_em).toLocaleDateString('pt-BR')}</span>
              {taskCompleta.prazo && (
                <span className={`font-semibold flex items-center gap-1 ${
                  taskCompleta.status !== 'concluida' && new Date(taskCompleta.prazo) < new Date()
                    ? 'text-rose-600 dark:text-rose-400'
                    : 'text-sky-600 dark:text-cyan-300'
                }`}>
                  <Clock className="w-3.5 h-3.5" />
                  Prazo: {new Date(taskCompleta.prazo).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                  {taskCompleta.status !== 'concluida' && new Date(taskCompleta.prazo) < new Date() && ' (Vencido)'}
                </span>
              )}
              <span>Atualizado: {new Date(taskCompleta.atualizada_em).toLocaleDateString('pt-BR')}</span>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
