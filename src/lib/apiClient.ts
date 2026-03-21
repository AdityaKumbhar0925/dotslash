import { dataStore } from './dataStore';

export async function fetchIncidentsMap() {
  return dataStore.incidents
    .filter((i: any) => i.status === 'active')
    .map((i: any) => ({ ...i }));
}

export async function fetchTriageList() {
  return dataStore.incidents
    .filter((i: any) => i.status === 'active' && i.type !== 'early_crack')
    .map((i: any) => ({
      ...i,
      priority_score: (i.severity_score || 0) * (i.buses_per_day || 0),
      priority_label: (i.severity_score || 0) > 80 ? 'Critical' : 'High'
    }))
    .sort((a: any, b: any) => b.priority_score - a.priority_score);
}

export async function fetchActiveCracks() {
  return dataStore.incidents
    .filter((i: any) => i.type === 'early_crack')
    .sort((a: any, b: any) => (a.fix_deadline_days || 99) - (b.fix_deadline_days || 99));
}

export async function fetchFleetStatus() {
  return [...dataStore.fleet];
}

export async function fetchPublicMap() {
  return dataStore.incidents.map((inc: any) => ({
    ...inc,
    status_label: inc.status === 'repaired' ? 'Repaired' : inc.type.replace('_', ' '),
  }));
}

export async function fetchWardScores() {
  return [...dataStore.wards];
}
