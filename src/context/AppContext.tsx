import React, { createContext, useContext, useState, useEffect } from 'react';
import { ScreenId, Workflow, ExecutionRecord, Tenant, ExecutionLog } from '../types';
import { initialTenants, initialWorkflows, initialExecutions } from '../mockData';

interface AppContextType {
  currentScreen: ScreenId;
  setCurrentScreen: (screen: ScreenId) => void;
  currentTenant: Tenant;
  setCurrentTenant: (tenant: Tenant) => void;
  allTenants: Tenant[];
  isAuthenticated: boolean;
  login: (email: string, tenantId: string) => void;
  logout: () => void;
  workflows: Workflow[];
  addWorkflow: (wf: Partial<Workflow>) => Workflow;
  updateWorkflow: (wf: Workflow) => void;
  deleteWorkflow: (id: string) => void;
  activeWorkflowId: string;
  setActiveWorkflowId: (id: string) => void;
  executions: ExecutionRecord[];
  selectedExecutionId: string;
  setSelectedExecutionId: (id: string) => void;
  simulationRunning: boolean;
  simulationStep: number;
  simulationLogs: ExecutionLog[];
  startLiveSimulation: (workflowId?: string) => void;
  stopLiveSimulation: () => void;
  rerunFailedExecution: () => void;
  toast: string | null;
  showToast: (msg: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentScreen, setCurrentScreen] = useState<ScreenId>('dashboard');
  const [currentTenant, setCurrentTenant] = useState<Tenant>(initialTenants[0]);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);
  const [workflows, setWorkflows] = useState<Workflow[]>(initialWorkflows);
  const [activeWorkflowId, setActiveWorkflowId] = useState<string>('wf-customer-onboarding');
  const [executions, setExecutions] = useState<ExecutionRecord[]>(initialExecutions);
  const [selectedExecutionId, setSelectedExecutionId] = useState<string>('#1001');
  const [toast, setToast] = useState<string | null>(null);

  // Live simulation states
  const [simulationRunning, setSimulationRunning] = useState<boolean>(false);
  const [simulationStep, setSimulationStep] = useState<number>(3); // start at node 3 running to mirror Screen 6
  const [simulationLogs, setSimulationLogs] = useState<ExecutionLog[]>([
    { id: '1', time: '10:20:01', message: 'Workflow started', level: 'info' },
    { id: '2', time: '10:20:02', message: 'Executing node: Create Customer', level: 'info' },
    { id: '3', time: '10:20:03', message: 'Create Customer completed (1.2s)', level: 'success' },
    { id: '4', time: '10:20:04', message: 'Executing node: Send Welcome Email', level: 'info' },
    { id: '5', time: '10:20:05', message: 'Send Welcome Email completed (0.8s)', level: 'success' },
    { id: '6', time: '10:20:06', message: 'Executing node: Check Verification', level: 'info' },
    { id: '7', time: '10:20:06', message: 'Condition evaluating...', level: 'info' },
    { id: '8', time: '10:20:07', message: 'Still running...', level: 'info' },
  ]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => {
      setToast(null);
    }, 3000);
  };

  const login = (email: string, tenantId: string) => {
    const tenant = initialTenants.find(t => t.id === tenantId) || initialTenants[0];
    setCurrentTenant(tenant);
    setIsAuthenticated(true);
    setCurrentScreen('dashboard');
    showToast(`Welcome back, ${tenant.user}! Signed into ${tenant.name}`);
  };

  const logout = () => {
    setIsAuthenticated(false);
    setCurrentScreen('login');
    showToast('Signed out successfully');
  };

  const addWorkflow = (newWf: Partial<Workflow>): Workflow => {
    const created: Workflow = {
      id: 'wf-' + Date.now(),
      tenantId: currentTenant.id,
      name: newWf.name || 'Untitled Workflow',
      description: newWf.description || 'Custom automated workflow',
      status: 'active',
      updatedAt: 'Just now',
      tags: ['Custom', 'API'],
      nodes: initialWorkflows[0].nodes, // seed with rich DAG
      edges: initialWorkflows[0].edges,
    };
    setWorkflows(prev => [created, ...prev]);
    setActiveWorkflowId(created.id);
    return created;
  };

  const updateWorkflow = (updated: Workflow) => {
    setWorkflows(prev => prev.map(w => (w.id === updated.id ? updated : w)));
    showToast('Workflow saved and validated successfully!');
  };

  const deleteWorkflow = (id: string) => {
    setWorkflows(prev => prev.filter(w => w.id !== id));
    showToast('Workflow deleted');
  };

  // Live simulation ticker
  const startLiveSimulation = (workflowId?: string) => {
    if (workflowId) {
      setActiveWorkflowId(workflowId);
    }
    setSimulationRunning(true);
    setSimulationStep(0);
    const initialLog: ExecutionLog = {
      id: 'init-' + Date.now(),
      time: new Date().toLocaleTimeString(),
      message: 'Workflow started',
      level: 'info',
    };
    setSimulationLogs([initialLog]);
    setCurrentScreen('execution-live');
  };

  const stopLiveSimulation = () => {
    setSimulationRunning(false);
    setSimulationLogs(prev => [
      ...prev,
      {
        id: 'stop-' + Date.now(),
        time: new Date().toLocaleTimeString(),
        message: 'Execution stopped by operator',
        level: 'warn',
      },
    ]);
    showToast('Workflow execution halted');
  };

  const rerunFailedExecution = () => {
    showToast('Re-running Order Processing with Saga DLQ replay...');
    setCurrentScreen('failure-dlq');
  };

  // Simulating live steps when running
  useEffect(() => {
    if (!simulationRunning) return;

    const interval = setInterval(() => {
      setSimulationStep(curr => {
        const next = curr + 1;
        const now = new Date().toLocaleTimeString();

        if (next === 1) {
          setSimulationLogs(prev => [
            ...prev,
            { id: String(Date.now()), time: now, message: 'Executing node: Create Customer', level: 'info' },
          ]);
        } else if (next === 2) {
          setSimulationLogs(prev => [
            ...prev,
            { id: String(Date.now()), time: now, message: 'Create Customer completed (1.2s - 201 Created)', level: 'success' },
            { id: String(Date.now() + 1), time: now, message: 'Executing node: Send Welcome Email', level: 'info' },
          ]);
        } else if (next === 3) {
          setSimulationLogs(prev => [
            ...prev,
            { id: String(Date.now()), time: now, message: 'Send Welcome Email completed (0.8s - 200 OK)', level: 'success' },
            { id: String(Date.now() + 1), time: now, message: 'Executing node: Check Verification', level: 'info' },
            { id: String(Date.now() + 2), time: now, message: 'Condition evaluating: KYC Score >= 75 (true)', level: 'info' },
          ]);
        } else if (next === 4) {
          setSimulationLogs(prev => [
            ...prev,
            { id: String(Date.now()), time: now, message: 'Condition passed -> Routed to Create Invoice', level: 'info' },
            { id: String(Date.now() + 1), time: now, message: 'Executing node: Create Invoice', level: 'info' },
          ]);
        } else if (next === 5) {
          setSimulationLogs(prev => [
            ...prev,
            { id: String(Date.now()), time: now, message: 'Create Invoice completed (0.9s - Invoice #INV-8832)', level: 'success' },
            { id: String(Date.now() + 1), time: now, message: 'Reached terminal node: End', level: 'success' },
            { id: String(Date.now() + 2), time: now, message: 'Workflow completed successfully. Execution took 3.8s', level: 'success' },
          ]);
          setSimulationRunning(false);
          showToast('Workflow execution finished successfully!');
        }
        return next;
      });
    }, 2200);

    return () => clearInterval(interval);
  }, [simulationRunning]);

  return (
    <AppContext.Provider
      value={{
        currentScreen,
        setCurrentScreen,
        currentTenant,
        setCurrentTenant,
        allTenants: initialTenants,
        isAuthenticated,
        login,
        logout,
        workflows,
        addWorkflow,
        updateWorkflow,
        deleteWorkflow,
        activeWorkflowId,
        setActiveWorkflowId,
        executions,
        selectedExecutionId,
        setSelectedExecutionId,
        simulationRunning,
        simulationStep,
        simulationLogs,
        startLiveSimulation,
        stopLiveSimulation,
        rerunFailedExecution,
        toast,
        showToast,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
