import { NextResponse } from 'next/server';
import { dataStore } from '@/lib/dataStore';

export async function GET() {
  const triage = dataStore.incidents
    .filter((i: any) => i.status === 'active' && i.type !== 'early_crack')
    .map((i: any) => ({
        id: i.id,
        location_name: i.location_name,
        priority_score: (i.severity_score || 0) * (i.buses_per_day || 0),
        priority_label: (i.severity_score || 0) > 80 ? 'Critical' : 'High',
        buses_per_day: i.buses_per_day,
        detected_at: i.detected_at
    }))
    .sort((a: any, b: any) => b.priority_score - a.priority_score);

  return NextResponse.json(triage);
}
