'use client';

import { useRouter, useSearchParams } from 'next/navigation';

export default function AreaFilter({ areas }: { areas: string[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentArea = searchParams.get('area') || '';

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    const params = new URLSearchParams(searchParams.toString());
    if (val) {
      params.set('area', val);
    } else {
      params.delete('area');
    }
    router.push(`/dashboard?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="card p-4 border-white/10 bg-black/40 flex flex-col gap-3">
      <label className="text-sm font-bold text-white/80">Select Area / Location</label>
      <select 
        value={currentArea}
        onChange={handleChange}
        className="w-full bg-[#0f0f0f] border border-white/10 rounded-md py-2 px-3 text-sm text-white focus:outline-none focus:border-smc_blue transition-colors cursor-pointer appearance-none"
      >
        <option value="">All Areas</option>
        {areas.map((a, i) => (
          <option key={i} value={a}>{a}</option>
        ))}
      </select>
    </div>
  );
}
