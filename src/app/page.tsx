import TopBar from '@/components/TopBar';
import Map from '@/components/Map';
import { Search } from 'lucide-react';
import { fetchPublicMap, fetchWardScores } from '@/lib/apiClient';

export default async function PublicPortal() {
  const publicMap = await fetchPublicMap();
  const mockWards = await fetchWardScores();

  const mapMarkers = publicMap.map((inc: any) => ({
    id: inc.id || Math.random().toString(),
    lat: inc.lat,
    lng: inc.lng,
    type: inc.type as any,
    popupData: {
      location_name: inc.location_name || 'Surat Road',
      status_label: inc.status_label || inc.type,
      detected_at: inc.detected_at,
      ...(inc.repaired_at && { repaired_at: inc.repaired_at })
    }
  }));

  const getBarColor = (percentage: number) => {
    if (percentage > 50) return 'bg-severe';
    if (percentage >= 20) return 'bg-moderate';
    return 'bg-repaired';
  };

  return (
    <main className="flex-1 flex flex-col h-screen overflow-hidden bg-[#050505]">
      <TopBar role="public" />
      
      <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 flex flex-col gap-8">
        
        {/* Interactive Map Section */}
        <section className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h1 className="text-2xl font-bold tracking-tight">Live Road Conditions</h1>
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <input 
                type="text" 
                placeholder="Search your area, e.g. Adajan, Vesu..." 
                className="w-full bg-[#0f0f0f] border border-white/10 rounded-full py-2 pl-9 pr-4 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-public_teal transition-colors"
              />
            </div>
          </div>

          <div className="h-[50vh] min-h-[400px] w-full relative rounded-xl overflow-hidden shadow-2xl shadow-black">
            <Map center={[21.1702, 72.8311]} zoom={12} markers={mapMarkers} />
            
            {/* Overlay Map Legend */}
            <div className="absolute bottom-4 right-4 z-[400] card bg-black/80 backdrop-blur-md p-4 flex flex-col gap-2 border-white/10">
              <h3 className="text-xs font-bold text-white/50 uppercase tracking-wider mb-1">Status Legend</h3>
              <div className="flex items-center gap-2 text-sm text-white/80">
                <div className="w-3 h-3 rounded-full bg-severe border-[1.5px] border-[#121212]" />
                Severe — avoid if possible
              </div>
              <div className="flex items-center gap-2 text-sm text-white/80">
                <div className="w-3 h-3 rounded-full bg-moderate border-[1.5px] border-[#121212]" />
                Moderate — drive carefully
              </div>
              <div className="flex items-center gap-2 text-sm text-white/80">
                <div className="w-3 h-3 rounded-full bg-repaired border-[1.5px] border-[#121212]" />
                Repaired — all clear
              </div>
            </div>
          </div>
        </section>

        {/* Ward Health Scores */}
        <section className="flex flex-col gap-4 pb-12">
          <h2 className="text-xl font-bold tracking-tight">Ward health scores — this month</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {mockWards.map((ward: any) => (
              <div key={ward.id} className="card p-4 flex flex-col gap-3 hover:border-white/20 transition-colors group cursor-default">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">{ward.ward_name}</span>
                  <span className="text-xl font-bold tracking-tighter">{ward.damage_percentage}%</span>
                </div>
                
                {/* Progress Bar Container */}
                <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden relative">
                  <div 
                    className={`h-full absolute left-0 top-0 transition-all duration-1000 ease-out group-hover:opacity-100 opacity-90 ${getBarColor(ward.damage_percentage)}`}
                    style={{ width: `${ward.damage_percentage}%` }}
                  />
                </div>
                
                <div className="flex justify-between text-xs text-white/50">
                  <span>Damaged: {ward.damaged_roads}</span>
                  <span>Total: {ward.total_roads}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

      </div>
    </main>
  );
}
