'use server';

import { exportToGoogleSheets } from '@/lib/sheetsService';
import { dataStore } from '@/lib/dataStore';
import { revalidatePath } from 'next/cache';

export async function exportActiveIncidentsAction() {
  const activeIncidents = dataStore.incidents.filter((i: any) => i.status === 'active');
  await exportToGoogleSheets(activeIncidents);
  
  // Re-render dashboard
  revalidatePath('/dashboard');
}

export async function exportSingleIncidentAction(formData: FormData) {
  const id = formData.get('id') as string;
  const incident = dataStore.incidents.find((i: any) => i.id === id);
  if (incident) {
    await exportToGoogleSheets([incident]);
  }
  revalidatePath('/dashboard');
}

export async function simulateWebhookSyncAction() {
  // Simulate a webhook hitting the server by finding the first active incident and repairing it
  const incident = dataStore.incidents.find((i: any) => i.status === 'active');
  if (incident) {
    incident.status = 'repaired';
    incident.type = 'repaired';
    incident.repaired_at = new Date().toISOString();
    incident.verified_by = 'Contractor (Simulation Action)';
  }
  
  revalidatePath('/dashboard');
  revalidatePath('/');
}
