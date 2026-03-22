import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Helper function to safely instantiate server client within API routes
async function getSupabase() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          try { cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)); } catch {}
        },
      },
    }
  );
}

export async function POST(req: Request) {
  try {
    const payloads = await req.json();
    if (!Array.isArray(payloads)) return NextResponse.json({ error: 'Array expected' }, { status: 400 });

    const supabase = await getSupabase();

    const formattedIncidents = payloads.map((p) => {
      // Calculate physical area (m²) from bounding box logic
      let area = null;
      if (p.boundingBox) {
        // Assume bbox represents YOLO output pixel widths
        // Example Conversion: 10,000 pixels squared = ~0.6 m²
        const PIXEL_TO_SQ_METERS = 0.00006; 
        const w = p.boundingBox.w || (p.boundingBox.xmax - p.boundingBox.xmin) || 100;
        const h = p.boundingBox.h || (p.boundingBox.ymax - p.boundingBox.ymin) || 100;
        area = parseFloat((w * h * PIXEL_TO_SQ_METERS).toFixed(2));
      }

      // Generate base severity dynamically influenced by the bounding box area
      const baseAreaSeverity = area ? Math.min(area * 10, 40) : 0;
      
      const isCrack = p.type && p.type.toLowerCase().includes('crack');
      let severity_score = isCrack ? 20 : 20 + baseAreaSeverity;
      severity_score = severity_score + Math.floor(Math.random() * 10);

      return {
        lat: p.lat,
        lng: p.lng,
        type: p.type || 'pothole',
        area: isCrack ? 0 : area,
        status: 'active',
        severity_score: Math.min(Math.floor(severity_score), 100),
        buses_per_day: Math.floor(Math.random() * 300) + 50,
        fix_deadline_days: isCrack ? Math.floor(Math.random() * 15) + 3 : null,
        location_name: `Pi Camera [${p.lat.toFixed(3)}, ${p.lng.toFixed(3)}]`,
        detected_at: p.detected_at || new Date().toISOString()
      };
    });

    let inserted = 0;
    
    for (const inc of formattedIncidents) {
      // Bounding box for ~20 meters (~0.00018 degrees at equator)
      const latMin = inc.lat - 0.00004;
      const latMax = inc.lat + 0.00004;
      const lngMin = inc.lng - 0.00004;
      const lngMax = inc.lng + 0.00004;

      // 1. Spatial Deduplication Search
      const { data: existing } = await supabase
        .from('incidents')
        .select('id')
        .eq('status', 'active')
        .eq('type', inc.type) // Ensure we don't overwrite a pothole over a crack
        .gte('lat', latMin)
        .lte('lat', latMax)
        .gte('lng', lngMin)
        .lte('lng', lngMax)
        .limit(1);

      if (existing && existing.length > 0) {
        // 2. Collision Detected! Update the existing record with the freshest AI metrics.
        await supabase.from('incidents').update({
          detected_at: inc.detected_at,
          area: inc.area, // Refresh structural area mapping
          severity_score: inc.severity_score // Adjust severity logically
        }).eq('id', existing[0].id);
      } else {
        // 3. True Anomaly: Insert fresh record
        const { error } = await supabase.from('incidents').insert([inc]);
        if (!error) inserted++;
      }
    }

    return NextResponse.json({ success: true, inserted });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
