import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Pulse from './panels/Pulse'
import Vitals from './panels/Vitals'
import PrescriptionPad from './panels/PrescriptionPad'
import TreatmentPlan from './panels/TreatmentPlan'
import FinancialAnatomy from './panels/FinancialAnatomy'
import CashFlow from './panels/CashFlow'

export default function App() {
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
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
