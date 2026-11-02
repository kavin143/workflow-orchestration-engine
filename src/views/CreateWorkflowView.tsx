import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  FileText, 
  CheckCircle, 
  ArrowLeft, 
  Layers, 
  Sparkles, 
  Sliders, 
  Network, 
  Zap,
  ArrowRight
} from 'lucide-react';

export const CreateWorkflowView: React.FC = () => {
  const { setCurrentScreen, addWorkflow, showToast } = useApp();

  const [name, setName] = useState('Customer Onboarding');
  const [description, setDescription] = useState(
    'Complete customer onboarding process with validation and notification'
  );
  const [template, setTemplate] = useState('scratch');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('Please enter a workflow name');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      const created = addWorkflow({
        name,
        description,
      });
      setIsSubmitting(false);
      showToast(`Created workflow "${name}". Loading Visual DAG Builder...`);
      setCurrentScreen('builder');
    }, 400);
  };

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto space-y-6">
      {/* Top back button */}
      <button
        onClick={() => setCurrentScreen('workflows')}
        className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Workflows</span>
      </button>

      {/* Main Two-Column Card matching Screen 4 */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-[520px]">
        {/* Left Column: Visual feature overview matching Screen 4 */}
        <div className="md:col-span-5 bg-gradient-to-br from-indigo-50/80 via-blue-50/50 to-slate-50 p-8 border-b md:border-b-0 md:border-r border-slate-200 flex flex-col justify-between">
          <div>
            {/* Visual Icon Illustration Box */}
            <div className="w-20 h-20 rounded-2xl bg-white border border-indigo-100 shadow-md flex items-center justify-center text-indigo-600 mb-6">
              <FileText className="w-10 h-10 stroke-[1.5]" />
            </div>

            <h2 className="text-xl font-bold text-slate-900 leading-snug">
              Create automated workflows with visual builder
            </h2>

            {/* Checklist with green checkmarks matching Screen 4 */}
            <div className="mt-8 space-y-4">
              <div className="flex items-center gap-3 text-xs text-slate-700">
                <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                  <CheckCircle className="w-3.5 h-3.5" />
                </div>
                <span className="font-medium">Drag and drop nodes</span>
              </div>

              <div className="flex items-center gap-3 text-xs text-slate-700">
                <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                  <CheckCircle className="w-3.5 h-3.5" />
                </div>
                <span className="font-medium">Connect and configure</span>
              </div>

              <div className="flex items-center gap-3 text-xs text-slate-700">
                <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                  <CheckCircle className="w-3.5 h-3.5" />
                </div>
                <span className="font-medium">Validate before running</span>
              </div>

              <div className="flex items-center gap-3 text-xs text-slate-700">
                <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                  <CheckCircle className="w-3.5 h-3.5" />
                </div>
                <span className="font-medium">Execute with real-time tracking</span>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-200/60 text-[11px] text-slate-400">
            Tenant isolation enabled • Multi-tenant safe
          </div>
        </div>

        {/* Right Column: Form matching Screen 4 */}
        <div className="md:col-span-7 p-8 md:p-10 flex flex-col justify-between">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Create New Workflow</h1>
              <p className="text-xs text-slate-500 mt-1">Provide basic information for your workflow</p>
            </div>

            {/* Workflow Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Workflow Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Customer Onboarding"
                className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all font-medium"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Description
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Complete customer onboarding process with validation and notification"
                className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all resize-none"
              ></textarea>
            </div>

            {/* Select Template */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Select Template (Optional)
              </label>
              <select
                value={template}
                onChange={(e) => setTemplate(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all font-medium"
              >
                <option value="scratch">Start from scratch</option>
                <option value="customer">Customer Onboarding (API + Email + Branching)</option>
                <option value="order">Order Processing & Saga Retry (Payment + DLQ)</option>
                <option value="invoice">Invoice Generation & Dispatch</option>
              </select>
            </div>

            {/* Action Buttons matching Screen 4 */}
            <div className="pt-6 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setCurrentScreen('workflows')}
                className="px-4 py-2.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold text-xs transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold text-xs shadow-md shadow-indigo-600/20 transition-all flex items-center gap-2 disabled:opacity-70"
              >
                {isSubmitting ? (
                  <span>Generating DAG...</span>
                ) : (
                  <>
                    <span>Create Workflow</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
