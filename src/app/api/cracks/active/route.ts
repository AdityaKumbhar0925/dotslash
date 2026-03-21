import { NextResponse } from 'next/server';
import { dataStore } from '@/lib/dataStore';

export async function GET() {
  const activeCracks = dataStore.incidents
    .filter((i: any) => i.type === 'early_crack' && i.status === 'active')
    .map((crk: any) => ({
        id: crk.id,
        location_name: crk.location_name,
        crack_priority: (crk.fix_deadline_days || 99) <= 7 ? 'Urgent' : 'Medium',
        fix_deadline_days: crk.fix_deadline_days,
        buses_per_day: crk.buses_per_day,
        detected_at: crk.detected_at
    }))
    .sort((a: any, b: any) => (a.fix_deadline_days || 99) - (b.fix_deadline_days || 99));

  return NextResponse.json(activeCracks);
}
