'use client';

import { Search } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function PublicSearchBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [val, setVal] = useState(searchParams.get('q') || '');

  useEffect(() => {
    const handler = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (val) {
        params.set('q', val);
      } else {
        params.delete('q');
      }
      router.push(`/?${params.toString()}`, { scroll: false });
    }, 400);

    return () => clearTimeout(handler);
  }, [val, router, searchParams]);

  return (
    <div className="relative w-full sm:max-w-xs">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
      <input 
        type="text" 
        value={val}
        onChange={(e) => setVal(e.target.value)}
        placeholder="Search your area, e.g. Adajan, Vesu..." 
        className="w-full bg-[#0f0f0f] border border-white/10 rounded-full py-2 pl-9 pr-4 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-public_teal transition-colors"
      />
    </div>
  );
}
