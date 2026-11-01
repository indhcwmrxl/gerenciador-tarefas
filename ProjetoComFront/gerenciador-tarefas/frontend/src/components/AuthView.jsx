import React, { useState } from 'react';
import { 
  Eye, 
  EyeOff, 
  Loader2, 
  AlertCircle,
  Sun,
  Moon,
  ArrowRight,
  Zap,
  Lock,
  Mail,
  User
} from 'lucide-react';
import { apiUsers } from '../services/api';

export function AuthView({ onLoginSuccess, isDark, onToggleTheme }) {
  const [isRegister, setIsRegister] = useState(false);
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmSenha, setConfirmSenha] = useState('');
  const [showSenha, setShowSenha] = useState(false);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro('');

    if (isRegister) {
      if (!nome.trim()) return setErro('Informe o seu nome completo.');
      if (!email.trim()) return setErro('Informe o seu e-mail.');
      if (!senha || senha.length < 6) return setErro('A senha deve conter no mínimo 6 caracteres.');
      if (senha !== confirmSenha) return setErro('As senhas não coincidem.');

      try {
        setLoading(true);
        const res = await apiUsers.register({ nome: nome.trim(), email: email.trim(), senha });
        onLoginSuccess(res.usuario);
      } catch (err) {
        setErro(err.message || 'Erro ao realizar cadastro.');
      } finally {
        setLoading(false);
      }
    } else {
      if (!email.trim()) return setErro('Informe o seu e-mail.');
      if (!senha) return setErro('Informe a sua senha.');

      try {
        setLoading(true);
        const res = await apiUsers.login({ email: email.trim(), senha });
        onLoginSuccess(res.usuario);
      } catch (err) {
        setErro(err.message || 'E-mail ou senha incorretos.');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden select-none">
      
      {/* THEME TOGGLE */}
      <div className="absolute top-5 right-5 z-20">
        <button
          onClick={onToggleTheme}
          className="p-2 rounded-xl glass-panel text-slate-600 dark:text-sky-300 hover:text-sky-500 transition-all shadow-md"
          title={isDark ? 'Tema Claro' : 'Tema Escuro'}
        >
          {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
      </div>

      {/* AUTH CARD */}
      <div className="relative z-10 w-full max-w-sm glass-panel rounded-2xl p-7 shadow-2xl border border-sky-400/30 frost-sheen animate-scale-up">
        
        {/* LOGO & HEADING */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-sky-500/20 border border-sky-400/50 flex items-center justify-center glow-cyan shadow-[0_0_20px_rgba(125,211,252,0.4)] mb-3">
            <Zap className="w-6 h-6 text-sky-600 dark:text-primary fill-current" />
          </div>
          <div className="flex items-center gap-1.5 justify-center">
            <h1 className="text-xl font-bold font-display tracking-tight text-slate-900 dark:text-white">
              TaskFlow
            </h1>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-sky-400/15 text-sky-700 dark:text-primary border border-sky-400/30">
              PRO
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-on-surface-variant mt-1 font-mono">
            {isRegister ? 'Criar novo acesso executivo' : 'Entre no seu Workspace Individual'}
          </p>
        </div>

        {/* SEGMENTED SWITCH */}
        <div className="grid grid-cols-2 p-1 rounded-xl bg-slate-200/80 dark:bg-[#0a1224]/80 border border-slate-300 dark:border-sky-400/15 mb-5 text-xs font-semibold">
          <button
            type="button"
            onClick={() => { setIsRegister(false); setErro(''); }}
            className={`py-1.5 rounded-lg transition-all ${
              !isRegister
                ? 'bg-sky-400 text-slate-950 shadow-[0_0_12px_rgba(125,211,252,0.4)] font-bold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
            }`}
          >
            Entrar
          </button>
          <button
            type="button"
            onClick={() => { setIsRegister(true); setErro(''); }}
            className={`py-1.5 rounded-lg transition-all ${
              isRegister
                ? 'bg-sky-400 text-slate-950 shadow-[0_0_12px_rgba(125,211,252,0.4)] font-bold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
            }`}
          >
            Criar conta
          </button>
        </div>

        {/* ERROR */}
        {erro && (
          <div className="mb-4 p-3 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs font-mono flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{erro}</span>
          </div>
        )}

        {/* FORM */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          
          {isRegister && (
            <div>
              <label className="block text-[11px] font-mono font-semibold mb-1 text-slate-600 dark:text-sky-200/80 uppercase tracking-wider">
                Nome completo
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 dark:text-sky-300/60 absolute left-3 top-2.5 pointer-events-none" />
                <input
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Ex: João Lucas"
                  className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-100 dark:bg-[#0e172a]/80 border border-slate-300 dark:border-sky-400/20 text-xs text-slate-900 dark:text-on-surface focus:outline-none focus:ring-1 focus:ring-sky-400/60 focus:border-sky-400 transition-all"
                  required
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-mono font-semibold mb-1 text-slate-600 dark:text-sky-200/80 uppercase tracking-wider">
              E-mail
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 dark:text-sky-300/60 absolute left-3 top-2.5 pointer-events-none" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nome@empresa.com"
                className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-100 dark:bg-[#0e172a]/80 border border-slate-300 dark:border-sky-400/20 text-xs text-slate-900 dark:text-on-surface focus:outline-none focus:ring-1 focus:ring-sky-400/60 focus:border-sky-400 transition-all"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-mono font-semibold mb-1 text-slate-600 dark:text-sky-200/80 uppercase tracking-wider">
              Senha
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 dark:text-sky-300/60 absolute left-3 top-2.5 pointer-events-none" />
              <input
                type={showSenha ? 'text' : 'password'}
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-9 py-2 rounded-lg bg-slate-100 dark:bg-[#0e172a]/80 border border-slate-300 dark:border-sky-400/20 text-xs text-slate-900 dark:text-on-surface focus:outline-none focus:ring-1 focus:ring-sky-400/60 focus:border-sky-400 transition-all font-mono"
                required
              />
              <button
                type="button"
                onClick={() => setShowSenha(!showSenha)}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-sky-300 transition-colors"
              >
                {showSenha ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {isRegister && (
            <div>
              <label className="block text-[11px] font-mono font-semibold mb-1 text-slate-600 dark:text-sky-200/80 uppercase tracking-wider">
                Confirmar Senha
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 dark:text-sky-300/60 absolute left-3 top-2.5 pointer-events-none" />
                <input
                  type={showSenha ? 'text' : 'password'}
                  value={confirmSenha}
                  onChange={(e) => setConfirmSenha(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-100 dark:bg-[#0e172a]/80 border border-slate-300 dark:border-sky-400/20 text-xs text-slate-900 dark:text-on-surface focus:outline-none focus:ring-1 focus:ring-sky-400/60 focus:border-sky-400 transition-all font-mono"
                  required
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-4 py-2.5 px-4 rounded-lg bg-sky-400 text-slate-950 font-bold text-xs tracking-wide shadow-[0_0_20px_rgba(125,211,252,0.45)] hover:bg-sky-300 hover:shadow-[0_0_28px_rgba(125,211,252,0.65)] transition-all active:scale-95 duration-150 disabled:opacity-50 flex items-center justify-center gap-1.5"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <span>{isRegister ? 'Criar minha conta' : 'Acessar Workspace'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

        </form>

      </div>

      <div className="relative z-10 mt-6 text-center text-xs text-slate-500 dark:text-on-surface-variant font-mono">
        TaskFlow Pro • Glacier Glassmorphism
      </div>

    </div>
  );
}
