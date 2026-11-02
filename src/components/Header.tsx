import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Bell, Search, ChevronDown, CheckCircle2, AlertTriangle, Play, Sparkles, Building2 } from 'lucide-react';

export const Header: React.FC = () => {
  const { currentTenant, setCurrentTenant, allTenants, setCurrentScreen, showToast, startLiveSimulation } = useApp();
  const [showTenantMenu, setShowTenantMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const notifications = [
    { id: 1, title: 'Retry Exhausted: Order #1000', desc: 'Step Process Payment sent to DLQ topic', time: '12m ago', type: 'error' },
    { id: 2, title: 'Workflow Completed', desc: 'Customer Onboarding executed in 2m 10s', time: '45m ago', type: 'success' },
    { id: 3, title: 'Saga Compensation Triggered', desc: 'Order rollback completed with 0 errors', time: '1h ago', type: 'warning' },
  ];

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between z-30 select-none">
      {/* Search Input */}
      <div className="relative w-80 max-w-sm hidden md:block">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Search workflows, executions, logs..."
          className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 py-1.5 text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
        />
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-4 ml-auto">
        {/* Quick Launch Run simulation button */}
        <button
          onClick={() => {
            startLiveSimulation('wf-customer-onboarding');
            showToast('Started live DAG execution simulation!');
          }}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 text-xs font-semibold transition-colors"
        >
          <Play className="w-3.5 h-3.5 fill-current text-emerald-600" />
          <span>Simulate Run</span>
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white"></span>
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-slide-in">
              <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">System Notifications</span>
                <span className="text-[10px] bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded font-medium">3 unread</span>
              </div>
              <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => {
                      setShowNotifications(false);
                      if (n.type === 'error') setCurrentScreen('failure-dlq');
                      else setCurrentScreen('execution-live');
                    }}
                    className="p-3 hover:bg-slate-50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-start gap-2.5">
                      {n.type === 'error' ? (
                        <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                      ) : n.type === 'warning' ? (
                        <Sparkles className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      )}
                      <div>
                        <p className="text-xs font-semibold text-slate-800">{n.title}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5 leading-tight">{n.desc}</p>
                        <span className="text-[10px] text-slate-400 mt-1 block">{n.time}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Vertical divider */}
        <div className="h-6 w-px bg-slate-200"></div>

        {/* Tenant Profile Menu matching Screenshot (Sarah / Tenant: Acme Corp) */}
        <div className="relative">
          <button
            onClick={() => setShowTenantMenu(!showTenantMenu)}
            className="flex items-center gap-3 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow-sm">
              {currentTenant.user.charAt(0)}
            </div>
            <div className="text-left hidden sm:block">
              <div className="text-xs font-bold text-slate-800 leading-tight">{currentTenant.user}</div>
              <div className="text-[11px] text-slate-500 leading-tight">Tenant: <span className="font-medium text-indigo-600">{currentTenant.name}</span></div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {showTenantMenu && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-slide-in">
              <div className="px-3 py-1.5 border-b border-slate-100">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Switch Tenant Context</span>
                <p className="text-[11px] text-slate-500 mt-0.5">Simulates isolated tenant database scoping</p>
              </div>

              <div className="p-1 space-y-1">
                {allTenants.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => {
                      setCurrentTenant(t);
                      setShowTenantMenu(false);
                      showToast(`Switched context to tenant: ${t.name}`);
                    }}
                    className={`w-full flex items-center justify-between p-2 rounded-lg text-left text-xs transition-colors ${
                      currentTenant.id === t.id ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      <div>
                        <div>{t.name}</div>
                        <div className="text-[10px] text-slate-400 font-normal">{t.plan} Plan • {t.executionsUsed}/{t.executionsLimit} runs</div>
                      </div>
                    </div>
                    {currentTenant.id === t.id && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
