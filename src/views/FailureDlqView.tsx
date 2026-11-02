import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  RotateCcw, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  ArrowDown, 
  Terminal, 
  FileCode, 
  ShieldAlert, 
  Layers, 
  Check, 
  RefreshCw,
  Send,
  Sparkles
} from 'lucide-react';

export const FailureDlqView: React.FC = () => {
  const { rerunFailedExecution, setCurrentScreen, showToast } = useApp();
  const [activeTab, setActiveTab] = useState<'logs' | 'retry-details'>('logs');
  const [compensationTriggered, setCompensationTriggered] = useState(false);
  const [dlqReplayed, setDlqReplayed] = useState(false);

  const handleManualReplay = () => {
    setDlqReplayed(true);
    showToast('Replaying Dead Letter Queue payload to worker queue...');
    setTimeout(() => {
      showToast('Payload re-injected into worker-1 for re-processing');
    }, 1500);
  };

  const handleManualCompensation = () => {
    setCompensationTriggered(true);
    showToast('Executing backward Saga compensation chain...');
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col bg-slate-100 select-none overflow-hidden">
      {/* Top Header matching Screen 8 */}
      <div className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center gap-3">
          <h1 className="font-bold text-slate-900 text-sm md:text-base">
            Execution: Order Processing
          </h1>
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1.5 shadow-sm">
            <XCircle className="w-3.5 h-3.5 text-rose-600" />
            Failed
          </span>
          <span className="hidden sm:inline-block text-[11px] font-mono text-slate-400">
            Execution ID: #1000 • Tenant: Acme Corp
          </span>
        </div>

        {/* Action button matching Screen 8 */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={rerunFailedExecution}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-sm transition-all shadow-indigo-600/20"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Re-run</span>
          </button>
          <button
            onClick={() => setCurrentScreen('execution-history')}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors"
          >
            <span>Back to History</span>
          </button>
        </div>
      </div>

      {/* Main Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Center Canvas with Failure, Retries, and DLQ matching Screen 8 */}
        <div className="flex-1 overflow-auto p-8 flex items-center justify-center canvas-grid">
          <div className="flex flex-col items-center gap-4 py-4 min-w-[550px]">
            {/* Start Node */}
            <div className="w-36 py-2 px-4 rounded-full bg-emerald-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-sm">
              <CheckCircle2 className="w-4 h-4" />
              <span>Start</span>
            </div>

            <div className="w-0.5 h-6 bg-emerald-400"></div>

            {/* Failed Node: Process Payment with Retry Branch matching Screen 8 */}
            <div className="flex items-center gap-6">
              {/* Process Payment Node */}
              <div className="w-56 p-3 rounded-xl bg-rose-50/60 border-2 border-rose-500 shadow-sm flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                  <XCircle className="w-4 h-4" />
                </div>
                <div className="overflow-hidden flex-1">
                  <div className="text-xs font-bold text-slate-900">Process Payment</div>
                  <div className="text-[10px] text-rose-600 font-semibold">Failed (504 Timeout)</div>
                </div>
              </div>

              {/* Retry Flow Bracket matching Screen 8 */}
              <div className="flex flex-col gap-1.5 border-l-2 border-dashed border-rose-300 pl-4 py-1">
                <div className="px-2.5 py-1 rounded bg-rose-50 border border-rose-200 text-rose-700 text-[10px] font-semibold flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                  Retry 1 (Failed)
                </div>
                <div className="px-2.5 py-1 rounded bg-rose-50 border border-rose-200 text-rose-700 text-[10px] font-semibold flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                  Retry 2 (Failed)
                </div>
                <div className="px-2.5 py-1 rounded bg-rose-50 border border-rose-200 text-rose-700 text-[10px] font-semibold flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                  Retry 3 (Failed)
                </div>
              </div>
            </div>

            {/* Connecting arrow with DLQ Branch matching Screen 8 */}
            <div className="flex flex-col items-center">
              <div className="w-0.5 h-6 bg-rose-400"></div>
              {/* Move to DLQ Card matching Screen 8 */}
              <div className="my-1 px-4 py-2 rounded-xl bg-rose-600 text-white shadow-md flex items-center gap-2 text-xs font-bold border border-rose-700">
                <ArrowDown className="w-4 h-4 text-rose-200" />
                <span>Move to DLQ</span>
              </div>
              <div className="w-0.5 h-6 bg-slate-300"></div>
            </div>

            {/* Send Notification Node matching Screen 8 */}
            <div className="w-56 p-3 rounded-xl bg-white border border-slate-300 shadow-sm flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                <Send className="w-4 h-4" />
              </div>
              <div className="overflow-hidden flex-1">
                <div className="text-xs font-bold text-slate-800">Send Notification</div>
                <div className="text-[10px] text-slate-500">Alert Tenant Ops</div>
              </div>
            </div>

            <div className="w-0.5 h-6 bg-slate-300"></div>

            {/* End Node */}
            <div className="w-36 py-2 px-4 rounded-full bg-slate-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-sm">
              <CheckCircle2 className="w-4 h-4" />
              <span>End</span>
            </div>
          </div>
        </div>

        {/* Right Drawer matching Screen 8: Execution Logs & Retry Details */}
        <div className="w-96 bg-white border-l border-slate-200 flex flex-col shrink-0 shadow-lg">
          {/* Tabs matching Screen 8 */}
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
              onClick={() => setActiveTab('retry-details')}
              className={`flex-1 py-3 text-center border-b-2 transition-colors flex items-center justify-center gap-1.5 ${
                activeTab === 'retry-details'
                  ? 'border-indigo-600 text-indigo-600 font-bold bg-white'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Retry Details</span>
            </button>
          </div>

          {/* Logs View matching Screen 8 */}
          {activeTab === 'logs' && (
            <div className="flex-1 p-4 overflow-y-auto space-y-2 font-mono text-[11px] bg-slate-900 text-slate-300">
              <div className="text-[10px] text-slate-400 font-sans uppercase font-bold border-b border-slate-800 pb-2 mb-2 flex items-center justify-between">
                <span>Failure & Retry Stream</span>
                <span className="text-rose-400 font-semibold">Exhausted</span>
              </div>

              <div className="flex items-start gap-2 text-slate-400">
                <span className="font-semibold text-slate-400">10:15:01</span>
                <span className="text-indigo-300">Workflow started</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-semibold text-slate-400">10:15:02</span>
                <span className="text-rose-400">Process Payment - Failed</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-semibold text-slate-400">10:15:32</span>
                <span className="text-amber-400">Retry 1 (Failed)</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-semibold text-slate-400">10:16:02</span>
                <span className="text-amber-400">Retry 2 (Failed)</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-semibold text-slate-400">10:16:32</span>
                <span className="text-amber-400">Retry 3 (Failed)</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-semibold text-slate-400">10:16:33</span>
                <span className="text-rose-400 font-bold">Moved to DLQ</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-semibold text-slate-400">10:16:34</span>
                <span className="text-rose-500 font-bold">Workflow marked as Failed</span>
              </div>

              {compensationTriggered && (
                <div className="mt-3 p-2 rounded bg-amber-950/80 border border-amber-800 text-amber-300 text-[10px]">
                  <div>✔ Saga rollback executed: SKU locks released</div>
                  <div>✔ Payment reservation cancelled on Stripe gateway</div>
                </div>
              )}
            </div>
          )}

          {/* Retry Details Tab */}
          {activeTab === 'retry-details' && (
            <div className="flex-1 p-5 overflow-y-auto space-y-4 text-xs">
              <div className="p-3.5 bg-rose-50 rounded-xl border border-rose-200 text-rose-800">
                <div className="font-bold text-xs flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-rose-600" />
                  <span>Max Retries Exhausted (3 / 3)</span>
                </div>
                <div className="text-[11px] mt-1 text-rose-700">
                  HTTP 504 Gateway Timeout connecting to payments upstream.
                </div>
              </div>

              <div className="space-y-3">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="font-semibold text-slate-700 text-[11px]">Dead-Letter Queue Topic</div>
                  <div className="font-mono text-indigo-600 text-[11px] mt-0.5">orders.dead-letter-queue.v1</div>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="font-semibold text-slate-700 text-[11px]">Backoff Strategy</div>
                  <div className="text-slate-600 text-[11px] mt-0.5">Exponential Backoff: 30s → 60s → 90s</div>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="font-semibold text-slate-700 text-[11px]">Saga Compensation Action</div>
                  <div className="text-slate-600 text-[11px] mt-0.5">
                    Revert inventory hold and release credit lock.
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 space-y-2">
                <button
                  onClick={handleManualReplay}
                  disabled={dlqReplayed}
                  className="w-full py-2.5 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-60"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>{dlqReplayed ? 'Replay Sent to Queue' : 'Manual DLQ Replay'}</span>
                </button>

                <button
                  onClick={handleManualCompensation}
                  disabled={compensationTriggered}
                  className="w-full py-2 px-3 rounded-lg border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-800 font-semibold text-xs transition-colors flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span>{compensationTriggered ? 'Compensation Completed' : 'Trigger Saga Rollback'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Bottom Footer */}
          <div className="p-3 bg-slate-50 border-t border-slate-200 text-[11px] text-slate-500 flex items-center justify-between">
            <span>DLQ Message ID: msg_9941</span>
            <span className="font-bold text-rose-600">3 Retries Failed</span>
          </div>
        </div>
      </div>
    </div>
  );
};
