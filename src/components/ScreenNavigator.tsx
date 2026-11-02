import React from 'react';
import { useApp } from '../context/AppContext';
import { ScreenId } from '../types';
import { 
  LogIn, 
  LayoutDashboard, 
  ListTree, 
  PlusCircle, 
  Network, 
  PlayCircle, 
  History, 
  AlertOctagon, 
  Activity,
  Layers,
  Key,
  Sliders
} from 'lucide-react';

interface ScreenPill {
  id: ScreenId;
  label: string;
  num: number;
  icon: React.ComponentType<{ className?: string }>;
  tag?: string;
}

const screens: ScreenPill[] = [
  { id: 'login', label: 'Login', num: 1, icon: LogIn },
  { id: 'dashboard', label: 'Dashboard', num: 2, icon: LayoutDashboard },
  { id: 'workflows', label: 'Workflow List', num: 3, icon: ListTree },
  { id: 'create-workflow', label: 'Create Flow', num: 4, icon: PlusCircle },
  { id: 'builder', label: 'DAG Builder', num: 5, icon: Network },
  { id: 'execution-live', label: 'Live Run', num: 6, icon: PlayCircle, tag: 'Live' },
  { id: 'execution-history', label: 'History', num: 7, icon: History },
  { id: 'failure-dlq', label: 'Failure & DLQ', num: 8, icon: AlertOctagon, tag: 'Saga' },
  { id: 'monitoring', label: 'Monitoring', num: 9, icon: Activity },
  { id: 'tenants', label: 'Tenants', num: 10, icon: Layers },
  { id: 'api-keys', label: 'API Keys', num: 11, icon: Key },
  { id: 'settings', label: 'Settings', num: 12, icon: Sliders },
];

export const ScreenNavigator: React.FC = () => {
  const { currentScreen, setCurrentScreen } = useApp();

  return (
    <header aria-label="Screen Navigation Bar" className="bg-slate-900 border-b border-slate-800 text-white px-3 py-2 flex flex-wrap items-center justify-between gap-2 shadow-sm z-50 sticky top-0 text-xs">
      <div className="flex items-center gap-2">
        <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
        <span className="font-semibold text-slate-200 tracking-wide flex items-center gap-1.5">
          <span className="bg-indigo-600 text-[10px] font-bold px-1.5 py-0.5 rounded text-white uppercase tracking-wider">Project 1</span>
          Interactive Prototype:
        </span>
      </div>

      <div className="flex items-center gap-1 overflow-x-auto py-0.5 no-scrollbar max-w-full">
        {screens.slice(0, 9).map((s) => {
          const isActive = currentScreen === s.id;
          const Icon = s.icon;
          return (
            <button
              key={s.id}
              onClick={() => setCurrentScreen(s.id)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-medium transition-all duration-150 whitespace-nowrap ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-sm ring-1 ring-indigo-400 font-semibold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
              }`}
              title={`Switch to Screen ${s.num}: ${s.label}`}
            >
              <span
                className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  isActive ? 'bg-white text-indigo-700' : 'bg-slate-800 text-slate-400 border border-slate-700'
                }`}
              >
                {s.num}
              </span>
              <Icon className="w-3.5 h-3.5" />
              <span>{s.label}</span>
              {s.tag && (
                <span className={`text-[9px] px-1 py-0.2 rounded font-mono uppercase ${
                  s.tag === 'Live' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                }`}>
                  {s.tag}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="hidden lg:flex items-center gap-1 text-[11px] text-slate-400">
        <span>Click tabs or interact with in-app buttons</span>
      </div>
    </header>
  );
};
