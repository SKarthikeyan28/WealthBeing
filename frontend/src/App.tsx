import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useDashboard } from './hooks/useDashboard'
import Layout from './components/Layout'
import DashboardSkeleton from './components/DashboardSkeleton'
import ErrorCard from './components/ErrorCard'
import Login from './components/Login'
import Register from './components/Register'
import Pulse from './panels/Pulse'
import Vitals from './panels/Vitals'
import PrescriptionPad from './panels/PrescriptionPad'
import TreatmentPlan from './panels/TreatmentPlan'
import FinancialAnatomy from './panels/FinancialAnatomy'
import CashFlow from './panels/CashFlow'
import FinancialHealthForm from './components/FinancialHealthForm'
import { apiClient } from './constants/api'
import { useStore } from './store'

function AuthValidator({ children }: { children: React.ReactNode }) {
  const accessToken = useStore((s) => s.accessToken)
  const setAuth = useStore((s) => s.setAuth)
  const clearAuth = useStore((s) => s.clearAuth)

  useEffect(() => {
    if (!accessToken) return
    apiClient
      .get<{ id: string; email: string; name: string }>('/api/auth/me')
      .then((res) => {
        setAuth({ id: res.data.id, email: res.data.email, name: res.data.name }, accessToken)
      })
      .catch(() => clearAuth())
  }, [accessToken, setAuth, clearAuth])

  return <>{children}</>
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthValidator>
        <AppRoutes />
      </AuthValidator>
    </BrowserRouter>
  )
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/*" element={<DashboardOrSkeleton />} />
    </Routes>
  )
}

function DashboardOrSkeleton() {
  const { data, isLoading, isError, error, refetch } = useDashboard()

  if (isLoading && !data) {
    return <DashboardSkeleton />
  }
  if (isError) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center p-6">
        <ErrorCard message={error?.message} onRetry={refetch} />
      </div>
    )
  }
  if (!data) {
    return <DashboardSkeleton />
  }

  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Navigate to="/pulse" replace />} />
        <Route path="pulse" element={<Pulse />} />
        <Route path="vitals" element={<Vitals />} />
        <Route path="prescription" element={<PrescriptionPad />} />
        <Route path="treatment" element={<TreatmentPlan />} />
        <Route path="anatomy" element={<FinancialAnatomy />} />
        <Route path="cashflow" element={<CashFlow />} />
        <Route path="check" element={<FinancialHealthForm />} />
      </Route>
    </Routes>
  )
}
