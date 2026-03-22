'use server';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

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

export async function deleteIncidentAction(formData: FormData) {
  const id = formData.get('id') as string;
  if (!id) return;

  const supabase = await getSupabase();
  await supabase.from('incidents').delete().eq('id', id);
  
  // Revalidate specific dashboard pages to show standard freshness
  revalidatePath('/dashboard');
  revalidatePath('/');
}
