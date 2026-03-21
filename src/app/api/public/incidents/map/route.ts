import { NextResponse } from 'next/server';
import { dataStore } from '@/lib/dataStore';

export async function GET() {
  const publicMap = dataStore.incidents.map((inc: any) => ({
      lat: inc.lat,
      lng: inc.lng,
      type: inc.type,
      status_label: inc.status === 'repaired' ? 'Repaired' : inc.type.replace('_', ' '),
      detected_at: inc.detected_at,
      repaired_at: inc.repaired_at
  }));
  return NextResponse.json(publicMap);
}
