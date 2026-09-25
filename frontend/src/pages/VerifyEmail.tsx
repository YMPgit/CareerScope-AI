import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { CheckCircle2, XCircle } from 'lucide-react'
import { AuthLayout } from '@/components/layouts/AuthLayout'
import { api, getErrorMessage } from '@/api/client'

type State = 'loading' | 'success' | 'error'

export function VerifyEmail() {
  const [params] = useSearchParams()
  const [state, setState] = useState<State>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const token = params.get('token')
    if (!token) {
      setState('error')
      setMessage('This verification link is invalid.')
      return
    }
    api
      .get('/auth/verify-email', { params: { token } })
      .then(() => {
        setState('success')
        setMessage('Your email has been verified.')
      })
      .catch((err) => {
        setState('error')
        setMessage(getErrorMessage(err, 'Verification failed.'))
      })
  }, [params])

  return (
    <AuthLayout title="Email verification" subtitle="One last step.">
      <div className="animate-fade-in">
        {state === 'loading' && <p className="py-8 text-center text-sm text-slate-500">Verifying your email…</p>}
        {state === 'success' && (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-center dark:border-emerald-900/50 dark:bg-emerald-900/20">
            <CheckCircle2 className="h-10 w-10 text-emerald-500" />
            <p className="text-sm font-medium text-emerald-800 dark:text-emerald-200">{message}</p>
            <Link to="/signin" className="btn-primary mt-2">
              Continue to sign in
            </Link>
          </div>
        )}
        {state === 'error' && (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-8 text-center dark:border-red-900/50 dark:bg-red-900/20">
            <XCircle className="h-10 w-10 text-red-500" />
            <p className="text-sm font-medium text-red-700 dark:text-red-300">{message}</p>
            <Link to="/signin" className="btn-secondary mt-2">
              Go to sign in
            </Link>
          </div>
        )}
      </div>
    </AuthLayout>
  )
}