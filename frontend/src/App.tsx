
import { useState } from 'react';
import './App.css';

type Workflow = {
  id: number;
  name: string;
  status: 'Active' | 'Draft' | 'Failed';
  steps: number;
  updated: string;
};

const initialWorkflows: Workflow[] = [
  {
    id: 1,
    name: 'Customer Onboarding',
    status: 'Active',
    steps: 5,
    updated: 'Today',
  },
  {
    id: 2,
    name: 'Payment Processing',
    status: 'Active',
    steps: 4,
    updated: 'Yesterday',
  },
  {
    id: 3,
    name: 'Email Notifications',
    status: 'Draft',
    steps: 3,
    updated: 'Yesterday',
  },
];

function App() {
  const [workflows, setWorkflows] = useState(initialWorkflows);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [workflowName, setWorkflowName] = useState('');

  const filteredWorkflows = workflows.filter((workflow) =>
    workflow.name.toLowerCase().includes(search.toLowerCase())
  );

  function createWorkflow() {
    const name = workflowName.trim();

    if (!name) return;

    const newWorkflow: Workflow = {
      id: Date.now(),
      name,
      status: 'Draft',
      steps: 0,
      updated: 'Just now',
    };

    setWorkflows((current) => [newWorkflow, ...current]);
    setWorkflowName('');
    setShowForm(false);
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <h2 className="brand">Zaalima<span>.</span></h2>
        <p className="sidebar-label">WORKSPACE</p>
        <button className="nav-item selected">▦ Dashboard</button>
        <button className="nav-item">◇ Workflows</button>
        <button className="nav-item">◷ Executions</button>
        <button className="nav-item">⚙ Settings</button>

        <div className="sidebar-bottom">
          <div className="avatar">RK</div>
          <div>
            <strong>Rahul Karan</strong>
            <p>Team Member</p>
          </div>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <span>Workspace / Dashboard</span>
          <span className="connection"><span /> Local workspace</span>
        </header>

        <section className="content">
          <div className="page-heading">
            <div>
              <p className="eyebrow">WORKFLOW MANAGEMENT</p>
              <h1>Dashboard</h1>
              <p className="subtitle">
                Manage your workflows and monitor their activity.
              </p>
            </div>

            <button
              className="primary-button"
              onClick={() => setShowForm(!showForm)}
            >
              + Create Workflow
            </button>
          </div>

          {showForm && (
            <form
              className="create-form"
              onSubmit={(event) => {
                event.preventDefault();
                createWorkflow();
              }}
            >
              <label htmlFor="workflowName">Workflow name</label>
              <input
                id="workflowName"
                value={workflowName}
                onChange={(event) => setWorkflowName(event.target.value)}
                placeholder="e.g. Order Processing"
              />
              <button className="primary-button" type="submit">
                Save Workflow
              </button>
              <button
                className="secondary-button"
                type="button"
                onClick={() => setShowForm(false)}
              >
                Cancel
              </button>
            </form>
          )}

          <div className="stats-grid">
            <div className="stat-card">
              <p>Total Workflows</p>
              <h2>{workflows.length}</h2>
              <span>Created in this session</span>
            </div>
            <div className="stat-card">
              <p>Active Workflows</p>
              <h2>{workflows.filter((w) => w.status === 'Active').length}</h2>
              <span>Ready for execution</span>
            </div>
            <div className="stat-card">
              <p>Draft Workflows</p>
              <h2>{workflows.filter((w) => w.status === 'Draft').length}</h2>
              <span>Not yet activated</span>
            </div>
            <div className="stat-card">
              <p>Failed Workflows</p>
              <h2>{workflows.filter((w) => w.status === 'Failed').length}</h2>
              <span>Need attention</span>
            </div>
          </div>

          <section className="workflow-panel">
            <div className="panel-heading">
              <div>
                <h2>Workflows</h2>
                <p>View and manage your workflow definitions.</p>
              </div>

              <input
                className="search-input"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search workflows..."
                aria-label="Search workflows"
              />
            </div>

            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>WORKFLOW NAME</th>
                    <th>STATUS</th>
                    <th>STEPS</th>
                    <th>LAST UPDATED</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredWorkflows.map((workflow) => (
                    <tr key={workflow.id}>
                      <td>
                        <strong>{workflow.name}</strong>
                        <small>ID: {workflow.id}</small>
                      </td>
                      <td>
                        <span
                          className={`status status-${workflow.status.toLowerCase()}`}
                        >
                          {workflow.status}
                        </span>
                      </td>
                      <td>{workflow.steps}</td>
                      <td>{workflow.updated}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredWorkflows.length === 0 && (
                <p className="empty-state">
                  No workflows found. Try another name.
                </p>
              )}
            </div>

            <div className="panel-footer">
              Showing {filteredWorkflows.length} of {workflows.length} workflows
            </div>
          </section>

          <p className="demo-note">
            Demo data only · Workflows are not connected to the backend yet.
          </p>
        </section>
      </main>
    </div>
  );
}

export default App;