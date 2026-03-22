'use client';

import { useRouter, useSearchParams } from 'next/navigation';

export default function StateFilter({ states }: { states: string[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentState = searchParams.get('state') || '';

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    const params = new URLSearchParams(searchParams.toString());
    if (val) {
      params.set('state', val);
    } else {
      params.delete('state');
    }
    // Remove area to avoid 0 results when jumping states
    params.delete('area');
    router.push(`/dashboard?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="card p-4 border-white/10 bg-black/40 flex flex-col gap-3">
      <label className="text-sm font-bold text-white/80">Select State</label>
      <select 
        value={currentState}
        onChange={handleChange}
        className="w-full bg-[#0f0f0f] border border-white/10 rounded-md py-2 px-3 text-sm text-white focus:outline-none focus:border-smc_blue transition-colors cursor-pointer appearance-none"
      >
        <option value="">All States / National</option>
        {states.map((s, i) => (
          <option key={i} value={s}>{s}</option>
        ))}
      </select>
    </div>
  );
}
