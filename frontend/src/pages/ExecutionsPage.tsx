
import { Link } from 'react-router-dom'

export default function ExecutionsPage() {
  return (
    <main className="page">
      <section className="panel">
        <h1>Executions</h1>
        <p>Execution history will connect to the backend API next.</p>
        <Link to="/dashboard">Back to dashboard</Link>
      </section>
    </main>
  )
}
