
import { Link } from 'react-router-dom'
import { useAuth } from '../features/auth/AuthContext'

export default function DashboardPage() {
  const { logout } = useAuth()

  return (
    <main className="page">
      <section className="panel">
        <h1>Dashboard</h1>
        <p>Welcome to the Zaalima Workflow Orchestration Engine.</p>

        <nav className="page-links">
          <Link to="/workflows">Workflows</Link>
          <Link to="/executions">Executions</Link>
        </nav>

        <button onClick={logout}>Log out</button>
      </section>
    </main>
  )
}
