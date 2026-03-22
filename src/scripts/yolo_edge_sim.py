from ultralytics import YOLO
import cv2
import os
import csv
import requests
import time
from datetime import datetime

# ==========================================
# EDGE DEVICE CONFIGURATION (Hardware & API)
# ==========================================
MODEL_PATH = "src/scripts/best.pt"
VIDEO_PATH = "src/scripts/inputvideo.mp4"
API_URL = "http://localhost:3000/api/ingest"
BATCH_SIZE = 5  # Flush to database when queue has 5 incidents

# Telemetry / Movement Mocking (40 km/hr = 11.11 m/s)
START_LAT = 21.1702
START_LNG = 72.8311
SPEED_KMH = 40.0
SPEED_MS = SPEED_KMH * (1000.0 / 3600.0)

# Approx 111,111 meters per degree at the equator
METERS_PER_DEGREE = 111111.0 
# ==========================================

model = YOLO(MODEL_PATH)
output_folder = "output_frames"
os.makedirs(output_folder, exist_ok=True)

csv_file = "detections.csv"
csv_f = open(csv_file, mode="w", newline="")
csv_writer = csv.writer(csv_f)
csv_writer.writerow(["frame", "class", "confidence", "x1", "y1", "x2", "y2", "lat", "lng"])

cap = cv2.VideoCapture(VIDEO_PATH)

# Fetch FPS to calculate car distance strictly per frame passed
fps = cap.get(cv2.CAP_PROP_FPS)
if fps == 0 or fps != fps:
    fps = 30.0

time_per_frame = 1.0 / fps # e.g. 0.033 seconds per frame
meters_per_frame = SPEED_MS * time_per_frame # e.g. ~0.37 meters
degrees_per_frame = meters_per_frame / METERS_PER_DEGREE

class_names = model.names
target_classes = [
    "longitudinal crack", "transverse crack", "alligator crack", 
    "other corruption", "pothole"
]
target_classes = [c.lower() for c in target_classes]

frame_count = 0
current_lat = START_LAT
current_lng = START_LNG

# Local Offline Storage Cache
offline_queue = []
logged_track_ids = set() # Store unique Track IDs to prevent duplicate database entries

def flush_queue():
    """Takes contents of offline memory and pushes to Next.js Supabase Database via API"""
    global offline_queue
    if not offline_queue:
        return
        
    print(f"\n📡 [Network Sync] Pushing batch of {len(offline_queue)} anomalies to API...")
    try:
        # Tries to upload to API
        response = requests.post(API_URL, json=offline_queue, timeout=5)
        if response.status_code == 200:
            print(f"✅ [Server ACK] Successfully synced {len(offline_queue)} records!")
            offline_queue.clear()
        else:
            print(f"❌ [Server Error] Code: {response.status_code}. Throttling and keeping data locally.")
    except Exception as e:
        print(f"🔌 [Connection Error] API Unreachable. Buffering data for later. Cause: {e}")

# ==========================================
# MAIN VIDEO INFERENCE LOOP
# ==========================================
while cap.isOpened():
    ret, frame = cap.read()
    if not ret:
        break

    frame_count += 1
    
    # Mathematical Simulation: Vehicle moved slightly, updating GPS coords
    current_lat += degrees_per_frame
    current_lng += degrees_per_frame

    # ML Inference using YOLO Tracker (Assigns unique IDs to objects across frames)
    results = model.track(frame, persist=True, verbose=False)

    for r in results:
        if r.boxes is None:
            continue

        boxes = r.boxes.xyxy.cpu().numpy()
        classes = r.boxes.cls.cpu().numpy()
        scores = r.boxes.conf.cpu().numpy()
        
        # Grab tracking IDs if available
        track_ids = r.boxes.id.int().cpu().tolist() if r.boxes.id is not None else [None] * len(boxes)

        for box, cls_id, conf, track_id in zip(boxes, classes, scores, track_ids):
            cls_id = int(cls_id)
            class_name = class_names[cls_id].lower()

            if class_name in target_classes and conf > 0.25:
                
                # Deduplication: If we already logged this specific pothole, skip Database Sync
                if track_id is not None:
                    if track_id in logged_track_ids:
                        continue # Skip uploading duplicate!
                    logged_track_ids.add(track_id)
                    
                # Math coordinate box translation
                x1, y1, x2, y2 = map(int, box)
                w = x2 - x1
                h = y2 - y1

                # Standardize category for backend ingest format
                api_type = "early_crack" if "crack" in class_name else "pothole"

                # Visualization 
                color = (0, 0, 255) if api_type == "pothole" else (0, 255, 0)
                cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)
                label = f"{class_name} {conf:.2f}"
                cv2.putText(frame, label, (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.6, color, 2)

                print(f"Frame {frame_count:04d} | {class_name.upper()} | Conf: {conf:.2f} | Lat: {current_lat:.5f}, Lng: {current_lng:.5f} | Box: {w}px * {h}px")

                # Local Storage CSV Logging
                csv_writer.writerow([frame_count, class_name, conf, x1, y1, x2, y2, current_lat, current_lng])

                # Memory Queueing for Telemetry Sync
                offline_queue.append({
                    "lat": current_lat,
                    "lng": current_lng,
                    "type": api_type,
                    "boundingBox": {"w": w, "h": h},
                    "detected_at": datetime.utcnow().isoformat() + "Z"
                })

                # Event Listener Trigger: Sync if Queue reaches Batch Size constraints
                if len(offline_queue) >= BATCH_SIZE:
                    flush_queue()

    # Image Saving locally
    output_path = os.path.join(output_folder, f"frame_{frame_count:04d}.jpg")
    cv2.imwrite(output_path, frame)

# Force flush any straggler data chunks that didn't hit batch size 
flush_queue()

cap.release()
csv_f.close()
cv2.destroyAllWindows()

print("✅ Processing pipeline complete. Offline records parsed.")
