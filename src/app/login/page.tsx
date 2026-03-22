import { login, signup } from './actions'

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ message?: string }> }) {
  const params = await searchParams;

  return (
    <div className="flex h-screen w-full items-center justify-center bg-[#050505] bg-[url('/grid-pattern.svg')] bg-repeat text-white px-4">
      <form className="animate-in flex-1 flex flex-col w-full justify-center gap-2 max-w-md card p-8 border-white/10 shadow-3xl shadow-black/50">
        <div className="flex flex-col items-center mb-6">
          <div className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center bg-white/5 shadow-[0_0_15px_rgba(255,255,255,0.1)] mb-4">
            <span className="text-xl">🛣️</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">RoadIntel Auth</h1>
          <p className="text-sm text-white/50 mt-1">Sign in to access the Dashboard</p>
        </div>
        
        <label className="text-sm font-semibold text-white/80" htmlFor="email">Email</label>
        <input
          className="rounded-md px-4 py-2 bg-[#0c0c0c] border border-white/10 mb-4 focus:outline-none focus:border-smc_blue transition-colors placeholder:text-white/20"
          name="email"
          placeholder="officer@surat.gov.in"
          required
        />
        
        <label className="text-sm font-semibold text-white/80" htmlFor="password">Password</label>
        <input
          className="rounded-md px-4 py-2 bg-[#0c0c0c] border border-white/10 mb-6 focus:outline-none focus:border-smc_blue transition-colors placeholder:text-white/20"
          type="password"
          name="password"
          placeholder="••••••••"
          required
        />
        
        <button formAction={login} className="bg-smc_blue rounded-md px-4 py-2 text-white font-bold hover:bg-[#154e8c] transition-colors mb-2 shadow-[0_0_15px_rgba(30,128,230,0.3)]">
          Sign In
        </button>
        
        {params?.message && (
          <p className="mt-4 p-3 bg-red-500/10 border border-red-500/20 text-red-500 text-center text-sm font-bold rounded-md">
            {params.message}
          </p>
        )}
      </form>
    </div>
  )
}
