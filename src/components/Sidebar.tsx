import React from 'react';
import { useApp } from '../context/AppContext';
import { 
  LayoutDashboard, 
  Workflow as WorkflowIcon, 
  PlaySquare, 
  Activity, 
  Building2, 
  KeyRound, 
  Settings, 
  Cpu,
  LogOut,
  Sparkles
} from 'lucide-react';
import { ScreenId } from '../types';

export const Sidebar: React.FC = () => {
  const { currentScreen, setCurrentScreen, currentTenant, logout } = useApp();

  const navItems: { id: ScreenId; label: string; icon: React.ComponentType<{ className?: string }>; badge?: string }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'workflows', label: 'Workflows', icon: WorkflowIcon, badge: '12' },
    { id: 'execution-history', label: 'Executions', icon: PlaySquare, badge: '3 live' },
    { id: 'monitoring', label: 'Monitoring', icon: Activity },
    { id: 'tenants', label: 'Tenants', icon: Building2 },
    { id: 'api-keys', label: 'API Keys', icon: KeyRound },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 text-slate-300 flex flex-col flex-shrink-0 select-none">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-blue-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 ring-1 ring-white/20">
          <Cpu className="w-5 h-5 text-white animate-pulse" />
        </div>
        <div>
          <h1 className="font-bold text-white text-base tracking-tight flex items-center gap-1.5">
            Workflow
            <span className="text-indigo-400 font-semibold">Orchestrator</span>
          </h1>
          <p className="text-[11px] text-slate-400 font-medium">Distributed Saga Engine</p>
        </div>
      </div>

      {/* Nav Menu */}
      <nav className="p-3 space-y-1 flex-1 overflow-y-auto">
        <div className="px-3 py-2 text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
          Main Navigation
        </div>
        {navItems.map((item) => {
          // If we are on builder, create-workflow, or live execution, highlight relevant tab
          const isSelected = 
            currentScreen === item.id ||
            (item.id === 'workflows' && (currentScreen === 'builder' || currentScreen === 'create-workflow')) ||
            (item.id === 'execution-history' && (currentScreen === 'execution-live' || currentScreen === 'failure-dlq'));

          const Icon = item.icon;

          return (
            <button
              key={item.id}
              onClick={() => setCurrentScreen(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isSelected
                  ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                    isSelected
                      ? 'bg-indigo-700/60 text-white'
                      : item.badge.includes('live')
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}

        <div className="pt-4 px-3 py-2 text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
          Orchestration Views
        </div>

        <button
          onClick={() => setCurrentScreen('builder')}
          className={`w-full flex items-center gap-3 px-3.5 py-2 rounded-lg text-xs font-medium transition-colors ${
            currentScreen === 'builder'
              ? 'bg-slate-800 text-indigo-400 font-semibold border-l-2 border-indigo-500'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
          <span>Visual DAG Canvas (Screen 5)</span>
        </button>

        <button
          onClick={() => setCurrentScreen('execution-live')}
          className={`w-full flex items-center gap-3 px-3.5 py-2 rounded-lg text-xs font-medium transition-colors ${
            currentScreen === 'execution-live'
              ? 'bg-slate-800 text-emerald-400 font-semibold border-l-2 border-emerald-500'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
          <span>Live Execution (Screen 6)</span>
        </button>

        <button
          onClick={() => setCurrentScreen('failure-dlq')}
          className={`w-full flex items-center gap-3 px-3.5 py-2 rounded-lg text-xs font-medium transition-colors ${
            currentScreen === 'failure-dlq'
              ? 'bg-slate-800 text-rose-400 font-semibold border-l-2 border-rose-500'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-rose-400"></span>
          <span>Retry & DLQ Trace (Screen 8)</span>
        </button>
      </nav>

      {/* Tenant Box */}
      <div className="p-3 border-t border-slate-800 bg-slate-900/60">
        <div className="bg-slate-800/70 rounded-lg p-2.5 border border-slate-700/50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-indigo-500 text-white font-bold flex items-center justify-center text-xs">
              {currentTenant.user.charAt(0)}
            </div>
            <div className="overflow-hidden">
              <div className="text-xs font-semibold text-white truncate">{currentTenant.user}</div>
              <div className="text-[10px] text-slate-400 truncate">{currentTenant.name}</div>
            </div>
          </div>
          <button
            onClick={logout}
            title="Log Out (View Screen 1 Login)"
            className="text-slate-400 hover:text-rose-400 p-1.5 rounded transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
        <div className="mt-2 text-[10px] text-slate-400 text-center flex items-center justify-center gap-1">
          <Sparkles className="w-3 h-3 text-indigo-400" />
          <span>Tenant Scoped Engine v2.4</span>
        </div>
      </div>
    </aside>
  );
};
