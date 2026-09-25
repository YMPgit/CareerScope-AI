import { useState, FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { AuthLayout } from '@/components/layouts/AuthLayout'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/context/AuthContext'
import { getErrorMessage } from '@/api/client'

interface FieldErrors {
  full_name?: string
  email?: string
  password?: string
  confirm?: string
}

export function Signup() {
  const { signup } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({ full_name: '', email: '', password: '', confirm: '' })
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState('')
  const [loading, setLoading] = useState(false)

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }))

  const validate = (): boolean => {
    const errors: FieldErrors = {}
    if (form.full_name.trim().length < 2) errors.full_name = 'Enter your full name.'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.email = 'Enter a valid email address.'
    if (form.password.length < 8) errors.password = 'Password must be at least 8 characters.'
    if (!/[A-Za-z]/.test(form.password) || !/\d/.test(form.password)) errors.password = 'Must include at least one letter and one number.'
    if (form.confirm !== form.password) errors.confirm = 'Passwords do not match.'
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setFormError('')
    if (!validate()) return

    setLoading(true)
    try {
      await signup({ full_name: form.full_name.trim(), email: form.email, password: form.password })
      toast.success('Account created — welcome to CareerScope AI!')
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setFormError(getErrorMessage(err, 'Could not create your account.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout title="Create your account" subtitle="Start turning the live job market into your career roadmap.">
      <form onSubmit={onSubmit} className="space-y-4">
        {formError && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-300">
            {formError}
          </div>
        )}
        <Input label="Full name" placeholder="Jane Doe" value={form.full_name} onChange={set('full_name')} error={fieldErrors.full_name} autoComplete="name" />
        <Input label="Email" type="email" placeholder="you@example.com" value={form.email} onChange={set('email')} error={fieldErrors.email} autoComplete="email" />
        <Input
          label="Password"
          type="password"
          placeholder="Min. 8 chars, letters + numbers"
          value={form.password}
          onChange={set('password')}
          error={fieldErrors.password}
          autoComplete="new-password"
        />
        <Input label="Confirm password" type="password" placeholder="Repeat your password" value={form.confirm} onChange={set('confirm')} error={fieldErrors.confirm} autoComplete="new-password" />
        <Button type="submit" loading={loading} className="w-full">
          Create Account
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
        Already have an account?{' '}
        <Link to="/signin" className="font-semibold text-brand-600 hover:underline dark:text-brand-400">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  )
}