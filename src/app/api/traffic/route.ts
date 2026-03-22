import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get('lat');
  const lng = searchParams.get('lng');

  if (!lat || !lng) {
    return NextResponse.json({ error: 'Missing coordinates' }, { status: 400 });
  }

  // Query Overpass to count bus stops within a 1.5km radius
  const query = `[out:json];node(around:1500,${lat},${lng})["highway"="bus_stop"];out count;`;
  
  try {
    const res = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`, {
      headers: { 'User-Agent': 'RoadIntelDevWebApp/1.0' },
      next: { revalidate: 86400 } // Cache for 24 hours to prevent rate limiting
    });
    
    if (!res.ok) throw new Error('Overpass API returned an error');
    
    const data = await res.json();
    const count = parseInt(data.elements[0]?.tags?.nodes || '0', 10);
    
    // Estimate traffic: Assume each bus stop brings ~20 bus passes per day. 
    // Add a baseline of 10 to ensure even remote roads have some traffic.
    const busesPerDay = count > 0 ? (count * 20) + 10 : Math.floor(Math.random() * 20) + 10;
    
    return NextResponse.json({ buses_per_day: busesPerDay, stops_nearby: count });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch traffic data' }, { status: 500 });
  }
}
