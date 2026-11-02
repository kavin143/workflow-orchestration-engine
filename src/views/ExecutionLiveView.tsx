import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Square, 
  Play, 
  CheckCircle2, 
  RefreshCw, 
  Clock, 
  Globe, 
  GitBranch, 
  Flag, 
  Terminal, 
  FileText,
  RotateCcw,
  Sparkles,
  ChevronRight,
  ExternalLink
} from 'lucide-react';

export const ExecutionLiveView: React.FC = () => {
  const { 
    simulationRunning, 
    simulationStep, 
    simulationLogs, 
    startLiveSimulation, 
    stopLiveSimulation, 
    setCurrentScreen,
    showToast 
  } = useApp();

  const [activeTab, setActiveTab] = useState<'logs' | 'details'>('logs');
  const [selectedNodeId, setSelectedNodeId] = useState<string>('node-check-verif');

  // Step states based on simulationStep
  const isStartDone = true;
  const isCreateCustDone = simulationStep >= 1;
  const isSendEmailDone = simulationStep >= 2;
  const isCheckVerifRunning = simulationStep === 3;
  const isCheckVerifDone = simulationStep > 3;
  const isCreateInvRunning = simulationStep === 4;
  const isCreateInvDone = simulationStep >= 5;
  const isEndDone = simulationStep >= 5;

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col bg-slate-100 select-none overflow-hidden">
      {/* Top Header matching Screen 6 */}
      <div className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center gap-3">
          <h1 className="font-bold text-slate-900 text-sm md:text-base">
            Execution: Customer Onboarding
          </h1>
          {simulationRunning ? (
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              Running
            </span>
          ) : isEndDone ? (
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Completed (3.8s)
            </span>
          ) : (
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              Paused
            </span>
          )}
        </div>

        {/* Controls matching Screen 6 */}
        <div className="flex items-center gap-2.5">
          {simulationRunning ? (
            <button
              onClick={stopLiveSimulation}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-rose-500 hover:bg-rose-600 active:bg-rose-700 text-white font-semibold text-xs shadow-sm transition-all shadow-rose-500/20"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              <span>Stop</span>
            </button>
          ) : (
            <button
              onClick={() => startLiveSimulation('wf-customer-onboarding')}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-sm transition-all shadow-indigo-600/20"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Re-run</span>
            </button>
          )}

          <button
            onClick={() => setCurrentScreen('builder')}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors"
          >
            <span>Edit in Builder</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Center Canvas with Live Running DAG matching Screen 6 */}
        <div className="flex-1 overflow-auto p-8 flex items-center justify-center canvas-grid">
          <div className="flex flex-col items-center gap-5 py-6 min-w-[500px]">
            {/* Start Node */}
            <div className="w-36 py-2 px-4 rounded-full bg-emerald-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-sm">
              <CheckCircle2 className="w-4 h-4" />
              <span>Start</span>
            </div>

            <div className="w-0.5 h-6 bg-emerald-400"></div>

            {/* Step 1: Create Customer */}
            <div
              onClick={() => setSelectedNodeId('node-create-cust')}
              className={`w-64 p-3 rounded-xl bg-white border-2 shadow-sm cursor-pointer transition-all flex items-center gap-3 ${
                isCreateCustDone
                  ? 'border-emerald-500 bg-emerald-50/20'
                  : 'border-slate-200'
              }`}
            >
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div className="overflow-hidden flex-1">
                <div className="text-xs font-bold text-slate-800">Create Customer</div>
                <div className="text-[10px] text-emerald-600 font-semibold">Completed (1.2s)</div>
              </div>
            </div>

            <div className="w-0.5 h-6 bg-emerald-400"></div>

            {/* Step 2: Send Welcome Email */}
            <div
              onClick={() => setSelectedNodeId('node-send-email')}
              className={`w-64 p-3 rounded-xl bg-white border-2 shadow-sm cursor-pointer transition-all flex items-center gap-3 ${
                isSendEmailDone
                  ? 'border-emerald-500 bg-emerald-50/20'
                  : 'border-slate-200'
              }`}
            >
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div className="overflow-hidden flex-1">
                <div className="text-xs font-bold text-slate-800">Send Welcome Email</div>
                <div className="text-[10px] text-emerald-600 font-semibold">Completed (0.8s)</div>
              </div>
            </div>

            <div className={`w-0.5 h-6 ${isCheckVerifDone ? 'bg-emerald-400' : 'bg-blue-400'}`}></div>

            {/* Step 3: Check Verification (Active Running in Screen 6) */}
            <div
              onClick={() => setSelectedNodeId('node-check-verif')}
              className={`w-52 py-3 px-4 rounded-xl shadow-md cursor-pointer transition-all flex items-center justify-center gap-3 border-2 ${
                isCheckVerifRunning
                  ? 'bg-blue-50 border-blue-600 ring-4 ring-blue-100 animate-pulse'
                  : isCheckVerifDone
                  ? 'bg-emerald-50 border-emerald-500'
                  : 'bg-white border-slate-200'
              }`}
            >
              {isCheckVerifRunning ? (
                <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              )}
              <div className="text-center">
                <div className="text-xs font-bold text-slate-800">Check Verification</div>
                <div className={`text-[10px] font-bold ${isCheckVerifRunning ? 'text-blue-600' : 'text-emerald-600'}`}>
                  {isCheckVerifRunning ? 'Running...' : 'Verified (KYC >= 75)'}
                </div>
              </div>
            </div>

            {/* Branches: Yes & No */}
            <div className="flex items-start justify-between w-96 relative">
              {/* Branch Left: Yes */}
              <div className="flex-1 flex flex-col items-center">
                <div className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 mb-2">
                  Yes
                </div>
                <div className={`w-0.5 h-6 ${isCreateInvDone ? 'bg-emerald-400' : 'bg-slate-300'}`}></div>

                {/* Node: Create Invoice */}
                <div
                  onClick={() => setSelectedNodeId('node-create-inv')}
                  className={`w-40 p-2.5 rounded-xl bg-white border shadow-sm cursor-pointer transition-all flex items-center gap-2.5 ${
                    isCreateInvDone
                      ? 'border-emerald-500 bg-emerald-50/20'
                      : isCreateInvRunning
                      ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-100 animate-pulse'
                      : 'border-slate-200 opacity-60'
                  }`}
                >
                  <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <Globe className="w-3.5 h-3.5" />
                  </div>
                  <div className="overflow-hidden">
                    <div className="text-[11px] font-bold text-slate-800">Create Invoice</div>
                    <div className="text-[9px] text-slate-400">
                      {isCreateInvDone ? 'Completed (0.9s)' : 'Waiting...'}
                    </div>
                  </div>
                </div>

                <div className={`w-0.5 h-6 ${isCreateInvDone ? 'bg-emerald-400' : 'bg-slate-200'} mt-2`}></div>
              </div>

              {/* Branch Right: No */}
              <div className="flex-1 flex flex-col items-center opacity-40">
                <div className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 mb-2">
                  No
                </div>
                <div className="w-0.5 h-6 bg-slate-200"></div>

                {/* Node: Retry Payment */}
                <div className="w-40 p-2.5 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                    <Clock className="w-3.5 h-3.5" />
                  </div>
                  <div className="overflow-hidden">
                    <div className="text-[11px] font-bold text-slate-800">Retry Payment</div>
                    <div className="text-[9px] text-slate-400">Waiting...</div>
                  </div>
                </div>

                <div className="w-0.5 h-6 bg-slate-200 mt-2"></div>
              </div>
            </div>

            {/* End Node */}
            <div
              className={`w-36 py-2 px-4 rounded-full text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-sm transition-all ${
                isEndDone ? 'bg-emerald-600' : 'bg-slate-400 opacity-60'
              }`}
            >
              <Flag className="w-4 h-4 fill-current" />
              <span>End</span>
            </div>
          </div>
        </div>

        {/* Right Drawer matching Screen 6: Execution Logs & Node Details */}
        <div className="w-96 bg-white border-l border-slate-200 flex flex-col shrink-0 shadow-lg">
          {/* Tabs matching Screen 6 */}
          <div className="flex border-b border-slate-200 bg-slate-50 text-xs font-medium">
            <button
              onClick={() => setActiveTab('logs')}
              className={`flex-1 py-3 text-center border-b-2 transition-colors flex items-center justify-center gap-1.5 ${
                activeTab === 'logs'
                  ? 'border-indigo-600 text-indigo-600 font-bold bg-white'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>Execution Logs</span>
            </button>
            <button
              onClick={() => setActiveTab('details')}
              className={`flex-1 py-3 text-center border-b-2 transition-colors flex items-center justify-center gap-1.5 ${
                activeTab === 'details'
                  ? 'border-indigo-600 text-indigo-600 font-bold bg-white'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Node Details</span>
            </button>
          </div>

          {/* Logs View matching Screen 6 */}
          {activeTab === 'logs' && (
            <div className="flex-1 p-4 overflow-y-auto space-y-2 font-mono text-[11px] bg-slate-900 text-slate-300">
              <div className="text-[10px] text-slate-400 font-sans uppercase font-bold border-b border-slate-800 pb-2 mb-2 flex items-center justify-between">
                <span>Real-Time Event Stream</span>
                <span className="flex items-center gap-1 text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Connected
                </span>
              </div>

              {simulationLogs.map((log) => (
                <div key={log.id} className="flex items-start gap-2.5 leading-relaxed">
                  <span className="text-slate-400 shrink-0 font-medium">{log.time}</span>
                  <span
                    className={`${
                      log.level === 'success'
                        ? 'text-emerald-400'
                        : log.level === 'warn'
                        ? 'text-amber-400'
                        : log.level === 'error'
                        ? 'text-rose-400'
                        : 'text-indigo-300'
                    }`}
                  >
                    {log.level === 'success' && '✔ '}
                    {log.level === 'error' && '✖ '}
                    {log.message}
                  </span>
                </div>
              ))}

              {simulationRunning && (
                <div className="flex items-center gap-2 text-indigo-400 text-[10px] pt-2">
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  <span>Waiting for worker dispatch confirmation...</span>
                </div>
              )}
            </div>
          )}

          {/* Node Details View */}
          {activeTab === 'details' && (
            <div className="flex-1 p-5 overflow-y-auto space-y-4 text-xs">
              <div>
                <h3 className="font-bold text-slate-800 text-sm">Check Verification</h3>
                <p className="text-[11px] text-slate-500">Node ID: node-check-verif • Type: Condition</p>
              </div>

              <div className="space-y-3">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="font-semibold text-slate-700 text-[11px] mb-1">Evaluated Expression</div>
                  <code className="text-indigo-600 font-mono text-[11px]">
                    response.status === "VERIFIED" && score &gt;= 75
                  </code>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="font-semibold text-slate-700 text-[11px] mb-1">Input Context Payload</div>
                  <pre className="text-slate-700 font-mono text-[10px] overflow-x-auto">
{JSON.stringify(
  {
    customer: { id: "cust_9921", email: "sarah@acme.com", status: "VERIFIED" },
    verification: { score: 88, passed: true },
    tenant: "tenant-acme"
  },
  null,
  2
)}
                  </pre>
                </div>

                <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 text-emerald-800">
                  <div className="font-bold text-[11px]">Evaluation Result</div>
                  <div className="text-[11px] mt-0.5">Condition evaluated to <strong>TRUE</strong>. Dispatched to branch "Yes".</div>
                </div>
              </div>
            </div>
          )}

          {/* Bottom Footer Info */}
          <div className="p-3 bg-slate-50 border-t border-slate-200 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Execution ID: #1001</span>
            <span className="font-semibold text-indigo-600">Tenant: Acme Corp</span>
          </div>
        </div>
      </div>
    </div>
  );
};
