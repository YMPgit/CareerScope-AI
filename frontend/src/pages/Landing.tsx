import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Sparkles,
  Radar,
  FileText,
  GitCompareArrows,
  Map,
  Network,
  ShieldCheck,
  Database,
  LineChart,
  Search,
  Cpu,
  Workflow,
  Building2,
  Briefcase,
  TrendingUp,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'

export function Landing() {
  const { user, loading } = useAuth()
  const primaryHref = user ? '/dashboard' : '/signup'
  const primaryLabel = user ? 'Open Dashboard' : 'Get Started'

  return (
    <div className="min-h-screen bg-white text-slate-900 dark:bg-surface-950 dark:text-slate-100">
      <Header user={user} loading={loading} />
      <Hero primaryHref={primaryHref} primaryLabel={primaryLabel} />
      <HowItWorks />
      <MarketIntelligence />
      <Features />
      <AgentArchitecture />
      <WhySection />
      <Footer />
    </div>
  )
}

function Header({ user, loading }: { user: ReturnType<typeof useAuth>['user']; loading: boolean }) {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-100 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-surface-950/80">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white">
            <Sparkles className="h-5 w-5" />
          </span>
          <span className="text-lg font-bold">
            CareerScope <span className="text-brand-600">AI</span>
          </span>
        </div>
        <nav className="hidden items-center gap-8 text-sm font-medium text-slate-600 md:flex dark:text-slate-300">
          <a href="#how-it-works" className="hover:text-slate-900 dark:hover:text-white">How it works</a>
          <a href="#intelligence" className="hover:text-slate-900 dark:hover:text-white">Market intelligence</a>
          <a href="#agents" className="hover:text-slate-900 dark:hover:text-white">Agents</a>
          <a href="#why" className="hover:text-slate-900 dark:hover:text-white">Why CareerScope</a>
        </nav>
        <div className="flex items-center gap-3">
          {user && !loading ? (
            <Link to="/dashboard" className="btn-primary">Dashboard</Link>
          ) : (
            <>
              <Link to="/signin" className="btn-secondary">Sign In</Link>
              <Link to="/signup" className="btn-primary">Get Started</Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}

function Hero({ primaryHref, primaryLabel }: { primaryHref: string; primaryLabel: string }) {
  return (
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-brand-50 to-transparent dark:from-brand-900/10" />
      <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="mx-auto max-w-3xl text-center">
          <p className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-4 py-1.5 text-xs font-semibold text-brand-700 dark:border-brand-800 dark:bg-brand-900/30 dark:text-brand-300">
            <Radar className="h-3.5 w-3.5" />
            Live job-market intelligence, tuned to your career
          </p>
          <h1 className="mt-6 text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
            Turn the live job market into your{' '}
            <span className="bg-gradient-to-r from-brand-600 to-brand-400 bg-clip-text text-transparent">personal career roadmap.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-600 dark:text-slate-300">
            Analyze current job-market demand, compare it with your resume, discover skill gaps, and get a personalized action plan
            powered by live web intelligence and AI agents.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link to={primaryHref} className="btn-primary px-6 py-3 text-base">
              {primaryLabel} <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/signin" className="btn-secondary px-6 py-3 text-base">
              Sign In
            </Link>
          </div>
          <div className="mt-12 grid grid-cols-3 gap-4 text-center">
            {[
              { value: 'Live', label: 'job data' },
              { value: '7+', label: 'AI agents' },
              { value: '30 days', label: 'action plan' },
            ].map((s) => (
              <div key={s.label} className="rounded-2xl border border-slate-100 bg-white/70 p-4 dark:border-slate-800 dark:bg-surface-900/60">
                <p className="text-xl font-bold text-slate-900 dark:text-white">{s.value}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function HowItWorks() {
  const steps = [
    { icon: FileText, title: 'Upload your resume', text: 'We extract your real skills, experience and education — nothing invented.' },
    { icon: Search, title: 'Pick your target role', text: 'Choose the role, city and experience level you want to compete in.' },
    { icon: LineChart, title: 'AI scans the live market', text: 'Fresh job postings are pulled in real time and converted into a structured demand snapshot.' },
    { icon: GitCompareArrows, title: 'Skill gaps surface', text: 'Live demand is compared to your resume, skill by skill.' },
    { icon: Map, title: 'Get your roadmap', text: 'A 30-day plan focused on the gaps that actually matter in the market.' },
  ]
  return (
    <section id="how-it-works" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold">How it works</h2>
        <p className="mt-2 text-slate-500 dark:text-slate-400">Data → Analysis → Evidence → Recommendation → Action</p>
      </div>
      <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-5">
        {steps.map((step, i) => {
          const Icon = step.icon
          return (
            <div key={step.title} className="relative rounded-2xl border border-slate-100 bg-slate-50/60 p-6 dark:border-slate-800 dark:bg-surface-900/60">
              <span className="absolute right-4 top-4 text-4xl font-extrabold text-slate-200 dark:text-slate-700">{i + 1}</span>
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-brand-600 text-white">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-slate-900 dark:text-white">{step.title}</h3>
              <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">{step.text}</p>
            </div>
          )
        })}
      </div>
    </section>
  )
}

function MarketIntelligence() {
  const stats = [
    { icon: Briefcase, label: 'Jobs analyzed', value: 'e.g. 124 live postings' },
    { icon: TrendingUp, label: 'Top demanded skills', value: 'SQL · Python · Power BI' },
    { icon: Building2, label: 'Hiring industries', value: 'Finance · Tech · E-com' },
  ]
  return (
    <section id="intelligence" className="bg-slate-50 py-20 dark:bg-surface-900/40">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-brand-600 dark:text-brand-400">Live market intelligence</p>
            <h2 className="mt-3 text-3xl font-bold">Real numbers, not guesswork</h2>
            <p className="mt-4 text-slate-600 dark:text-slate-300">
              CareerScope AI pulls fresh job postings for your exact role + location, computes objective statistics — skill frequency, work-mode
              availability, experience levels, salary mentions — and then interprets the numbers into clear recommendations.
            </p>
            <ul className="mt-6 space-y-3">
              {[
                'Skill demand shown as % of live job postings',
                'Remote / hybrid / on-site availability counts',
                'Top companies and industries hiring',
                'Evidence links back to the original job postings',
              ].map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                  {f}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-lg dark:border-slate-800 dark:bg-surface-900">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-4 dark:border-slate-800">
              <Database className="h-4 w-4 text-brand-600" />
              <span className="text-sm font-semibold">Live demand feed · Data Analyst — Mumbai</span>
            </div>
            <div className="space-y-4 pt-4">
              {[
                { s: 'SQL', p: 82, c: 'bg-brand-500' },
                { s: 'Excel', p: 71, c: 'bg-brand-500' },
                { s: 'Power BI', p: 64, c: 'bg-amber-500' },
                { s: 'Python', p: 53, c: 'bg-emerald-500' },
                { s: 'Tableau', p: 31, c: 'bg-slate-400' },
              ].map((row) => (
                <div key={row.s}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="font-medium">{row.s}</span>
                    <span className="text-slate-500">{row.p}% of jobs</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 dark:bg-surface-800">
                    <div className={`h-full rounded-full ${row.c}`} style={{ width: `${row.p}%` }} />
                  </div>
                </div>
              ))}
              <p className="pt-2 text-[11px] italic text-slate-400">Illustrative layout — live values come from the retrieved dataset every time.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function Features() {
  const features = [
    { icon: FileText, title: 'Resume skill analysis', text: 'Skills, tools, education, projects and certifications extracted only from your actual resume — hallucination-guarded.' },
    { icon: GitCompareArrows, title: 'Skill-gap detection', text: 'Every demanded skill classified Strong / Partial / Missing with priority and a reason tied to live market data.' },
    { icon: Map, title: 'Personalized roadmap', text: 'A 30-day, week-by-week plan that targets your high-priority market gaps — with projects, practice and interview prep.' },
    { icon: Radar, title: 'Market dashboard', text: 'Interactive charts: skill demand, resume match, and gap distribution — all computed from retrieved jobs.' },
    { icon: BookmarkIcon, title: 'Save jobs', text: 'Bookmark interesting postings and revisit them anytime. Persisted to your account.' },
    { icon: HistoryIcon, title: 'Full history', text: 'Every analysis is saved. Reopen, rename, or re-run any analysis whenever the market moves.' },
  ]
  return (
    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold">Everything you need to plan your career</h2>
        <p className="mt-2 text-slate-500 dark:text-slate-400">Built on live data, analyzed by purpose-built AI agents.</p>
      </div>
      <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {features.map((f) => {
          const Icon = f.icon
          return (
            <div key={f.title} className="rounded-2xl border border-slate-100 p-6 transition-all hover:-translate-y-1 hover:shadow-md dark:border-slate-800">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-900/40 dark:text-brand-300">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{f.text}</p>
            </div>
          )
        })}
      </div>
    </section>
  )
}

function AgentArchitecture() {
  return (
    <section id="agents" className="bg-slate-50 py-20 dark:bg-surface-900/40">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-brand-600 dark:text-brand-400">Multi-agent architecture</p>
          <h2 className="mt-3 text-3xl font-bold">A multi-step AI pipeline, not a chatbot</h2>
          <p className="mx-auto mt-2 max-w-2xl text-slate-500 dark:text-slate-400">
            Specialized AI stages cooperate in a fixed sequence. Each has one job, and the results flow into your personalized report.
          </p>
        </div>
        <div className="mx-auto mt-10 max-w-3xl overflow-x-auto rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-surface-900">
          <div className="flex min-w-[600px] flex-wrap items-center justify-center gap-y-3">
            {['Manager', 'Resume Analyzer', 'Job Market', 'Skill Intelligence', 'Skill Gap', 'Career Planner', 'Insight', 'Persist'].map((node, i, arr) => (
              <div key={node} className="flex items-center">
                <div className="relative flex h-20 w-20 flex-col items-center justify-center gap-1 rounded-2xl border-2 border-brand-200 bg-brand-50 text-center text-[11px] font-semibold text-brand-700 dark:border-brand-800 dark:bg-brand-900/30 dark:text-brand-300">
                  <Cpu className="h-4 w-4" />
                  {node}
                </div>
                {i < arr.length - 1 && <ArrowRight className="mx-1.5 h-4 w-4 text-slate-300 dark:text-slate-600" />}
              </div>
            ))}
          </div>
          <div className="mt-5 flex items-center justify-center gap-2 rounded-xl bg-slate-50 p-3 text-xs text-slate-500 dark:bg-surface-800 dark:text-slate-400">
            <Workflow className="h-4 w-4 text-brand-600" />
            Managed pipeline · progress streamed live to you
          </div>
        </div>
      </div>
    </section>
  )
}

function WhySection() {
  return (
    <section id="why" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <div className="grid items-center gap-12 lg:grid-cols-2">
        <div className="rounded-2xl bg-gradient-to-br from-brand-700 via-brand-600 to-brand-400 p-8 text-white">
          <p className="text-xs font-bold uppercase tracking-widest text-brand-100">The formula</p>
          <div className="mt-6 space-y-3 text-lg font-semibold">
            <p>LIVE MARKET DATA</p>
            <p className="text-brand-200">+</p>
            <p>YOUR RESUME</p>
            <p className="text-brand-200">+</p>
            <p>MULTI-AGENT REASONING</p>
            <div className="mt-6 border-t border-white/20 pt-5 text-xl font-extrabold">
              = PERSONALIZED CAREER INTELLIGENCE
            </div>
          </div>
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-brand-600 dark:text-brand-400">Why CareerScope AI</p>
          <h2 className="mt-3 text-3xl font-bold">Generic advice is not a career plan</h2>
          <p className="mt-4 text-slate-600 dark:text-slate-300">
            Most career guidance ignores what employers actually look for today. CareerScope AI replaces intuition with structured,
            verifiable market signals — and explains every recommendation with the evidence behind it.
          </p>
          <ul className="mt-6 space-y-3">
            {[
              'Every statistic traces back to retrieved job data',
              'Every recommendation is grounded in a skill gap and a reason',
              'Your history, roadmap progress and saved jobs persist forever',
              'Secure accounts: hashed passwords, JWT sessions, ownership checks',
            ].map((f) => (
              <li key={f} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
                <Network className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" />
                {f}
              </li>
            ))}
          </ul>
          <Link to="/signup" className="btn-primary mt-8 px-6 py-3">
            Get Started <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer className="border-t border-slate-100 py-10 dark:border-slate-800">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6 lg:px-8">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 text-white">
            <Sparkles className="h-4 w-4" />
          </span>
          <span className="font-bold">CareerScope AI</span>
        </div>
        <p className="text-xs text-slate-400">AI-powered live job-market intelligence & career planning.</p>
        <div className="flex gap-4 text-xs text-slate-400">
          Make data-driven career moves
        </div>
      </div>
    </footer>
  )
}

function BookmarkIcon(props: { className?: string }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={props.className}><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" /></svg>
}

function HistoryIcon(props: { className?: string }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={props.className}><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /><path d="M12 7v5l4 2" /></svg>
}