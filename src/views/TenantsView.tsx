import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Building2, ShieldCheck, Plus, CheckCircle2, AlertTriangle, KeyRound } from 'lucide-react';

export const TenantsView: React.FC = () => {
  const { allTenants, currentTenant, setCurrentTenant, showToast } = useApp();

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Tenants & Access Control</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage multi-tenant workspaces with strict data isolation, quota enforcement, and separate worker queues
          </p>
        </div>

        <button
          onClick={() => showToast('Tenant onboarding wizard triggered')}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-md shadow-indigo-600/20 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Provision Tenant</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {allTenants.map((t) => {
          const isCurrent = t.id === currentTenant.id;
          return (
            <div
              key={t.id}
              className={`p-5 rounded-xl border bg-white shadow-sm flex flex-col justify-between transition-all ${
                isCurrent ? 'border-indigo-600 ring-2 ring-indigo-100 shadow-md' : 'border-slate-200'
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                    <Building2 className="w-5 h-5" />
                  </div>
                  {isCurrent && (
                    <span className="text-[10px] bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded-full border border-indigo-200">
                      Active Context
                    </span>
                  )}
                </div>

                <div className="mt-4">
                  <h3 className="font-bold text-sm text-slate-900">{t.name}</h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">{t.user} • {t.email}</p>
                </div>

                <div className="mt-4 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Plan:</span>
                    <span className="font-semibold text-slate-800">{t.plan}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Executions:</span>
                    <span className="font-mono font-medium">{t.executionsUsed} / {t.executionsLimit}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Concurrency:</span>
                    <span className="font-mono font-medium">{t.concurrencyUsed} / {t.concurrencyLimit}</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100">
                <button
                  onClick={() => {
                    setCurrentTenant(t);
                    showToast(`Switched active context to ${t.name}`);
                  }}
                  disabled={isCurrent}
                  className={`w-full py-2 rounded-lg text-xs font-semibold transition-colors ${
                    isCurrent
                      ? 'bg-slate-100 text-slate-400 cursor-default'
                      : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700'
                  }`}
                >
                  {isCurrent ? 'Current Tenant' : 'Switch Context'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
