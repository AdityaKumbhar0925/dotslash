import { createClient } from './supabase/server';

export async function fetchIncidentsMap() {
  const supabase = await createClient();
  const { data, error } = await supabase.from('incidents').select('*').eq('status', 'active');
  if (error) console.error('fetchIncidentsMap error:', error.message);
  return data || [];
}

export async function fetchTriageList() {
  const supabase = await createClient();
  const { data, error } = await supabase.from('incidents')
    .select('*')
    .eq('status', 'active')
    .neq('type', 'early_crack');
    
  if (error) console.error('fetchTriageList error:', error.message);
  
  return (data || [])
    .map((i: any) => ({
      ...i,
      priority_score: (i.severity_score || 0) * (i.buses_per_day || 0),
      priority_label: (i.severity_score || 0) > 80 ? 'Critical' : 'High'
    }))
    .sort((a: any, b: any) => b.priority_score - a.priority_score);
}

export async function fetchActiveCracks() {
  const supabase = await createClient();
  const { data, error } = await supabase.from('incidents')
    .select('*')
    .eq('type', 'early_crack');
    
  if (error) console.error('fetchActiveCracks error:', error.message);
  return (data || []).sort((a: any, b: any) => (a.fix_deadline_days || 99) - (b.fix_deadline_days || 99));
}

export async function fetchFleetStatus() {
  const supabase = await createClient();
  const { data, error } = await supabase.from('fleet').select('*');
  if (error) console.error('fetchFleetStatus error:', error.message);
  return data || [];
}

export async function fetchPublicMap() {
  const supabase = await createClient();
  const { data, error } = await supabase.from('incidents').select('*');
  if (error) console.error('fetchPublicMap error:', error.message);
  return (data || []).map((inc: any) => ({
    ...inc,
    status_label: inc.status === 'repaired' ? 'Repaired' : inc.type.replace('_', ' '),
  }));
}

export async function fetchWardScores() {
  const supabase = await createClient();
  const { data, error } = await supabase.from('wards').select('*');
  if (error) console.error('fetchWardScores error:', error.message);
  return data || [];
}
