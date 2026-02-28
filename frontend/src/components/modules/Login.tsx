// ============================================================
// PetroVision — Login Page (Industrial Themed)
// ============================================================

import { useState, useEffect, useRef, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, Eye, EyeOff, Shield } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

// ── Industrial SVG Background ──────────────────────────────
function IndustrialBackground() {
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', zIndex: 0 }}>
      {/* Animated gradient base */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse at 20% 80%, rgba(6,182,212,0.08) 0%, transparent 50%), radial-gradient(ellipse at 80% 20%, rgba(139,92,246,0.06) 0%, transparent 50%), radial-gradient(ellipse at 50% 50%, rgba(59,130,246,0.04) 0%, transparent 70%), var(--bg-primary, #07090f)',
      }} />

      {/* Grid overlay */}
      <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0, opacity: 0.08 }}>
        <defs>
          <pattern id="lgrid" width="60" height="60" patternUnits="userSpaceOnUse">
            <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#3b82f6" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#lgrid)" />
      </svg>

      {/* Industrial P&ID schematic background */}
      <svg viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid slice"
        width="100%" height="100%"
        style={{ position: 'absolute', inset: 0, opacity: 0.06 }}>

        {/* Reactor vessel */}
        <rect x={100} y={250} width={90} height={230} rx={12} fill="none" stroke="#06b6d4" strokeWidth={2} />
        <ellipse cx={145} cy={250} rx={45} ry={14} fill="none" stroke="#06b6d4" strokeWidth={2} />
        <ellipse cx={145} cy={480} rx={45} ry={14} fill="none" stroke="#06b6d4" strokeWidth={2} />
        {/* Catalyst bed lines */}
        {[290, 320, 350, 380, 410].map(y => (
          <line key={y} x1={115} y1={y} x2={175} y2={y} stroke="#06b6d4" strokeWidth={0.8} opacity={0.6} />
        ))}
        <text x={145} y={230} textAnchor="middle" fill="#06b6d4" fontSize={12} fontFamily="monospace" fontWeight={700}>R-101</text>

        {/* Column */}
        <rect x={350} y={140} width={55} height={350} rx={8} fill="none" stroke="#8b5cf6" strokeWidth={2} />
        <ellipse cx={377.5} cy={140} rx={27.5} ry={10} fill="none" stroke="#8b5cf6" strokeWidth={2} />
        <ellipse cx={377.5} cy={490} rx={27.5} ry={10} fill="none" stroke="#8b5cf6" strokeWidth={2} />
        {[180, 220, 260, 300, 340, 380, 420, 460].map(y => (
          <line key={y} x1={358} y1={y} x2={397} y2={y} stroke="#8b5cf6" strokeWidth={0.6} opacity={0.5} />
        ))}
        <text x={377} y={120} textAnchor="middle" fill="#8b5cf6" fontSize={12} fontFamily="monospace" fontWeight={700}>T-101</text>

        {/* Heat exchanger circles */}
        <circle cx={560} cy={350} r={40} fill="none" stroke="#f97316" strokeWidth={2} />
        <circle cx={560} cy={350} r={28} fill="none" stroke="#f97316" strokeWidth={1.5} />
        <line x1={536} y1={330} x2={584} y2={370} stroke="#f97316" strokeWidth={0.8} />
        <line x1={536} y1={340} x2={584} y2={380} stroke="#f97316" strokeWidth={0.8} />
        <line x1={536} y1={350} x2={584} y2={350} stroke="#f97316" strokeWidth={0.8} />
        <text x={560} y={300} textAnchor="middle" fill="#f97316" fontSize={12} fontFamily="monospace" fontWeight={700}>E-101</text>

        {/* Pump */}
        <circle cx={250} cy={560} r={22} fill="none" stroke="#22c55e" strokeWidth={2} />
        <line x1={250} y1={538} x2={250} y2={520} stroke="#22c55e" strokeWidth={2} />
        <line x1={239} y1={520} x2={261} y2={520} stroke="#22c55e" strokeWidth={2} />
        <text x={250} y={600} textAnchor="middle" fill="#22c55e" fontSize={12} fontFamily="monospace" fontWeight={700}>P-101</text>

        {/* Storage tank right side */}
        <rect x={750} y={280} width={80} height={160} rx={10} fill="none" stroke="#34d399" strokeWidth={2} />
        <ellipse cx={790} cy={280} rx={40} ry={12} fill="none" stroke="#34d399" strokeWidth={2} />
        <ellipse cx={790} cy={440} rx={40} ry={12} fill="none" stroke="#34d399" strokeWidth={2} />
        {/* Fill level */}
        <rect x={755} y={360} width={70} height={78} rx={4} fill="#34d399" opacity={0.06} />
        <text x={790} y={260} textAnchor="middle" fill="#34d399" fontSize={12} fontFamily="monospace" fontWeight={700}>TK-102</text>

        {/* Crystallizer */}
        <rect x={900} y={320} width={140} height={60} rx={6} fill="none" stroke="#0891b2" strokeWidth={2} />
        <rect x={892} y={312} width={156} height={76} rx={10} fill="none" stroke="#0891b2" strokeWidth={1} strokeDasharray="4 3" />
        {/* Crystals */}
        {[920, 950, 980, 1010].map((x, i) => (
          <polygon key={i} points={`${x},345 ${x+5},335 ${x+10},345 ${x+5},355`} fill="none" stroke="#0891b2" strokeWidth={0.8} opacity={0.5} />
        ))}
        <text x={970} y={305} textAnchor="middle" fill="#0891b2" fontSize={12} fontFamily="monospace" fontWeight={700}>CR-201</text>

        {/* Compressor */}
        <rect x={870} y={520} width={60} height={55} rx={4} fill="none" stroke="#eab308" strokeWidth={2} />
        {[0, 45, 90, 135].map(deg => (
          <line key={deg} x1={900} y1={547} x2={900 + 18 * Math.cos(deg * Math.PI / 180)} y2={547 + 18 * Math.sin(deg * Math.PI / 180)}
            stroke="#eab308" strokeWidth={1} opacity={0.6} />
        ))}
        <text x={900} y={510} textAnchor="middle" fill="#eab308" fontSize={11} fontFamily="monospace" fontWeight={700}>K-101</text>

        {/* Process lines */}
        <line x1={190} y1={365} x2={350} y2={365} stroke="#3b82f6" strokeWidth={1.5} />
        <line x1={405} y1={365} x2={520} y2={365} stroke="#3b82f6" strokeWidth={1.5} />
        <line x1={600} y1={350} x2={750} y2={350} stroke="#3b82f6" strokeWidth={1.5} />
        <line x1={145} y1={480} x2={145} y2={560} stroke="#3b82f6" strokeWidth={1.5} />
        <line x1={145} y1={560} x2={228} y2={560} stroke="#3b82f6" strokeWidth={1.5} />
        <line x1={830} y1={350} x2={900} y2={350} stroke="#3b82f6" strokeWidth={1.5} />
        <line x1={970} y1={380} x2={970} y2={520} stroke="#3b82f6" strokeWidth={1.2} strokeDasharray="6 3" />

        {/* Signal lines (dashed) */}
        <line x1={145} y1={300} x2={50} y2={300} stroke="#fbbf24" strokeWidth={0.8} strokeDasharray="3 2" />
        <line x1={377} y1={200} x2={430} y2={200} stroke="#fbbf24" strokeWidth={0.8} strokeDasharray="3 2" />
        <line x1={560} y1={310} x2={560} y2={260} stroke="#fbbf24" strokeWidth={0.8} strokeDasharray="3 2" />

        {/* Instrument bubbles */}
        <circle cx={40} cy={300} r={14} fill="none" stroke="#22c55e" strokeWidth={1.5} />
        <line x1={26} y1={300} x2={54} y2={300} stroke="#22c55e" strokeWidth={0.5} opacity={0.5} />
        <text x={40} y={297} textAnchor="middle" fill="#22c55e" fontSize={5.5} fontFamily="monospace">TIC</text>
        <text x={40} y={305} textAnchor="middle" fill="#22c55e" fontSize={5} fontFamily="monospace">101</text>

        <circle cx={440} cy={200} r={14} fill="none" stroke="#22c55e" strokeWidth={1.5} />
        <line x1={426} y1={200} x2={454} y2={200} stroke="#22c55e" strokeWidth={0.5} opacity={0.5} />
        <text x={440} y={197} textAnchor="middle" fill="#22c55e" fontSize={5.5} fontFamily="monospace">PIC</text>
        <text x={440} y={205} textAnchor="middle" fill="#22c55e" fontSize={5} fontFamily="monospace">102</text>

        <circle cx={560} cy={250} r={14} fill="none" stroke="#22c55e" strokeWidth={1.5} />
        <line x1={546} y1={250} x2={574} y2={250} stroke="#22c55e" strokeWidth={0.5} opacity={0.5} />
        <text x={560} y={247} textAnchor="middle" fill="#22c55e" fontSize={5.5} fontFamily="monospace">FIC</text>
        <text x={560} y={255} textAnchor="middle" fill="#22c55e" fontSize={5} fontFamily="monospace">103</text>

        {/* Control valve (bowtie) */}
        <polygon points="270,355 290,345 290,365" fill="none" stroke="#3b82f6" strokeWidth={1.2} />
        <polygon points="310,355 290,345 290,365" fill="none" stroke="#3b82f6" strokeWidth={1.2} />
        <circle cx={290} cy={335} r={5} fill="none" stroke="#3b82f6" strokeWidth={1} />
        <line x1={290} y1={340} x2={290} y2={345} stroke="#3b82f6" strokeWidth={0.8} />

        {/* Arrows on process lines */}
        <polygon points="340,360 340,370 350,365" fill="#3b82f6" opacity={0.7} />
        <polygon points="510,360 510,370 520,365" fill="#3b82f6" opacity={0.7} />
        <polygon points="740,345 740,355 750,350" fill="#3b82f6" opacity={0.7} />

        {/* Chemical formula decorations */}
        <text x={100} y={680} fill="#06b6d4" fontSize={14} fontFamily="monospace" opacity={0.4}>
          C₄H₁₀ + 3.5 O₂ → C₄H₂O₃ + 4 H₂O
        </text>
        <text x={650} y={680} fill="#8b5cf6" fontSize={14} fontFamily="monospace" opacity={0.4}>
          CaC₄H₄O₆ + H₂SO₄ → C₄H₆O₆ + CaSO₄
        </text>
        <text x={100} y={710} fill="#3b82f6" fontSize={10} fontFamily="monospace" opacity={0.25}>
          ISA 5.1 | ISA 101 | IEC 61131 | ANSI/ISA-88
        </text>
      </svg>

      {/* Floating particles */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
        {Array.from({ length: 20 }).map((_, i) => (
          <div key={i} style={{
            position: 'absolute',
            width: 2 + (i % 3),
            height: 2 + (i % 3),
            borderRadius: '50%',
            background: ['#06b6d4', '#8b5cf6', '#3b82f6', '#22c55e', '#f97316'][i % 5],
            opacity: 0.15 + (i % 5) * 0.04,
            left: `${(i * 5.3) % 100}%`,
            top: `${(i * 7.1 + 10) % 100}%`,
            animation: `floatParticle ${8 + i * 1.5}s ease-in-out infinite ${i * 0.7}s`,
          }} />
        ))}
      </div>

      {/* Vignette overlay */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse at center, transparent 40%, rgba(7,9,15,0.7) 100%)',
      }} />
    </div>
  );
}


// ── Animated flow dots for login card border ───────────────
function FlowBorder() {
  return (
    <svg style={{ position: 'absolute', inset: -1, width: 'calc(100% + 2px)', height: 'calc(100% + 2px)', pointerEvents: 'none' }}>
      <defs>
        <linearGradient id="loginGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor="#06b6d4" stopOpacity={0.5} />
          <stop offset="50%"  stopColor="#8b5cf6" stopOpacity={0.5} />
          <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.5} />
        </linearGradient>
      </defs>
      <rect x={0.5} y={0.5} width="calc(100% - 1px)" height="calc(100% - 1px)" rx={16} ry={16}
        fill="none" stroke="url(#loginGrad)" strokeWidth={1}
        strokeDasharray="8 12" strokeDashoffset={0}>
        <animate attributeName="stroke-dashoffset" from="0" to="-40" dur="3s" repeatCount="indefinite" />
      </rect>
    </svg>
  );
}


export default function Login() {
  const navigate = useNavigate();
  const { login, isLoading, error, clearError } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await login(username, password);
      navigate('/', { replace: true });
    } catch {
      // error is set in store
    }
  };

  return (
    <div
      style={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <IndustrialBackground />

      {/* Login Card */}
      <div
        style={{
          width: 400,
          background: 'rgba(14, 20, 35, 0.85)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 16,
          padding: '2.5rem 2rem',
          boxShadow: '0 25px 80px rgba(0,0,0,0.5), 0 0 40px rgba(6,182,212,0.05)',
          position: 'relative',
          zIndex: 1,
          animation: 'loginAppear 0.6s cubic-bezier(0.4,0,0.2,1)',
        }}
      >
        <FlowBorder />

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 56, height: 56, borderRadius: 14,
            background: 'linear-gradient(135deg, rgba(6,182,212,0.15), rgba(139,92,246,0.1))',
            border: '1px solid rgba(6,182,212,0.2)',
            marginBottom: 12,
            boxShadow: '0 0 30px rgba(6,182,212,0.1)',
          }}>
            <Activity size={28} color="#06b6d4" />
          </div>
          <div>
            <span style={{
              fontSize: '1.6rem', fontWeight: 700,
              background: 'linear-gradient(135deg, #06b6d4, #8b5cf6)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              letterSpacing: '-0.02em',
            }}>
              PetroVision
            </span>
          </div>
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>
            Sistema RTIC — Control Industrial en Tiempo Real
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {error && (
            <div
              style={{
                background: 'rgba(239,68,68,0.08)',
                border: '1px solid rgba(239,68,68,0.25)',
                borderRadius: 10,
                color: '#f87171',
                padding: '0.5rem 0.75rem',
                fontSize: '0.8rem',
                marginBottom: '1rem',
                display: 'flex', alignItems: 'center', gap: 6,
                cursor: 'pointer',
              }}
              onClick={clearError}
            >
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#ef4444', flexShrink: 0 }} />
              {error}
            </div>
          )}

          <div style={{ marginBottom: '1rem' }}>
            <label className="text-xs" style={{
              display: 'block', marginBottom: 6, color: 'rgba(255,255,255,0.4)',
              textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: '0.65rem', fontWeight: 600,
            }}>
              Usuario
            </label>
            <input
              className="input"
              type="text"
              placeholder="Ej: operador1"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoFocus
              required
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 10,
                transition: 'border-color 0.3s, box-shadow 0.3s',
              }}
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label className="text-xs" style={{
              display: 'block', marginBottom: 6, color: 'rgba(255,255,255,0.4)',
              textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: '0.65rem', fontWeight: 600,
            }}>
              Contraseña
            </label>
            <div style={{ position: 'relative' }}>
              <input
                className="input"
                type={showPwd ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 10,
                  transition: 'border-color 0.3s, box-shadow 0.3s',
                }}
              />
              <button
                type="button"
                onClick={() => setShowPwd(!showPwd)}
                style={{
                  position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)',
                  padding: 4, display: 'flex', cursor: 'pointer',
                  transition: 'color 0.2s',
                }}
              >
                {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            style={{
              width: '100%', padding: '0.7rem', fontWeight: 600,
              fontSize: '0.85rem',
              background: 'linear-gradient(135deg, #06b6d4, #3b82f6)',
              color: '#fff', border: 'none', borderRadius: 10,
              cursor: isLoading ? 'wait' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              transition: 'transform 0.2s, box-shadow 0.2s',
              boxShadow: '0 4px 20px rgba(6,182,212,0.25)',
              opacity: isLoading ? 0.7 : 1,
            }}
            onMouseEnter={(e) => { if (!isLoading) { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 30px rgba(6,182,212,0.35)'; }}}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(6,182,212,0.25)'; }}
          >
            <Shield size={16} />
            {isLoading ? 'Ingresando...' : 'Ingresar al Sistema'}
          </button>
        </form>

        {/* Demo credentials */}
        <div
          style={{
            marginTop: '1.5rem',
            padding: '0.75rem 1rem',
            background: 'rgba(59,130,246,0.04)',
            border: '1px solid rgba(59,130,246,0.12)',
            borderRadius: 10,
          }}
        >
          <div className="text-xs" style={{ color: '#60a5fa', fontWeight: 600, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 5 }}>
            <Shield size={11} />
            Credenciales de demo
          </div>
          <div className="mono text-xs" style={{ color: 'rgba(255,255,255,0.35)', lineHeight: 1.8 }}>
            <span style={{ color: '#06b6d4' }}>admin</span> / admin2026<br />
            <span style={{ color: '#06b6d4' }}>operador1</span> / operador2026<br />
            <span style={{ color: '#06b6d4' }}>ing_quimico</span> / ingeniero2026
          </div>
        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center', marginTop: '1.25rem' }}>
          <p style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.2)', fontFamily: 'monospace' }}>
            PetroVision RTIC v1.0 · Tesis 2026 · ISA 5.1 / ISA 101
          </p>
        </div>
      </div>
    </div>
  );
}
