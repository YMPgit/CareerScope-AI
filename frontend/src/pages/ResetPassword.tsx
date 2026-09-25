import { useState, FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { AuthLayout } from '@/components/layouts/AuthLayout'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { api, getErrorMessage } from '@/api/client'

export function ResetPassword() {
  const [params] = useSearchParams()
  const token = params.get('token') || ''
  const navigate = useNavigate()

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    if (!token) {
      setError('This reset link is missing its token. Please request a new one.')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }
    setLoading(true)
    try {
      await api.post('/auth/reset-password', { token, new_password: password })
      toast.success('Password updated. Please sign in.')
      navigate('/signin', { replace: true })
    } catch (err) {
      setError(getErrorMessage(err, 'Could not reset password.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout title="Set a new password" subtitle="Choose a strong password to continue.">
      <form onSubmit={onSubmit} className="space-y-4">
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-300">
            {error}
          </div>
        )}
        <Input label="New password" type="password" placeholder="Min. 8 chars, letters + numbers" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />
        <Input label="Confirm new password" type="password" placeholder="Repeat password" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" />
        <Button type="submit" loading={loading} className="w-full">
          Update password
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
        <Link to="/signin" className="font-semibold text-brand-600 hover:underline dark:text-brand-400">
          Back to sign in
        </Link>
      </p>
    </AuthLayout>
  )
}