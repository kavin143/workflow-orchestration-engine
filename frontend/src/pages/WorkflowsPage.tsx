
import { Link } from 'react-router-dom'

export default function WorkflowsPage() {
  return (
    <main className="page">
      <section className="panel">
        <h1>Workflows</h1>
        <p>Workflow listing will connect to the backend API next.</p>
        <Link to="/dashboard">Back to dashboard</Link>
      </section>
    </main>
  )
}
