import React from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { useAppStore } from '../../../shared/store';
import {
  LayoutDashboard, Ship, GitCompare, Landmark, Users, BarChart3,
  Sun, Moon, Sparkles, ChevronLeft, ChevronRight, Waves,
} from 'lucide-react';
import { cn } from '../../../shared/utils';
import InsightsPanel from '../components/InsightsPanel';

const NAV_ITEMS = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/routes', label: 'Routes', icon: Ship },
  { path: '/compare', label: 'Compare', icon: GitCompare },
  { path: '/banking', label: 'Banking', icon: Landmark },
  { path: '/pooling', label: 'Pooling', icon: Users },
  { path: '/analytics', label: 'Analytics', icon: BarChart3 },
];

export default function AppLayout() {
  const { theme, toggleTheme, sidebarCollapsed, toggleSidebar, insightsPanelOpen, toggleInsights } = useAppStore();
  const location = useLocation();

  return (
    <div className={cn(
      'flex h-screen overflow-hidden font-body',
      theme === 'dark' ? 'bg-mesh text-white' : 'bg-mesh-light text-ocean-800'
    )}>
      {/* Noise overlay */}
      <div className="noise-overlay pointer-events-none fixed inset-0 z-50" />

      {/* Sidebar */}
      <aside className={cn(
        'relative z-40 flex flex-col border-r transition-all duration-300',
        theme === 'dark' ? 'border-white/[0.06] bg-black/20' : 'border-ocean-100/20 bg-white/60',
        sidebarCollapsed ? 'w-[72px]' : 'w-[240px]'
      )}>
        {/* Logo */}
        <div className="flex h-16 items-center gap-3 px-5">
          <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sea-400 to-ocean-500">
            <Waves className="h-5 w-5 text-white" />
            <div className="absolute -inset-1 -z-10 rounded-xl bg-sea-400/20 blur-lg" />
          </div>
          {!sidebarCollapsed && (
            <div className="animate-fade-in">
              <div className="text-sm font-bold tracking-tight">Meridian</div>
              <div className={cn('text-[10px] font-medium uppercase tracking-widest', theme === 'dark' ? 'text-sea-400/60' : 'text-sea-600/60')}>
                FuelEU Maritime
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="mt-4 flex-1 space-y-1 px-3">
          {NAV_ITEMS.map(({ path, label, icon: Icon }) => {
            const active = location.pathname === path;
            return (
              <NavLink
                key={path}
                to={path}
                className={cn(
                  'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
                  active
                    ? theme === 'dark'
                      ? 'bg-sea-400/10 text-sea-400'
                      : 'bg-sea-400/10 text-sea-600'
                    : theme === 'dark'
                    ? 'text-white/40 hover:bg-white/[0.04] hover:text-white/70'
                    : 'text-ocean-400 hover:bg-ocean-50 hover:text-ocean-700'
                )}
              >
                {active && (
                  <div className="absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-r-full bg-sea-400" />
                )}
                <Icon className={cn('h-[18px] w-[18px] shrink-0', active && 'drop-shadow-[0_0_8px_rgba(46,196,182,0.5)]')} />
                {!sidebarCollapsed && <span>{label}</span>}
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom actions */}
        <div className="space-y-1 border-t border-white/[0.06] p-3">
          {/* Insights toggle */}
          <button onClick={toggleInsights} className={cn(
            'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
            insightsPanelOpen
              ? 'bg-amber-400/10 text-amber-400'
              : theme === 'dark' ? 'text-white/40 hover:bg-white/[0.04] hover:text-white/70' : 'text-ocean-400 hover:bg-ocean-50'
          )}>
            <Sparkles className="h-[18px] w-[18px] shrink-0" />
            {!sidebarCollapsed && <span>Insights AI</span>}
          </button>

          {/* Theme toggle */}
          <button onClick={toggleTheme} className={cn(
            'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
            theme === 'dark' ? 'text-white/40 hover:bg-white/[0.04] hover:text-white/70' : 'text-ocean-400 hover:bg-ocean-50'
          )}>
            {theme === 'dark' ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
            {!sidebarCollapsed && <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>}
          </button>

          {/* Collapse toggle */}
          <button onClick={toggleSidebar} className={cn(
            'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
            theme === 'dark' ? 'text-white/40 hover:bg-white/[0.04]' : 'text-ocean-400 hover:bg-ocean-50'
          )}>
            {sidebarCollapsed ? <ChevronRight className="h-[18px] w-[18px]" /> : <ChevronLeft className="h-[18px] w-[18px]" />}
            {!sidebarCollapsed && <span>Collapse</span>}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-7xl p-6 lg:p-8">
          <Outlet />
        </div>
      </main>

      {/* Insights Panel Overlay */}
      {insightsPanelOpen && <InsightsPanel />}
    </div>
  );
}
