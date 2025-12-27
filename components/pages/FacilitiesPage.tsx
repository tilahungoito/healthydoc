'use client';

import dynamic from 'next/dynamic';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { Config } from '@/config';
import { languageManager } from '@/lib/language/manager';
import type { FacilitiesMapProps } from './FacilitiesMap';

const FacilitiesMap = dynamic<FacilitiesMapProps>(() => import('./FacilitiesMap').then((mod) => mod.FacilitiesMap), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center rounded-lg border border-gray-200 bg-gray-50 text-sm text-gray-600">
      Loading map...
    </div>
  ),
});

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

type Coordinates = { lat: number; lon: number };

const SEARCH_RADIUS_METERS = 5000;

const haversineDistanceKm = (from: Coordinates, to: Coordinates) => {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const R = 6371; // km
  const dLat = toRad(to.lat - from.lat);
  const dLon = toRad(to.lon - from.lon);
  const lat1 = toRad(from.lat);
  const lat2 = toRad(to.lat);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const formatAddress = (tags: Record<string, string> | undefined) => {
  if (!tags) return undefined;
  const parts = [tags['addr:housenumber'], tags['addr:street'], tags['addr:city'], tags['addr:postcode']]
    .filter(Boolean)
    .join(' ');
  return parts || tags.address || undefined;
};

export default function FacilitiesPage() {
  const t = languageManager.getText.bind(languageManager);
  const [userLocation, setUserLocation] = useState<Coordinates | null>(null);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loadingLocation, setLoadingLocation] = useState(true);
  const [loadingFacilities, setLoadingFacilities] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [placeQuery, setPlaceQuery] = useState('');
  const [searchingPlace, setSearchingPlace] = useState(false);

  const requestLocation = useCallback(() => {
    if (!navigator?.geolocation) {
      setError('Geolocation is unavailable. Showing default city.');
      setLoadingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lon: pos.coords.longitude });
        setError(null);
        setLoadingLocation(false);
      },
      () => {
        setError('Unable to access your location. Please allow location or search manually.');
        setLoadingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, []);

  const searchPlace = useCallback(async () => {
    if (!placeQuery.trim()) return;
    setSearchingPlace(true);
    setError(null);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(placeQuery)}`
      );
      if (!response.ok) throw new Error('Geocoding failed');
      const results = await response.json();
      if (Array.isArray(results) && results.length > 0) {
        const hit = results[0];
        setUserLocation({ lat: parseFloat(hit.lat), lon: parseFloat(hit.lon) });
      } else {
        setError('No results found for that place.');
      }
    } catch {
      setError('Unable to find that place right now. Try again.');
    } finally {
      setSearchingPlace(false);
    }
  }, [placeQuery]);

  const fetchNearbyFacilities = useCallback(
    async (coords: Coordinates) => {
      setLoadingFacilities(true);
      setError(null);

      try {
        const query = `
          [out:json][timeout:25];
          (
            node["amenity"~"hospital|clinic|doctors|pharmacy|dentist"](around:${SEARCH_RADIUS_METERS},${coords.lat},${coords.lon});
            way["amenity"~"hospital|clinic|doctors|pharmacy|dentist"](around:${SEARCH_RADIUS_METERS},${coords.lat},${coords.lon});
            relation["amenity"~"hospital|clinic|doctors|pharmacy|dentist"](around:${SEARCH_RADIUS_METERS},${coords.lat},${coords.lon});
          );
          out center;
        `;

        const response = await fetch('https://overpass-api.de/api/interpreter', {
          method: 'POST',
          body: query,
        });

        if (!response.ok) {
          throw new Error('Overpass API request failed');
        }

        const data = await response.json();
        const elements = Array.isArray(data?.elements) ? data.elements : [];

        const parsedFacilities: Facility[] = elements
          .map((el: any) => {
            const center = el.center || (el.lat && el.lon ? { lat: el.lat, lon: el.lon } : null);
            if (!center) return null;

            const name =
              el.tags?.name ||
              el.tags?.operator ||
              `${el.tags?.amenity ?? 'Facility'} ${el.id.toString().slice(-4)}`;

            return {
              id: String(el.id),
              name,
              type: el.tags?.amenity,
              description: el.tags?.description,
              address: formatAddress(el.tags),
              lat: center.lat,
              lon: center.lon,
              distanceKm: haversineDistanceKm(coords, { lat: center.lat, lon: center.lon }),
            } as Facility;
          })
          .filter(Boolean)
          .sort((a: Facility, b: Facility) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0));

        setFacilities(parsedFacilities);
      } catch (err) {
        setError('Unable to load nearby facilities right now. Please try again.');
      } finally {
        setLoadingFacilities(false);
      }
    },
    []
  );

  useEffect(() => {
    requestLocation();
  }, [requestLocation]);

  useEffect(() => {
    if (userLocation) {
      fetchNearbyFacilities(userLocation);
    }
  }, [userLocation, fetchNearbyFacilities]);

  const statusText = useMemo(() => {
    if (loadingLocation) return 'Detecting your location...';
    if (loadingFacilities) return 'Searching nearby facilities...';
    if (error) return error;
    if (!userLocation) return 'Waiting for your location or a place search.';
    return null;
  }, [loadingFacilities, loadingLocation, error, userLocation]);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-1">🏥 {t('health_facilities')}</h2>
            <p className="text-gray-600">
              Discover nearby hospitals, clinics, doctors, and pharmacies powered by OpenStreetMap.
            </p>
          </div>
          <div className="flex flex-col items-end gap-2 sm:flex-row sm:items-center">
            <button
              onClick={requestLocation}
              className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              Refresh location
            </button>
            <div className="flex w-full items-center gap-2 sm:w-72">
              <input
                value={placeQuery}
                onChange={(e) => setPlaceQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && searchPlace()}
                placeholder="Search a place (e.g., Mekelle University)"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
              <button
                onClick={searchPlace}
                disabled={searchingPlace}
                className="rounded-md bg-gray-800 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {searchingPlace ? '...' : 'Go'}
              </button>
            </div>
          </div>
        </div>

        {statusText && <p className="text-sm text-gray-700">{statusText}</p>}

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-3">
            {userLocation ? (
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <span className="font-semibold">Your location:</span>
                <span>
                  {userLocation.lat.toFixed(4)}, {userLocation.lon.toFixed(4)}
                </span>
                <span className="text-gray-400">•</span>
                <span>Radius: {(SEARCH_RADIUS_METERS / 1000).toFixed(1)} km</span>
              </div>
            ) : (
              <div className="text-sm text-gray-700">
                No coordinates yet. Allow location or search a place to center the map.
              </div>
            )}

            <div className="space-y-2">
              {facilities.length === 0 && !loadingFacilities && (
                <p className="text-gray-600">No nearby facilities were found. Try increasing the radius.</p>
              )}

              {facilities.slice(0, 8).map((facility) => (
                <div key={facility.id} className="rounded-lg border border-gray-200 p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800">{facility.name}</h3>
                      <p className="text-sm text-gray-500">
                        {facility.type ?? 'medical'} {facility.address ? `• ${facility.address}` : ''}
                      </p>
                    </div>
                    {facility.distanceKm !== undefined && (
                      <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                        {facility.distanceKm.toFixed(1)} km
                      </span>
                    )}
                  </div>
                  {facility.description && <p className="text-sm text-gray-600 mt-2">{facility.description}</p>}
                </div>
              ))}
            </div>
          </div>

          <div className="min-h-[420px]">
            {userLocation ? (
              <FacilitiesMap userLocation={userLocation} facilities={facilities} radius={SEARCH_RADIUS_METERS} />
            ) : (
              <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 text-sm text-gray-600">
                Waiting for location or a place search to show the map.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

