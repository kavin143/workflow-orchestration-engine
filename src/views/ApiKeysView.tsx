import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { KeyRound, Copy, Check, Plus, ShieldAlert, Eye, EyeOff } from 'lucide-react';

export const ApiKeysView: React.FC = () => {
  const { currentTenant, showToast } = useApp();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const keys = [
    {
      id: 'k1',
      name: 'Production Worker Daemon Key',
      prefix: 'wf_live_883a9...',
      full: 'wf_live_883a9921bcfae09182390192',
      created: 'Nov 12, 2024',
      lastUsed: '2 minutes ago',
      rateLimit: '1,000 req/min',
    },
    {
      id: 'k2',
      name: 'Webhook Ingestion Secret',
      prefix: 'wf_hook_192e4...',
      full: 'wf_hook_192e48271039840293847291',
      created: 'Nov 15, 2024',
      lastUsed: '1 hour ago',
      rateLimit: '500 req/min',
    },
  ];

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    showToast('API key copied to clipboard');
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">API Keys & Access Tokens</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Scoped credentials for tenant: <span className="font-semibold text-slate-700">{currentTenant.name}</span>
          </p>
        </div>

        <button
          onClick={() => showToast('Generated new production API token')}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-md shadow-indigo-600/20 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Generate New Key</span>
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-indigo-600" />
            <h2 className="font-bold text-slate-800 text-sm">Active Secret Keys</h2>
          </div>
          <span className="text-xs text-slate-400">Scoped strictly to current tenant isolation context</span>
        </div>

        <div className="divide-y divide-slate-100">
          {keys.map((k) => (
            <div key={k.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/50">
              <div>
                <div className="font-bold text-slate-900 text-sm">{k.name}</div>
                <div className="flex items-center gap-2 mt-1">
                  <code className="text-xs font-mono bg-slate-100 text-slate-700 px-2.5 py-1 rounded border border-slate-200">
                    {k.prefix}
                  </code>
                  <button
                    onClick={() => handleCopy(k.id, k.full)}
                    className="p-1 text-slate-400 hover:text-slate-600 rounded transition-colors"
                    title="Copy full key"
                  >
                    {copiedId === k.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-6 text-xs text-slate-500">
                <div>
                  <span className="block text-[10px] text-slate-400 uppercase font-semibold">Created</span>
                  <span>{k.created}</span>
                </div>
                <div>
                  <span className="block text-[10px] text-slate-400 uppercase font-semibold">Last Used</span>
                  <span>{k.lastUsed}</span>
                </div>
                <div>
                  <span className="block text-[10px] text-slate-400 uppercase font-semibold">Rate Limit</span>
                  <span className="font-medium text-slate-700">{k.rateLimit}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
