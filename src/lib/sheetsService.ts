import { google } from 'googleapis';

const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');
const sheetId = process.env.GOOGLE_SHEET_ID;

const isConfigured = !!clientEmail && !!privateKey && !!sheetId;

let sheetsAction: any;
if (isConfigured) {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: clientEmail,
      private_key: privateKey,
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  sheetsAction = google.sheets({ version: 'v4', auth });
}

export async function exportToGoogleSheets(incidents: any[]) {
  const values: any[][] = [];
  
  // Conditionally add headers
  let includeHeaders = false;
  if (isConfigured) {
    try {
      const getRes = await sheetsAction.spreadsheets.values.get({
        spreadsheetId: sheetId,
        range: 'Sheet1!A1:H1',
      });
      includeHeaders = !getRes.data.values || getRes.data.values.length === 0;
    } catch {
      includeHeaders = true;
    }
  } else {
    includeHeaders = !(global as any).simulatedHeadersAdded;
    (global as any).simulatedHeadersAdded = true;
  }

  if (includeHeaders) {
    values.push([
      'Incident ID', 'Location', 'Severity / Priority', 'Type', 'Status', 'Date Detected', 'Google Maps Link', 'Contractor Fixed? (CHECK BOX)'
    ]);
  }

  incidents.forEach((inc) => {
    const mapsLink = `https://www.google.com/maps/search/?api=1&query=${inc.lat},${inc.lng}`;
    const severity = inc.type === 'early_crack' 
      ? `Deadline: ${inc.fix_deadline_days} days`
      : `Score: ${inc.severity_score ?? 0}`;

    values.push([
      inc.id,
      inc.location_name,
      severity,
      inc.type,
      inc.status,
      new Date(inc.detected_at).toLocaleString(),
      mapsLink,
      'FALSE'
    ]);
  });

  if (isConfigured) {
    try {
      await sheetsAction.spreadsheets.values.append({
        spreadsheetId: sheetId,
        range: 'Sheet1!A1:H1',
        valueInputOption: 'USER_ENTERED',
        requestBody: { values },
      });
      return { success: true, simulated: false };
    } catch (err: any) {
      console.error('Google Sheets API Error:', err.message);
      throw err;
    }
  } else {
    // Simulation Mode
    console.log('[SIMULATION] Appended rows to Google Sheets:', values.length - 1);
    return { success: true, simulated: true };
  }
}
