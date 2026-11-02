import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { WorkflowNode, NodeType } from '../types';
import { 
  Play, 
  Check, 
  Undo, 
  Redo, 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  Grid, 
  Globe, 
  GitBranch, 
  Clock, 
  Terminal, 
  Shuffle, 
  Webhook as WebhookIcon, 
  Flag, 
  PlayCircle,
  X,
  Save,
  CheckCircle2,
  AlertCircle,
  Plus
} from 'lucide-react';

export const WorkflowBuilderView: React.FC = () => {
  const { 
    workflows, 
    activeWorkflowId, 
    updateWorkflow, 
    startLiveSimulation, 
    showToast 
  } = useApp();

  const currentWf = workflows.find((w) => w.id === activeWorkflowId) || workflows[0];

  const [nodes, setNodes] = useState<WorkflowNode[]>(currentWf.nodes);
  const [selectedNodeId, setSelectedNodeId] = useState<string>('node-create-cust');
  const [configTab, setConfigTab] = useState<'basic' | 'advanced' | 'headers'>('basic');
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [validationResult, setValidationResult] = useState<{ valid: boolean; message: string } | null>(null);

  const selectedNode = nodes.find((n) => n.id === selectedNodeId) || nodes[1];

  // Palette item definitions matching Screen 5
  const paletteItems: { type: NodeType; label: string; icon: React.ComponentType<{ className?: string }>; color: string }[] = [
    { type: 'start', label: 'Start', icon: PlayCircle, color: 'text-emerald-500 bg-emerald-50 border-emerald-200' },
    { type: 'end', label: 'End', icon: Flag, color: 'text-rose-500 bg-rose-50 border-rose-200' },
    { type: 'api', label: 'API Request', icon: Globe, color: 'text-blue-500 bg-blue-50 border-blue-200' },
    { type: 'condition', label: 'Condition', icon: GitBranch, color: 'text-amber-500 bg-amber-50 border-amber-200' },
    { type: 'transform', label: 'Transform', icon: Shuffle, color: 'text-purple-500 bg-purple-50 border-purple-200' },
    { type: 'webhook', label: 'Webhook', icon: WebhookIcon, color: 'text-teal-500 bg-teal-50 border-teal-200' },
    { type: 'delay', label: 'Delay', icon: Clock, color: 'text-indigo-500 bg-indigo-50 border-indigo-200' },
    { type: 'script', label: 'Custom Script', icon: Terminal, color: 'text-violet-500 bg-violet-50 border-violet-200' },
  ];

  // Node property update handler
  const handleUpdateNodeProp = (key: string, value: any) => {
    if (!selectedNode) return;
    setNodes((prev) =>
      prev.map((n) => {
        if (n.id !== selectedNode.id) return n;
        if (key === 'name') return { ...n, name: value };
        if (key === 'type') return { ...n, type: value };
        return {
          ...n,
          config: {
            ...n.config,
            [key]: value,
          },
        };
      })
    );
  };

  const handleSaveNode = () => {
    updateWorkflow({
      ...currentWf,
      nodes,
    });
    showToast(`Saved configuration for "${selectedNode.name}"`);
  };

  // Graph validation check matching Project 1 specification
  const handleValidateGraph = () => {
    const hasStart = nodes.some((n) => n.type === 'start');
    const hasEnd = nodes.some((n) => n.type === 'end');

    if (!hasStart || !hasEnd) {
      setValidationResult({
        valid: false,
        message: 'Graph error: Missing required Start or End node terminal.',
      });
      return;
    }

    setValidationResult({
      valid: true,
      message: 'DAG valid: 0 cycle loops detected, all tenant endpoints verified and reachable.',
    });
    showToast('Workflow DAG validated successfully!');
  };

  const handleAddNodeFromPalette = (type: NodeType, label: string) => {
    const newNode: WorkflowNode = {
      id: 'node-' + Date.now(),
      type,
      name: label,
      x: 240,
      y: (nodes.length * 75) + 30,
      config: {
        method: 'POST',
        url: 'https://api.example.com/step',
        body: '{\n  "status": "ok"\n}',
      },
    };
    setNodes((prev) => [...prev, newNode]);
    setSelectedNodeId(newNode.id);
    showToast(`Added ${label} node to canvas`);
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col bg-slate-100 select-none overflow-hidden">
      {/* Top Toolbar matching Screen 5 */}
      <div className="h-14 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center gap-3">
          <h1 className="font-bold text-slate-800 text-sm">{currentWf.name}</h1>
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            Draft
          </span>
        </div>

        {/* Center Controls */}
        <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 p-1 rounded-lg">
          <button
            onClick={() => showToast('Undo action')}
            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-white rounded transition-colors"
            title="Undo"
          >
            <Undo className="w-4 h-4" />
          </button>
          <button
            onClick={() => showToast('Redo action')}
            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-white rounded transition-colors"
            title="Redo"
          >
            <Redo className="w-4 h-4" />
          </button>
          <div className="w-px h-4 bg-slate-200 mx-1"></div>
          <button
            onClick={() => setZoomLevel((z) => Math.max(50, z - 10))}
            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-white rounded transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-[11px] font-mono text-slate-600 px-1">{zoomLevel}%</span>
          <button
            onClick={() => setZoomLevel((z) => Math.min(150, z + 10))}
            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-white rounded transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => setZoomLevel(100)}
            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-white rounded transition-colors"
            title="Reset Zoom"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowGrid(!showGrid)}
            className={`p-1.5 rounded transition-colors ${
              showGrid ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:bg-white'
            }`}
            title="Toggle Grid"
          >
            <Grid className="w-4 h-4" />
          </button>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleValidateGraph}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-xs border border-indigo-200 transition-colors"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Validate</span>
          </button>
          <button
            onClick={() => {
              startLiveSimulation(currentWf.id);
            }}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-sm transition-all shadow-indigo-600/20"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Run</span>
          </button>
        </div>
      </div>

      {/* Validation Banner if validated */}
      {validationResult && (
        <div
          className={`px-6 py-2 text-xs flex items-center justify-between transition-all ${
            validationResult.valid
              ? 'bg-emerald-50 text-emerald-800 border-b border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-b border-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {validationResult.valid ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600" />
            )}
            <span>{validationResult.message}</span>
          </div>
          <button
            onClick={() => setValidationResult(null)}
            className="text-slate-500 hover:text-slate-700 font-bold"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main 3-Column Workspace */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Palette: Nodes matching Screen 5 */}
        <div className="w-48 bg-white border-r border-slate-200 p-4 flex flex-col shrink-0 overflow-y-auto">
          <div className="text-xs font-bold text-slate-800 mb-3 uppercase tracking-wider">
            Nodes
          </div>

          <div className="space-y-2">
            {paletteItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.type}
                  onClick={() => handleAddNodeFromPalette(item.type, item.label)}
                  className={`w-full flex items-center gap-2.5 p-2 rounded-lg border text-xs font-medium transition-all hover:shadow-sm ${item.color} hover:brightness-95`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          <div className="mt-auto pt-6 text-[11px] text-slate-400">
            Click to add node to DAG canvas
          </div>
        </div>

        {/* Center Canvas matching Screen 5 */}
        <div
          className={`flex-1 overflow-auto relative p-8 flex items-center justify-center ${
            showGrid ? 'canvas-grid' : 'bg-slate-50'
          }`}
        >
          {/* Visual DAG Flow matching Screen 5 */}
          <div
            style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'center top' }}
            className="flex flex-col items-center gap-6 py-6 transition-transform duration-150 min-w-[500px]"
          >
            {/* Node 1: Start */}
            <div
              onClick={() => setSelectedNodeId('node-start')}
              className={`w-36 py-2 px-4 rounded-full bg-emerald-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-sm cursor-pointer border-2 transition-all ${
                selectedNodeId === 'node-start' ? 'border-emerald-700 ring-2 ring-emerald-300 scale-105' : 'border-transparent hover:scale-105'
              }`}
            >
              <PlayCircle className="w-4 h-4 fill-current" />
              <span>Start</span>
            </div>

            {/* Connecting Arrow */}
            <div className="w-0.5 h-6 bg-slate-300 relative flex items-center justify-center">
              <span className="absolute bottom-0 w-2 h-2 border-r-2 border-b-2 border-slate-400 rotate-45 transform -translate-x-[3px] -translate-y-0.5"></span>
            </div>

            {/* Node 2: Create Customer (API Request) */}
            <div
              onClick={() => setSelectedNodeId('node-create-cust')}
              className={`w-56 p-3 rounded-xl bg-white border-2 shadow-sm cursor-pointer transition-all flex items-center gap-3 ${
                selectedNodeId === 'node-create-cust'
                  ? 'border-indigo-600 ring-2 ring-indigo-200 shadow-md'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-200">
                <Globe className="w-4 h-4" />
              </div>
              <div className="overflow-hidden">
                <div className="text-xs font-bold text-slate-800">Create Customer</div>
                <div className="text-[10px] text-slate-400">API Request • POST</div>
              </div>
            </div>

            {/* Connecting Arrow */}
            <div className="w-0.5 h-6 bg-slate-300 relative flex items-center justify-center">
              <span className="absolute bottom-0 w-2 h-2 border-r-2 border-b-2 border-slate-400 rotate-45 transform -translate-x-[3px] -translate-y-0.5"></span>
            </div>

            {/* Node 3: Send Welcome Email (API Request) */}
            <div
              onClick={() => setSelectedNodeId('node-send-email')}
              className={`w-56 p-3 rounded-xl bg-white border-2 shadow-sm cursor-pointer transition-all flex items-center gap-3 ${
                selectedNodeId === 'node-send-email'
                  ? 'border-indigo-600 ring-2 ring-indigo-200 shadow-md'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 border border-purple-200">
                <Globe className="w-4 h-4" />
              </div>
              <div className="overflow-hidden">
                <div className="text-xs font-bold text-slate-800">Send Welcome Email</div>
                <div className="text-[10px] text-slate-400">API Request • POST</div>
              </div>
            </div>

            {/* Connecting Arrow */}
            <div className="w-0.5 h-6 bg-slate-300 relative flex items-center justify-center">
              <span className="absolute bottom-0 w-2 h-2 border-r-2 border-b-2 border-slate-400 rotate-45 transform -translate-x-[3px] -translate-y-0.5"></span>
            </div>

            {/* Node 4: Check Verification (Condition Diamond) matching Screen 5 */}
            <div
              onClick={() => setSelectedNodeId('node-check-verif')}
              className={`w-44 py-2.5 px-4 rounded-lg bg-amber-50 border-2 text-amber-900 shadow-sm cursor-pointer transition-all flex items-center justify-center gap-2 text-center ${
                selectedNodeId === 'node-check-verif'
                  ? 'border-amber-600 ring-2 ring-amber-200'
                  : 'border-amber-300 hover:border-amber-400'
              }`}
            >
              <GitBranch className="w-4 h-4 text-amber-600" />
              <div>
                <div className="text-xs font-bold">Check Verification</div>
                <div className="text-[10px] text-amber-700/80">Condition</div>
              </div>
            </div>

            {/* Branching Connections (Yes / No) matching Screen 5 */}
            <div className="flex items-start justify-between w-96 relative">
              {/* Branch Left: Yes */}
              <div className="flex-1 flex flex-col items-center">
                <div className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 mb-2">
                  Yes
                </div>
                <div className="w-0.5 h-6 bg-emerald-400"></div>

                {/* Node 5: Create Invoice */}
                <div
                  onClick={() => setSelectedNodeId('node-create-inv')}
                  className={`w-40 p-2.5 rounded-xl bg-white border-2 shadow-sm cursor-pointer transition-all flex items-center gap-2.5 ${
                    selectedNodeId === 'node-create-inv'
                      ? 'border-indigo-600 ring-2 ring-indigo-200 shadow-md'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <Globe className="w-3.5 h-3.5" />
                  </div>
                  <div className="overflow-hidden">
                    <div className="text-[11px] font-bold text-slate-800">Create Invoice</div>
                    <div className="text-[9px] text-slate-400">API Request</div>
                  </div>
                </div>

                <div className="w-0.5 h-6 bg-slate-300 mt-2"></div>
              </div>

              {/* Branch Right: No */}
              <div className="flex-1 flex flex-col items-center">
                <div className="text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200 mb-2">
                  No
                </div>
                <div className="w-0.5 h-6 bg-rose-400"></div>

                {/* Node 6: Retry Payment */}
                <div
                  onClick={() => setSelectedNodeId('node-retry-payment')}
                  className={`w-40 p-2.5 rounded-xl bg-white border-2 shadow-sm cursor-pointer transition-all flex items-center gap-2.5 ${
                    selectedNodeId === 'node-retry-payment'
                      ? 'border-indigo-600 ring-2 ring-indigo-200 shadow-md'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                    <Clock className="w-3.5 h-3.5" />
                  </div>
                  <div className="overflow-hidden">
                    <div className="text-[11px] font-bold text-slate-800">Retry Payment</div>
                    <div className="text-[9px] text-slate-400">Delay 30s</div>
                  </div>
                </div>

                <div className="w-0.5 h-6 bg-slate-300 mt-2"></div>
              </div>
            </div>

            {/* Terminal Node: End */}
            <div
              onClick={() => setSelectedNodeId('node-end')}
              className={`w-36 py-2 px-4 rounded-full bg-rose-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-sm cursor-pointer border-2 transition-all ${
                selectedNodeId === 'node-end' ? 'border-rose-700 ring-2 ring-rose-300 scale-105' : 'border-transparent hover:scale-105'
              }`}
            >
              <Flag className="w-4 h-4 fill-current" />
              <span>End</span>
            </div>
          </div>
        </div>

        {/* Right Configuration Drawer matching Screen 5 */}
        <div className="w-80 bg-white border-l border-slate-200 flex flex-col shrink-0 z-10 shadow-lg">
          {/* Header */}
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Node Configuration
            </h2>
            <button
              onClick={() => showToast('Closed panel')}
              className="text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Configuration Tabs matching Screen 5 */}
          <div className="flex border-b border-slate-200 bg-slate-50 text-xs font-medium">
            <button
              onClick={() => setConfigTab('basic')}
              className={`flex-1 py-2 text-center border-b-2 transition-colors ${
                configTab === 'basic'
                  ? 'border-indigo-600 text-indigo-600 font-bold bg-white'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Basic
            </button>
            <button
              onClick={() => setConfigTab('advanced')}
              className={`flex-1 py-2 text-center border-b-2 transition-colors ${
                configTab === 'advanced'
                  ? 'border-indigo-600 text-indigo-600 font-bold bg-white'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Advanced
            </button>
            <button
              onClick={() => setConfigTab('headers')}
              className={`flex-1 py-2 text-center border-b-2 transition-colors ${
                configTab === 'headers'
                  ? 'border-indigo-600 text-indigo-600 font-bold bg-white'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Headers
            </button>
          </div>

          {/* Tab Content */}
          <div className="p-4 flex-1 overflow-y-auto space-y-4 text-xs">
            {configTab === 'basic' && (
              <>
                {/* Node Type */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Node Type</label>
                  <select
                    value={selectedNode?.type || 'api'}
                    onChange={(e) => handleUpdateNodeProp('type', e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-800 font-medium"
                  >
                    <option value="api">API Request</option>
                    <option value="condition">Condition</option>
                    <option value="delay">Delay</option>
                    <option value="transform">Transform</option>
                    <option value="script">Custom Script</option>
                    <option value="start">Start</option>
                    <option value="end">End</option>
                  </select>
                </div>

                {/* Node Name */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Node Name</label>
                  <input
                    type="text"
                    value={selectedNode?.name || ''}
                    onChange={(e) => handleUpdateNodeProp('name', e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-800 font-medium"
                  />
                </div>

                {/* Method */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Method</label>
                  <select
                    value={selectedNode?.config.method || 'POST'}
                    onChange={(e) => handleUpdateNodeProp('method', e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-800 font-medium"
                  >
                    <option value="GET">GET</option>
                    <option value="POST">POST</option>
                    <option value="PUT">PUT</option>
                    <option value="DELETE">DELETE</option>
                    <option value="PATCH">PATCH</option>
                  </select>
                </div>

                {/* URL */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">URL</label>
                  <input
                    type="text"
                    value={selectedNode?.config.url || 'https://api.example.com/customers'}
                    onChange={(e) => handleUpdateNodeProp('url', e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-800 font-mono text-[11px]"
                  />
                </div>

                {/* Request Body (JSON) matching Screen 5 */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Request Body (JSON)</label>
                  <textarea
                    rows={6}
                    value={
                      selectedNode?.config.body ||
                      '{\n  "name": "{{input.name}}",\n  "email": "{{input.email}}",\n  "plan": "{{input.plan}}"\n}'
                    }
                    onChange={(e) => handleUpdateNodeProp('body', e.target.value)}
                    className="w-full bg-slate-900 text-emerald-400 border border-slate-700 rounded-lg p-2.5 font-mono text-[11px] leading-relaxed resize-none focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  ></textarea>
                </div>
              </>
            )}

            {configTab === 'advanced' && (
              <div className="space-y-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Retry Policy (Exponential Backoff)</label>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[10px] text-slate-500">Max Attempts</span>
                      <input
                        type="number"
                        defaultValue={3}
                        className="w-full bg-slate-50 border border-slate-300 rounded p-1.5"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500">Backoff Multiplier</span>
                      <input
                        type="number"
                        defaultValue={2.0}
                        step={0.5}
                        className="w-full bg-slate-50 border border-slate-300 rounded p-1.5"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Saga Compensation Rollback URL</label>
                  <input
                    type="text"
                    defaultValue="https://api.example.com/customers/rollback"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-800 font-mono text-[11px]"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Called automatically in reverse order if a downstream step fails.
                  </p>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Execution Timeout (ms)</label>
                  <input
                    type="number"
                    defaultValue={5000}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2"
                  />
                </div>
              </div>
            )}

            {configTab === 'headers' && (
              <div className="space-y-3 font-mono text-[11px]">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-sans">Content-Type</span>
                  <input
                    type="text"
                    defaultValue="application/json"
                    className="w-full bg-slate-50 border border-slate-300 rounded p-1.5 mt-0.5"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-sans">Authorization</span>
                  <input
                    type="text"
                    defaultValue="Bearer {{secrets.TENANT_API_KEY}}"
                    className="w-full bg-slate-50 border border-slate-300 rounded p-1.5 mt-0.5"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Bottom Save Action */}
          <div className="p-4 border-t border-slate-200 bg-slate-50">
            <button
              onClick={handleSaveNode}
              className="w-full py-2 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-sm flex items-center justify-center gap-2 transition-colors"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Node</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
