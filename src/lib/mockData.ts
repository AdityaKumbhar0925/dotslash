export const mockIncidents = [
  {
    id: '1',
    lat: 21.1702,
    lng: 72.8311,
    type: 'pothole',
    area: 4.5,
    location_name: 'Ring Road, Udhna Darwaja',
    buses_per_day: 120,
    detected_at: '2026-03-21T08:30:00Z',
    status: 'active',
  },
  {
    id: '2',
    lat: 21.1856,
    lng: 72.8123,
    type: 'pothole',
    area: 2.2,
    location_name: 'Adajan Patia',
    buses_per_day: 80,
    detected_at: '2026-03-20T14:15:00Z',
    status: 'active',
  },
  {
    id: '3',
    lat: 21.1611,
    lng: 72.8456,
    type: 'repaired',
    location_name: 'Majura Gate Crossroads',
    buses_per_day: 200,
    detected_at: '2026-03-18T09:00:00Z',
    repaired_at: '2026-03-21T10:00:00Z',
    status: 'repaired',
    verified_by: 'Inspector Sharma'
  },
  {
    id: '4',
    lat: 21.2034,
    lng: 72.8400,
    type: 'early_crack',
    location_name: 'Katargam Main Road',
    fix_deadline_days: 5,
    buses_per_day: 150,
    detected_at: '2026-03-19T11:20:00Z',
    status: 'active',
  },
  {
    id: '5',
    lat: 21.1412,
    lng: 72.7831,
    type: 'early_crack',
    location_name: 'Vesu VIP Road',
    fix_deadline_days: 12,
    buses_per_day: 90,
    detected_at: '2026-03-15T08:10:00Z',
    status: 'active',
  },
  {
    id: '6',
    lat: 21.1901,
    lng: 72.8210,
    type: 'pothole',
    area: 6.8,
    location_name: 'Chowk Bazar Main Road',
    buses_per_day: 300,
    detected_at: '2026-03-21T07:15:00Z',
    status: 'active',
  },
  {
    id: '7',
    lat: 21.1550,
    lng: 72.7950,
    type: 'pothole',
    area: 1.5,
    location_name: 'Piplod Dumas Road',
    buses_per_day: 150,
    detected_at: '2026-03-20T16:20:00Z',
    status: 'active',
  },
  {
    id: '8',
    lat: 21.1732,
    lng: 72.8021,
    type: 'early_crack',
    location_name: 'Bhatar Cross Road',
    fix_deadline_days: 3,
    buses_per_day: 220,
    detected_at: '2026-03-19T09:45:00Z',
    status: 'active',
  },
  {
    id: '9',
    lat: 21.2154,
    lng: 72.8541,
    type: 'repaired',
    location_name: 'Amroli Bridge Approach',
    buses_per_day: 180,
    detected_at: '2026-03-15T11:00:00Z',
    repaired_at: '2026-03-18T14:30:00Z',
    status: 'repaired',
    verified_by: 'Inspector Patel'
  },
  {
    id: '10',
    lat: 21.1685,
    lng: 72.8420,
    type: 'pothole',
    area: 3.8,
    location_name: 'Rustampura',
    buses_per_day: 90,
    detected_at: '2026-03-21T10:10:00Z',
    status: 'active',
  },
  {
    id: '11',
    lat: 21.1480,
    lng: 72.7710,
    type: 'early_crack',
    location_name: 'Magdalla Port Road',
    fix_deadline_days: 14,
    buses_per_day: 350,
    detected_at: '2026-03-16T08:00:00Z',
    status: 'active',
  },
  {
    id: '12',
    lat: 21.1890,
    lng: 72.8360,
    type: 'pothole',
    area: 5.2,
    location_name: 'Delhi Gate',
    buses_per_day: 280,
    detected_at: '2026-03-21T06:45:00Z',
    status: 'active',
  },
  {
    id: '13',
    lat: 21.2010,
    lng: 72.8250,
    type: 'pothole',
    area: 2.9,
    location_name: 'Ved Road',
    buses_per_day: 140,
    detected_at: '2026-03-20T22:30:00Z',
    status: 'active',
  },
  {
    id: '14',
    lat: 21.1650,
    lng: 72.8100,
    type: 'repaired',
    location_name: 'City Light Road',
    buses_per_day: 160,
    detected_at: '2026-03-10T09:15:00Z',
    repaired_at: '2026-03-12T16:00:00Z',
    status: 'repaired',
    verified_by: 'Inspector Desai'
  },
  {
    id: '15',
    lat: 21.1820,
    lng: 72.8180,
    type: 'early_crack',
    location_name: 'Navsari Bazar',
    fix_deadline_days: 21,
    buses_per_day: 110,
    detected_at: '2026-03-14T13:40:00Z',
    status: 'active',
  }
];

// Procedurally generate dense data for visualization
const generateMockData = () => {
  const generated = [];
  const types = ['pothole', 'pothole', 'early_crack', 'early_crack', 'repaired'];
  
  const regions = [
    { state: 'Gujarat', baseLat: 21.12, baseLng: 72.76, locs: ['Ring Road', 'Udhna Magdalla Road', 'Gaurav Path', 'VIP Road', 'Dumas Road', 'Varachha Main', 'Katargam', 'Adajan Patiya'] },
    { state: 'Maharashtra', baseLat: 19.07, baseLng: 72.87, locs: ['Andheri West', 'Bandra Kurla Complex', 'Dadar', 'Marine Drive', 'Powai', 'Worli Sea Face'] },
    { state: 'Delhi', baseLat: 28.61, baseLng: 77.20, locs: ['Connaught Place', 'Vasant Kunj', 'Saket', 'Karol Bagh', 'Hauz Khas', 'Lajpat Nagar'] },
    { state: 'Karnataka', baseLat: 12.97, baseLng: 77.59, locs: ['Koramangala', 'Indiranagar', 'Whitefield', 'Jayanagar', 'HSR Layout', 'Malleshwaram'] }
  ];

  for (let i = 16; i <= 250; i++) {
    const type = types[Math.floor(Math.random() * types.length)];
    const isRepaired = type === 'repaired';
    const region = regions[Math.floor(Math.random() * regions.length)];
    const locName = region.locs[Math.floor(Math.random() * region.locs.length)];
    
    generated.push({
      id: i.toString(),
      lat: region.baseLat + (Math.random() - 0.5) * 0.15, 
      lng: region.baseLng + (Math.random() - 0.5) * 0.15,
      type: type,
      ...(type === 'pothole' ? { area: Math.round((Math.random() * 5 + 0.5) * 10) / 10 } : {}),
      location_name: `${locName} Patch ${Math.floor(Math.random() * 900)}`,
      fix_deadline_days: type === 'early_crack' ? Math.floor(Math.random() * 14) + 1 : undefined,
      buses_per_day: Math.floor(Math.random() * 400) + 10,
      detected_at: new Date(Date.now() - Math.random() * 10000000000).toISOString(),
      repaired_at: isRepaired ? new Date(Date.now() - Math.random() * 5000000000).toISOString() : undefined,
      status: isRepaired ? 'repaired' : 'active',
      verified_by: isRepaired ? 'Contractor ' + Math.floor(Math.random() * 100) : undefined
    });
  }
  return generated;
};

mockIncidents.forEach((inc: any) => {
  if (inc.type === 'pothole' && !inc.area) {
    inc.area = Math.round((Math.random() * 5 + 1) * 10) / 10;
  }
});

mockIncidents.push(...(generateMockData() as any));

export const mockWards = [
  { id: 'w1', ward_name: 'Central Zone', damage_percentage: 15, total_roads: 120, damaged_roads: 18, repaired_this_month: 45 },
  { id: 'w2', ward_name: 'Varachha', damage_percentage: 35, total_roads: 180, damaged_roads: 63, repaired_this_month: 20 },
  { id: 'w3', ward_name: 'Udhna', damage_percentage: 55, total_roads: 150, damaged_roads: 82, repaired_this_month: 12 },
  { id: 'w4', ward_name: 'Adajan', damage_percentage: 12, total_roads: 140, damaged_roads: 16, repaired_this_month: 80 },
  { id: 'w5', ward_name: 'Katargam', damage_percentage: 25, total_roads: 130, damaged_roads: 32, repaired_this_month: 15 },
  { id: 'w6', ward_name: 'Rander', damage_percentage: 18, total_roads: 100, damaged_roads: 18, repaired_this_month: 30 },
  { id: 'w7', ward_name: 'Atha', damage_percentage: 42, total_roads: 110, damaged_roads: 46, repaired_this_month: 18 },
  { id: 'w8', ward_name: 'Limbayat', damage_percentage: 62, total_roads: 160, damaged_roads: 99, repaired_this_month: 5 },
];

export const mockFleet = [
  { bus_id: 'GJ-05-BZ-1001', status: 'synced', last_sync_time: '10 mins ago' },
  { bus_id: 'GJ-05-BZ-1045', status: 'synced', last_sync_time: '1 hr ago' },
  { bus_id: 'GJ-05-BZ-1088', status: 'offline', last_sync_time: '2 days ago' },
  { bus_id: 'GJ-05-BZ-1102', status: 'synced', last_sync_time: '5 mins ago' },
  { bus_id: 'GJ-05-BZ-0002', status: 'synced', last_sync_time: '200 mins ago' },
];
