'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function SeveritySlider() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialSeverity = searchParams.get('minSeverity') || '0';
  
  const [sliderValue, setSliderValue] = useState(parseInt(initialSeverity, 10));

  useEffect(() => {
    setSliderValue(parseInt(searchParams.get('minSeverity') || '0', 10));
  }, [searchParams]);

  const handleDragEnd = (e: React.MouseEvent<HTMLInputElement> | React.TouchEvent<HTMLInputElement>) => {
    const val = (e.target as HTMLInputElement).value;
    router.push(`/dashboard?minSeverity=${val}`, { scroll: false });
  };

  return (
    <div className="card p-4 border-white/10 bg-black/40 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-bold text-white/80">Filter Map by Minimum Severity</label>
        <span className="badge bg-smc_blue/20 text-smc_blue">{sliderValue}+</span>
      </div>
      <input 
        type="range" 
        min="0" 
        max="100" 
        step="10"
        value={sliderValue}
        onChange={(e) => setSliderValue(parseInt(e.target.value, 10))}
        onMouseUp={handleDragEnd}
        onTouchEnd={(e: any) => handleDragEnd(e)}
        className="w-full accent-smc_blue h-2 bg-white/10 rounded-lg appearance-none cursor-pointer"
      />
      <div className="flex justify-between text-xs text-white/40 font-mono">
        <span>0 (All)</span>
        <span>50 (Moderate)</span>
        <span>100 (Critical)</span>
      </div>
    </div>
  );
}
