'use client';

'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Badge } from 'lucide-react'; // Placeholder for icons if needed

if (typeof window !== 'undefined') {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: '/leaflet/marker-icon-2x.png',
    iconUrl: '/leaflet/marker-icon.png',
    shadowUrl: '/leaflet/marker-shadow.png',
  });
}

import { useRef } from 'react';

function MapEffect({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  const initialLock = useRef(false);
  const prevCoords = useRef(center);

  useEffect(() => {
    if (!initialLock.current) {
      map.setView(center, zoom);
      initialLock.current = true;
      return;
    }
    
    const latShift = Math.abs(center[0] - prevCoords.current[0]);
    const lngShift = Math.abs(center[1] - prevCoords.current[1]);
    
    // Only snap the camera if the dashboard physically requested a new city/state (>500 meters)
    if (latShift > 0.005 || lngShift > 0.005) {
      map.setView(center, zoom);
      prevCoords.current = center;
    }
  }, [center[0], center[1], zoom, map]);
  return null;
}

export type MapMarker = {
  id: string;
  lat: number;
  lng: number;
  type: string;
  severity?: number;
  popupData: Record<string, any>;
};

export default function MapInner({
  center = [21.1702, 72.8311],
  zoom = 12,
  markers = [],
}: {
  center?: [number, number];
  zoom?: number;
  markers?: MapMarker[];
}) {
  const createCustomIcon = (type: string, severity?: number, count?: number) => {
    let color = '';
    let shadow = 'shadow-black/50';
    let shapeClass = 'rounded-full';
    let sizeClass = 'w-3 h-3';

    if (type === 'cluster') {
      if (severity !== undefined && severity >= 60) {
        color = 'bg-red-500/80 backdrop-blur-md';
        shadow = 'shadow-[0_0_15px_rgba(239,68,68,0.7)]';
      } else if (severity !== undefined && severity >= 30) {
        color = 'bg-yellow-500/80 backdrop-blur-md';
        shadow = 'shadow-[0_0_15px_rgba(234,179,8,0.7)]';
      } else {
        color = 'bg-green-500/80 backdrop-blur-md';
        shadow = 'shadow-[0_0_15px_rgba(34,197,94,0.7)]';
      }
      sizeClass = 'w-6 h-6 flex flex-col items-center justify-center';
      const html = `<div class="${sizeClass} ${color} ${shapeClass} border-2 border-white/50 ${shadow}"></div>`;
      
      return L.divIcon({
        className: 'custom-leaflet-icon',
        html,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });
    }

    if (severity !== undefined && type !== 'repaired' && type !== 'early_crack') {
      if (severity > 60) {
        color = 'bg-red-500';
        shadow = 'shadow-[0_0_8px_#ef4444]';
        sizeClass = 'w-3.5 h-3.5';
      } else if (severity >= 30 && severity <= 60) {
        color = 'bg-yellow-500';
        shadow = 'shadow-[0_0_8px_#eab308]';
      } else {
        color = 'bg-green-500';
        shadow = 'shadow-[0_0_8px_#22c55e]';
      }
    } else {
      switch (type) {
        case 'severe':
          color = 'bg-severe';
          sizeClass = 'w-3.5 h-3.5';
          break;
        case 'moderate':
          color = 'bg-moderate';
          break;
        case 'repaired':
          color = 'bg-repaired';
          shadow = 'shadow-[0_0_8px_#3AE196]';
          break;
        case 'early_crack':
          color = 'bg-early_crack';
          shapeClass = 'rotate-45'; // Diamond shape
          shadow = 'shadow-[0_0_8px_#7F77DD]';
          break;
        default:
          color = 'bg-gray-500';
      }
    }

    const html = `<div class="${sizeClass} ${color} ${shapeClass} border-2 border-[#121212] shadow-sm ${shadow}"></div>`;
    
    return L.divIcon({
      className: 'custom-leaflet-icon',
      html,
      iconSize: [14, 14],
      iconAnchor: [7, 7],
    });
  };

  return (
    <div className="h-full w-full rounded-[8px] overflow-hidden border border-white/10 relative z-0">
      <style>{`
        .leaflet-container {
          background-color: #0c0c0c;
        }
        .map-tiles {
          filter: invert(100%) hue-rotate(180deg) brightness(105%) contrast(90%);
        }
        .leaflet-popup-content-wrapper {
          background-color: #1a1a1a;
          color: #f0f0f0;
          border-radius: 8px;
          border: 1px solid rgba(255,255,255,0.1);
        }
        .leaflet-popup-tip {
          background-color: #1a1a1a;
        }
      `}</style>
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          className="map-tiles"
        />
        <MapEffect center={center} zoom={zoom} />
        {markers.map((mrk) => (
          <Marker
            key={mrk.id}
            position={[mrk.lat, mrk.lng]}
            icon={createCustomIcon(mrk.type, mrk.severity, mrk.popupData.incidents_count)}
          >
            <Popup>
              <div className="flex flex-col gap-1 min-w-[150px]">
                <strong className="text-sm font-semibold border-b border-white/10 pb-1 mb-1">
                  {mrk.popupData.location_name || 'Location info'}
                </strong>
                {Object.entries(mrk.popupData).map(([k, v]) => {
                  if (k === 'location_name') return null;
                  return (
                    <div key={k} className="flex justify-between text-xs gap-3">
                      <span className="text-white/60 capitalize">{k.replace(/_/g, ' ')}:</span>
                      <span className="font-medium text-white">{String(v)}</span>
                    </div>
                  );
                })}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
