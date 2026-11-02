import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  FolderKanban, 
  Play, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowUpRight, 
  Plus, 
  Flame, 
  Clock, 
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { last7DaysExecutionStats } from '../mockData';

export const DashboardView: React.FC = () => {
  const { setCurrentScreen, currentTenant, startLiveSimulation } = useApp();
  const [hoveredDay, setHoveredDay] = useState<string | null>(null);

  // Totals matching Screen 2
  const totalWorkflows = 12;
  const runningExecutions = 3;
  const successfulExecutions = 96;
  const failedExecutions = 8;
  const totalExecutions = 107;

  // Donut chart angles calculation
  const successPct = (successfulExecutions / totalExecutions) * 100;
  const failedPct = (failedExecutions / totalExecutions) * 100;
  const runningPct = (runningExecutions / totalExecutions) * 100;

  // Circumference for r=70: 2 * PI * 70 = 439.82
  const c = 439.82;
  const successStroke = (successPct / 100) * c;
  const failedStroke = (failedPct / 100) * c;
  const runningStroke = (runningPct / 100) * c;

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Page Title & Quick Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Dashboard</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time multi-tenant workflow and Saga orchestration telemetry for{' '}
            <span className="font-semibold text-slate-700">{currentTenant.name}</span>
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setCurrentScreen('create-workflow')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-sm transition-all shadow-indigo-500/20"
          >
            <Plus className="w-4 h-4" />
            <span>Create Workflow</span>
          </button>
          <button
            onClick={() => startLiveSimulation('wf-customer-onboarding')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs shadow-sm transition-all"
          >
            <Play className="w-3.5 h-3.5 text-emerald-600 fill-current" />
            <span>Test Run Engine</span>
          </button>
        </div>
      </div>

      {/* 4 Metric Cards (Matching Screen 2) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Workflows */}
        <div
          onClick={() => setCurrentScreen('workflows')}
          className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Workflows</span>
            <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <FolderKanban className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">{totalWorkflows}</span>
            <span className="text-xs text-emerald-600 font-medium flex items-center">
              <ArrowUpRight className="w-3.5 h-3.5" /> +2 this week
            </span>
          </div>
        </div>

        {/* Card 2: Running */}
        <div
          onClick={() => setCurrentScreen('execution-live')}
          className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Running</span>
            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform relative">
              <RefreshCw className="w-5 h-5 animate-spin text-emerald-600" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">{runningExecutions}</span>
            <span className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-semibold border border-emerald-200 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Live DAGs
            </span>
          </div>
        </div>

        {/* Card 3: Successful */}
        <div
          onClick={() => setCurrentScreen('execution-history')}
          className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Successful</span>
            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">{successfulExecutions}</span>
            <span className="text-xs text-slate-500 font-medium">89.7% rate</span>
          </div>
        </div>

        {/* Card 4: Failed */}
        <div
          onClick={() => setCurrentScreen('failure-dlq')}
          className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Failed</span>
            <div className="w-9 h-9 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-rose-600">{failedExecutions}</span>
            <span className="text-xs bg-rose-50 text-rose-700 px-2 py-0.5 rounded-full font-semibold border border-rose-200">
              3 in DLQ
            </span>
          </div>
        </div>
      </div>

      {/* Two Column Visual Analytics Section (Matching Screen 2) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Execution Overview (Last 7 Days) */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-bold text-slate-900">Execution Overview (Last 7 Days)</h2>
              <p className="text-xs text-slate-400 mt-0.5">Daily breakdown across states</p>
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

          {/* Grouped Bar Chart Visual */}
          <div className="h-64 flex flex-col justify-between pt-4">
            <div className="flex-1 flex items-end justify-between gap-3 px-4 border-b border-slate-200 pb-2 relative">
              {/* Horizontal gridlines */}
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
                    {/* Tooltip on hover */}
                    {isHovered && (
                      <div className="absolute -top-14 bg-slate-900 text-white text-[11px] py-1.5 px-2.5 rounded-lg shadow-lg z-20 whitespace-nowrap animate-fade-in pointer-events-none">
                        <div className="font-bold border-b border-slate-700 pb-0.5 mb-1">{item.day} Telemetry</div>
                        <div>Success: <span className="text-emerald-400 font-semibold">{item.success}</span></div>
                        <div>Failed: <span className="text-rose-400 font-semibold">{item.failed}</span></div>
                        <div>Running: <span className="text-blue-400 font-semibold">{item.running}</span></div>
                      </div>
                    )}

                    {/* Bar Triplet */}
                    <div className="flex items-end gap-1 w-full justify-center">
                      <div
                        style={{ height: `${hSuccess}px` }}
                        className="w-2.5 sm:w-3.5 bg-emerald-500 rounded-t-sm hover:brightness-110 transition-all"
                      ></div>
                      <div
                        style={{ height: `${hFailed}px` }}
                        className="w-2.5 sm:w-3.5 bg-rose-500 rounded-t-sm hover:brightness-110 transition-all"
                      ></div>
                      <div
                        style={{ height: `${hRunning}px` }}
                        className="w-2.5 sm:w-3.5 bg-blue-500 rounded-t-sm hover:brightness-110 transition-all"
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Day Labels */}
            <div className="flex justify-between px-4 pt-2 text-xs font-semibold text-slate-500">
              {last7DaysExecutionStats.map((item) => (
                <div key={item.day} className="flex-1 text-center">
                  {item.day}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Execution Status Donut Chart (Matching Screen 2) */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Execution Status</h2>
            <p className="text-xs text-slate-400 mt-0.5">Aggregated run distribution</p>
          </div>

          {/* SVG Donut */}
          <div className="relative flex items-center justify-center my-6">
            <svg className="w-52 h-52 transform -rotate-90">
              {/* Background ring */}
              <circle
                cx="104"
                cy="104"
                r="70"
                stroke="#f1f5f9"
                strokeWidth="20"
                fill="transparent"
              />
              {/* Success Segment */}
              <circle
                cx="104"
                cy="104"
                r="70"
                stroke="#10b981"
                strokeWidth="20"
                fill="transparent"
                strokeDasharray={`${successStroke} ${c}`}
                strokeDashoffset="0"
                strokeLinecap="round"
                className="transition-all duration-700"
              />
              {/* Failed Segment */}
              <circle
                cx="104"
                cy="104"
                r="70"
                stroke="#ef4444"
                strokeWidth="20"
                fill="transparent"
                strokeDasharray={`${failedStroke} ${c}`}
                strokeDashoffset={-successStroke}
                strokeLinecap="round"
                className="transition-all duration-700"
              />
              {/* Running Segment */}
              <circle
                cx="104"
                cy="104"
                r="70"
                stroke="#3b82f6"
                strokeWidth="20"
                fill="transparent"
                strokeDasharray={`${runningStroke} ${c}`}
                strokeDashoffset={-(successStroke + failedStroke)}
                strokeLinecap="round"
                className="transition-all duration-700"
              />
            </svg>

            {/* Inner Content */}
            <div className="absolute flex flex-col items-center justify-center text-center">
              <span className="text-3xl font-extrabold text-slate-900">{totalExecutions}</span>
              <span className="text-[11px] font-medium text-slate-400">Total Executions</span>
            </div>
          </div>

          {/* Legend Pills matching screenshot */}
          <div className="flex items-center justify-around text-xs font-semibold pt-3 border-t border-slate-100">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <span className="text-slate-700">Successful <strong className="text-slate-900">{successfulExecutions}</strong></span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
              <span className="text-slate-700">Failed <strong className="text-slate-900">{failedExecutions}</strong></span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
              <span className="text-slate-700">Running <strong className="text-slate-900">{runningExecutions}</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Access to Screens 3, 5, 8 */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 rounded-xl p-5 text-white flex flex-col md:flex-row items-center justify-between gap-4 shadow-lg">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-white">Saga Orchestration & DLQ Recovery Active</h3>
            <p className="text-xs text-indigo-200/80 mt-0.5">
              Recent order failure #1000 has 3 retry attempts recorded and moved to the dead-letter queue.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setCurrentScreen('failure-dlq')}
            className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs transition-colors flex items-center gap-2 shadow-sm"
          >
            <span>View DLQ & Compensation (Screen 8)</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
