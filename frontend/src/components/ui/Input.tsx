import { InputHTMLAttributes, SelectHTMLAttributes, ReactNode, forwardRef } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
  icon?: ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, hint, icon, className = '', ...rest },
  ref,
) {
  return (
    <div>
      {label && <label className="label">{label}</label>}
      <div className="relative">
        {icon && (
          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">{icon}</span>
        )}
        <input ref={ref} className={`input ${icon ? 'pl-10' : ''} ${error ? 'border-red-500' : ''} ${className}`} {...rest} />
      </div>
      {error && <p className="mt-1 text-xs font-medium text-red-600 dark:text-red-400">{error}</p>}
      {hint && !error && <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{hint}</p>}
    </div>
  )
})

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  icon?: ReactNode
  children: ReactNode
}

export function Select({ label, error, icon, children, className = '', ...rest }: SelectProps) {
  return (
    <div>
      {label && <label className="label">{label}</label>}
      <div className="relative">
        {icon && <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">{icon}</span>}
        <select className={`input ${icon ? 'pl-10' : ''} ${error ? 'border-red-500' : ''} ${className}`} {...rest}>
          {children}
        </select>
      </div>
      {error && <p className="mt-1 text-xs font-medium text-red-600 dark:text-red-400">{error}</p>}
    </div>
  )
}