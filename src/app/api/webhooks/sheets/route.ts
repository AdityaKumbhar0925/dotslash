import { NextResponse } from 'next/server';
import { dataStore } from '@/lib/dataStore';

// Google Apps Script will POST here when a Contractor checks the "Done" box
export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const incidentId = payload.incidentId;
    
    if (!incidentId) {
       return NextResponse.json({ error: 'Missing incidentId' }, { status: 400 });
    }

    const incident = dataStore.incidents.find((i: any) => i.id === incidentId.toString());
    
    if (incident) {
      incident.status = 'repaired';
      incident.repaired_at = new Date().toISOString();
      incident.verified_by = 'Contractor (via Google Sheets)';
      return NextResponse.json({ success: true, message: `Incident ${incidentId} marked as repaired!` });
    }
    
    return NextResponse.json({ error: 'Incident not found' }, { status: 404 });
  } catch (error: any) {
    return NextResponse.json({ error: 'Invalid webhook payload structure' }, { status: 400 });
  }
}
