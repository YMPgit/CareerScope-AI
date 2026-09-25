import { Routes, Route } from 'react-router-dom'
import { DashboardLayout } from '@/components/layouts/DashboardLayout'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { Landing } from '@/pages/Landing'
import { Signin } from '@/pages/Signin'
import { Signup } from '@/pages/Signup'
import { ForgotPassword } from '@/pages/ForgotPassword'
import { ResetPassword } from '@/pages/ResetPassword'
import { VerifyEmail } from '@/pages/VerifyEmail'
import { Dashboard } from '@/pages/Dashboard'
import { Analyze } from '@/pages/Analyze'
import { AnalysisDetail } from '@/pages/AnalysisDetail'
import { Market } from '@/pages/Market'
import { Skills } from '@/pages/Skills'
import { Roadmap } from '@/pages/Roadmap'
import { History } from '@/pages/History'
import { SavedJobs } from '@/pages/SavedJobs'
import { Profile } from '@/pages/Profile'
import { Settings } from '@/pages/Settings'
import { NotFound } from '@/pages/NotFound'

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<Landing />} />
      <Route path="/signin" element={<Signin />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/verify-email" element={<VerifyEmail />} />

      {/* Protected */}
      <Route
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/analyze" element={<Analyze />} />
        <Route path="/analysis/:id" element={<AnalysisDetail />} />
        <Route path="/market" element={<Market />} />
        <Route path="/skills" element={<Skills />} />
        <Route path="/roadmap" element={<Roadmap />} />
        <Route path="/history" element={<History />} />
        <Route path="/saved-jobs" element={<SavedJobs />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/settings" element={<Settings />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}