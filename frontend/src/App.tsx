import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useDashboard } from './hooks/useDashboard'
import Layout from './components/Layout'
import DashboardSkeleton from './components/DashboardSkeleton'
import ErrorCard from './components/ErrorCard'
import Pulse from './panels/Pulse'
import Vitals from './panels/Vitals'
import PrescriptionPad from './panels/PrescriptionPad'
import TreatmentPlan from './panels/TreatmentPlan'
import FinancialAnatomy from './panels/FinancialAnatomy'
import CashFlow from './panels/CashFlow'
import FinancialHealthForm from './components/FinancialHealthForm'

export default function App() {
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

  return (
    <BrowserRouter>
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
    </BrowserRouter>
  )
}
