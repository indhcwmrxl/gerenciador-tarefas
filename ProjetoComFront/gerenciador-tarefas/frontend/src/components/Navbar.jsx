import React, { useState, useEffect } from 'react';
import { Bell, LogOut, Sun, Moon, RefreshCw, Plus, Zap } from 'lucide-react';
import { apiNotifications } from '../services/api';

export function Navbar({ user, onLogout, isDark, onToggleTheme, userTaskIds = [], onNewTask }) {
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [loadingNotifs, setLoadingNotifs] = useState(false);

  const fetchNotifications = async () => {
    try {
      setLoadingNotifs(true);
      const list = await apiNotifications.list();
      if (Array.isArray(list)) {
        const filtered = list.filter((n) => {
          if (!n.task_id) return true;
          return userTaskIds.includes(n.task_id) || (user?.nome && n.mensagem?.includes(user.nome));
        });
        setNotifications(filtered.reverse().slice(0, 15));
      }
    } catch (e) {
      console.warn('Erro ao atualizar notificações:', e);
    } finally {
      setLoadingNotifs(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, [userTaskIds]);

  const getInitials = (nome) => {
    if (!nome) return 'U';
    const parts = nome.trim().split(' ');
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  return (
    <header className="sticky top-0 z-40"
            style={{
              background: 'var(--navbar-bg)',
              backdropFilter: 'blur(16px)',
              borderBottom: '1px solid var(--navbar-border)',
            }}>

      {/* TOP GRADIENT LINE */}
      <div className="h-[1px] w-full"
           style={{ background: 'linear-gradient(90deg, transparent 0%, #9333ea 35%, #e8f400 65%, transparent 100%)' }} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
        
        {/* BRAND */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                 style={{
                   background: 'linear-gradient(135deg, #e8f400 0%, #9333ea 100%)',
                   boxShadow: '0 0 12px rgba(232,244,0,0.3)',
                   animation: 'glowPulse 2.4s ease-in-out infinite',
                 }}>
              <Zap className="w-4 h-4 text-black" strokeWidth={2.5} />
            </div>
            <span className="font-black text-sm hidden sm:inline"
                  style={{ color: 'var(--text-primary)', letterSpacing: '-0.03em' }}>
              TaskFlow
            </span>
          </div>

          <div className="h-4 w-[1px] hidden sm:block" style={{ background: 'var(--border-color)' }} />

          {/* WORKSPACE CHIP */}
          <div className="neon-pill flex items-center gap-1.5 px-2.5 py-1 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            <span className="truncate max-w-[140px] text-[11px]">{user?.nome || 'Minha Conta'}</span>
          </div>
        </div>

        {/* RIGHT ACTIONS */}
        <div className="flex items-center gap-2">

          {/* NEW TASK */}
          <button onClick={() => onNewTask('pendente')} className="btn-neon flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs">
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline font-black">Nova Tarefa</span>
          </button>

          {/* THEME TOGGLE */}
          <button
            onClick={onToggleTheme}
            className="p-1.5 rounded-lg transition-all"
            style={{
              color: 'var(--text-secondary)',
              background: 'rgba(147,51,234,0.08)',
              border: '1px solid var(--border-color)',
            }}
            title={isDark ? 'Modo Claro' : 'Modo Escuro'}
          >
            {isDark
              ? <Sun className="w-4 h-4" style={{ color: '#e8f400' }} />
              : <Moon className="w-4 h-4" />}
          </button>

          {/* NOTIFICATIONS */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-1.5 rounded-lg transition-all"
              style={{
                color: 'var(--text-secondary)',
                background: 'rgba(147,51,234,0.08)',
                border: '1px solid var(--border-color)',
              }}
              title="Notificações"
            >
              <Bell className="w-4 h-4" />
              {notifications.length > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full"
                      style={{
                        background: '#e8f400',
                        boxShadow: '0 0 6px rgba(232,244,0,0.6)',
                        animation: 'neonFlicker 4s linear infinite',
                      }} />
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl p-3 z-50"
                   style={{
                     background: 'var(--modal-bg)',
                     border: '1px solid var(--border-color)',
                     boxShadow: 'var(--modal-shadow)',
                     animation: 'scaleUp 0.18s cubic-bezier(0.16,1,0.3,1)',
                   }}>
                <div className="flex items-center justify-between pb-2 mb-2 px-1"
                     style={{ borderBottom: '1px solid var(--divider)' }}>
                  <span className="font-black text-xs" style={{ color: 'var(--text-primary)' }}>
                    Notificações
                  </span>
                  <button
                    onClick={fetchNotifications}
                    className="text-[11px] font-bold flex items-center gap-1 transition-opacity hover:opacity-70"
                    style={{ color: isDark ? '#e8f400' : '#7c3aed' }}
                  >
                    <RefreshCw className={`w-3 h-3 ${loadingNotifs ? 'animate-spin' : ''}`} />
                    Atualizar
                  </button>
                </div>

                <div className="max-h-64 overflow-y-auto text-xs space-y-0.5">
                  {notifications.length === 0 ? (
                    <div className="py-8 text-center font-medium"
                         style={{ color: 'var(--text-muted)' }}>
                      Nenhuma notificação.
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div key={n.id} className="py-2.5 px-2 rounded-lg cursor-default transition-all"
                           style={{ borderBottom: '1px solid var(--divider)' }}
                           onMouseEnter={e => e.currentTarget.style.background = 'rgba(147,51,234,0.06)'}
                           onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                        <div className="flex items-center justify-between text-[10px] mb-1">
                          <span className="font-black uppercase tracking-wider"
                                style={{ color: isDark ? '#e8f400' : '#7c3aed' }}>
                            {n.tipo.replace('_', ' ')}
                          </span>
                          <span style={{ color: 'var(--text-muted)' }}>
                            {new Date(n.criada_em).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{n.mensagem}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="h-4 w-[1px]" style={{ background: 'var(--border-color)' }} />

          {/* USER */}
          <div className="flex items-center gap-2 pl-1">
            <div className="w-7 h-7 rounded-lg font-black text-xs flex items-center justify-center"
                 style={{
                   background: 'linear-gradient(135deg, rgba(147,51,234,0.35), rgba(232,244,0,0.2))',
                   border: '1px solid rgba(147,51,234,0.35)',
                   color: isDark ? '#e8f400' : '#7c3aed',
                 }}>
              {getInitials(user?.nome)}
            </div>
            <button
              onClick={onLogout}
              className="p-1.5 rounded-lg transition-all"
              style={{ color: 'var(--text-muted)' }}
              title="Encerrar sessão"
              onMouseEnter={e => { e.currentTarget.style.color = '#dc2626'; e.currentTarget.style.background = 'rgba(220,38,38,0.1)'; }}
              onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'transparent'; }}
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>
      </div>
    </header>
  );
}
