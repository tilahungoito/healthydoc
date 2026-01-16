'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

type Facility = {
  id: string;
  name: string;
  type?: string;
  description?: string;
  address?: string;
  lat: number;
  lon: number;
  distanceKm?: number;
};

export type FacilitiesMapProps = {
  userLocation: { lat: number; lon: number };
  facilities: Facility[];
  radius: number;
};

const defaultIcon = L.icon({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41],
});

L.Marker.prototype.options.icon = defaultIcon;

export function FacilitiesMap({ userLocation, facilities, radius }: FacilitiesMapProps) {
  const center: [number, number] = [userLocation.lat, userLocation.lon];
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const circleRef = useRef<L.Circle | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Initialize map only once
    if (!mapInstanceRef.current) {
      mapInstanceRef.current = L.map(mapContainerRef.current, {
        center,
        zoom: 13,
        scrollWheelZoom: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(mapInstanceRef.current);
    }

    // Clear existing markers and circle
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];
    if (circleRef.current) {
      circleRef.current.remove();
      circleRef.current = null;
    }

    // Update map center
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView(center, mapInstanceRef.current.getZoom());
    }

    // Add circle
    if (mapInstanceRef.current) {
      circleRef.current = L.circle(center, {
        radius,
        color: '#2563eb',
        fillColor: '#60a5fa',
        fillOpacity: 0.15,
      }).addTo(mapInstanceRef.current);
    }

    // Add user location marker
    if (mapInstanceRef.current) {
      const userMarker = L.marker(center, { icon: defaultIcon })
        .addTo(mapInstanceRef.current)
        .bindPopup('<div class="font-semibold text-gray-800">You are here</div>');
      markersRef.current.push(userMarker);
    }

    // Add facility markers
    facilities.forEach((facility) => {
      if (mapInstanceRef.current) {
        const popupContent = `
          <div class="space-y-1 text-sm">
            <div class="font-semibold text-gray-800">${facility.name}</div>
            ${facility.type ? `<div class="text-gray-600 capitalize">${facility.type.replace(/_/g, ' ')}</div>` : ''}
            ${facility.address ? `<div class="text-gray-600">${facility.address}</div>` : ''}
            ${facility.distanceKm !== undefined ? `<div class="text-gray-500">${facility.distanceKm.toFixed(1)} km away</div>` : ''}
            ${facility.description ? `<div class="text-gray-500">${facility.description}</div>` : ''}
          </div>
        `;
        const marker = L.marker([facility.lat, facility.lon], { icon: defaultIcon })
          .addTo(mapInstanceRef.current!)
          .bindPopup(popupContent);
        markersRef.current.push(marker);
      }
    });

    return () => {
      // Cleanup on unmount
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [center, facilities, radius]);

  return (
    <div className="h-full w-full overflow-hidden rounded-lg border border-gray-200 shadow-sm">
      <div ref={mapContainerRef} style={{ height: '100%', width: '100%' }} />
    </div>
  );
}

export default FacilitiesMap;
