import { useState, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { KeyRound, LogOut, ShieldAlert, Trash2 } from 'lucide-react'
import { api, getErrorMessage } from '@/api/client'
import { useAuth } from '@/context/AuthContext'
import { Card, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'

export function Settings() {
  const { logout } = useAuth()
  const navigate = useNavigate()

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [changing, setChanging] = useState(false)

  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const changePassword = async (e: FormEvent) => {
    e.preventDefault()
    if (newPassword.length < 8) {
      toast.error('New password must be at least 8 characters.')
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match.')
      return
    }
    setChanging(true)
    try {
      await api.put('/settings/password', {
        current_password: currentPassword,
        new_password: newPassword,
      })
      toast.success('Password changed')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setChanging(false)
    }
  }

  const deleteAccount = async () => {
    setDeleting(true)
    try {
      await api.delete('/settings/account')
      toast.success('Your account and data have been deleted.')
      await logout()
      navigate('/')
    } catch (err) {
      setDeleting(false)
      setConfirmDelete(false)
      toast.error(getErrorMessage(err, 'Could not delete account.'))
    }
  }

  return (
    <div className="mx-auto max-w-2xl animate-fade-in space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Settings</h1>
        <p className="mt-1 text-slate-500 dark:text-slate-400">Security and account management.</p>
      </div>

      <Card>
        <CardHeader title="Change password" subtitle="Use at least 8 characters, with a mix of letters, numbers and symbols." />
        <form onSubmit={changePassword} className="space-y-4">
          <Input label="Current password" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} icon={<KeyRound className="h-4 w-4" />} autoComplete="current-password" />
          <Input label="New password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} icon={<KeyRound className="h-4 w-4" />} autoComplete="new-password" />
          <Input label="Confirm new password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} icon={<KeyRound className="h-4 w-4" />} autoComplete="new-password" />
          <div className="flex justify-end">
            <Button type="submit" loading={changing}>
              Update password
            </Button>
          </div>
        </form>
      </Card>

      <Card>
        <CardHeader title="Session" subtitle="Sign out of this device." />
        <div className="flex justify-end">
          <Button
            variant="secondary"
            icon={<LogOut className="h-4 w-4" />}
            onClick={async () => {
              await logout()
              navigate('/')
            }}
          >
            Sign out
          </Button>
        </div>
      </Card>

      <div className="rounded-2xl border border-red-200 p-6 dark:border-red-900/50">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-300">
            <ShieldAlert className="h-5 w-5" />
          </span>
          <div className="flex-1">
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">Danger zone</h3>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              Deleting your account permanently removes all analyses, resumes, saved jobs and your roadmap. This action cannot be
              undone.
            </p>
          </div>
          <Button variant="danger" icon={<Trash2 className="h-4 w-4" />} onClick={() => setConfirmDelete(true)}>
            Delete account
          </Button>
        </div>
      </div>

      <Modal open={confirmDelete} onClose={() => setConfirmDelete(false)} title="Delete your account?">
        <p className="text-sm text-slate-600 dark:text-slate-300">
          This permanently deletes your profile, all analyses, stored resumes, saved jobs and roadmap progress. You will lose
          access immediately.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setConfirmDelete(false)}>Cancel</Button>
          <Button variant="danger" loading={deleting} onClick={deleteAccount}>Yes, delete everything</Button>
        </div>
      </Modal>
    </div>
  )
}