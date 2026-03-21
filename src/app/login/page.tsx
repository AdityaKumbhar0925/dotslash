'use client';

import { useState } from 'react';
import { login } from '@/app/actions/auth';
import { Lock, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    const formData = new FormData(e.currentTarget);
    const result = await login(formData);
    
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#050505] relative overflow-hidden p-4">
      
      {/* Background Decor */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-smc_blue/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-public_teal/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="card w-full max-w-sm p-8 z-10 border-white/10 bg-black/50 backdrop-blur-xl flex flex-col items-center">
        
        <div className="w-14 h-14 bg-smc_blue/10 rounded-full flex items-center justify-center mb-6 shadow-[0_0_24px_rgba(24,95,165,0.3)]">
          <Lock className="w-6 h-6 text-smc_blue" />
        </div>
        
        <h1 className="text-2xl font-bold text-white tracking-tight mb-2">Staff Portal</h1>
        <p className="text-white/50 text-sm text-center mb-8">
          Sign in to the Surat Municipal Corporation Command Center.
        </p>

        {error && (
          <div className="w-full bg-severe/10 border border-severe/30 text-severe text-xs font-medium px-4 py-3 rounded-md mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-white/70 uppercase tracking-wider">Username</label>
            <input 
              type="text" 
              name="username"
              required
              placeholder="admin"
              className="w-full bg-white/5 border border-white/10 rounded-md px-4 py-2.5 text-white placeholder:text-white/30 focus:outline-none focus:border-smc_blue/50 focus:ring-1 focus:ring-smc_blue transition-all"
            />
          </div>
          
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-white/70 uppercase tracking-wider">Password</label>
            <input 
              type="password" 
              name="password"
              required
              placeholder="••••••••"
              className="w-full bg-white/5 border border-white/10 rounded-md px-4 py-2.5 text-white placeholder:text-white/30 focus:outline-none focus:border-smc_blue/50 focus:ring-1 focus:ring-smc_blue transition-all"
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="mt-4 w-full bg-smc_blue hover:bg-[#154e8c] text-white font-bold py-3 rounded-md transition-all flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-smc_blue/20"
          >
            {loading ? 'Authenticating...' : 'Sign In'}
            {!loading && <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
          </button>
        </form>

        <div className="w-full border-t border-white/10 mt-8 pt-6 flex justify-center">
          <Link href="/" className="text-xs text-white/40 hover:text-white transition-colors underline underline-offset-4">
            ← Return to Public Transparency Portal
          </Link>
        </div>
      </div>

    </main>
  );
}
