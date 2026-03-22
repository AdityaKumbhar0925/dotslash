const { createClient } = require('@supabase/supabase-js');

require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function formatExisting() {
  console.log('Fetching existing incidents starting with Pi Camera...');
  const { data: incidents, error } = await supabase
    .from('incidents')
    .select('*')
    .like('location_name', 'Pi Camera%');

  if (error) {
    console.error('Error fetching:', error);
    return;
  }

  console.log(`Found ${incidents.length} anomalies to re-geocode.`);

  for (const inc of incidents) {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${inc.lat}&lon=${inc.lng}`, {
        headers: { 'User-Agent': 'RoadLens-Scraper/1.0' }
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.display_name) {
          const newName = data.display_name.split(',').slice(0, 2).join(',').trim();
          console.log(`Updating [${inc.id}]: ${inc.location_name} -> ${newName}`);
          
          await supabase.from('incidents').update({ location_name: newName }).eq('id', inc.id);
        }
      }
      // Wait 1.1s to respect OSM Free tier
      await new Promise(r => setTimeout(r, 1100));
    } catch (e) {
      console.error(`Failed to update ${inc.id}:`, e.message);
    }
  }
  
  console.log('Finished updating existing incidents!');
}

formatExisting();
