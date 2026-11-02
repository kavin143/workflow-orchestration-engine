import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Cpu, Lock, Mail, Eye, EyeOff, Building, CheckCircle, ArrowRight, ShieldCheck, Zap, GitBranch } from 'lucide-react';

export const LoginView: React.FC = () => {
  const { login, allTenants } = useApp();
  const [email, setEmail] = useState('sarah@acme.com');
  const [password, setPassword] = useState('••••••••••••');
  const [selectedTenantId, setSelectedTenantId] = useState(allTenants[0].id);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      login(email, selectedTenantId);
      setIsLoading(false);
    }, 600);
  };

  const handleQuickDemo = (tId: string, demoEmail: string) => {
    setSelectedTenantId(tId);
    setEmail(demoEmail);
    setIsLoading(true);
    setTimeout(() => {
      login(demoEmail, tId);
      setIsLoading(false);
    }, 400);
  };

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row bg-slate-100 font-sans">
      {/* Left Gradient Hero Banner (matching Screen 1) */}
      <div className="md:w-1/2 bg-gradient-to-br from-indigo-700 via-indigo-600 to-blue-600 p-8 md:p-14 flex flex-col justify-between text-white relative overflow-hidden">
        {/* Subtle background glow circles */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-indigo-500/30 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-blue-500/30 rounded-full blur-3xl pointer-events-none"></div>

        {/* Top Tag */}
        <div className="relative z-10 flex items-center gap-2 text-indigo-100 text-xs font-semibold uppercase tracking-wider">
          <span className="px-2.5 py-1 rounded bg-white/10 backdrop-blur-md border border-white/20">
            Zaalima Internship Project 1
          </span>
          <span>Screen 1 • Authentication</span>
        </div>

        {/* Center Hero Content */}
        <div className="my-auto py-12 relative z-10 max-w-lg">
          <div className="w-20 h-20 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center mb-8 shadow-2xl">
            <Cpu className="w-10 h-10 text-white animate-pulse" />
          </div>

          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight leading-tight">
            Workflow Orchestrator
          </h1>
          <p className="text-xl font-medium text-indigo-100 mt-2">
            Build. Automate. Scale.
          </p>

          <p className="mt-4 text-indigo-100/90 text-sm leading-relaxed">
            Multi-tenant workflow automation with distributed execution, Saga orchestrations, exponential retries, and dead-letter queue recovery.
          </p>

          {/* Feature Highlights matching PDF specification */}
          <div className="mt-8 space-y-3">
            <div className="flex items-center gap-3 text-xs text-indigo-100">
              <div className="p-1.5 rounded-full bg-white/10 text-emerald-300">
                <CheckCircle className="w-3.5 h-3.5" />
              </div>
              <span>Strict Tenant-Aware Isolation on all MongoDB models & executions</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-indigo-100">
              <div className="p-1.5 rounded-full bg-white/10 text-amber-300">
                <GitBranch className="w-3.5 h-3.5" />
              </div>
              <span>Visual DAG builder with cycle detection and loop prevention</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-indigo-100">
              <div className="p-1.5 rounded-full bg-white/10 text-blue-300">
                <Zap className="w-3.5 h-3.5" />
              </div>
              <span>Distributed Saga compensation & Dead-Letter Queue (DLQ) support</span>
            </div>
          </div>
        </div>

        {/* Bottom footer text */}
        <div className="relative z-10 text-xs text-indigo-200/80 flex items-center justify-between border-t border-white/10 pt-4">
          <span>Multi-Tenant Distributed Engine v2.4</span>
          <span>© 2024 Zaalima Project 1</span>
        </div>
      </div>

      {/* Right Login Card (matching Screen 1) */}
      <div className="md:w-1/2 flex items-center justify-center p-6 md:p-12 bg-white">
        <div className="w-full max-w-md space-y-6">
          <div className="text-left">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Welcome Back</h2>
            <p className="text-xs text-slate-500 mt-1">Sign in to your tenant account to continue</p>
          </div>

          {/* Quick Demo Shortcuts Banner */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                Quick 1-Click Demo Profiles
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickDemo('tenant-acme', 'sarah@acme.com')}
                className="text-left p-2 rounded-lg bg-white border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/50 transition-all text-xs"
              >
                <div className="font-semibold text-slate-800">Sarah Jenkins</div>
                <div className="text-[10px] text-indigo-600 font-medium">Acme Corp (Primary)</div>
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemo('tenant-techcorp', 'alex@techcorp.io')}
                className="text-left p-2 rounded-lg bg-white border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/50 transition-all text-xs"
              >
                <div className="font-semibold text-slate-800">Alex Rivera</div>
                <div className="text-[10px] text-slate-500 font-medium">TechCorp Solutions</div>
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Tenant Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Target Organization / Tenant
              </label>
              <div className="relative">
                <Building className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <select
                  value={selectedTenantId}
                  onChange={(e) => setSelectedTenantId(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg pl-9 pr-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all font-medium appearance-none"
                >
                  {allTenants.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.plan} Plan)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Email Field */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Work Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full bg-white border border-slate-300 rounded-lg pl-9 pr-4 py-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white border border-slate-300 rounded-lg pl-9 pr-10 py-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me and Forgot Password */}
            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 cursor-pointer text-slate-600">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                />
                <span>Remember me</span>
              </label>
              <a href="#forgot" onClick={(e) => e.preventDefault()} className="text-indigo-600 hover:underline font-semibold">
                Forgot password?
              </a>
            </div>

            {/* Login Submit Button matching screenshot */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold text-xs shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>Login</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Sign up prompt */}
          <div className="text-center text-xs text-slate-500">
            Don't have an account?{' '}
            <button
              type="button"
              onClick={() => handleQuickDemo('tenant-acme', 'sarah@acme.com')}
              className="text-indigo-600 font-semibold hover:underline"
            >
              Sign up
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
