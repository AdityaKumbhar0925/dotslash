'use server';

import { exportToGoogleSheets } from '@/lib/sheetsService';
import { revalidatePath } from 'next/cache';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

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

export async function exportActiveIncidentsAction() {
  const supabase = await getSupabase();
  const { data: activeIncidents } = await supabase.from('incidents').select('*').eq('status', 'active');
  if (activeIncidents && activeIncidents.length > 0) {
    await exportToGoogleSheets(activeIncidents);
  }
  revalidatePath('/dashboard');
}

export async function exportSingleIncidentAction(formData: FormData) {
  const id = formData.get('id') as string;
  if (!id) return;
  
  const supabase = await getSupabase();
  const { data: incident } = await supabase.from('incidents').select('*').eq('id', id).limit(1).single();
  
  if (incident) {
    await exportToGoogleSheets([incident]);
  }
  revalidatePath('/dashboard');
}

export async function simulateWebhookSyncAction() {
  // Simulate a webhook hitting the server by finding the first active incident and repairing it
  const supabase = await getSupabase();
  const { data: incident } = await supabase.from('incidents').select('*').eq('status', 'active').limit(1);
  
  if (incident && incident.length > 0) {
    await supabase.from('incidents').update({
      status: 'repaired',
      type: 'repaired',
      repaired_at: new Date().toISOString(),
      verified_by: 'Contractor (Simulation Action)'
    }).eq('id', incident[0].id);
  }
  
  revalidatePath('/dashboard');
  revalidatePath('/');
}
