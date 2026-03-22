import { createClient } from '@supabase/supabase-js';
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

async function seedUsers() {
  console.log('Seeding Government Auth Users...');
  
  const dummyUsers = [
    { email: 'officer1@surat.gov.in', password: 'Password123!', role: 'inspector' },
    { email: 'admin@surat.gov.in', password: 'Password123!', role: 'admin' },
    { email: 'contractor@smc.gov.in', password: 'Password123!', role: 'contractor' }
  ];

  for (const u of dummyUsers) {
    const { data, error } = await supabase.auth.signUp({
      email: u.email,
      password: u.password,
    });
    
    if (error) {
      if (error.message.includes('User already registered')) {
        console.log(`User ${u.email} already exists! Skipping sign up.`);
      } else {
        console.error(`Failed to create ${u.email}:`, error.message);
      }
    } else {
      console.log(`Successfully created user: ${u.email} / ${u.password}`);
    }
  }

  // We use dataStore.ts trick again to fetch the generated data
  console.log('\nReloading incidents/wards/tables from DataStore locally...');
  const { dataStore } = require('../lib/dataStore');
  
  const incidents = dataStore.incidents.map((inc: any) => {
    const { id, ...rest } = inc; // Drop the mock string id so Supabase UUID kicks in
    return rest;
  });

  console.log(`Inserting ${incidents.length} fresh incidents...`);
  await supabase.from('incidents').insert(incidents);
  
  console.log(`Inserting ${dataStore.wards.length} wards...`);
  await supabase.from('wards').upsert(dataStore.wards, { onConflict: 'id' });
  
  console.log(`Inserting ${dataStore.fleet.length} fleet buses...`);
  await supabase.from('fleet').upsert(dataStore.fleet, { onConflict: 'bus_id' });

  console.log('\n✅ Database Data & Auth Seeding Complete.');
  console.log('\n⚠️ IMPORTANT: If Supabase Email Confirmations are enabled, you might not be able to log in immediately. You may need to go to Authentication -> Providers -> Email in your Supabase Dashboard and toggle OFF "Confirm email" for these passwords to work instantly!');
}

seedUsers();
