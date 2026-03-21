import TopBar from '@/components/TopBar';
import Map from '@/components/Map';
import { Download } from 'lucide-react';
import { fetchIncidentsMap, fetchTriageList, fetchActiveCracks, fetchFleetStatus } from '@/lib/apiClient';
import { exportActiveIncidentsAction, simulateWebhookSyncAction, exportSingleIncidentAction } from '@/app/actions/sheets';
import SeveritySlider from '@/components/SeveritySlider';

export const dynamic = 'force-dynamic';

export default async function Dashboard({ searchParams }: { searchParams: Promise<{ minSeverity?: string }> }) {
  const params = await searchParams;
  const minSev = parseInt(params?.minSeverity || '0', 10);

  const rawMapData = await fetchIncidentsMap();
  const rawTriageList = await fetchTriageList();
  
  const mapData = rawMapData.filter((i: any) => (i.severity_score || 0) >= minSev);
  const triageList = rawTriageList.filter((i: any) => (i.severity_score || 0) >= minSev);
  const crackTable = await fetchActiveCracks();
  const mockFleet = await fetchFleetStatus();

  const mapMarkers = mapData.map((inc: any) => ({
    id: inc.id || Math.random().toString(),
    lat: inc.lat,
    lng: inc.lng,
    type: inc.type as any,
    popupData: {
      location_name: inc.location_name || 'Location',
      severity_score: inc.severity_score,
      buses_per_day: inc.buses_per_day,
      detected_at: inc.detected_at,
      ...(inc.fix_deadline_days && { fix_deadline_days: inc.fix_deadline_days })
    }
  }));

  const activeIncidents = mapData.length;
  const repairedThisWeek = 142; // static mock
  const fleetSynced = mockFleet.filter((f: any) => f.status === 'synced').length;

  return (
    <main className="flex-1 flex flex-col h-screen overflow-hidden bg-[#050505]">
      <TopBar role="government_official" />
      
      <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 flex flex-col xl:flex-row gap-6 lg:gap-8 xl:gap-10">
        
        {/* Left Column - Main Content */}
        <div className="flex-1 flex flex-col gap-6 xl:gap-8 min-w-0">
          
          {/* Metric Cards */}
          <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="card p-5 border-severe/30 bg-severe/5 group">
              <h3 className="text-white/60 text-sm font-medium">Active Incidents</h3>
              <p className="text-3xl font-bold mt-2 text-severe">{activeIncidents}</p>
            </div>
            <div className="card p-5 border-repaired/30 bg-repaired/5">
              <h3 className="text-white/60 text-sm font-medium">Repaired this week</h3>
              <p className="text-3xl font-bold mt-2 text-repaired">{repairedThisWeek}</p>
            </div>
            <div className="card p-5 border-white/20">
              <h3 className="text-white/60 text-sm font-medium">Buses synced today</h3>
              <p className="text-3xl font-bold mt-2 text-white">{fleetSynced} <span className="text-white/40 text-lg">/ {mockFleet.length}</span></p>
            </div>
          </section>

          {/* Interactive Map */}
          <section className="card p-1 h-[50vh] min-h-[400px] flex flex-col relative w-full overflow-hidden">
            <Map center={[21.1702, 72.8311]} zoom={12} markers={mapMarkers} />
            <div className="absolute bottom-4 left-4 z-[400] card bg-black/80 backdrop-blur-md p-3 px-4 flex items-center gap-4 border-white/10 shadow-xl shadow-black">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-white/60">
                <div className="w-2.5 h-2.5 rounded-full bg-severe shadow-[0_0_8px_#E24B4A]"></div> Pothole
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-white/60">
                <div className="w-2.5 h-2.5 rotate-45 bg-early_crack shadow-[0_0_8px_#7F77DD]"></div> Early Crack
              </div>
            </div>
          </section>

          {/* Early Crack Detection Table */}
          <section className="card flex flex-col overflow-hidden border-early_crack/30">
            <div className="p-5 border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-early_crack/5">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <div className="w-2 h-2 rotate-45 bg-early_crack shadow-[0_0_8px_#7F77DD]"></div>
                  ML Crack Detection <span className="badge bg-early_crack/20 text-early_crack ml-2">{crackTable.length} pending</span>
                </h2>
                <p className="text-sm text-white/50 mt-1 max-w-xl">Detected by edge AI model. Sealing now costs ~₹8/m² vs ₹400/m² once a pothole forms.</p>
              </div>
              <form action={exportActiveIncidentsAction}>
                <button type="submit" className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-early_crack hover:bg-early_crack/80 text-white text-xs font-bold transition-all shadow-lg shadow-early_crack/20">
                  <Download className="w-3.5 h-3.5" />
                  Export to Sheet
                </button>
              </form>
            </div>
            <div className="overflow-auto max-h-[400px]">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-[#0c0c0c] sticky top-0 z-10 text-white/50 border-b border-white/10">
                  <tr>
                    <th className="p-4 font-semibold">Location</th>
                    <th className="p-4 font-semibold">Severity</th>
                    <th className="p-4 font-semibold">Fix within</th>
                    <th className="p-4 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {crackTable.map((crack: any) => (
                    <tr key={crack.id} className="hover:bg-white/[0.02] transition-colors group">
                      <td className="p-4">
                        <div className="font-medium text-white">{crack.location_name}</div>
                        <div className="text-xs text-white/40 mt-0.5">{crack.buses_per_day} buses/day</div>
                      </td>
                      <td className="p-4">
                        <span className={`badge ${crack.severity_score >= 80 ? 'bg-severe/20 text-severe border-severe/30' : 'bg-moderate/20 text-moderate border-moderate/30'} border`}>
                          {crack.severity_score}%
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`font-bold ${crack.fix_deadline_days! <= 7 ? 'text-severe' : 'text-early_crack'}`}>
                          {crack.fix_deadline_days} days
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <form action={exportSingleIncidentAction} className="flex items-center justify-end gap-3">
                          <input type="hidden" name="id" value={crack.id} />
                          <button type="submit" className="text-xs font-bold text-white/50 hover:text-white transition-colors bg-white/5 border border-white/10 px-3 py-1.5 rounded-full hover:bg-white/10 shadow-lg shadow-black/20">
                            Upload to Sheet
                          </button>
                          <button type="button" className="text-sm font-semibold text-early_crack hover:text-white transition-colors underline decoration-early_crack/40 underline-offset-4">
                            Seal ↗
                          </button>
                        </form>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

        </div>

        {/* Right Column - Sidebars */}
        <div className="w-full xl:w-96 flex flex-col gap-6 xl:gap-8 flex-shrink-0">
          
          <SeveritySlider />
          
          {/* Smart Triage List */}
          <section className="card flex flex-col overflow-hidden max-h-[600px] flex-shrink-0">
            <div className="p-5 border-b border-white/10 flex items-center justify-between sticky top-0 bg-[#0c0c0c] z-20">
              <h2 className="text-lg font-bold">Smart Triage List</h2>
            </div>
            <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-2 relative">
              {triageList.map((item: any) => (
                <div key={item.id} className="p-3 rounded-md hover:bg-white/5 transition-colors cursor-pointer group border border-transparent hover:border-white/10">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-semibold text-white/90 group-hover:text-white transition-colors leading-tight">{item.location_name}</h4>
                    <span className={`badge shrink-0 ${item.priority_label === 'Critical' ? 'bg-severe/20 text-severe' : 'bg-moderate/20 text-moderate'}`}>
                      {item.priority_label}
                    </span>
                  </div>
                  <div className="mt-3 flex items-end justify-between">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-white/40 text-xs font-mono uppercase tracking-wider">Priority Score</span>
                      <span className="text-lg font-bold tabular-nums leading-none tracking-tight">{item.priority_score.toLocaleString()}</span>
                    </div>
                    <form action={exportSingleIncidentAction} className="flex gap-2">
                       <input type="hidden" name="id" value={item.id} />
                       <button type="submit" className="text-[10px] font-bold text-white/50 hover:text-white transition-colors border border-white/10 px-2 py-1.5 rounded-full hover:bg-white/5 bg-transparent shadow-lg">
                         Upload
                       </button>
                       <button type="button" className="text-xs font-semibold text-smc_blue hover:text-white transition-colors bg-smc_blue/10 px-3 py-1.5 rounded-full">
                         View
                       </button>
                    </form>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 border-t border-white/10 bg-white/[0.02] flex flex-col gap-3">
              <form action={exportActiveIncidentsAction}>
                <button type="submit" className="w-full py-2.5 rounded-[6px] bg-smc_blue hover:bg-[#154e8c] text-white text-sm font-bold transition-colors shadow-lg shadow-smc_blue/20">
                  Export to Crew Sheet
                </button>
              </form>
              <form action={simulateWebhookSyncAction}>
                <button type="submit" className="w-full py-2.5 rounded-[6px] bg-transparent hover:bg-white/5 border border-white/20 text-white/80 text-sm font-bold transition-colors flex items-center justify-center gap-2 group">
                  <span className="w-2 h-2 rounded-full bg-repaired shadow-[0_0_8px_#3AE196]" />
                  Simulate Contractor Fix
                </button>
              </form>
            </div>
          </section>

          {/* Fleet Diagnostics */}
          <section className="card flex flex-col h-[350px] flex-shrink-0">
            <div className="p-5 border-b border-white/10 sticky top-0 bg-[#0c0c0c] z-20">
              <h2 className="text-lg font-bold flex items-center gap-2">
                Fleet Diagnostics
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse ml-2" />
              </h2>
            </div>
            <div className="flex-1 p-2 space-y-1 overflow-y-auto">
              {mockFleet.map((bus: any) => (
                <div key={bus.bus_id} className="flex items-center justify-between p-3 rounded-md hover:bg-white/5 transition-colors">
                  <span className="font-mono text-sm text-white/80">{bus.bus_id}</span>
                  <div className="flex flex-col items-end">
                    <span className={`text-xs font-bold flex items-center gap-1.5 ${bus.status === 'synced' ? 'text-repaired' : 'text-severe'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${bus.status === 'synced' ? 'bg-repaired' : 'bg-severe'}`} />
                      {bus.status === 'synced' ? 'Synced' : 'Offline'}
                    </span>
                    <span className="text-[10px] text-white/40 mt-0.5">{bus.last_sync_time}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

        </div>
      </div>
    </main>
  );
}
