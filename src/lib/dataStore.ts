import { mockIncidents, mockWards, mockFleet } from './mockData';

// Global variable preserves memory during fast-refresh in dev mode
let dataStore: any = (global as any).dataStore;

if (!dataStore) {
  const incidents = [...mockIncidents];

  // Mathematical Clustering Algorithm: Calculate severity based on coordinate density + traffic frequency
  const CLUSTER_RADIUS = 500; // Analyze structural density within 500 meters
  
  incidents.forEach(inc => {
    const item = inc as any;
    // We only calculate severity for active potholes and cracks
    if (item.status === 'active') {
      let nearbyCount = 0;
      let clusterArea = item.type === 'pothole' ? (item.area || 0) : 0;
      
      incidents.forEach(other => {
        const otherItem = other as any;
        if (otherItem.status === 'active' &&
            otherItem.id !== item.id && 
            getDistanceInMeters(item.lat, item.lng, otherItem.lat, otherItem.lng) <= CLUSTER_RADIUS) {
          nearbyCount++;
          if (otherItem.type === 'pothole' && otherItem.area) {
            clusterArea += otherItem.area;
          }
        }
      });
      
      // ALGORITHM:
      // 1. Cluster Severity Score (0-50): Heavily scaled by the physical clusterArea (e.g. 5 points per sq meter)
      const clusterScore = Math.min(50, clusterArea * 5);
      
      // 2. Traffic Intensity Score (0-30): Scale by buses_per_day (peaks out around 200 buses)
      const trafficScore = Math.min(30, (item.buses_per_day / 200) * 30);
      
      // 3. Density/Frequency Score (0-20): Scale by nearby anomalies count
      const densityScore = Math.min(20, nearbyCount * 10);
      
      const calculatedSeverity = Math.min(100, clusterScore + trafficScore + densityScore + 10); // Auto +10 base severity
      item.severity_score = Math.floor(calculatedSeverity);
      
      // Dynamically re-classify potholes into severe/moderate buckets based on calculation
      if (item.type === 'pothole') {
        item.type = item.severity_score >= 80 ? 'severe' : 'moderate';
      }
    } else if (item.status === 'repaired') {
       // Just assign a static high score for repaired items in the log
       item.severity_score = 100;
    }
  });

  dataStore = (global as any).dataStore = {
    incidents,
    wards: [...mockWards],
    fleet: [...mockFleet],
  };
}

// Pseudo-ST_DWithin: Calculates distance between two coordinates in meters
export function getDistanceInMeters(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371e3; // metres
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

export { dataStore };
