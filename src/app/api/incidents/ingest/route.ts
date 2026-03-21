import { NextResponse } from 'next/server';
import { dataStore, getDistanceInMeters } from '@/lib/dataStore';

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    
    for (const packet of payload) {
      const lat = parseFloat(packet.lat);
      const lng = parseFloat(packet.lng);
      const score = parseInt(packet.severity_score, 10);

      // Pseudo-ST_DWithin logic
      const existing = dataStore.incidents.find((i: any) => 
        i.status === 'active' && getDistanceInMeters(lat, lng, i.lat, i.lng) <= 10
      );

      if (existing) {
        existing.severity_score += score;
        existing.detected_at = new Date().toISOString();
      } else {
        dataStore.incidents.push({
          id: Math.random().toString(36).substring(7),
          lat,
          lng,
          type: packet.type,
          severity_score: score,
          buses_per_day: Math.floor(Math.random() * 200) + 50,
          location_name: 'Newly Detected Point',
          status: 'active',
          detected_at: new Date().toISOString(),
          bus_id: packet.bus_id
        });
      }

      // Sync fleet
      const bus = dataStore.fleet.find((b: any) => b.bus_id === packet.bus_id);
      if (bus) {
        bus.status = 'synced';
        bus.last_sync_time = 'Just now';
      } else {
        dataStore.fleet.push({ bus_id: packet.bus_id, status: 'synced', last_sync_time: 'Just now' });
      }
    }

    return NextResponse.json({ success: true, ingested: payload.length });
  } catch (error) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }
}
