import { dataStore } from '../lib/dataStore';
import * as fs from 'fs';

function escapeSql(str: string) {
  return str.replace(/'/g, "''");
}

function buildWards() {
  const wards = dataStore.wards.map((w: any) => 
    `('${w.id}', '${escapeSql(w.ward_name)}', ${w.damage_percentage}, ${w.total_roads}, ${w.damaged_roads}, ${w.repaired_this_month})`
  );
  return `-- 1. Dummy Wards\nINSERT INTO public.wards (id, ward_name, damage_percentage, total_roads, damaged_roads, repaired_this_month)\nVALUES \n${wards.join(',\n')}\nON CONFLICT (id) DO NOTHING;\n\n`;
}

function buildFleet() {
  const fleet = dataStore.fleet.map((f: any) => 
    `('${f.bus_id}', '${f.status}', '${f.last_sync_time}')`
  );
  return `-- 2. Dummy Fleet\nINSERT INTO public.fleet (bus_id, status, last_sync_time)\nVALUES \n${fleet.join(',\n')}\nON CONFLICT (bus_id) DO NOTHING;\n\n`;
}

function buildIncidents() {
  const incidents = dataStore.incidents.map((i: any) => {
    const area = i.area ? i.area : 'NULL';
    const severity_score = i.severity_score || 0;
    const buses_per_day = i.buses_per_day || 0;
    const fix_deadline_days = i.fix_deadline_days ? i.fix_deadline_days : 'NULL';
    const repaired_at = i.repaired_at ? `'${i.repaired_at}'` : 'NULL';
    const detected_at = i.detected_at ? `'${i.detected_at}'` : 'NULL';
    const verified_by = i.verified_by ? `'${escapeSql(i.verified_by)}'` : 'NULL';
    
    return `(${i.lat}, ${i.lng}, '${i.type}', ${area}, '${escapeSql(i.location_name)}', ${severity_score}, ${buses_per_day}, '${i.status}', ${detected_at}, ${repaired_at}, ${fix_deadline_days}, ${verified_by})`;
  });

  return `-- 3. Dummy Incidents (250+ Generated records matching algorithm)\nINSERT INTO public.incidents (lat, lng, type, area, location_name, severity_score, buses_per_day, status, detected_at, repaired_at, fix_deadline_days, verified_by)\nVALUES \n${incidents.join(',\n')};\n\n`;
}

const sql = buildWards() + buildFleet() + buildIncidents();
fs.writeFileSync('dummy_data.sql', sql);
console.log('Successfully generated large dataset in dummy_data.sql');
