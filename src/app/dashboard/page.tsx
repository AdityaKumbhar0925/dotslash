import TopBar from '@/components/TopBar';
import Map from '@/components/Map';
import { Download } from 'lucide-react';
import { fetchIncidentsMap, fetchTriageList, fetchActiveCracks, fetchFleetStatus } from '@/lib/apiClient';
import { exportActiveIncidentsAction, simulateWebhookSyncAction, exportSingleIncidentAction } from '@/app/actions/sheets';
import { deleteIncidentAction } from '@/app/actions/incidents';
import SeveritySlider from '@/components/SeveritySlider';
import AreaFilter from '@/components/AreaFilter';
import StateFilter from '@/components/StateFilter';
import RealtimeSubscriber from '@/components/RealtimeSubscriber';

export const dynamic = 'force-dynamic';

const getStateFromCoords = (lat: number, lng: number) => {
  if (lat > 26) return 'Delhi';
  if (lat > 20 && lat <= 26) return 'Gujarat';
  if (lat > 16 && lat <= 20) return 'Maharashtra';
  if (lat <= 16) return 'Karnataka';
  return 'Unknown State';
};

const getDistanceInMeters = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371e3; 
  const p1 = lat1 * Math.PI / 180;
  const p2 = lat2 * Math.PI / 180;
  const dp = (lat2 - lat1) * Math.PI / 180;
  const dl = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dp/2) * Math.sin(dp/2) + Math.cos(p1) * Math.cos(p2) * Math.sin(dl/2) * Math.sin(dl/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

export default async function Dashboard({ searchParams }: { searchParams: Promise<{ minSeverity?: string, area?: string, state?: string, focusLat?: string, focusLng?: string }> }) {
  const params = await searchParams;
  const minSev = parseInt(params?.minSeverity || '0', 10);
  const areaFilter = (params?.area || '').toLowerCase();
  const stateFilter = (params?.state || '').toLowerCase();

  const [rawMapData, mockFleet] = await Promise.all([
    fetchIncidentsMap(),
    fetchFleetStatus()
  ]);

  const focusLat = params?.focusLat ? parseFloat(params.focusLat) : null;
  const focusLng = params?.focusLng ? parseFloat(params.focusLng) : null;

  const rawTriageList = rawMapData
    .filter((i: any) => i.type !== 'early_crack')
    .map((i: any) => ({
      ...i,
      priority_score: (i.severity_score || 0) * (i.buses_per_day || 0),
      priority_label: (i.severity_score || 0) > 80 ? 'Critical' : 'High'
    }))
    .sort((a: any, b: any) => b.priority_score - a.priority_score);

  const crackTable = rawMapData
    .filter((i: any) => i.type === 'early_crack')
    .sort((a: any, b: any) => (a.fix_deadline_days || 99) - (b.fix_deadline_days || 99));

  const baseStates = new Set(rawMapData.map((i: any) => getStateFromCoords(i.lat, i.lng)));
  const uniqueStates = Array.from(baseStates).sort() as string[];
  
  let filteredForAreas = rawMapData;
  if (stateFilter) {
    filteredForAreas = rawMapData.filter((i: any) => getStateFromCoords(i.lat, i.lng).toLowerCase() === stateFilter);
  }
  
  const baseAreas = new Set(filteredForAreas.map((i: any) => {
    let name = i.location_name || '';
    if (name.includes(' Patch ')) name = name.split(' Patch ')[0];
    if (name.includes(',')) name = name.split(',')[0];
    return name.trim();
  }));
  const uniqueAreas = Array.from(baseAreas).filter(Boolean).sort() as string[];

  const mapData = rawMapData.filter((i: any) => {
    const iState = getStateFromCoords(i.lat, i.lng).toLowerCase();
    const meetsState = stateFilter ? iState === stateFilter : true;
    const meetsSev = (i.severity_score || 0) >= minSev;
    const meetsArea = areaFilter ? (i.location_name || '').toLowerCase().includes(areaFilter) : true;
    return meetsState && meetsSev && meetsArea;
  });
  
  const triageList = rawTriageList.filter((i: any) => {
    const iState = getStateFromCoords(i.lat, i.lng).toLowerCase();
    const meetsState = stateFilter ? iState === stateFilter : true;
    const meetsSev = (i.severity_score || 0) >= minSev;
    const meetsArea = areaFilter ? (i.location_name || '').toLowerCase().includes(areaFilter) : true;
    return meetsState && meetsSev && meetsArea;
  });

  const CLUSTER_RADIUS_M = 15;
  const clusteredMarkers: any[] = [];

  for (const inc of mapData) {
    let foundCluster = null;
    for (const cluster of clusteredMarkers) {
      if (getDistanceInMeters(inc.lat, inc.lng, cluster.lat, cluster.lng) <= CLUSTER_RADIUS_M) {
        foundCluster = cluster;
        break;
      }
    }

    if (foundCluster) {
      foundCluster.incidents.push(inc);
      // Recenter the cluster coordinate geographically
      foundCluster.lat = foundCluster.incidents.reduce((a: number, b: any) => a + b.lat, 0) / foundCluster.incidents.length;
      foundCluster.lng = foundCluster.incidents.reduce((a: number, b: any) => a + b.lng, 0) / foundCluster.incidents.length;
    } else {
      clusteredMarkers.push({
        id: `cluster-${inc.id || Math.random()}`,
        lat: inc.lat,
        lng: inc.lng,
        incidents: [inc],
        type: inc.type
      });
    }
  }

  const mapMarkers = clusteredMarkers.map((c: any) => {
    const isCluster = c.incidents.length > 1;
    const numPotholes = c.incidents.filter((i: any) => i.type === 'pothole').length;
    const numCracks = c.incidents.filter((i: any) => i.type === 'early_crack').length;
    const totalArea = c.incidents.reduce((sum: number, i: any) => sum + (i.area || 0), 0);
    const densityMetric = parseFloat(((numPotholes * 1) + (numCracks * 0.2)).toFixed(2));
    const maxSeverity = Math.max(...c.incidents.map((i: any) => i.severity_score || 0));
    const locationName = isCluster ? `Density Cluster (${c.incidents[0].location_name})` : (c.incidents[0].location_name || 'Location');

    return {
      id: c.id,
      lat: c.lat,
      lng: c.lng,
      type: isCluster ? 'cluster' : c.incidents[0].type,
      severity: maxSeverity,
      popupData: {
        location_name: locationName,
        severity_score: maxSeverity,
        buses_per_day: c.incidents[0].buses_per_day,
        ...(isCluster && { 
             incidents_count: c.incidents.length, 
             potholes_count: numPotholes,
             cracks_count: numCracks,
             cluster_density: densityMetric,
             total_area_sq_m: parseFloat(totalArea.toFixed(2))
        }),
        ...(!isCluster && c.incidents[0].area && { area_sq_m: c.incidents[0].area }),
        ...(!isCluster && c.incidents[0].fix_deadline_days && { fix_deadline_days: c.incidents[0].fix_deadline_days }),
        detected_at: isCluster ? 'Multiple Entries' : c.incidents[0].detected_at
      }
    };
  });

  const activeIncidents = mapData.length;
  const repairedThisWeek = 142; // static mock
  const fleetSynced = mockFleet.filter((f: any) => f.status === 'synced').length;

  return (
    <main className="flex-1 flex flex-col h-screen overflow-hidden bg-[#050505]">
      <RealtimeSubscriber />
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
            <Map 
              center={
                focusLat && focusLng
                  ? [focusLat, focusLng] as [number, number]
                  : areaFilter && mapMarkers.length > 0
                  ? [mapMarkers[0].lat, mapMarkers[0].lng] as [number, number]
                  : stateFilter && mapMarkers.length > 0
                  ? [mapMarkers[0].lat, mapMarkers[0].lng] as [number, number]
                  : [21.1702, 72.8311] as [number, number]
              } 
              zoom={focusLat && focusLng ? 18 : areaFilter ? 14 : (stateFilter ? 11 : 5)} 
              markers={mapMarkers} 
            />
            <div className="absolute bottom-4 left-4 z-[400] card bg-black/80 backdrop-blur-md p-3 px-4 flex flex-col sm:flex-row items-start sm:items-center gap-4 border-white/10 shadow-xl shadow-black">
              <div className="flex items-center gap-3 text-xs font-semibold tracking-wider text-white/60">
                <span className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_8px_#ef4444]"></div> &gt; 60%</span>
                <span className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-yellow-500 shadow-[0_0_8px_#eab308]"></div> 30-60%</span>
                <span className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-[0_0_8px_#22c55e]"></div> &lt; 30%</span>
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
                        <span className={`badge border ${
                          crack.severity_score > 60 ? 'bg-red-500/20 text-red-500 border-red-500/30' : 
                          crack.severity_score >= 30 ? 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30' : 
                          'bg-green-500/20 text-green-500 border-green-500/30'
                        }`}>
                          {crack.severity_score}% - {crack.severity_score > 60 ? 'Critical' : crack.severity_score >= 30 ? 'Medium' : 'Low'}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`font-bold ${crack.fix_deadline_days! <= 7 ? 'text-severe' : 'text-early_crack'}`}>
                          {crack.fix_deadline_days} days
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <a href={`?minSeverity=${minSev}&area=${areaFilter}&state=${stateFilter}&focusLat=${crack.lat}&focusLng=${crack.lng}`} className="text-[10px] font-bold text-smc_blue hover:text-white transition-colors border border-smc_blue/30 px-2 py-1.5 rounded-full hover:bg-smc_blue/20 bg-transparent shadow-lg text-center leading-none inline-flex items-center">
                            View
                          </a>
                          <form action={exportSingleIncidentAction} className="inline-flex">
                            <input type="hidden" name="id" value={crack.id} />
                            <button type="submit" className="text-[10px] font-bold text-white/50 hover:text-white transition-colors bg-white/5 border border-white/10 px-2 py-1.5 rounded-full hover:bg-white/10 shadow-lg shadow-black/20 text-center leading-none inline-flex items-center">
                              Upload
                            </button>
                          </form>
                          <form action={deleteIncidentAction} className="inline-flex">
                            <input type="hidden" name="id" value={crack.id} />
                            <button type="submit" className="text-[10px] font-bold text-red-500/80 hover:text-red-500 transition-colors bg-red-500/10 border border-red-500/20 px-2 py-1.5 rounded-full hover:bg-red-500/20 shadow-lg text-center leading-none inline-flex items-center">
                              Delete
                            </button>
                          </form>
                        </div>
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
          <StateFilter states={uniqueStates} />
          <AreaFilter areas={uniqueAreas} />
          
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
                    <span className={`badge shrink-0 border ${
                      item.severity_score > 60 ? 'bg-red-500/20 text-red-400 border-red-500/30' : 
                      item.severity_score >= 30 ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' : 
                      'bg-green-500/20 text-green-400 border-green-500/30'
                    }`}>
                      {item.severity_score > 60 ? 'Critical' : item.severity_score >= 30 ? 'Medium' : 'Low'}
                    </span>
                  </div>
                  <div className="mt-3 flex items-end justify-between">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-white/40 text-xs font-mono uppercase tracking-wider">Severity Score</span>
                      <span className="text-lg font-bold tabular-nums leading-none tracking-tight">{item.severity_score ?? 0}</span>
                    </div>
                    <div className="flex gap-2 items-center">
                       <a href={`?minSeverity=${minSev}&area=${areaFilter}&state=${stateFilter}&focusLat=${item.lat}&focusLng=${item.lng}`} className="text-[10px] font-bold text-smc_blue hover:text-white transition-colors border border-smc_blue/30 px-2 py-1.5 rounded-full hover:bg-smc_blue/20 bg-transparent shadow-lg text-center leading-none inline-flex items-center">
                         View
                       </a>
                       <form action={exportSingleIncidentAction} className="inline-flex">
                         <input type="hidden" name="id" value={item.id} />
                         <button type="submit" className="text-[10px] font-bold text-white/50 hover:text-white transition-colors border border-white/10 px-2 py-1.5 rounded-full hover:bg-white/5 bg-transparent shadow-lg leading-none inline-flex items-center">
                           Upload
                         </button>
                       </form>
                       <form action={deleteIncidentAction} className="inline-flex">
                         <input type="hidden" name="id" value={item.id} />
                         <button type="submit" className="text-[10px] font-bold text-red-500/80 hover:text-red-500 transition-colors border border-red-500/20 px-2 py-1.5 rounded-full hover:bg-red-500/10 bg-transparent shadow-lg leading-none inline-flex items-center">
                           Delete
                         </button>
                       </form>
                    </div>
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
