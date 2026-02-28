// ============================================================
// PetroVision — Main Layout (Header + Sidebar + Content)
// Mobile-responsive: overlay drawer, swipe gestures, PWA-ready
// ============================================================

import { useState, useEffect, useCallback, useRef } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Cpu, Gauge, AlertTriangle, TrendingUp,
  Package, Brain, SlidersHorizontal, Shield, LogOut, Menu,
  Bell, Wifi, WifiOff, ChevronLeft, Activity, FlaskConical, GitBranchPlus, Zap, BookOpen, X, BellRing,
  BarChart3, FileText,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useProcess } from '@/hooks/useProcess';
import { useWebSocket } from '@/hooks/useWebSocket';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { processAPI, instrumentAPI, alarmAPI } from '@/services/api';
import api from '@/services/api';
import type { LiveDataMessage, LiveReading } from '@/types';

const NAV_ITEMS = [
  { to: '/',            icon: LayoutDashboard, label: 'Overview' },
  { to: '/process',     icon: FlaskConical,    label: 'Procesos' },
  { to: '/pfd',          icon: GitBranchPlus,   label: 'Diagrama PFD' },
  { to: '/simulator',    icon: Zap,             label: 'Simulador' },
  { to: '/docs',         icon: BookOpen,        label: 'Documentación' },
  { to: '/digital-twin', icon: Cpu,             label: 'Digital Twin' },
  { to: '/instruments', icon: Gauge,           label: 'Instrumentos' },
  { to: '/alarms',      icon: AlertTriangle,   label: 'Alarmas' },
  { to: '/trends',      icon: TrendingUp,      label: 'Tendencias' },
  { to: '/batches',     icon: Package,         label: 'Lotes' },
  { to: '/ml',          icon: Brain,           label: 'ML / IA' },
  { to: '/pid',         icon: SlidersHorizontal, label: 'PID Tuning' },
  { to: '/audit',       icon: Shield,          label: 'Auditoría' },
  { to: '/spc',         icon: BarChart3,       label: 'SPC' },
  { to: '/reports',     icon: FileText,        label: 'Reportes' },
];

const MOBILE_BREAKPOINT = 768;

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= MOBILE_BREAKPOINT);
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= MOBILE_BREAKPOINT);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return isMobile;
}

export default function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const isMobile = useIsMobile();
  const {
    setProcesses, setInstruments, setActiveAlarms,
    updateBulkReadings, addAlarm, activeAlarms, alarmCount,
  } = useProcess();

  const [collapsed, setCollapsed] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [now, setNow] = useState(new Date());

  // Push notifications
  const { isSupported: pushSupported, isSubscribed: pushSubscribed, subscribe: pushSubscribe, unsubscribe: pushUnsubscribe, isLoading: pushLoading } = usePushNotifications();

  // Touch/swipe state for drawer gesture
  const touchStartX = useRef(0);
  const touchCurrentX = useRef(0);
  const sidebarRef = useRef<HTMLElement>(null);

  // Close sidebar on route change (mobile)
  useEffect(() => {
    if (isMobile) setSidebarOpen(false);
  }, [location.pathname, isMobile]);

  // Prevent body scroll when sidebar open on mobile
  useEffect(() => {
    if (isMobile && sidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isMobile, sidebarOpen]);

  // Clock
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Initial data fetch
  useEffect(() => {
    (async () => {
      try {
        const [procRes, instrRes, alarmRes] = await Promise.all([
          processAPI.list(),
          instrumentAPI.list(),
          alarmAPI.active(),
        ]);
        setProcesses(procRes.data);
        setInstruments(instrRes.data);
        setActiveAlarms(alarmRes.data);

        try {
          const liveRes = await api.get('/instruments/live');
          const bulk: Record<string, any> = {};
          Object.entries(liveRes.data).forEach(([tag, reading]: [string, any]) => {
            bulk[tag] = reading;
          });
          if (Object.keys(bulk).length > 0) updateBulkReadings(bulk);
        } catch { /* sim may not have started yet */ }

      } catch (err) {
        console.error('Failed to fetch initial data:', err);
      }
    })();
  }, []);

  // WebSocket — live sensor data
  const handleLiveData = useCallback((msg: LiveDataMessage) => {
    if (msg.channel === 'live-data' && msg.data) {
      const bulk: Record<string, LiveReading> = {};
      if (Array.isArray(msg.data)) {
        msg.data.forEach((r: any) => {
          if (r.tag) bulk[r.tag] = r;
        });
      }
      if (Object.keys(bulk).length > 0) updateBulkReadings(bulk);
    }
  }, [updateBulkReadings]);

  const { isConnected } = useWebSocket({
    channel: 'live-data',
    onMessage: handleLiveData,
  });

  // WebSocket — alarms channel
  useWebSocket({
    channel: 'alarms',
    onMessage: useCallback((msg: LiveDataMessage) => {
      if (msg.data) addAlarm(msg.data as any);
    }, [addAlarm]),
  });

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // ── Swipe gestures (mobile) ─────────────────────────────
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchCurrentX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchCurrentX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    const delta = touchCurrentX.current - touchStartX.current;
    // Swipe right from left edge to open
    if (!sidebarOpen && touchStartX.current < 30 && delta > 60) {
      setSidebarOpen(true);
    }
    // Swipe left to close
    if (sidebarOpen && delta < -60) {
      setSidebarOpen(false);
    }
  };

  const toggleSidebar = () => {
    if (isMobile) {
      setSidebarOpen(!sidebarOpen);
    } else {
      setCollapsed(!collapsed);
    }
  };

  // ── Render ──────────────────────────────────────────────
  return (
    <div
      style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}
      onTouchStart={isMobile ? handleTouchStart : undefined}
      onTouchMove={isMobile ? handleTouchMove : undefined}
      onTouchEnd={isMobile ? handleTouchEnd : undefined}
    >
      {/* Mobile Backdrop */}
      {isMobile && (
        <div
          className={`sidebar-backdrop ${sidebarOpen ? 'visible' : ''}`}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        ref={sidebarRef}
        className={isMobile ? `mobile-sidebar ${sidebarOpen ? 'open' : ''}` : ''}
        style={{
          width: isMobile ? 280 : collapsed ? 'var(--sidebar-collapsed)' : 'var(--sidebar-width)',
          background: 'var(--bg-secondary)',
          borderRight: '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          transition: isMobile ? undefined : 'width 0.2s',
          flexShrink: 0,
          overflow: 'hidden',
        }}
      >
        {/* Logo Area */}
        <div
          style={{
            height: 'var(--header-height)',
            display: 'flex',
            alignItems: 'center',
            padding: '0 12px',
            gap: 10,
            borderBottom: '1px solid var(--border-color)',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Activity size={24} color="var(--accent-cyan)" />
            {(!collapsed || isMobile) && (
              <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--accent-cyan)' }}>
                PetroVision
              </span>
            )}
          </div>
          {isMobile && (
            <button
              onClick={() => setSidebarOpen(false)}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', padding: 4 }}
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* Nav Links */}
        <nav style={{ flex: 1, padding: '8px 0', overflowY: 'auto' }}>
          {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: isMobile ? '14px 16px' : '10px 16px',
                margin: '2px 8px',
                borderRadius: 'var(--radius-md)',
                color: isActive ? 'var(--accent-blue)' : 'var(--text-secondary)',
                background: isActive ? 'rgba(59,130,246,0.1)' : 'transparent',
                textDecoration: 'none',
                fontSize: '0.875rem',
                fontWeight: isActive ? 600 : 400,
                transition: 'all 0.15s',
                whiteSpace: 'nowrap',
              })}
            >
              <Icon size={18} />
              {(!collapsed || isMobile) && label}
            </NavLink>
          ))}
        </nav>

        {/* Collapse Toggle (desktop only) */}
        {!isMobile && (
          <button
            onClick={() => setCollapsed(!collapsed)}
            style={{
              padding: '12px',
              background: 'none',
              border: 'none',
              borderTop: '1px solid var(--border-color)',
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ChevronLeft
              size={18}
              style={{
                transform: collapsed ? 'rotate(180deg)' : 'none',
                transition: 'transform 0.2s',
              }}
            />
          </button>
        )}
      </aside>

      {/* Main content area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        {/* Header */}
        <header
          style={{
            height: 'var(--header-height)',
            background: 'var(--bg-secondary)',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: isMobile ? '0 10px' : '0 20px',
            flexShrink: 0,
          }}
        >
          <div className="mobile-header-left" style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 8 : 16 }}>
            <button
              onClick={toggleSidebar}
              className="btn-icon"
              style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', padding: 4, minHeight: 'auto', minWidth: 'auto' }}
            >
              <Menu size={20} />
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {isConnected ? (
                <Wifi size={14} color="var(--accent-green)" />
              ) : (
                <WifiOff size={14} color="var(--accent-red)" />
              )}
              <span className="text-xs text-muted">
                {isConnected ? 'ONLINE' : 'OFFLINE'}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 10 : 20 }}>
            {/* Clock — hide on small screens */}
            {!isMobile && (
              <span className="mono text-sm header-clock" style={{ color: 'var(--text-muted)' }}>
                {now.toLocaleDateString('es-AR')} {now.toLocaleTimeString('es-AR')}
              </span>
            )}

            {/* Push notification toggle */}
            {pushSupported && (
              <button
                onClick={() => pushSubscribed ? pushUnsubscribe() : pushSubscribe()}
                disabled={pushLoading}
                style={{
                  background: 'none',
                  border: 'none',
                  color: pushSubscribed ? 'var(--accent-green)' : 'var(--text-muted)',
                  padding: 4,
                  display: 'flex',
                  alignItems: 'center',
                  minHeight: 'auto',
                  minWidth: 'auto',
                  opacity: pushLoading ? 0.5 : 1,
                  position: 'relative',
                }}
                title={pushSubscribed ? 'Notificaciones push activas — click para desactivar' : 'Activar notificaciones push para alarmas críticas'}
              >
                <BellRing size={16} />
                {pushSubscribed && (
                  <span style={{
                    position: 'absolute', top: -2, right: -2,
                    width: 6, height: 6, borderRadius: '50%',
                    background: 'var(--accent-green)',
                    boxShadow: '0 0 4px var(--accent-green)',
                  }} />
                )}
              </button>
            )}

            {/* Alarm counter */}
            <NavLink to="/alarms" style={{ position: 'relative', display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
              <Bell size={18} color={alarmCount > 0 ? 'var(--accent-yellow)' : 'var(--text-muted)'} />
              {alarmCount > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: -6,
                    right: -8,
                    background: 'var(--accent-red)',
                    color: 'white',
                    fontSize: '0.6rem',
                    fontWeight: 700,
                    borderRadius: '9999px',
                    padding: '1px 5px',
                    minWidth: 16,
                    textAlign: 'center',
                  }}
                >
                  {alarmCount}
                </span>
              )}
            </NavLink>

            {/* User info — compact on mobile */}
            {!isMobile && (
              <div className="header-user-info" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    background: 'var(--gradient-blue)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    color: 'white',
                  }}
                >
                  {user?.full_name?.charAt(0) || user?.username?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <div style={{ lineHeight: 1.2 }}>
                  <div className="text-sm">{user?.full_name || user?.username}</div>
                  <div className="text-xs text-muted">{user?.role?.replace('_', ' ')}</div>
                </div>
              </div>
            )}

            {/* Mobile: just show user avatar */}
            {isMobile && (
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  background: 'var(--gradient-blue)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  color: 'white',
                  flexShrink: 0,
                }}
              >
                {user?.full_name?.charAt(0) || user?.username?.charAt(0)?.toUpperCase() || 'U'}
              </div>
            )}

            <button
              onClick={handleLogout}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                padding: 4,
                display: 'flex',
                minHeight: 'auto',
                minWidth: 'auto',
              }}
              title="Cerrar sesión"
            >
              <LogOut size={18} />
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main
          className={isMobile ? 'mobile-content' : ''}
          style={{
            flex: 1,
            overflow: 'auto',
            padding: isMobile ? '12px' : '20px',
            background: 'var(--bg-primary)',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          <Outlet />
        </main>

        {/* Alarm Strip */}
        <div className="alarm-strip">
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', flexShrink: 0 }}>
            <AlertTriangle size={12} />
            {!isMobile && (
              <span style={{ fontWeight: 600, textTransform: 'uppercase' }}>Alarmas</span>
            )}
          </div>
          {activeAlarms.length === 0 ? (
            <span style={{ color: 'var(--accent-green)', whiteSpace: 'nowrap' }}>
              {isMobile ? 'OK' : 'Sin alarmas activas'}
            </span>
          ) : (
            activeAlarms.slice(0, isMobile ? 2 : 5).map((a, i) => (
              <div key={a.id || i} className="alarm-item">
                <span
                  className="led"
                  style={{
                    background:
                      a.priority === 'CRITICA' || a.priority === 'ALTA'
                        ? 'var(--accent-red)'
                        : a.priority === 'MEDIA'
                        ? 'var(--accent-yellow)'
                        : 'var(--accent-blue)',
                    boxShadow: `0 0 6px ${
                      a.priority === 'CRITICA' || a.priority === 'ALTA'
                        ? 'var(--accent-red)'
                        : a.priority === 'MEDIA'
                        ? 'var(--accent-yellow)'
                        : 'var(--accent-blue)'
                    }`,
                  }}
                />
                <span className="mono">{a.instrument_tag}</span>
                {!isMobile && (
                  <>
                    <span className="text-muted">—</span>
                    <span>{a.message || a.alarm_type}</span>
                  </>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
