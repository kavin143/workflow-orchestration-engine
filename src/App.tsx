import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { ScreenNavigator } from './components/ScreenNavigator';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { LoginView } from './views/LoginView';
import { DashboardView } from './views/DashboardView';
import { WorkflowListView } from './views/WorkflowListView';
import { CreateWorkflowView } from './views/CreateWorkflowView';
import { WorkflowBuilderView } from './views/WorkflowBuilderView';
import { ExecutionLiveView } from './views/ExecutionLiveView';
import { ExecutionHistoryView } from './views/ExecutionHistoryView';
import { FailureDlqView } from './views/FailureDlqView';
import { MonitoringDashboardView } from './views/MonitoringDashboardView';
import { TenantsView } from './views/TenantsView';
import { ApiKeysView } from './views/ApiKeysView';
import { SettingsView } from './views/SettingsView';
import { CheckCircle2 } from 'lucide-react';

const MainLayout: React.FC = () => {
  const { currentScreen, toast } = useApp();

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800 font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Screen Navigator Bar to jump directly between all 9 screens */}
      <ScreenNavigator />

      {/* Conditional: Screen 1 Login View */}
      {currentScreen === 'login' ? (
        <LoginView />
      ) : (
        <div className="flex-1 flex overflow-hidden h-[calc(100vh-2.25rem)]">
          {/* Left Dark Sidebar matching Screens 2, 3, 5, 6, 7, 8, 9 */}
          <Sidebar />

          {/* Main Content Area with Header */}
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            <Header />

            <main className="flex-1 overflow-y-auto bg-slate-50">
              {currentScreen === 'dashboard' && <DashboardView />}
              {currentScreen === 'workflows' && <WorkflowListView />}
              {currentScreen === 'create-workflow' && <CreateWorkflowView />}
              {currentScreen === 'builder' && <WorkflowBuilderView />}
              {currentScreen === 'execution-live' && <ExecutionLiveView />}
              {currentScreen === 'execution-history' && <ExecutionHistoryView />}
              {currentScreen === 'failure-dlq' && <FailureDlqView />}
              {currentScreen === 'monitoring' && <MonitoringDashboardView />}
              {currentScreen === 'tenants' && <TenantsView />}
              {currentScreen === 'api-keys' && <ApiKeysView />}
              {currentScreen === 'settings' && <SettingsView />}
            </main>
          </div>
        </div>
      )}

      {/* Global Interactive Toast Notification */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2.5 text-xs font-semibold border border-slate-700 animate-slide-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toast}</span>
        </div>
      )}
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
