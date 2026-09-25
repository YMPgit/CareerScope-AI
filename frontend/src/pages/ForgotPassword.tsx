import { useState, FormEvent } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Mail, CheckCircle2 } from 'lucide-react'
import { AuthLayout } from '@/components/layouts/AuthLayout'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { api, getErrorMessage } from '@/api/client'

export function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    if (!email) {
      setError('Enter your email address.')
      return
    }
    setLoading(true)
    try {
      await api.post('/auth/forgot-password', { email })
      setSent(true)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <AuthLayout title="Check your email" subtitle="Password reset instructions are on the way.">
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-center dark:border-emerald-900/50 dark:bg-emerald-900/20">
          <CheckCircle2 className="h-10 w-10 text-emerald-500" />
          <p className="text-sm text-emerald-800 dark:text-emerald-200">
            If an account exists for <span className="font-semibold">{email}</span>, a reset link has been sent. Follow the link to set a
            new password.
          </p>
          <Link to="/signin" className="text-sm font-semibold text-brand-600 hover:underline dark:text-brand-400">
            Back to sign in
          </Link>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout title="Forgot your password?" subtitle="We'll email you a secure link to reset it.">
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="flex items-center gap-3 rounded-xl bg-brand-50 p-3 text-sm text-brand-800 dark:bg-brand-900/30 dark:text-brand-200">
          <Mail className="h-4 w-4 shrink-0" />
          <span>Enter the email address linked to your CareerScope AI account.</span>
        </div>
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-300">
            {error}
          </div>
        )}
        <Input label="Email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
        <Button type="submit" loading={loading} className="w-full">
          Send reset link
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
        Remembered it?{' '}
        <Link to="/signin" className="font-semibold text-brand-600 hover:underline dark:text-brand-400">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  )
}