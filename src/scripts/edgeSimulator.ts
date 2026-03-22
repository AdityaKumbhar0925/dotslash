/**
 * This script completely simulates a physical Raspberry Pi edge device mounted on a fleet vehicle.
 * It continually detects anomalies via bounded boxes, stores them in local memory,
 * and carefully batch-uploads them when network connectivity is available to prevent Server DDoS.
 */

const INGEST_URL = 'http://localhost:3000/api/ingest';
const BATCH_SIZE = 3; // Ensure very slow and safe DB inserts

let offlineQueue: any[] = [];

// 1. HARDWARE SIMULATION: Detect potholes while bus is moving (Every 2 seconds)
setInterval(() => {
  // Random coord near Surat ring roads
  const baseLat = 21.17;
  const baseLng = 72.83;
  const lat = baseLat + (Math.random() - 0.5) * 0.05;
  const lng = baseLng + (Math.random() - 0.5) * 0.05;
  
  // Simulated bounding box coming straight from a YOLOv8 Python Edge pipeline
  // width x height in pixels
  const boxWidth = Math.floor(Math.random() * 250) + 50; 
  const boxHeight = Math.floor(Math.random() * 250) + 50; 

  const anomalyType = Math.random() > 0.4 ? 'pothole' : 'early_crack';

  const detection = {
    lat,
    lng,
    type: anomalyType,
    boundingBox: { w: boxWidth, h: boxHeight },
    detected_at: new Date().toISOString()
  };
  
  // Push to local offline device memory (e.g., local SQLite buffer on the Pi)
  offlineQueue.push(detection);
  console.log(`[Pi Camera] 📷 Detected [${anomalyType.toUpperCase()}] at [${lat.toFixed(4)}, ${lng.toFixed(4)}]. Stored locally. (Offline Buffer: ${offlineQueue.length})`);
}, 2500); 

// 2. NETWORK SYNC CRON: Wait for 4G internet, then flush the database slowly
setInterval(async () => {
  if (offlineQueue.length === 0) return;

  // Extract a tiny batch of elements from the local memory
  const batch = offlineQueue.splice(0, BATCH_SIZE);
  console.log(`\n[Network Sync] 📡 Processing Upload Queue... Pushing batch of ${batch.length} bounding boxes to Main API...`);

  try {
    const res = await fetch(INGEST_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(batch)
    });

    if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
    const result = await res.json();
    
    console.log(`[Server ACK] ✅ Successfully securely uploaded ${result.inserted} records! They should now appear on the live dashboard.`);
  } catch (err: any) {
    console.error(`[Connection Error] ❌ API Unreachable or failed. Re-buffering ${batch.length} items to memory to try again later. Err:`, err.message);
    
    // Safety fallback: if internet cuts out, stuff the records back in the queue!
    offlineQueue.unshift(...batch); 
  }
}, 8000); // Trigger upload protocol every 8 seconds
