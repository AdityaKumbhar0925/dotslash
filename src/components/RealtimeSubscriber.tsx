'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '../lib/supabase/client';

export default function RealtimeSubscriber() {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    
    // Listen to all inserts, updates, and deletes on the incidents table
    const channel = supabase.channel('realtime_incidents')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'incidents' }, () => {
        // Automatically re-run Server Components to fetch fresh data
        router.refresh();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [router]);

  return null;
}
