import { NextResponse } from 'next/server';
import { dataStore } from '@/lib/dataStore';

export async function GET() {
  const activeIncidents = dataStore.incidents
    .filter((i: any) => i.status === 'active')
    .map((i: any) => ({
        id: i.id,
        lat: i.lat,
        lng: i.lng,
        type: i.type,
        severity_score: i.severity_score,
        location_name: i.location_name,
        buses_per_day: i.buses_per_day,
        detected_at: i.detected_at,
        status: i.status
    }));
  return NextResponse.json(activeIncidents);
}
