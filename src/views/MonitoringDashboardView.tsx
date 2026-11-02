import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { mockWorkers, last7DaysExecutionStats } from '../mockData';
import { 
  Users, 
  Activity, 
  CheckCircle2, 
  AlertTriangle, 
  Cpu, 
  Server, 
  Database, 
  ShieldCheck, 
  ArrowUpRight, 
  Filter, 
  RefreshCw,
  HardDrive
} from 'lucide-react';

export const MonitoringDashboardView: React.FC = () => {
  const { allTenants, showToast } = useApp();
  const [timeRange, setTimeRange] = useState('Last 7 Days');
  const [hoveredDay, setHoveredDay] = useState<string | null>(null);

  // Key metrics matching Screen 9
  const totalTenants = 8;
  const totalExecutions = '1,245';
  const successRate = '92%';
  const failedExecutions = 98;

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header matching Screen 9 */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Admin / Monitoring Dashboard</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            System-wide orchestration health, worker pool telemetry, and tenant resource isolation
          </p>
        </div>

        {/* Time Filter matching Screen 9 */}
        <div className="flex items-center gap-2">
          <select
            value={timeRange}
            onChange={(e) => {
              setTimeRange(e.target.value);
              showToast(`Refreshed telemetry for ${e.target.value}`);
            }}
            className="bg-white border border-slate-300 rounded-lg px-3.5 py-2 text-xs text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all shadow-sm"
          >
            <option value="Last 24 Hours">Last 24 Hours</option>
            <option value="Last 7 Days">Last 7 Days</option>
            <option value="Last 30 Days">Last 30 Days</option>
          </select>
        </div>
      </div>

      {/* 4 Metric Cards matching Screen 9 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Tenants */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Tenants</span>
            <div className="w-9 h-9 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">{totalTenants}</span>
            <span className="text-xs text-emerald-600 font-medium flex items-center">
              <ArrowUpRight className="w-3.5 h-3.5" /> 100% Isolated
            </span>
          </div>
        </div>

        {/* Total Executions */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Executions</span>
            <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Activity className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">{totalExecutions}</span>
            <span className="text-xs text-emerald-600 font-medium flex items-center">
              <ArrowUpRight className="w-3.5 h-3.5" /> +14.2%
            </span>
          </div>
        </div>

        {/* Success Rate */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Success Rate</span>
            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">{successRate}</span>
            <span className="text-xs text-slate-500 font-medium">Target &gt; 90%</span>
          </div>
        </div>

        {/* Failed Executions */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Failed Executions</span>
            <div className="w-9 h-9 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-rose-600">{failedExecutions}</span>
            <span className="text-xs bg-rose-50 text-rose-700 px-2 py-0.5 rounded-full font-semibold border border-rose-200">
              12 in DLQ
            </span>
          </div>
        </div>
      </div>

      {/* Main Two-Panel Section matching Screen 9 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Execution Statistics Bar Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-bold text-slate-900">Execution Statistics</h2>
              <p className="text-xs text-slate-400 mt-0.5">Distributed engine throughput & failures</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-medium">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-emerald-500"></span>
                <span className="text-slate-600">Success</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-rose-500"></span>
                <span className="text-slate-600">Failed</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-blue-500"></span>
                <span className="text-slate-600">Running</span>
              </div>
            </div>
          </div>

          <div className="h-64 flex flex-col justify-between pt-4">
            <div className="flex-1 flex items-end justify-between gap-3 px-4 border-b border-slate-200 pb-2 relative">
              <div className="absolute inset-x-0 top-0 border-b border-dashed border-slate-100 -z-10"></div>
              <div className="absolute inset-x-0 top-1/4 border-b border-dashed border-slate-100 -z-10"></div>
              <div className="absolute inset-x-0 top-2/4 border-b border-dashed border-slate-100 -z-10"></div>
              <div className="absolute inset-x-0 top-3/4 border-b border-dashed border-slate-100 -z-10"></div>

              {last7DaysExecutionStats.map((item) => {
                const max = 220;
                const hSuccess = Math.round((item.success / max) * 190);
                const hFailed = Math.max(10, Math.round((item.failed / max) * 190));
                const hRunning = Math.max(8, Math.round((item.running / max) * 190));
                const isHovered = hoveredDay === item.day;

                return (
                  <div
                    key={item.day}
                    onMouseEnter={() => setHoveredDay(item.day)}
                    onMouseLeave={() => setHoveredDay(null)}
                    className="flex-1 flex flex-col items-center justify-end h-full group relative cursor-pointer"
                  >
                    {isHovered && (
                      <div className="absolute -top-14 bg-slate-900 text-white text-[11px] py-1.5 px-2.5 rounded-lg shadow-lg z-20 whitespace-nowrap animate-fade-in pointer-events-none">
                        <div className="font-bold border-b border-slate-700 pb-0.5 mb-1">{item.day} Telemetry</div>
                        <div>Success: <span className="text-emerald-400 font-semibold">{item.success}</span></div>
                        <div>Failed: <span className="text-rose-400 font-semibold">{item.failed}</span></div>
                        <div>Running: <span className="text-blue-400 font-semibold">{item.running}</span></div>
                      </div>
                    )}

                    <div className="flex items-end gap-1 w-full justify-center">
                      <div style={{ height: `${hSuccess}px` }} className="w-3 sm:w-4 bg-emerald-500 rounded-t-sm hover:brightness-110 transition-all"></div>
                      <div style={{ height: `${hFailed}px` }} className="w-3 sm:w-4 bg-rose-500 rounded-t-sm hover:brightness-110 transition-all"></div>
                      <div style={{ height: `${hRunning}px` }} className="w-3 sm:w-4 bg-blue-500 rounded-t-sm hover:brightness-110 transition-all"></div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-between px-4 pt-2 text-xs font-semibold text-slate-500">
              {last7DaysExecutionStats.map((item) => (
                <div key={item.day} className="flex-1 text-center">
                  {item.day}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Worker Status Panel matching Screen 9 */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Worker Status</h2>
              <p className="text-xs text-slate-400 mt-0.5">Distributed execution pool</p>
            </div>
            <span className="text-xs bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full font-semibold border border-emerald-200">
              4/4 Healthy
            </span>
          </div>

          <div className="space-y-3 my-auto">
            {mockWorkers.map((worker) => (
              <div
                key={worker.id}
                className="p-3 rounded-lg border border-slate-200 hover:border-slate-300 bg-slate-50/50 flex items-center justify-between transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
                  <div>
                    <div className="text-xs font-bold text-slate-800">{worker.name}</div>
                    <div className="text-[10px] text-slate-400">
                      CPU: {worker.cpu}% • RAM: {worker.memory}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 inline-block">
                    {worker.status}
                  </span>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    {worker.activeJobs} jobs active
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Cluster: us-east-1a</span>
            <span className="font-semibold text-indigo-600">Autoscaling Active</span>
          </div>
        </div>
      </div>

      {/* Tenant Resource Quota & Isolation Table (from PDF Day 23) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Tenant Resource Quotas & Usage</h2>
            <p className="text-xs text-slate-400 mt-0.5">Strict per-tenant concurrency & quota limits</p>
          </div>
          <span className="text-xs text-slate-500">MongoDB Multi-Tenant Partitioning</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Tenant Name</th>
                <th className="py-3 px-4">Plan</th>
                <th className="py-3 px-4">Executions / Limit</th>
                <th className="py-3 px-4">Concurrency</th>
                <th className="py-3 px-4">Isolation Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {allTenants.map((t) => {
                const execPct = Math.round((t.executionsUsed / t.executionsLimit) * 100);
                return (
                  <tr key={t.id} className="hover:bg-slate-50">
                    <td className="py-3.5 px-4 font-bold text-slate-800">{t.name}</td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium text-[11px]">
                        {t.plan}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="w-48">
                        <div className="flex justify-between text-[11px] mb-1">
                          <span className="font-medium text-slate-700">{t.executionsUsed} / {t.executionsLimit}</span>
                          <span className="text-slate-400">{execPct}%</span>
                        </div>
                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <div
                            style={{ width: `${execPct}%` }}
                            className={`h-full rounded-full ${
                              execPct > 90 ? 'bg-rose-500' : execPct > 75 ? 'bg-amber-500' : 'bg-indigo-600'
                            }`}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono">
                      {t.concurrencyUsed} / {t.concurrencyLimit} workers
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Scoped
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
