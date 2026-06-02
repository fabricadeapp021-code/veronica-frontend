'use client';

import { useEffect, useRef, useState } from 'react';
import { Form } from 'react-bootstrap';

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

let googleMapsPromise;

export function loadGoogleRouteLibraries() {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Google Maps indisponivel no servidor'));
  }
  if (!GOOGLE_MAPS_API_KEY) {
    return Promise.reject(new Error('NEXT_PUBLIC_GOOGLE_MAPS_API_KEY nao configurada'));
  }
  if (window.google?.maps?.Map) {
    const imports = [];
    if (window.google.maps.importLibrary) {
      if (!window.google.maps.places) imports.push(window.google.maps.importLibrary('places'));
      if (!window.google.maps.geometry) imports.push(window.google.maps.importLibrary('geometry'));
      if (!window.google.maps.marker) imports.push(window.google.maps.importLibrary('marker'));
    }
    return Promise.all(imports).then(() => window.google);
  }
  if (googleMapsPromise) return googleMapsPromise;
  googleMapsPromise = new Promise((resolve, reject) => {
    const existing = document.getElementById('google-maps-route-planning');
    if (existing) {
      const wait = () => (window.google?.maps?.Map ? resolve(window.google) : setTimeout(wait, 50));
      wait();
      return;
    }

    const script = document.createElement('script');
    script.id = 'google-maps-route-planning';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&v=weekly&libraries=places,geometry,marker&loading=async`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(window.google);
    script.onerror = () => reject(new Error('Falha ao carregar Google Maps'));
    document.head.appendChild(script);
  });
  return googleMapsPromise;
}

function getComponent(addressComponents = [], type) {
  const component = addressComponents.find((item) => item.types?.includes(type));
  if (!component) return '';
  return component.longText || component.long_name || component.shortText || component.short_name || '';
}

function getShortComponent(addressComponents = [], type) {
  const component = addressComponents.find((item) => item.types?.includes(type));
  if (!component) return '';
  return component.shortText || component.short_name || component.longText || component.long_name || '';
}

function normalizePlace(place, fallbackValue) {
  const components = place.addressComponents || place.address_components || [];
  const city =
    getComponent(components, 'administrative_area_level_2') ||
    getComponent(components, 'locality') ||
    getComponent(components, 'postal_town');
  const state = getShortComponent(components, 'administrative_area_level_1');
  const zipCode = getComponent(components, 'postal_code');
  const address = place.formattedAddress || place.formatted_address || place.displayName || place.name || fallbackValue;
  const lat = place.location?.lat?.() ?? place.geometry?.location?.lat?.();
  const lng = place.location?.lng?.() ?? place.geometry?.location?.lng?.();

  return {
    address,
    placeId: place.id || place.place_id,
    lat,
    lng,
    city,
    state,
    zipCode,
  };
}

export function GooglePlaceInput({
  value,
  placeholder,
  onTextChange,
  onPlaceSelect,
  size = 'sm',
}) {
  const containerRef = useRef(null);
  const elementRef = useRef(null);
  const valueRef = useRef(value);
  const onTextChangeRef = useRef(onTextChange);
  const onPlaceSelectRef = useRef(onPlaceSelect);
  const [fallback, setFallback] = useState(false);

  useEffect(() => {
    valueRef.current = value;
    onTextChangeRef.current = onTextChange;
    onPlaceSelectRef.current = onPlaceSelect;
  }, [onPlaceSelect, onTextChange, value]);

  useEffect(() => {
    if (!containerRef.current || elementRef.current) return undefined;
    let cancelled = false;
    let handler;

    loadGoogleRouteLibraries()
      .then((google) => {
        if (cancelled || !containerRef.current) return;
        if (!google.maps.places?.PlaceAutocompleteElement) {
          setFallback(true);
          return;
        }

        const element = new google.maps.places.PlaceAutocompleteElement({
          componentRestrictions: { country: ['br'] },
          includedRegionCodes: ['br'],
        });
        element.placeholder = placeholder;
        element.value = value || '';
        element.style.width = '100%';
        element.style.display = 'block';
        element.style.minHeight = size === 'sm' ? '31px' : '38px';
        element.style.setProperty('--gmpx-color-surface', '#1f2d4d');
        element.style.setProperty('--gmpx-color-on-surface', '#e5edf9');
        element.style.setProperty('--gmpx-color-on-surface-variant', '#9aa8c0');
        element.style.setProperty('--gmpx-color-primary', '#4f8cff');

        handler = async ({ placePrediction }) => {
          const place = placePrediction.toPlace();
          await place.fetchFields({
            fields: ['id', 'formattedAddress', 'displayName', 'location', 'addressComponents'],
          });
          onPlaceSelectRef.current(normalizePlace(place, valueRef.current));
        };

        element.addEventListener('gmp-select', handler);
        elementRef.current = element;
        containerRef.current.replaceChildren(element);
      })
      .catch(() => setFallback(true));

    return () => {
      cancelled = true;
      if (handler) elementRef.current?.removeEventListener?.('gmp-select', handler);
      elementRef.current?.remove();
      elementRef.current = null;
    };
  }, [placeholder, size]);

  useEffect(() => {
    if (elementRef.current && elementRef.current.value !== value) {
      elementRef.current.value = value || '';
    }
  }, [value]);

  if (fallback) {
    return (
      <Form.Control
        size={size}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onTextChangeRef.current(e.target.value)}
      />
    );
  }

  return (
    <div
      ref={containerRef}
      style={{
        minHeight: size === 'sm' ? 31 : 38,
        borderRadius: 6,
        overflow: 'visible',
      }}
    />
  );
}

export function RoutePreviewMap({ preview, height = 260 }) {
  const mapRef = useRef(null);
  const mapInst = useRef(null);
  const overlaysRef = useRef([]);

  useEffect(() => {
    if (!preview || !mapRef.current) return undefined;
    let cancelled = false;

    loadGoogleRouteLibraries()
      .then((google) => {
        if (cancelled || !mapRef.current) return;
        if (!mapInst.current) {
          mapInst.current = new google.maps.Map(mapRef.current, {
            center: { lat: -23.55, lng: -46.63 },
            zoom: 8,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: true,
          });
        }

        overlaysRef.current.forEach((overlay) => overlay.setMap?.(null));
        overlaysRef.current = [];

        const bounds = new google.maps.LatLngBounds();
        let path = [];
        if (preview.routeGeoJson?.coordinates?.length) {
          path = preview.routeGeoJson.coordinates.map(([lng, lat]) => ({ lat, lng }));
        } else if (preview.polyline && google.maps.geometry?.encoding) {
          path = google.maps.geometry.encoding.decodePath(preview.polyline);
        }

        if (path.length > 1) {
          const route = new google.maps.Polyline({
            path,
            map: mapInst.current,
            strokeColor: preview.apiUsed === 'routes_api' ? '#00c875' : '#0d6efd',
            strokeOpacity: 0.9,
            strokeWeight: 5,
          });
          overlaysRef.current.push(route);
          path.forEach((point) => bounds.extend(point));
        }

        [
          ['Origem', preview.originCoords, '#28a745'],
          ['Destino', preview.destinationCoords, '#dc3545'],
        ].forEach(([title, coords, color]) => {
          if (coords?.lat == null || coords?.lng == null) return;
          const marker = new google.maps.Marker({
            map: mapInst.current,
            position: { lat: coords.lat, lng: coords.lng },
            title,
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              scale: 7,
              fillColor: color,
              fillOpacity: 1,
              strokeColor: '#ffffff',
              strokeWeight: 2,
            },
          });
          overlaysRef.current.push(marker);
          bounds.extend(marker.getPosition());
        });

        if (!bounds.isEmpty()) mapInst.current.fitBounds(bounds, 40);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [preview]);

  if (!preview?.polyline && !preview?.routeGeoJson && !preview?.originCoords) return null;

  return (
    <div
      ref={mapRef}
      style={{
        height,
        borderRadius: 10,
        overflow: 'hidden',
        border: '1px solid rgba(255,255,255,.12)',
      }}
    />
  );
}
