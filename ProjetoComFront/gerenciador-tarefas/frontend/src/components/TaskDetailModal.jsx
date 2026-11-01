import React, { useState, useEffect } from 'react';
import { 
  X, 
  Calendar, 
  Clock, 
  Loader2, 
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { apiTasks, apiNotifications } from '../services/api';

export function TaskDetailModal({ isOpen, onClose, taskId }) {
  const [taskCompleta, setTaskCompleta] = useState(null);
  const [notificacoes, setNotificacoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');

  useEffect(() => {
    if (!isOpen || !taskId) return;

    let isMounted = true;
    setLoading(true);
    setErro('');

    Promise.all([
      apiTasks.getCompleto(taskId),
      apiNotifications.list(taskId).catch(() => []),
    ])
      .then(([dados, notifs]) => {
        if (!isMounted) return;
        setTaskCompleta(dados);
        setNotificacoes(Array.isArray(notifs) ? notifs : []);
      })
      .catch((err) => {
        if (!isMounted) return;
        setErro(err.message || 'Falha ao carregar informações.');
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
    pendente: { label: 'A Fazer', badge: 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400' },
    em_andamento: { label: 'Em Andamento', badge: 'bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-400' },
    concluida: { label: 'Concluída', badge: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400' },
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 dark:bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-xl bg-surface-light dark:bg-surface-dark rounded-xl p-5 border border-border-light dark:border-border-dark shadow-modal animate-scale-up max-h-[90vh] overflow-y-auto">
        
        {/* HEADER */}
        <div className="flex items-center justify-between pb-3 border-b border-border-light dark:border-border-dark">
          <div className="flex items-center gap-2 text-xs">
            <span className="font-mono font-semibold text-slate-400">
              TSK-{taskId}
            </span>
            {taskCompleta?.status && (
              <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${statusMap[taskCompleta.status]?.badge}`}>
                {statusMap[taskCompleta.status]?.label || taskCompleta.status}
              </span>
            )}
            {taskCompleta?.prioridade && (
              <span className="px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                {taskCompleta.prioridade}
              </span>
            )}
          </div>

          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* LOADING & ERROR */}
        {loading && (
          <div className="py-16 flex flex-col items-center justify-center gap-2 text-slate-400 text-xs">
            <Loader2 className="w-5 h-5 animate-spin text-brand-600" />
            <span>Carregando dados...</span>
          </div>
        )}

        {erro && (
          <div className="my-4 p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{erro}</span>
          </div>
        )}

        {/* CONTENT */}
        {!loading && taskCompleta && (
          <div className="mt-4 space-y-5 text-xs">
            
            {/* TITLE & DESCRIPTION */}
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white mb-2 leading-snug">
                {taskCompleta.titulo}
              </h2>
              {taskCompleta.descricao ? (
                <div className="text-slate-600 dark:text-slate-300 text-xs leading-relaxed bg-slate-50 dark:bg-[#080d16] p-3 rounded-lg border border-border-light dark:border-border-dark/60 whitespace-pre-wrap">
                  {taskCompleta.descricao}
                </div>
              ) : (
                <p className="text-slate-400 italic">Sem descrição.</p>
              )}
            </div>

            {/* TIMELINE / ACTIVITIES */}
            <div>
              <span className="font-semibold text-slate-900 dark:text-slate-100 block mb-2 text-xs">
                Histórico de Eventos
              </span>

              {notificacoes.length === 0 ? (
                <div className="text-slate-400 text-[11px] italic">
                  Nenhum registro de alteração para este item.
                </div>
              ) : (
                <div className="space-y-2 border-l border-border-light dark:border-border-dark pl-3 ml-1.5">
                  {notificacoes.map((n) => (
                    <div key={n.id} className="relative text-[11px]">
                      <span className="absolute -left-[17px] top-1 w-2 h-2 rounded-full bg-brand-500" />
                      <div className="font-medium text-slate-800 dark:text-slate-200">
                        {n.mensagem}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {new Date(n.criada_em).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* METADATA */}
            <div className="pt-3 border-t border-border-light dark:border-border-dark/60 flex items-center justify-between text-[11px] text-slate-400">
              <span>Criado em {new Date(taskCompleta.criada_em).toLocaleDateString('pt-BR')}</span>
              <span>Atualizado em {new Date(taskCompleta.atualizada_em).toLocaleDateString('pt-BR')}</span>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
