import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Search, 
  Filter, 
  Eye, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  Clock, 
  PlaySquare, 
  ExternalLink,
  ChevronRight
} from 'lucide-react';

export const ExecutionHistoryView: React.FC = () => {
  const { 
    executions, 
    setCurrentScreen, 
    setSelectedExecutionId, 
    showToast 
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Success' | 'Failed' | 'Running'>('All');

  const filtered = executions.filter((e) => {
    const matchesSearch =
      e.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.workflowName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'All' || e.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleInspect = (execId: string) => {
    setSelectedExecutionId(execId);
    if (execId === '#1000' || execId === '#997') {
      setCurrentScreen('failure-dlq');
      showToast(`Inspecting failed execution ${execId} (Saga DLQ & Retry Trace)`);
    } else {
      setCurrentScreen('execution-live');
      showToast(`Inspecting execution ${execId} (Live DAG View)`);
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header matching Screen 7 */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Execution History</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit trail of all tenant workflow runs, state transitions, and retry executions
          </p>
        </div>

        <button
          onClick={() => setCurrentScreen('failure-dlq')}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 text-xs font-semibold transition-colors"
        >
          <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
          <span>Inspect Dead Letter Queue (DLQ)</span>
        </button>
      </div>

      {/* Filter and Search Bar matching Screen 7 */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search executions..."
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400 hidden sm:block" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="w-full sm:w-44 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
          >
            <option value="All">All Status</option>
            <option value="Success">Success Only</option>
            <option value="Failed">Failed Only</option>
            <option value="Running">Running Only</option>
          </select>
        </div>
      </div>

      {/* Table matching Screen 7 */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3.5 px-5">Execution ID</th>
                <th className="py-3.5 px-5">Workflow</th>
                <th className="py-3.5 px-5">Status</th>
                <th className="py-3.5 px-5">Started At</th>
                <th className="py-3.5 px-5">Duration</th>
                <th className="py-3.5 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((exec) => (
                <tr
                  key={exec.id}
                  onClick={() => handleInspect(exec.id)}
                  className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                >
                  {/* Execution ID */}
                  <td className="py-4 px-5 font-mono font-bold text-slate-800">
                    <span className="text-indigo-600 group-hover:underline">{exec.id}</span>
                  </td>

                  {/* Workflow Name */}
                  <td className="py-4 px-5">
                    <div className="font-semibold text-slate-800 flex items-center gap-2">
                      <PlaySquare className="w-4 h-4 text-slate-400" />
                      <span>{exec.workflowName}</span>
                    </div>
                  </td>

                  {/* Status Badge */}
                  <td className="py-4 px-5">
                    {exec.status === 'Success' ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Success
                      </span>
                    ) : exec.status === 'Failed' ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                        Failed
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                        <RefreshCw className="w-3.5 h-3.5 text-blue-600 animate-spin" />
                        Running
                      </span>
                    )}
                  </td>

                  {/* Started At */}
                  <td className="py-4 px-5 text-slate-600 font-medium">
                    {exec.startedAt}
                  </td>

                  {/* Duration */}
                  <td className="py-4 px-5 text-slate-600 font-mono">
                    {exec.duration}
                  </td>

                  {/* Actions */}
                  <td className="py-4 px-5 text-right" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => handleInspect(exec.id)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors inline-flex items-center gap-1"
                      title="Inspect Execution Trace"
                    >
                      <Eye className="w-4 h-4" />
                      <span className="text-[11px] font-semibold hidden md:inline">Inspect</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
