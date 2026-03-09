import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useStore } from '../store'
import { colours } from '../constants/theme'
import { apiClient } from '../constants/api'

export default function Login() {
  const navigate = useNavigate()
  const setAuth = useStore((s) => s.setAuth)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { data } = await apiClient.post<{ user: { id: string; email: string; name: string }; access_token: string }>(
        '/api/auth/login',
        { email, password }
      )
      setAuth(
        { id: data.user.id, email: data.user.email, name: data.user.name },
        data.access_token
      )
      navigate('/pulse', { replace: true })
    } catch (err: unknown) {
      const msg = err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
        : 'Login failed'
      setError(typeof msg === 'string' ? msg : Array.isArray(msg) ? msg[0] : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-6">
        <div>
          <h1 className="text-xl font-bold text-white">Sign in</h1>
          <p className="text-sm text-text-muted mt-1">Wealth Wellness Hub</p>
        </div>
        <form onSubmit={handleSubmit} className="rounded-xl border border-border bg-surface p-5 space-y-4">
          {error && (
            <p className="text-sm" style={{ color: colours.red }} role="alert">
              {error}
            </p>
          )}
          <div>
            <label className="block text-xs text-text-muted mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:border-teal"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="block text-xs text-text-muted mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:border-teal"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl text-sm font-semibold text-bg disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
            style={{ backgroundColor: colours.teal }}
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
          <p className="text-center text-sm text-text-muted">
            Don’t have an account?{' '}
            <Link to="/register" className="text-teal hover:underline" style={{ color: colours.teal }}>
              Register
            </Link>
          </p>
        </form>
        <p className="text-center">
          <Link to="/" className="text-sm text-text-muted hover:text-white">
            Continue as demo
          </Link>
        </p>
      </div>
    </div>
  )
}
