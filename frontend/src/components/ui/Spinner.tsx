import { Loader2 } from 'lucide-react'

export function Spinner({ size = 'md', className = '' }: { size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const px = { sm: 'h-4 w-4', md: 'h-6 w-6', lg: 'h-10 w-10' }[size]
  return <Loader2 className={`animate-spin ${px} ${className}`} />
}

export function PageLoader({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-24 text-slate-500">
      <Spinner size="lg" className="text-brand-600" />
      <p className="text-sm">{label}</p>
    </div>
  )
}