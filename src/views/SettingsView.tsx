import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Sliders, Save, Database, Cpu, ShieldCheck } from 'lucide-react';

export const SettingsView: React.FC = () => {
  const { showToast } = useApp();
  const [maxRetries, setMaxRetries] = useState(3);
  const [backoffBase, setBackoffBase] = useState(30);
  const [sagaTimeout, setSagaTimeout] = useState(15);
  const [dlqThreshold, setDlqThreshold] = useState(3);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    showToast('Engine orchestration parameters updated successfully!');
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Engine Settings & Saga Policies</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Configure distributed execution retry policies, Saga rollback timeouts, and dead-letter queue parameters
        </p>
      </div>

      <form onSubmit={handleSave} className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
        <div>
          <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <Cpu className="w-4 h-4 text-indigo-600" />
            Distributed Retry & Exponential Backoff Policy
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Default Max Retries per Step
              </label>
              <input
                type="number"
                value={maxRetries}
                onChange={(e) => setMaxRetries(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800 font-medium"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Exhaustion sends message to DLQ</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Base Backoff Interval (Seconds)
              </label>
              <input
                type="number"
                value={backoffBase}
                onChange={(e) => setBackoffBase(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800 font-medium"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Multiplier: 2.0x per attempt</span>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100">
          <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-rose-600" />
            Saga Backward Compensation & Rollback
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Saga Rollback Timeout (Seconds)
              </label>
              <input
                type="number"
                value={sagaTimeout}
                onChange={(e) => setSagaTimeout(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Dead Letter Queue (DLQ) Threshold
              </label>
              <input
                type="number"
                value={dlqThreshold}
                onChange={(e) => setDlqThreshold(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800 font-medium"
              />
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 flex justify-end">
          <button
            type="submit"
            className="px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-md shadow-indigo-600/20 transition-all flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>Save Configuration</span>
          </button>
        </div>
      </form>
    </div>
  );
};
