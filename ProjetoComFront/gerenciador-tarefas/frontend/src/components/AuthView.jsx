import React, { useState } from 'react';
import { 
  Eye, 
  EyeOff, 
  Loader2, 
  AlertCircle,
  Sun,
  Moon,
  ArrowRight,
  Zap
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

  const activeTabStyle = {
    background: 'linear-gradient(135deg, rgba(232,244,0,0.15), rgba(147,51,234,0.2))',
    color: '#ca8a04',
    border: '1px solid rgba(232,244,0,0.3)',
  };
  const activeDarkTabStyle = {
    background: 'linear-gradient(135deg, rgba(232,244,0,0.15), rgba(147,51,234,0.2))',
    color: '#e8f400',
    border: '1px solid rgba(232,244,0,0.3)',
  };
  const activeTab = isDark ? activeDarkTabStyle : activeTabStyle;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden"
         style={{ background: 'var(--bg-canvas)' }}>

      {/* BACKGROUND LAYERS */}
      <div className="hero-glow" />
      <div className="bg-grid-pattern absolute inset-0" />
      <div className="scan-overlay" />

      {/* DECORATIVE ORBS */}
      <div className="absolute top-20 left-10 w-64 h-64 rounded-full blur-3xl pointer-events-none"
           style={{
             background: 'radial-gradient(circle, rgba(147,51,234,0.25), transparent)',
             animation: 'float 3s ease-in-out infinite',
           }} />
      <div className="absolute bottom-20 right-10 w-48 h-48 rounded-full blur-3xl pointer-events-none"
           style={{
             background: 'radial-gradient(circle, rgba(232,244,0,0.15), transparent)',
             animation: 'float 3s ease-in-out 1.5s infinite',
           }} />

      {/* THEME TOGGLE */}
      <div className="absolute top-4 right-4 z-10">
        <button
          onClick={onToggleTheme}
          className="p-2 rounded-lg transition-all"
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-color)',
            color: 'var(--text-secondary)',
          }}
          title={isDark ? 'Tema Claro' : 'Tema Escuro'}
        >
          {isDark ? <Sun className="w-4 h-4" style={{ color: '#e8f400' }} /> : <Moon className="w-4 h-4" />}
        </button>
      </div>

      {/* AUTH CARD */}
      <div className="relative z-10 w-full max-w-[380px]"
           style={{
             background: 'var(--modal-bg)',
             border: '1px solid var(--border-color)',
             borderRadius: '1.25rem',
             padding: '2rem 1.75rem',
             boxShadow: 'var(--modal-shadow)',
             animation: 'scaleUp 0.22s cubic-bezier(0.16,1,0.3,1)',
           }}>

        {/* TOP ACCENT LINE */}
        <div className="absolute top-0 left-8 right-8 h-[2px] rounded-full"
             style={{ background: 'linear-gradient(90deg, transparent, #9333ea, #e8f400, transparent)' }} />

        {/* LOGO & HEADING */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="relative w-12 h-12 rounded-xl mb-3 flex items-center justify-center"
               style={{
                 background: 'linear-gradient(135deg, #e8f400 0%, #9333ea 100%)',
                 boxShadow: '0 0 20px rgba(232,244,0,0.35)',
                 animation: 'glowPulse 2.4s ease-in-out infinite',
               }}>
            <Zap className="w-5 h-5 text-black" strokeWidth={2.5} />
          </div>

          <h1 className="text-xl font-black" style={{ color: 'var(--text-primary)', letterSpacing: '-0.03em' }}>
            {isRegister ? 'Criar nova conta' : 'Entrar no TaskFlow'}
          </h1>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
            {isRegister ? 'Configure seu espaço de trabalho' : 'Acesse suas tarefas e projetos'}
          </p>
        </div>

        {/* SEGMENTED SWITCH */}
        <div className="grid grid-cols-2 p-0.5 rounded-lg mb-5"
             style={{ background: 'var(--bg-canvas)', border: '1px solid var(--border-color)' }}>
          <button
            type="button"
            onClick={() => { setIsRegister(false); setErro(''); }}
            className="py-1.5 text-xs font-bold rounded-md transition-all"
            style={!isRegister ? activeTab : { color: 'var(--text-muted)' }}
          >
            Entrar
          </button>
          <button
            type="button"
            onClick={() => { setIsRegister(true); setErro(''); }}
            className="py-1.5 text-xs font-bold rounded-md transition-all"
            style={isRegister ? activeTab : { color: 'var(--text-muted)' }}
          >
            Criar conta
          </button>
        </div>

        {/* ERROR */}
        {erro && (
          <div className="mb-4 p-2.5 rounded-lg flex items-center gap-2 text-xs"
               style={{ background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.25)', color: '#dc2626' }}>
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{erro}</span>
          </div>
        )}

        {/* FORM */}
        <form onSubmit={handleSubmit} className="space-y-3">
          
          {isRegister && (
            <div>
              <label className="block text-[11px] font-black mb-1 tracking-wide uppercase"
                     style={{ color: 'var(--text-muted)' }}>
                Nome completo
              </label>
              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: Carlos Silva"
                className="w-full px-3 py-2 rounded-lg layer-input"
                required
              />
            </div>
          )}

          <div>
            <label className="block text-[11px] font-black mb-1 tracking-wide uppercase"
                   style={{ color: 'var(--text-muted)' }}>
              E-mail
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nome@exemplo.com"
              className="w-full px-3 py-2 rounded-lg layer-input"
              required
            />
          </div>

          <div>
            <label className="block text-[11px] font-black mb-1 tracking-wide uppercase"
                   style={{ color: 'var(--text-muted)' }}>
              Senha
            </label>
            <div className="relative">
              <input
                type={showSenha ? 'text' : 'password'}
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 pr-9 rounded-lg layer-input"
                required
              />
              <button
                type="button"
                onClick={() => setShowSenha(!showSenha)}
                className="absolute inset-y-0 right-0 pr-2.5 flex items-center transition-all"
                style={{ color: 'var(--text-muted)' }}
              >
                {showSenha ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {isRegister && (
            <div>
              <label className="block text-[11px] font-black mb-1 tracking-wide uppercase"
                     style={{ color: 'var(--text-muted)' }}>
                Confirmação de senha
              </label>
              <input
                type={showSenha ? 'text' : 'password'}
                value={confirmSenha}
                onChange={(e) => setConfirmSenha(e.target.value)}
                placeholder="Repita a senha"
                className="w-full px-3 py-2 rounded-lg layer-input"
                required
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-neon w-full mt-3 py-2.5 px-4 rounded-lg text-xs flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <>
                <span>{isRegister ? 'Criar minha conta' : 'Acessar'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>

      </div>

      <div className="relative z-10 mt-8 text-center text-[11px]"
           style={{ color: 'var(--text-muted)' }}>
        TaskFlow • Produtividade sem limites
      </div>

    </div>
  );
}
