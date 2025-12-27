'use client';

import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Circle, MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';

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

  return (
    <div className="h-full w-full overflow-hidden rounded-lg border border-gray-200 shadow-sm">
      <MapContainer center={center} zoom={13} style={{ height: '100%', width: '100%' }} scrollWheelZoom>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <Circle center={center} radius={radius} pathOptions={{ color: '#2563eb', fillColor: '#60a5fa', fillOpacity: 0.15 }} />

        <Marker position={center}>
          <Popup>
            <div className="font-semibold text-gray-800">You are here</div>
          </Popup>
        </Marker>

        {facilities.map((facility) => (
          <Marker key={`${facility.id}-${facility.lat}-${facility.lon}`} position={[facility.lat, facility.lon]}>
            <Popup>
              <div className="space-y-1 text-sm">
                <div className="font-semibold text-gray-800">{facility.name}</div>
                {facility.type && <div className="text-gray-600 capitalize">{facility.type.replace(/_/g, ' ')}</div>}
                {facility.address && <div className="text-gray-600">{facility.address}</div>}
                {facility.distanceKm !== undefined && (
                  <div className="text-gray-500">{facility.distanceKm.toFixed(1)} km away</div>
                )}
                {facility.description && <div className="text-gray-500">{facility.description}</div>}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}

export default FacilitiesMap;

