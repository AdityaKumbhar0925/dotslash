'use client';

import dynamic from 'next/dynamic';

const MapInner = dynamic(() => import('./MapInner'), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full bg-[#0c0c0c] border border-white/10 rounded-[8px] animate-pulse flex items-center justify-center">
      <span className="text-white/50 text-sm">Loading map data...</span>
    </div>
  ),
});

export default function Map(props: any) {
  return <MapInner {...props} />;
}
