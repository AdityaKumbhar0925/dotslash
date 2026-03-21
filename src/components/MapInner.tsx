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

function MapEffect({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
}

export type MapMarker = {
  id: string;
  lat: number;
  lng: number;
  type: 'severe' | 'moderate' | 'repaired' | 'early_crack';
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
  const createCustomIcon = (type: string) => {
    let color = '';
    let shapeClass = 'rounded-full';
    let sizeClass = 'w-3 h-3';

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
        break;
      case 'early_crack':
        color = 'bg-early_crack';
        shapeClass = 'rotate-45'; // Diamond shape
        break;
      default:
        color = 'bg-gray-500';
    }

    const html = `<div class="${sizeClass} ${color} ${shapeClass} border-2 border-[#121212] shadow-sm shadow-black/50"></div>`;
    
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
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        <MapEffect center={center} zoom={zoom} />
        {markers.map((mrk) => (
          <Marker
            key={mrk.id}
            position={[mrk.lat, mrk.lng]}
            icon={createCustomIcon(mrk.type)}
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
