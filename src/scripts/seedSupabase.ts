import { createClient } from '@supabase/supabase-js';
import { dataStore } from '../lib/dataStore';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seed() {
  console.log('Seeding Supabase...');
  try {
    // We use the post-calculated algorithms from dataStore.ts so severity is correct
    const incidents = dataStore.incidents.map((inc: any) => {
      const { id, ...rest } = inc;
      return rest;
    });

    console.log(`Inserting ${incidents.length} incidents...`);
    const { error: e1 } = await supabase.from('incidents').insert(incidents);
    if (e1) throw new Error(`Incidents Error: ${e1.message}`);

    console.log(`Inserting ${dataStore.wards.length} wards...`);
    const { error: e2 } = await supabase.from('wards').insert(dataStore.wards);
    if (e2) throw new Error(`Wards Error: ${e2.message}`);

    console.log(`Inserting ${dataStore.fleet.length} fleet records...`);
    const { error: e3 } = await supabase.from('fleet').insert(dataStore.fleet);
    if (e3) throw new Error(`Fleet Error: ${e3.message}`);

    console.log('✅ Seeding completed perfectly.');
  } catch (err: any) {
    console.error('❌ Seeding failed:', err.message);
  }
}

seed();
